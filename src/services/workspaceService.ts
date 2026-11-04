import { supabase, isSupabaseConfigured } from './supabaseClient';
import { TeamRole } from '../types';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatar: string;
  createdBy?: string;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: 'active' | 'invited' | 'suspended';
  joinedAt: string;
  profile?: {
    fullName: string;
    email: string;
    avatarUrl?: string;
    position?: string;
    department?: string;
    isOnline?: boolean;
  };
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

export class WorkspaceService {
  /**
   * Fetch all workspaces that the current user belongs to
   */
  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data: memberRows, error: memberErr } = await supabase
        .from('workspace_members')
        .select('workspace_id, status')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (memberErr || !memberRows || memberRows.length === 0) return [];

      const workspaceIds = memberRows.map((m) => m.workspace_id);
      const { data: workspaces, error: wsErr } = await supabase
        .from('workspaces')
        .select('*')
        .in('id', workspaceIds)
        .order('created_at', { ascending: false });

      if (wsErr || !workspaces) return [];

      return workspaces.map((w) => ({
        id: w.id,
        name: w.name,
        slug: w.slug,
        description: w.description || '',
        avatar: w.avatar || '⚡',
        createdBy: w.created_by,
        createdAt: w.created_at,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Atomic Workspace Creation RPC with caller as Owner
   */
  async createWorkspace(name: string, description = '', avatar = '⚡'): Promise<Workspace> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }

    // Try RPC first
    const { data, error } = await supabase.rpc('create_new_workspace', {
      ws_name: name,
      ws_description: description,
      ws_avatar: avatar,
    });

    if (error) {
      // Fallback direct insert if RPC isn't deployed yet
      const { data: userResp } = await supabase.auth.getUser();
      const user = userResp.user;
      if (!user) throw new Error('Not authenticated');

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
      const { data: newWs, error: insertWsErr } = await supabase
        .from('workspaces')
        .insert({
          name,
          slug,
          description,
          avatar,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertWsErr || !newWs) throw insertWsErr || new Error('Failed to create workspace');

      await supabase.from('workspace_members').insert({
        workspace_id: newWs.id,
        user_id: user.id,
        role: 'owner',
        status: 'active',
      });

      return {
        id: newWs.id,
        name: newWs.name,
        slug: newWs.slug,
        description: newWs.description,
        avatar: newWs.avatar,
        createdBy: newWs.created_by,
        createdAt: newWs.created_at,
      };
    }

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      avatar: data.avatar,
      createdAt: data.created_at,
    };
  }

  /**
   * Get members of workspace with profiles
   */
  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data: members, error } = await supabase
        .from('workspace_members')
        .select(`
          id,
          workspace_id,
          user_id,
          role,
          status,
          joined_at
        `)
        .eq('workspace_id', workspaceId);

      if (error || !members) return [];

      const userIds = members.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      return members.map((m) => {
        const prof = profileMap.get(m.user_id);
        return {
          id: m.id,
          workspaceId: m.workspace_id,
          userId: m.user_id,
          role: m.role as any,
          status: m.status as any,
          joinedAt: m.joined_at,
          profile: prof
            ? {
                fullName: prof.full_name || '',
                email: prof.email || '',
                avatarUrl: prof.avatar_url || '',
                position: prof.position || 'Специалист',
                department: prof.department || 'Разработка',
                isOnline: Boolean(prof.is_online),
              }
            : undefined,
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Update member role (Owner / Admin only)
   */
  async updateMemberRole(workspaceId: string, memberId: string, role: 'owner' | 'admin' | 'editor' | 'viewer') {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('workspace_members')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', memberId)
      .eq('workspace_id', workspaceId);

    if (error) throw error;
  }

  /**
   * Remove member from workspace
   */
  async removeMember(workspaceId: string, memberId: string) {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId)
      .eq('workspace_id', workspaceId);

    if (error) throw error;
  }

  /**
   * Create invitation for user email
   */
  async inviteUser(workspaceId: string, email: string, role: 'admin' | 'editor' | 'viewer' = 'editor') {
    if (!isSupabaseConfigured) return;
    const { data: userResp } = await supabase.auth.getUser();
    if (!userResp.user) throw new Error('Not authenticated');

    const rawToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    // SHA-256 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(rawToken);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const tokenHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from('workspace_invitations').insert({
      workspace_id: workspaceId,
      email: email.toLowerCase().trim(),
      role,
      invited_by: userResp.user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    if (error) throw error;
    return { token: rawToken, tokenHash, expiresAt };
  }

  /**
   * Get pending invitations for workspace
   */
  async getInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('workspace_invitations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString());

      if (error || !data) return [];
      return data.map((inv) => ({
        id: inv.id,
        workspaceId: inv.workspace_id,
        email: inv.email,
        role: inv.role,
        invitedBy: inv.invited_by,
        expiresAt: inv.expires_at,
        createdAt: inv.created_at,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Cancel / revoke invitation
   */
  async cancelInvitation(invitationId: string) {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('workspace_invitations').delete().eq('id', invitationId);
    if (error) throw error;
  }
}

export const workspaceService = new WorkspaceService();
