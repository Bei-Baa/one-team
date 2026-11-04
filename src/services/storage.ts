import {
  Task,
  Project,
  TeamMember,
  WorkspaceSettings,
  NotificationItem,
  TaskStatus,
  Priority,
  TaskComment,
  Client,
  Transaction,
  ClientNote,
  ClientInteraction,
  TeamMission,
  TeamVision,
  StrategicGoal,
  StrategicPriority,
  DevelopmentPlanItem,
} from '../types';
import {
  INITIAL_TASKS,
  INITIAL_PROJECTS,
  INITIAL_MEMBERS,
  INITIAL_SETTINGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_CLIENTS,
  INITIAL_TRANSACTIONS,
  INITIAL_MISSION,
  INITIAL_VISION,
  INITIAL_STRATEGIC_GOALS,
  INITIAL_STRATEGIC_PRIORITIES,
  INITIAL_DEVELOPMENT_PLAN,
} from './mockData';
import { indexedDbEngine, STORES } from './indexedDb';

export const STORAGE_KEYS = {
  TASKS: 'oneteam_tasks_v1',
  PROJECTS: 'oneteam_projects_v1',
  MEMBERS: 'oneteam_members_v1',
  SETTINGS: 'oneteam_settings_v1',
  NOTIFICATIONS: 'oneteam_notifications_v1',
  CLIENTS: 'oneteam_clients_v1',
  TRANSACTIONS: 'oneteam_transactions_v1',
  MISSION: 'oneteam_mission_v1',
  VISION: 'oneteam_vision_v1',
  GOALS: 'oneteam_goals_v1',
  PRIORITIES: 'oneteam_priorities_v1',
  PLAN: 'oneteam_plan_v1',
};

class StorageService {
  constructor() {
    this.initIndexedDbSync();
  }

  public isDemoCleaned(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem('oneteam_demo_cleaned_v1') === 'true';
  }

  /**
   * Initializes IndexedDB and hydrates data from IndexedDB into memory/localStorage,
   * or migrates existing localStorage data into IndexedDB.
   */
  async initIndexedDbSync(): Promise<void> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return;
    try {
      await indexedDbEngine.getDb();
      // Ensure settings and local user profile are persisted if present in localStorage,
      // but strictly NEVER automatically seed demo business records.
      const idbSettings = await indexedDbEngine.get(STORES.SETTINGS, 'current');
      if (!idbSettings) {
        await indexedDbEngine.put(STORES.SETTINGS, { id: 'current', ...this.getSettings() });
      }
      const idbMembers = await indexedDbEngine.getAll<TeamMember>(STORES.MEMBERS);
      if (idbMembers.length === 0) {
        const curMembers = this.getMembers();
        if (curMembers.length > 0) {
          await indexedDbEngine.setAll(STORES.MEMBERS, curMembers);
        }
      }
    } catch (e) {
      console.warn('IndexedDB sync initialization notice:', e);
    }
  }

  private safeGet<T>(key: string, defaultValue: T): T {
    try {
      if (typeof localStorage === 'undefined') return defaultValue;
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch (e) {
      console.warn(`Failed to read ${key} from storage:`, e);
      return defaultValue;
    }
  }

  private safeSet<T>(key: string, value: T, storeName?: (typeof STORES)[keyof typeof STORES]): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.warn(`Failed to write ${key} to storage:`, e);
    }

    // Asynchronously persist to IndexedDB
    if (storeName && typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
      if (Array.isArray(value)) {
        indexedDbEngine.setAll(storeName, value).catch((e) => {
          console.warn(`IndexedDB setAll failed for ${storeName}:`, e);
        });
      } else {
        indexedDbEngine.put(storeName, { id: 'current', ...(value as any) }).catch((e) => {
          console.warn(`IndexedDB put failed for ${storeName}:`, e);
        });
      }
    }
  }

  // Tasks
  getTasks(): Task[] {
    return this.safeGet<Task[]>(STORAGE_KEYS.TASKS, []);
  }

  saveTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Task {
    const tasks = this.getTasks();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (task.id) {
      const index = tasks.findIndex((t) => t.id === task.id);
      if (index !== -1) {
        const updated: Task = {
          ...tasks[index],
          ...task,
          updatedAt: now,
        };
        tasks[index] = updated;
        this.safeSet(STORAGE_KEYS.TASKS, tasks, STORES.TASKS);
        return updated;
      }
    }

    const newTask: Task = {
      ...task,
      id: task.id || `task-${Date.now()}`,
      comments: task.comments || [],
      activities: task.activities || [
        {
          id: `a-${Date.now()}`,
          action: 'Задача создана',
          authorName: 'Екатерина Соколова',
          timestamp: now,
        },
      ],
      completed: task.completed ?? task.status === 'done',
      createdAt: now,
      updatedAt: now,
    };

    tasks.unshift(newTask);
    this.safeSet(STORAGE_KEYS.TASKS, tasks, STORES.TASKS);
    return newTask;
  }

  deleteTask(taskId: string): void {
    const tasks = this.getTasks().filter((t) => t.id !== taskId);
    this.safeSet(STORAGE_KEYS.TASKS, tasks, STORES.TASKS);
  }

  updateTaskStatus(taskId: string, status: TaskStatus): Task | null {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return null;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const statusLabels: Record<TaskStatus, string> = {
      todo: 'К выполнению',
      in_progress: 'В работе',
      review: 'На проверке',
      done: 'Готово',
    };

    const task = tasks[index];
    const updated: Task = {
      ...task,
      status,
      completed: status === 'done',
      updatedAt: now,
      activities: [
        {
          id: `a-${Date.now()}`,
          action: `Статус изменён на "${statusLabels[status]}"`,
          authorName: 'Екатерина Соколова',
          timestamp: now,
        },
        ...task.activities,
      ],
    };

    tasks[index] = updated;
    this.safeSet(STORAGE_KEYS.TASKS, tasks, STORES.TASKS);
    return updated;
  }

  toggleTaskCompletion(taskId: string): Task | null {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return null;

    const task = tasks[index];
    const newCompleted = !task.completed;
    const newStatus: TaskStatus = newCompleted ? 'done' : 'in_progress';
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updated: Task = {
      ...task,
      completed: newCompleted,
      status: newStatus,
      updatedAt: now,
      activities: [
        {
          id: `a-${Date.now()}`,
          action: newCompleted ? 'Задача отмечена как выполненная' : 'Задача возвращена в работу',
          authorName: 'Екатерина Соколова',
          timestamp: now,
        },
        ...task.activities,
      ],
    };

    tasks[index] = updated;
    this.safeSet(STORAGE_KEYS.TASKS, tasks);
    return updated;
  }

  addTaskComment(taskId: string, text: string, author: { name: string; avatar: string }): TaskComment | null {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return null;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const comment: TaskComment = {
      id: `c-${Date.now()}`,
      authorId: 'user-1',
      authorName: author.name,
      authorAvatar: author.avatar,
      text,
      createdAt: now,
    };

    tasks[index].comments.push(comment);
    tasks[index].updatedAt = now;
    this.safeSet(STORAGE_KEYS.TASKS, tasks, STORES.TASKS);
    return comment;
  }

  // Projects
  getProjects(): Project[] {
    return this.safeGet<Project[]>(STORAGE_KEYS.PROJECTS, []);
  }

  saveProject(project: Omit<Project, 'id' | 'createdAt'> & { id?: string }): Project {
    const projects = this.getProjects();
    const now = new Date().toISOString().split('T')[0];

    if (project.id) {
      const index = projects.findIndex((p) => p.id === project.id);
      if (index !== -1) {
        const updated: Project = {
          ...projects[index],
          ...project,
        };
        projects[index] = updated;
        this.safeSet(STORAGE_KEYS.PROJECTS, projects, STORES.PROJECTS);
        return updated;
      }
    }

    const newProject: Project = {
      ...project,
      id: project.id || `proj-${Date.now()}`,
      createdAt: now,
    };

    projects.unshift(newProject);
    this.safeSet(STORAGE_KEYS.PROJECTS, projects, STORES.PROJECTS);
    return newProject;
  }

  deleteProject(projectId: string): void {
    const projects = this.getProjects().filter((p) => p.id !== projectId);
    this.safeSet(STORAGE_KEYS.PROJECTS, projects, STORES.PROJECTS);
  }

  toggleArchiveProject(projectId: string): Project | null {
    const projects = this.getProjects();
    const index = projects.findIndex((p) => p.id === projectId);
    if (index === -1) return null;

    projects[index].isArchived = !projects[index].isArchived;
    this.safeSet(STORAGE_KEYS.PROJECTS, projects, STORES.PROJECTS);
    return projects[index];
  }

  // Members
  getMembers(): TeamMember[] {
    return this.safeGet<TeamMember[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
  }

  saveMember(member: Omit<TeamMember, 'id'> & { id?: string }): TeamMember {
    const members = this.getMembers();

    if (member.id) {
      const index = members.findIndex((m) => m.id === member.id);
      if (index !== -1) {
        const updated: TeamMember = {
          ...members[index],
          ...member,
        };
        members[index] = updated;
        this.safeSet(STORAGE_KEYS.MEMBERS, members, STORES.MEMBERS);
        return updated;
      }
    }

    const newMember: TeamMember = {
      ...member,
      id: member.id || `user-${Date.now()}`,
    };

    members.push(newMember);
    this.safeSet(STORAGE_KEYS.MEMBERS, members, STORES.MEMBERS);
    return newMember;
  }

  deleteMember(memberId: string): void {
    const members = this.getMembers().filter((m) => m.id !== memberId);
    this.safeSet(STORAGE_KEYS.MEMBERS, members, STORES.MEMBERS);
  }

  // Clients
  getClients(): Client[] {
    return this.safeGet<Client[]>(STORAGE_KEYS.CLIENTS, []);
  }

  saveClient(client: Omit<Client, 'id' | 'createdAt'> & { id?: string }): Client {
    const clients = this.getClients();
    const now = new Date().toISOString().split('T')[0];

    if (client.id) {
      const index = clients.findIndex((c) => c.id === client.id);
      if (index !== -1) {
        const updated: Client = {
          ...clients[index],
          ...client,
        };
        clients[index] = updated;
        this.safeSet(STORAGE_KEYS.CLIENTS, clients, STORES.CLIENTS);
        return updated;
      }
    }

    const newClient: Client = {
      ...client,
      id: client.id || `client-${Date.now()}`,
      notes: client.notes || [],
      interactions: client.interactions || [],
      createdAt: now,
    };

    clients.unshift(newClient);
    this.safeSet(STORAGE_KEYS.CLIENTS, clients, STORES.CLIENTS);
    return newClient;
  }

  deleteClient(clientId: string): void {
    const clients = this.getClients().filter((c) => c.id !== clientId);
    this.safeSet(STORAGE_KEYS.CLIENTS, clients, STORES.CLIENTS);
  }

  toggleArchiveClient(clientId: string): Client | null {
    const clients = this.getClients();
    const index = clients.findIndex((c) => c.id === clientId);
    if (index === -1) return null;

    const currentStatus = clients[index].status;
    clients[index].status = currentStatus === 'archived' ? 'active' : 'archived';
    this.safeSet(STORAGE_KEYS.CLIENTS, clients, STORES.CLIENTS);
    return clients[index];
  }

  addClientNote(clientId: string, text: string, authorName: string): ClientNote | null {
    const clients = this.getClients();
    const index = clients.findIndex((c) => c.id === clientId);
    if (index === -1) return null;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const note: ClientNote = {
      id: `cn-${Date.now()}`,
      text,
      authorName,
      createdAt: now,
    };

    clients[index].notes.unshift(note);
    this.safeSet(STORAGE_KEYS.CLIENTS, clients, STORES.CLIENTS);
    return note;
  }

  addClientInteraction(clientId: string, interaction: Omit<ClientInteraction, 'id'>): ClientInteraction | null {
    const clients = this.getClients();
    const index = clients.findIndex((c) => c.id === clientId);
    if (index === -1) return null;

    const newInteraction: ClientInteraction = {
      ...interaction,
      id: `ci-${Date.now()}`,
    };

    clients[index].interactions.unshift(newInteraction);
    clients[index].lastInteraction = interaction.date;
    this.safeSet(STORAGE_KEYS.CLIENTS, clients, STORES.CLIENTS);
    return newInteraction;
  }

  // Transactions (Finance)
  getTransactions(): Transaction[] {
    return this.safeGet<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
  }

  saveTransaction(tx: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }): Transaction {
    const transactions = this.getTransactions();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (tx.id) {
      const index = transactions.findIndex((t) => t.id === tx.id);
      if (index !== -1) {
        const updated: Transaction = {
          ...transactions[index],
          ...tx,
        };
        transactions[index] = updated;
        this.safeSet(STORAGE_KEYS.TRANSACTIONS, transactions, STORES.TRANSACTIONS);
        return updated;
      }
    }

    const newTx: Transaction = {
      ...tx,
      id: tx.id || `tx-${Date.now()}`,
      createdAt: now,
    };

    transactions.unshift(newTx);
    this.safeSet(STORAGE_KEYS.TRANSACTIONS, transactions, STORES.TRANSACTIONS);
    return newTx;
  }

  deleteTransaction(txId: string): void {
    const transactions = this.getTransactions().filter((t) => t.id !== txId);
    this.safeSet(STORAGE_KEYS.TRANSACTIONS, transactions, STORES.TRANSACTIONS);
  }

  // STRATEGY MODULE METHODS
  getStrategyMission(): TeamMission {
    return this.safeGet<TeamMission>(STORAGE_KEYS.MISSION, INITIAL_MISSION);
  }

  saveStrategyMission(mission: TeamMission): TeamMission {
    this.safeSet(STORAGE_KEYS.MISSION, mission, STORES.MISSION);
    return mission;
  }

  getStrategyVision(): TeamVision {
    return this.safeGet<TeamVision>(STORAGE_KEYS.VISION, INITIAL_VISION);
  }

  saveStrategyVision(vision: TeamVision): TeamVision {
    this.safeSet(STORAGE_KEYS.VISION, vision, STORES.VISION);
    return vision;
  }

  getStrategicGoals(): StrategicGoal[] {
    return this.safeGet<StrategicGoal[]>(STORAGE_KEYS.GOALS, []);
  }

  saveStrategicGoal(goal: Omit<StrategicGoal, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): StrategicGoal {
    const goals = this.getStrategicGoals();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (goal.id) {
      const index = goals.findIndex((g) => g.id === goal.id);
      if (index !== -1) {
        const updated: StrategicGoal = {
          ...goals[index],
          ...goal,
          updatedAt: now,
        };
        goals[index] = updated;
        this.safeSet(STORAGE_KEYS.GOALS, goals, STORES.GOALS);
        return updated;
      }
    }

    const newGoal: StrategicGoal = {
      ...goal,
      id: goal.id || `goal-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    goals.unshift(newGoal);
    this.safeSet(STORAGE_KEYS.GOALS, goals, STORES.GOALS);
    return newGoal;
  }

  deleteStrategicGoal(goalId: string): void {
    const goals = this.getStrategicGoals().filter((g) => g.id !== goalId);
    this.safeSet(STORAGE_KEYS.GOALS, goals, STORES.GOALS);
  }

  getStrategicPriorities(): StrategicPriority[] {
    return this.safeGet<StrategicPriority[]>(STORAGE_KEYS.PRIORITIES, []);
  }

  saveStrategicPriority(priority: Omit<StrategicPriority, 'id'> & { id?: string }): StrategicPriority {
    const priorities = this.getStrategicPriorities();

    if (priority.id) {
      const index = priorities.findIndex((p) => p.id === priority.id);
      if (index !== -1) {
        const updated: StrategicPriority = {
          ...priorities[index],
          ...priority,
        };
        priorities[index] = updated;
        this.safeSet(STORAGE_KEYS.PRIORITIES, priorities, STORES.PRIORITIES);
        return updated;
      }
    }

    const newPriority: StrategicPriority = {
      ...priority,
      id: priority.id || `priority-${Date.now()}`,
      order: priorities.length + 1,
    };

    priorities.push(newPriority);
    this.safeSet(STORAGE_KEYS.PRIORITIES, priorities, STORES.PRIORITIES);
    return newPriority;
  }

  deleteStrategicPriority(priorityId: string): void {
    const priorities = this.getStrategicPriorities().filter((p) => p.id !== priorityId);
    this.safeSet(STORAGE_KEYS.PRIORITIES, priorities, STORES.PRIORITIES);
  }

  getDevelopmentPlan(): DevelopmentPlanItem[] {
    return this.safeGet<DevelopmentPlanItem[]>(STORAGE_KEYS.PLAN, []);
  }

  saveDevelopmentPlanItem(item: Omit<DevelopmentPlanItem, 'id'> & { id?: string }): DevelopmentPlanItem {
    const plan = this.getDevelopmentPlan();

    if (item.id) {
      const index = plan.findIndex((p) => p.id === item.id);
      if (index !== -1) {
        const updated: DevelopmentPlanItem = {
          ...plan[index],
          ...item,
        };
        plan[index] = updated;
        this.safeSet(STORAGE_KEYS.PLAN, plan, STORES.PLAN);
        return updated;
      }
    }

    const newItem: DevelopmentPlanItem = {
      ...item,
      id: item.id || `plan-${Date.now()}`,
      order: plan.length + 1,
    };

    plan.push(newItem);
    this.safeSet(STORAGE_KEYS.PLAN, plan, STORES.PLAN);
    return newItem;
  }

  deleteDevelopmentPlanItem(itemId: string): void {
    const plan = this.getDevelopmentPlan().filter((p) => p.id !== itemId);
    this.safeSet(STORAGE_KEYS.PLAN, plan, STORES.PLAN);
  }

  // Settings
  getSettings(): WorkspaceSettings {
    return this.safeGet<WorkspaceSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  updateSettings(settings: Partial<WorkspaceSettings>): WorkspaceSettings {
    const current = this.getSettings();
    const updated: WorkspaceSettings = {
      ...current,
      ...settings,
    };
    this.safeSet(STORAGE_KEYS.SETTINGS, updated, STORES.SETTINGS);
    return updated;
  }

  // Notifications
  getNotifications(): NotificationItem[] {
    return this.safeGet<NotificationItem[]>(
      STORAGE_KEYS.NOTIFICATIONS,
      []
    );
  }

  saveNotification(notification: Omit<NotificationItem, 'id' | 'timestamp'> & { id?: string }): NotificationItem {
    const notifications = this.getNotifications();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (notification.fingerprint) {
      const existing = notifications.find((n) => n.fingerprint === notification.fingerprint);
      if (existing) {
        return existing;
      }
    }

    const newNotif: NotificationItem = {
      ...notification,
      id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: now,
    };

    notifications.unshift(newNotif);
    const trimmed = notifications.slice(0, 100);
    this.safeSet(STORAGE_KEYS.NOTIFICATIONS, trimmed, STORES.NOTIFICATIONS);
    return newNotif;
  }

  deleteNotification(id: string): void {
    const notifications = this.getNotifications().filter((n) => n.id !== id);
    this.safeSet(STORAGE_KEYS.NOTIFICATIONS, notifications, STORES.NOTIFICATIONS);
  }

  markNotificationRead(id: string): void {
    const notifications = this.getNotifications().map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    this.safeSet(STORAGE_KEYS.NOTIFICATIONS, notifications, STORES.NOTIFICATIONS);
  }

  markAllNotificationsRead(): void {
    const notifications = this.getNotifications().map((n) => ({ ...n, read: true }));
    this.safeSet(STORAGE_KEYS.NOTIFICATIONS, notifications, STORES.NOTIFICATIONS);
  }

  // Reset to demo data
  resetDemoData(): void {
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.MISSION);
    localStorage.removeItem(STORAGE_KEYS.VISION);
    localStorage.removeItem(STORAGE_KEYS.GOALS);
    localStorage.removeItem(STORAGE_KEYS.PRIORITIES);
    localStorage.removeItem(STORAGE_KEYS.PLAN);
    localStorage.removeItem('oneteam_demo_cleaned_v1');

    if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
      indexedDbEngine.clearAll().catch((e) => console.warn('IndexedDB clearAll error:', e));
    }
  }
}

export const storageService = new StorageService();
