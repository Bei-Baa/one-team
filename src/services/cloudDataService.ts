import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  Task,
  Project,
  TeamMember,
  Client,
  Transaction,
  StrategicGoal,
  StrategicPriority,
  DevelopmentPlanItem,
  TeamMission,
  TeamVision,
  WorkspaceSettings,
  NotificationItem,
} from '../types';

export class CloudDataService {
  /**
   * Load entire active workspace dataset from Supabase PostgreSQL
   */
  async loadWorkspaceData(workspaceId: string) {
    if (!isSupabaseConfigured || !workspaceId) return null;

    try {
      const [
        tasksRes,
        projectsRes,
        clientsRes,
        txsRes,
        goalsRes,
        prioritiesRes,
        plansRes,
        missionRes,
        visionRes,
        settingsRes,
        notificationsRes,
        membersRes,
      ] = await Promise.all([
        supabase.from('tasks').select('*').eq('workspace_id', workspaceId),
        supabase.from('projects').select('*').eq('workspace_id', workspaceId),
        supabase.from('clients').select('*').eq('workspace_id', workspaceId),
        supabase.from('transactions').select('*').eq('workspace_id', workspaceId),
        supabase.from('strategic_goals').select('*').eq('workspace_id', workspaceId),
        supabase.from('strategic_priorities').select('*').eq('workspace_id', workspaceId),
        supabase.from('strategic_plans').select('*').eq('workspace_id', workspaceId),
        supabase.from('strategy_missions').select('*').eq('workspace_id', workspaceId).maybeSingle(),
        supabase.from('strategy_visions').select('*').eq('workspace_id', workspaceId).maybeSingle(),
        supabase.from('workspace_settings').select('*').eq('workspace_id', workspaceId).maybeSingle(),
        supabase.from('notifications').select('*').eq('workspace_id', workspaceId),
        supabase.from('workspace_members').select('*').eq('workspace_id', workspaceId),
      ]);

      if (membersRes.error) {
        throw membersRes.error;
      }

      // Fetch profiles in batch for all workspace members
      const rawMembers = membersRes.data || [];
      const userIds = Array.from(
        new Set(rawMembers.map((m: any) => m.user_id).filter((id: string) => Boolean(id) && this.isValidUUID(id)))
      );

      let profilesRes: any = { data: [] };
      if (userIds.length > 0) {
        profilesRes = await supabase.from('profiles').select('*').in('id', userIds);
        if (profilesRes.error) {
          throw profilesRes.error;
        }
      }

      const profileMap = new Map<string, any>(
        (profilesRes.data || []).map((p: any) => [p.id, p])
      );

      const tasks: Task[] = (tasksRes.data || []).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        status: t.status,
        priority: t.priority,
        projectId: t.project_id || '',
        assigneeId: t.assignee_id || '',
        dueDate: t.due_date,
        completed: Boolean(t.completed),
        comments: t.comments || [],
        activities: t.activities || [],
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));

      const projects: Project[] = (projectsRes.data || []).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        status: p.status,
        progress: p.progress,
        deadline: p.deadline,
        memberIds: p.member_ids || [],
        isArchived: Boolean(p.is_archived),
        category: p.category || 'Общий',
        clientId: p.client_id,
        clientName: p.client_name,
        createdAt: p.created_at,
      }));

      const clients: Client[] = (clientsRes.data || []).map((c) => ({
        id: c.id,
        name: c.name,
        contactPerson: c.contact_person || '',
        email: c.email || '',
        phone: c.phone || '',
        status: c.status,
        dealValue: Number(c.deal_value || 0),
        dealCurrency: c.deal_currency || 'KZT',
        associatedProjectId: c.associated_project_id,
        description: c.description || '',
        avatar: c.avatar || '',
        lastInteraction: c.last_interaction,
        notes: c.notes || [],
        interactions: c.interactions || [],
        createdAt: c.created_at,
      }));

      const transactions: Transaction[] = (txsRes.data || []).map((tx) => ({
        id: tx.id,
        title: tx.title,
        amount: Number(tx.amount || 0),
        currency: tx.currency,
        type: tx.type,
        category: tx.category,
        date: tx.date,
        status: tx.status,
        projectId: tx.project_id,
        clientId: tx.client_id,
        notes: tx.notes || '',
        createdAt: tx.created_at,
      }));

      const goals: StrategicGoal[] = (goalsRes.data || []).map((g) => ({
        id: g.id,
        title: g.title,
        description: g.description || '',
        category: g.category || 'Развитие',
        ownerId: g.owner_id || '',
        ownerName: g.owner_name || '',
        startDate: g.start_date,
        targetDate: g.target_date,
        progress: g.progress,
        status: g.status,
        relatedProjectIds: g.related_project_ids || [],
        successCriteria: g.success_criteria || [],
        createdAt: g.created_at,
        updatedAt: g.updated_at,
      }));

      const priorities: StrategicPriority[] = (prioritiesRes.data || []).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        importance: p.importance,
        ownerId: p.owner_id || '',
        ownerName: p.owner_name || '',
        expectedResult: p.expected_result || '',
        deadline: p.deadline,
        status: p.status,
        relatedGoalId: p.related_goal_id,
        order: p.sort_order,
        progress: p.progress,
      }));

      const plans: DevelopmentPlanItem[] = (plansRes.data || []).map((pl) => ({
        id: pl.id,
        title: pl.title,
        description: pl.description || '',
        timePeriod: pl.time_period,
        quarter: pl.quarter,
        month: pl.month,
        ownerId: pl.owner_id || '',
        ownerName: pl.owner_name || '',
        status: pl.status,
        progress: pl.progress,
        relatedGoalId: pl.related_goal_id,
        expectedOutcome: pl.expected_outcome || '',
        deadline: pl.deadline,
        order: pl.sort_order,
      }));

      const members: TeamMember[] = rawMembers.map((m: any) => {
        const prof = profileMap.get(m.user_id);
        return {
          id: m.user_id,
          name: prof?.full_name || 'Участник',
          position: prof?.position || 'Специалист',
          role: m.role,
          email: prof?.email || '',
          avatar: prof?.avatar_url || '',
          isOnline: Boolean(prof?.is_online),
          workload: 30,
          assignedProjectIds: [],
          department: prof?.department || 'Разработка',
        };
      });

      return {
        tasks,
        projects,
        clients,
        transactions,
        goals,
        priorities,
        plans,
        mission: missionRes.data ? {
          id: missionRes.data.id,
          statement: missionRes.data.statement,
          purpose: missionRes.data.purpose,
          customerValue: missionRes.data.customer_value,
          principles: missionRes.data.principles || [],
          ownerId: missionRes.data.owner_id || '',
          ownerName: missionRes.data.owner_name || '',
          updatedAt: missionRes.data.updated_at,
          revisions: missionRes.data.revisions || [],
        } : null,
        vision: visionRes.data ? {
          id: visionRes.data.id,
          statement: visionRes.data.statement,
          desiredState: visionRes.data.desired_state,
          direction: visionRes.data.direction,
          targetHorizon: visionRes.data.target_horizon,
          expectedOutcomes: visionRes.data.expected_outcomes || [],
          ownerId: visionRes.data.owner_id || '',
          ownerName: visionRes.data.owner_name || '',
          updatedAt: visionRes.data.updated_at,
          revisions: visionRes.data.revisions || [],
        } : null,
        members,
      };
    } catch (err) {
      console.warn('Error reading workspace tables from Supabase:', err);
      return null;
    }
  }

  // UUID Helper
  private isValidUUID(str: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
  }

  // Cloud Mutators
  async syncTask(workspaceId: string, task: Task) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      const payload: Record<string, any> = {
        workspace_id: workspaceId,
        project_id: task.projectId && this.isValidUUID(task.projectId) ? task.projectId : null,
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        due_date: task.dueDate || new Date().toISOString().split('T')[0],
        completed: task.completed,
        comments: task.comments || [],
        activities: task.activities || [],
        updated_at: new Date().toISOString(),
      };
      if (this.isValidUUID(task.id)) {
        payload.id = task.id;
      }
      await supabase.from('tasks').upsert(payload);
    } catch (e) {
      console.warn('Sync task failed:', e);
    }
  }

  async deleteTask(workspaceId: string, taskId: string) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      if (this.isValidUUID(taskId)) {
        await supabase.from('tasks').delete().eq('id', taskId).eq('workspace_id', workspaceId);
      }
    } catch (e) {
      console.warn('Delete task failed:', e);
    }
  }

  async syncProject(workspaceId: string, proj: Project) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      const payload: Record<string, any> = {
        workspace_id: workspaceId,
        name: proj.name,
        description: proj.description || '',
        status: proj.status,
        progress: proj.progress || 0,
        deadline: proj.deadline || new Date().toISOString().split('T')[0],
        category: proj.category || 'Общий',
        is_archived: proj.isArchived || false,
        client_id: proj.clientId && this.isValidUUID(proj.clientId) ? proj.clientId : null,
        client_name: proj.clientName || '',
        member_ids: proj.memberIds || [],
        updated_at: new Date().toISOString(),
      };
      if (this.isValidUUID(proj.id)) {
        payload.id = proj.id;
      }
      await supabase.from('projects').upsert(payload);
    } catch (e) {
      console.warn('Sync project failed:', e);
    }
  }

  async deleteProject(workspaceId: string, projId: string) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      if (this.isValidUUID(projId)) {
        await supabase.from('projects').delete().eq('id', projId).eq('workspace_id', workspaceId);
      }
    } catch (e) {
      console.warn('Delete project failed:', e);
    }
  }

  async syncClient(workspaceId: string, client: Client) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      const payload: Record<string, any> = {
        workspace_id: workspaceId,
        name: client.name,
        contact_person: client.contactPerson || '',
        email: client.email || '',
        phone: client.phone || '',
        status: client.status,
        deal_value: Number(Number(client.dealValue || 0).toFixed(2)),
        deal_currency: client.dealCurrency || 'KZT',
        associated_project_id:
          client.associatedProjectId && this.isValidUUID(client.associatedProjectId)
            ? client.associatedProjectId
            : null,
        description: client.description || '',
        avatar: client.avatar || '',
        last_interaction: client.lastInteraction || new Date().toISOString().split('T')[0],
        notes: client.notes || [],
        interactions: client.interactions || [],
        updated_at: new Date().toISOString(),
      };
      if (this.isValidUUID(client.id)) {
        payload.id = client.id;
      }
      await supabase.from('clients').upsert(payload);
    } catch (e) {
      console.warn('Sync client failed:', e);
    }
  }

  async deleteClient(workspaceId: string, clientId: string) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      if (this.isValidUUID(clientId)) {
        await supabase.from('clients').delete().eq('id', clientId).eq('workspace_id', workspaceId);
      }
    } catch (e) {
      console.warn('Delete client failed:', e);
    }
  }

  async syncTransaction(workspaceId: string, tx: Transaction) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      const payload: Record<string, any> = {
        workspace_id: workspaceId,
        title: tx.title,
        amount: Number(Number(tx.amount || 0).toFixed(2)),
        currency: tx.currency || 'KZT',
        type: tx.type,
        category: tx.category,
        date: tx.date || new Date().toISOString().split('T')[0],
        status: tx.status,
        project_id: tx.projectId && this.isValidUUID(tx.projectId) ? tx.projectId : null,
        client_id: tx.clientId && this.isValidUUID(tx.clientId) ? tx.clientId : null,
        notes: tx.notes || '',
        updated_at: new Date().toISOString(),
      };
      if (this.isValidUUID(tx.id)) {
        payload.id = tx.id;
      }
      await supabase.from('transactions').upsert(payload);
    } catch (e) {
      console.warn('Sync transaction failed:', e);
    }
  }

  async deleteTransaction(workspaceId: string, txId: string) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      if (this.isValidUUID(txId)) {
        await supabase.from('transactions').delete().eq('id', txId).eq('workspace_id', workspaceId);
      }
    } catch (e) {
      console.warn('Delete transaction failed:', e);
    }
  }

  // Strategy Mutators
  async syncGoal(workspaceId: string, goal: StrategicGoal) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      const payload: Record<string, any> = {
        workspace_id: workspaceId,
        title: goal.title,
        description: goal.description || '',
        category: goal.category || 'Развитие',
        owner_name: goal.ownerName || '',
        start_date: goal.startDate || new Date().toISOString().split('T')[0],
        target_date: goal.targetDate || new Date().toISOString().split('T')[0],
        progress: goal.progress || 0,
        status: goal.status,
        related_project_ids: goal.relatedProjectIds || [],
        success_criteria: goal.successCriteria || [],
        updated_at: new Date().toISOString(),
      };
      if (this.isValidUUID(goal.id)) {
        payload.id = goal.id;
      }
      await supabase.from('strategic_goals').upsert(payload);
    } catch (e) {
      console.warn('Sync goal failed:', e);
    }
  }

  async deleteGoal(workspaceId: string, goalId: string) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      if (this.isValidUUID(goalId)) {
        await supabase.from('strategic_goals').delete().eq('id', goalId).eq('workspace_id', workspaceId);
      }
    } catch (e) {
      console.warn('Delete goal failed:', e);
    }
  }

  async syncPriority(workspaceId: string, priority: StrategicPriority) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      const payload: Record<string, any> = {
        workspace_id: workspaceId,
        name: priority.name,
        description: priority.description || '',
        importance: priority.importance,
        owner_name: priority.ownerName || '',
        expected_result: priority.expectedResult || '',
        deadline: priority.deadline || new Date().toISOString().split('T')[0],
        status: priority.status,
        related_goal_id:
          priority.relatedGoalId && this.isValidUUID(priority.relatedGoalId)
            ? priority.relatedGoalId
            : null,
        sort_order: priority.order || 0,
        progress: priority.progress || 0,
        updated_at: new Date().toISOString(),
      };
      if (this.isValidUUID(priority.id)) {
        payload.id = priority.id;
      }
      await supabase.from('strategic_priorities').upsert(payload);
    } catch (e) {
      console.warn('Sync priority failed:', e);
    }
  }

  async deletePriority(workspaceId: string, priorityId: string) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      if (this.isValidUUID(priorityId)) {
        await supabase
          .from('strategic_priorities')
          .delete()
          .eq('id', priorityId)
          .eq('workspace_id', workspaceId);
      }
    } catch (e) {
      console.warn('Delete priority failed:', e);
    }
  }

  async syncPlanItem(workspaceId: string, plan: DevelopmentPlanItem) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      const payload: Record<string, any> = {
        workspace_id: workspaceId,
        title: plan.title,
        description: plan.description || '',
        time_period: plan.timePeriod,
        quarter: plan.quarter,
        month: plan.month || '',
        owner_name: plan.ownerName || '',
        status: plan.status,
        progress: plan.progress || 0,
        related_goal_id:
          plan.relatedGoalId && this.isValidUUID(plan.relatedGoalId) ? plan.relatedGoalId : null,
        expected_outcome: plan.expectedOutcome || '',
        deadline: plan.deadline || new Date().toISOString().split('T')[0],
        sort_order: plan.order || 0,
        updated_at: new Date().toISOString(),
      };
      if (this.isValidUUID(plan.id)) {
        payload.id = plan.id;
      }
      await supabase.from('strategic_plans').upsert(payload);
    } catch (e) {
      console.warn('Sync plan item failed:', e);
    }
  }

  async deletePlanItem(workspaceId: string, planId: string) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      if (this.isValidUUID(planId)) {
        await supabase
          .from('strategic_plans')
          .delete()
          .eq('id', planId)
          .eq('workspace_id', workspaceId);
      }
    } catch (e) {
      console.warn('Delete plan item failed:', e);
    }
  }

  async syncMission(workspaceId: string, mission: TeamMission) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      await supabase.from('strategy_missions').upsert(
        {
          workspace_id: workspaceId,
          statement: mission.statement || '',
          purpose: mission.purpose || '',
          customer_value: mission.customerValue || '',
          principles: mission.principles || [],
          owner_name: mission.ownerName || '',
          revisions: mission.revisions || [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'workspace_id' }
      );
    } catch (e) {
      console.warn('Sync mission failed:', e);
    }
  }

  async syncVision(workspaceId: string, vision: TeamVision) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      await supabase.from('strategy_visions').upsert(
        {
          workspace_id: workspaceId,
          statement: vision.statement || '',
          desired_state: vision.desiredState || '',
          direction: vision.direction || '',
          target_horizon: vision.targetHorizon || '3_years',
          expected_outcomes: vision.expectedOutcomes || [],
          owner_name: vision.ownerName || '',
          revisions: vision.revisions || [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'workspace_id' }
      );
    } catch (e) {
      console.warn('Sync vision failed:', e);
    }
  }

  // Settings Mutator
  async syncSettings(workspaceId: string, settings: WorkspaceSettings) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      await supabase.from('workspace_settings').upsert(
        {
          workspace_id: workspaceId,
          default_currency: settings.defaultCurrency || 'KZT',
          theme: settings.theme || 'dark',
          notifications_config: settings.notifications || {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'workspace_id' }
      );
    } catch (e) {
      console.warn('Sync settings failed:', e);
    }
  }
}

export const cloudDataService = new CloudDataService();
