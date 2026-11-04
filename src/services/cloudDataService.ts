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
        supabase.from('workspace_members').select('*, profiles(*)').eq('workspace_id', workspaceId),
      ]);

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

      const members: TeamMember[] = (membersRes.data || []).map((m: any) => ({
        id: m.user_id,
        name: m.profiles?.full_name || 'Участник',
        position: m.profiles?.position || 'Специалист',
        role: m.role,
        email: m.profiles?.email || '',
        avatar: m.profiles?.avatar_url || '',
        isOnline: Boolean(m.profiles?.is_online),
        workload: 30,
        assignedProjectIds: [],
        department: m.profiles?.department || 'Разработка',
      }));

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

  // Cloud Mutators
  async syncTask(workspaceId: string, task: Task) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      await supabase.from('tasks').upsert({
        id: task.id.length > 20 && !task.id.startsWith('task-') ? task.id : undefined,
        workspace_id: workspaceId,
        project_id: task.projectId || null,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.dueDate,
        completed: task.completed,
        comments: task.comments,
        activities: task.activities,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Sync task failed:', e);
    }
  }

  async deleteTask(workspaceId: string, taskId: string) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      await supabase.from('tasks').delete().eq('id', taskId).eq('workspace_id', workspaceId);
    } catch (e) {
      console.warn('Delete task failed:', e);
    }
  }

  async syncProject(workspaceId: string, proj: Project) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      await supabase.from('projects').upsert({
        id: proj.id.length > 20 && !proj.id.startsWith('proj-') ? proj.id : undefined,
        workspace_id: workspaceId,
        name: proj.name,
        description: proj.description,
        status: proj.status,
        progress: proj.progress,
        deadline: proj.deadline,
        category: proj.category,
        is_archived: proj.isArchived,
        client_id: proj.clientId || null,
        client_name: proj.clientName,
        member_ids: proj.memberIds,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Sync project failed:', e);
    }
  }

  async deleteProject(workspaceId: string, projId: string) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      await supabase.from('projects').delete().eq('id', projId).eq('workspace_id', workspaceId);
    } catch (e) {
      console.warn('Delete project failed:', e);
    }
  }

  async syncClient(workspaceId: string, client: Client) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      await supabase.from('clients').upsert({
        id: client.id.length > 20 && !client.id.startsWith('client-') ? client.id : undefined,
        workspace_id: workspaceId,
        name: client.name,
        contact_person: client.contactPerson,
        email: client.email,
        phone: client.phone,
        status: client.status,
        deal_value: client.dealValue,
        deal_currency: client.dealCurrency,
        associated_project_id: client.associatedProjectId || null,
        description: client.description,
        avatar: client.avatar,
        last_interaction: client.lastInteraction,
        notes: client.notes,
        interactions: client.interactions,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Sync client failed:', e);
    }
  }

  async deleteClient(workspaceId: string, clientId: string) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      await supabase.from('clients').delete().eq('id', clientId).eq('workspace_id', workspaceId);
    } catch (e) {
      console.warn('Delete client failed:', e);
    }
  }

  async syncTransaction(workspaceId: string, tx: Transaction) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      await supabase.from('transactions').upsert({
        id: tx.id.length > 20 && !tx.id.startsWith('tx-') ? tx.id : undefined,
        workspace_id: workspaceId,
        title: tx.title,
        amount: tx.amount,
        currency: tx.currency,
        type: tx.type,
        category: tx.category,
        date: tx.date,
        status: tx.status,
        project_id: tx.projectId || null,
        client_id: tx.clientId || null,
        notes: tx.notes,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Sync transaction failed:', e);
    }
  }

  async deleteTransaction(workspaceId: string, txId: string) {
    if (!isSupabaseConfigured || !workspaceId) return;
    try {
      await supabase.from('transactions').delete().eq('id', txId).eq('workspace_id', workspaceId);
    } catch (e) {
      console.warn('Delete transaction failed:', e);
    }
  }
}

export const cloudDataService = new CloudDataService();
