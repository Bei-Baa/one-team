import { supabase, isSupabaseConfigured } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export class RealtimeService {
  private channel: RealtimeChannel | null = null;

  /**
   * Subscribes to realtime updates for tasks, projects, members, and notifications
   * strictly scoped to the active workspace.
   */
  subscribeToWorkspace(workspaceId: string, onUpdate: (table: string, payload: any) => void) {
    if (!isSupabaseConfigured || !workspaceId) return;

    // Unsubscribe from previous channel if active
    this.unsubscribe();

    this.channel = supabase
      .channel(`workspace-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => onUpdate('tasks', payload)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => onUpdate('projects', payload)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_members',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => onUpdate('members', payload)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => onUpdate('notifications', payload)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.info(`Supabase Realtime connected for workspace ${workspaceId}`);
        }
      });
  }

  /**
   * Unsubscribe and clean up channel
   */
  unsubscribe() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

export const realtimeService = new RealtimeService();
