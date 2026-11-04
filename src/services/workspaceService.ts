import { supabase, isSupabaseConfigured, getIsSupabaseConfigured } from './supabaseClient';
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
  workspaceName?: string;
  email: string;
  inviteeName?: string;
  role: 'admin' | 'editor' | 'viewer';
  status?: 'pending' | 'accepted' | 'declined' | 'cancelled';
  invitedBy: string;
  inviterName?: string;
  expiresAt: string;
  createdAt: string;
}

export interface InviteUserResult {
  invitationId: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  emailDelivery: {
    sent: boolean;
    provider?: string;
    error?: string;
  };
}

export class WorkspaceService {
  private isConfigured(): boolean {
    return isSupabaseConfigured || Boolean(getIsSupabaseConfigured?.());
  }

  /**
   * Fetch all workspaces that the current user belongs to
   */
  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    if (!this.isConfigured()) return [];
    try {
      const { data: memberRows, error: memberErr } = await supabase
        .from('workspace_members')
        .select('workspace_id, status')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (memberErr) {
        console.warn('Error fetching workspace member rows:', memberErr);
        return [];
      }
      if (!memberRows || memberRows.length === 0) return [];

      const workspaceIds = memberRows.map((m) => m.workspace_id);
      const { data: workspaces, error: wsErr } = await supabase
        .from('workspaces')
        .select('*')
        .in('id', workspaceIds)
        .order('created_at', { ascending: false });

      if (wsErr) {
        console.warn('Error fetching user workspaces:', wsErr);
        return [];
      }
      if (!workspaces) return [];

      return workspaces.map((w) => ({
        id: w.id,
        name: w.name,
        slug: w.slug,
        description: w.description || '',
        avatar: w.avatar || '⚡',
        createdBy: w.created_by,
        createdAt: w.created_at,
      }));
    } catch (err) {
      console.warn('getUserWorkspaces exception:', err);
      return [];
    }
  }

  /**
   * Atomic Workspace Creation RPC with caller as Owner
   */
  async createWorkspace(name: string, description = '', avatar = '⚡'): Promise<Workspace> {
    if (!this.isConfigured()) {
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
    if (!this.isConfigured() || !workspaceId) return [];
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

      if (error) {
        console.warn('Error fetching workspace members:', error);
        return [];
      }
      if (!members) return [];

      const userIds = members.map((m) => m.user_id).filter(Boolean);
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profData, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        if (profErr) {
          console.warn('Error fetching member profiles:', profErr);
        }
        profiles = profData || [];
      }

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
    } catch (err) {
      console.warn('getWorkspaceMembers exception:', err);
      return [];
    }
  }

  /**
   * Update member role (Owner / Admin only)
   */
  async updateMemberRole(workspaceId: string, memberId: string, role: 'owner' | 'admin' | 'editor' | 'viewer') {
    if (!this.isConfigured()) return;
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
    if (!this.isConfigured()) return;
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId)
      .eq('workspace_id', workspaceId);

    if (error) throw error;
  }

  /**
   * Validate email address syntax
   */
  validateEmail(email: string): boolean {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase().trim());
  }

  /**
   * Create an email-only invitation for user
   */
  async inviteUser(
    workspaceId: string,
    email: string,
    inviteeName: string = '',
    role: 'admin' | 'editor' | 'viewer' = 'editor'
  ): Promise<InviteUserResult> {
    const normalizedEmail = email.toLowerCase().trim();
    if (!this.validateEmail(normalizedEmail)) {
      throw new Error('Некорректный адрес электронной почты');
    }

    if ((role as string) === 'owner') {
      throw new Error('Роль владельца (Owner) не может быть назначена через приглашение');
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      throw new Error('Недопустимая роль для приглашения. Доступны: Admin, Editor, Viewer');
    }

    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const { data: userResp, error: userAuthErr } = await supabase.auth.getUser();
    if (userAuthErr || !userResp?.user) {
      throw new Error('Необходима авторизация для отправки приглашения');
    }
    const inviter = userResp.user;
    const inviterEmail = (inviter.email || '').toLowerCase().trim();

    // 1. Prevent inviting oneself
    if (inviterEmail && inviterEmail === normalizedEmail) {
      throw new Error('Вы не можете пригласить самого себя');
    }

    // 2. Check if inviter is manager (owner or admin)
    const { data: inviterMember, error: inviterMemberErr } = await supabase
      .from('workspace_members')
      .select('role, status')
      .eq('workspace_id', workspaceId)
      .eq('user_id', inviter.id)
      .maybeSingle();

    if (inviterMemberErr) {
      throw new Error(`Ошибка проверки прав: ${inviterMemberErr.message}`);
    }

    if (!inviterMember || !['owner', 'admin'].includes(inviterMember.role)) {
      throw new Error('Недостаточно прав. Только Владелец и Администратор могут приглашать участников.');
    }

    // 3. Check if the user is already an active member in this workspace (by profiles matching this email)
    const { data: existingProfiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, email')
      .ilike('email', normalizedEmail);

    if (profErr) {
      throw new Error(`Ошибка проверки существования профиля: ${profErr.message}`);
    }

    if (existingProfiles && existingProfiles.length > 0) {
      const existingUserIds = existingProfiles.map((p) => p.id);
      const { data: existingMembers, error: memErr } = await supabase
        .from('workspace_members')
        .select('id, status')
        .eq('workspace_id', workspaceId)
        .in('user_id', existingUserIds)
        .eq('status', 'active');

      if (memErr) {
        throw new Error(`Ошибка проверки членства: ${memErr.message}`);
      }

      if (existingMembers && existingMembers.length > 0) {
        throw new Error('Пользователь с этим email уже является активным участником этого пространства');
      }
    }

    // 4. Check if there is already a pending active invitation for this email in this workspace
    const { data: existingPending, error: pendingErr } = await supabase
      .from('workspace_invitations')
      .select('id, status, expires_at')
      .eq('workspace_id', workspaceId)
      .ilike('email', normalizedEmail)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (pendingErr) {
      throw new Error(`Ошибка проверки существующих приглашений: ${pendingErr.message}`);
    }

    if (existingPending) {
      throw new Error('Приглашение для этого email уже отправлено и ожидает подтверждения');
    }

    // 7 days expiration
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const insertPayload: any = {
      workspace_id: workspaceId,
      email: normalizedEmail,
      invitee_name: inviteeName.trim(),
      role,
      invited_by: inviter.id,
      status: 'pending',
      token_hash: null,
      expires_at: expiresAt,
    };

    const { data: inserted, error: insertErr } = await supabase
      .from('workspace_invitations')
      .insert(insertPayload)
      .select('id')
      .single();

    if (insertErr || !inserted) {
      if (insertErr?.code === '23505' || insertErr?.message?.includes('duplicate key')) {
        throw new Error('Приглашение для этого email уже существует и ожидает принятия');
      }
      throw new Error(insertErr?.message || 'Ошибка создания приглашения');
    }

    // Fetch workspace name for notification email
    const { data: wsData } = await supabase
      .from('workspaces')
      .select('name')
      .eq('id', workspaceId)
      .maybeSingle();
    const workspaceName = wsData?.name || 'ONE TEAM Workspace';

    const inviterName =
      inviter.user_metadata?.full_name ||
      inviter.user_metadata?.name ||
      inviter.email?.split('@')[0] ||
      'Участник команды';

    // Dispatch email notification via Supabase Edge Function
    let emailDelivery: { sent: boolean; provider?: string; error?: string } = {
      sent: false,
      provider: undefined,
      error: undefined,
    };

    try {
      const { data: fnData, error: fnErr } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          invitationId: inserted.id,
          workspaceId,
          workspaceName,
          inviterName,
          inviteeName: inviteeName.trim(),
          inviteeEmail: normalizedEmail,
          role,
        },
      });

      if (fnErr) {
        console.warn('Edge Function send-invitation-email invoke error:', fnErr);
        emailDelivery = {
          sent: false,
          provider: undefined,
          error: fnErr.message || 'Ошибка вызова функции отправки email',
        };
      } else if (fnData?.success) {
        emailDelivery = {
          sent: true,
          provider: fnData.provider || 'resend',
          error: undefined,
        };
      } else if (fnData?.error === 'EMAIL_PROVIDER_UNCONFIGURED') {
        emailDelivery = {
          sent: false,
          provider: undefined,
          error: 'EMAIL_PROVIDER_UNCONFIGURED',
        };
      } else {
        emailDelivery = {
          sent: false,
          provider: undefined,
          error: fnData?.error || 'Провайдер email вернул ошибку',
        };
      }
    } catch (invokeErr: any) {
      console.warn('send-invitation-email invocation exception:', invokeErr);
      emailDelivery = {
        sent: false,
        provider: undefined,
        error: invokeErr.message || 'Сбой соединения с email-сервисом',
      };
    }

    return {
      invitationId: inserted.id,
      email: normalizedEmail,
      role,
      emailDelivery,
    };
  }

  /**
   * Fetch all pending invitations addressed to the current authenticated user's email
   */
  async getUserInvitations(): Promise<WorkspaceInvitation[]> {
    if (!this.isConfigured()) return [];
    try {
      const { data: userResp } = await supabase.auth.getUser();
      if (!userResp.user || !userResp.user.email) return [];

      const userEmail = userResp.user.email.toLowerCase().trim();

      const { data: invitations, error } = await supabase
        .from('workspace_invitations')
        .select('*')
        .ilike('email', userEmail)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error querying user invitations:', error);
        return [];
      }
      if (!invitations || invitations.length === 0) return [];

      // Hydrate workspace names and inviter profiles
      const workspaceIds = Array.from(new Set(invitations.map((i) => i.workspace_id)));
      const inviterIds = Array.from(new Set(invitations.map((i) => i.invited_by)));

      const [wsRes, profRes] = await Promise.all([
        supabase.from('workspaces').select('id, name').in('id', workspaceIds),
        supabase.from('profiles').select('id, full_name, email').in('id', inviterIds),
      ]);

      const wsMap = new Map((wsRes.data || []).map((w) => [w.id, w.name]));
      const profMap = new Map((profRes.data || []).map((p) => [p.id, p.full_name || p.email]));

      return invitations.map((inv) => ({
        id: inv.id,
        workspaceId: inv.workspace_id,
        workspaceName: wsMap.get(inv.workspace_id) || 'Рабочее пространство',
        email: inv.email,
        inviteeName: inv.invitee_name || '',
        role: inv.role,
        status: inv.status || 'pending',
        invitedBy: inv.invited_by,
        inviterName: profMap.get(inv.invited_by) || 'Коллега',
        expiresAt: inv.expires_at,
        createdAt: inv.created_at,
      }));
    } catch (err) {
      console.warn('Failed to fetch user invitations:', err);
      return [];
    }
  }

  /**
   * Accept an invitation using atomic SQL RPC
   */
  async acceptInvitation(invitationId: string): Promise<{ success: boolean; workspaceId: string; role: string }> {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await supabase.rpc('accept_workspace_invitation', {
      invitation_id: invitationId,
    });

    if (error) {
      throw new Error(error.message || 'Ошибка принятия приглашения');
    }

    return {
      success: true,
      workspaceId: data.workspace_id,
      role: data.role,
    };
  }

  /**
   * Decline an invitation using atomic SQL RPC
   */
  async declineInvitation(invitationId: string): Promise<{ success: boolean; workspaceId: string }> {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await supabase.rpc('decline_workspace_invitation', {
      invitation_id: invitationId,
    });

    if (error) {
      throw new Error(error.message || 'Ошибка отклонения приглашения');
    }

    return {
      success: true,
      workspaceId: data.workspace_id,
    };
  }

  /**
   * Get pending invitations for a specific workspace (for managers)
   */
  async getInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
    if (!this.isConfigured() || !workspaceId) return [];
    try {
      const { data, error } = await supabase
        .from('workspace_invitations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching workspace invitations:', error);
        return [];
      }
      if (!data) return [];
      return data.map((inv) => ({
        id: inv.id,
        workspaceId: inv.workspace_id,
        email: inv.email,
        inviteeName: inv.invitee_name,
        role: inv.role,
        status: inv.status,
        invitedBy: inv.invited_by,
        expiresAt: inv.expires_at,
        createdAt: inv.created_at,
      }));
    } catch (err) {
      console.warn('getInvitations exception:', err);
      return [];
    }
  }

  /**
   * Cancel / revoke invitation by manager
   */
  async cancelInvitation(invitationId: string) {
    if (!this.isConfigured()) return;
    const { error } = await supabase
      .from('workspace_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId);

    if (error) throw error;
  }
}

export const workspaceService = new WorkspaceService();
