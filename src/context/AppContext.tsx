import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  PageId,
  Task,
  Project,
  TeamMember,
  WorkspaceSettings,
  NotificationItem,
  TaskStatus,
  Priority,
  ThemeMode,
  Client,
  Transaction,
  Currency,
  ClientNote,
  ClientInteraction,
  TeamMission,
  TeamVision,
  StrategicGoal,
  StrategicPriority,
  DevelopmentPlanItem,
} from '../types';
import { storageService } from '../services/storage';
import { useAuth } from './AuthContext';
import { cloudDataService } from '../services/cloudDataService';

interface AppContextType {
  // Navigation
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;

  // Search & Global Filter
  globalSearch: string;
  setGlobalSearch: (q: string) => void;

  // Tasks
  tasks: Task[];
  saveTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Task;
  deleteTask: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  toggleTaskCompletion: (taskId: string) => void;
  addTaskComment: (taskId: string, text: string) => void;

  // Task Drawer & Modal
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  taskModalOpen: boolean;
  taskToEdit: Task | null;
  openCreateTask: (defaultProjectId?: string) => void;
  openEditTask: (task: Task) => void;
  closeTaskModal: () => void;

  // Projects
  projects: Project[];
  saveProject: (project: Omit<Project, 'id' | 'createdAt'> & { id?: string }) => Project;
  deleteProject: (projectId: string) => void;
  toggleArchiveProject: (projectId: string) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  projectModalOpen: boolean;
  projectToEdit: Project | null;
  openCreateProject: () => void;
  openEditProject: (project: Project) => void;
  closeProjectModal: () => void;

  // Members
  members: TeamMember[];
  saveMember: (member: Omit<TeamMember, 'id'> & { id?: string }) => TeamMember;
  deleteMember: (memberId: string) => void;
  selectedMemberId: string | null;
  setSelectedMemberId: (id: string | null) => void;
  inviteModalOpen: boolean;
  setInviteModalOpen: (open: boolean) => void;

  // Clients (Page 8)
  clients: Client[];
  saveClient: (client: Omit<Client, 'id' | 'createdAt'> & { id?: string }) => Client;
  deleteClient: (clientId: string) => void;
  toggleArchiveClient: (clientId: string) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  clientModalOpen: boolean;
  clientToEdit: Client | null;
  openCreateClient: () => void;
  openEditClient: (client: Client) => void;
  closeClientModal: () => void;
  addClientNote: (clientId: string, text: string) => void;
  addClientInteraction: (clientId: string, interaction: Omit<ClientInteraction, 'id'>) => void;

  // Finance (Page 7)
  transactions: Transaction[];
  saveTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => Transaction;
  deleteTransaction: (txId: string) => void;
  transactionModalOpen: boolean;
  transactionToEdit: Transaction | null;
  openCreateTransaction: (defaultType?: 'income' | 'expense') => void;
  openEditTransaction: (tx: Transaction) => void;
  closeTransactionModal: () => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;

  // STRATEGY MODULE (Page 4)
  mission: TeamMission;
  saveMission: (mission: TeamMission) => void;
  vision: TeamVision;
  saveVision: (vision: TeamVision) => void;
  goals: StrategicGoal[];
  saveGoal: (goal: Omit<StrategicGoal, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => StrategicGoal;
  deleteGoal: (goalId: string) => void;
  priorities: StrategicPriority[];
  savePriority: (priority: Omit<StrategicPriority, 'id'> & { id?: string }) => StrategicPriority;
  deletePriority: (priorityId: string) => void;
  developmentPlan: DevelopmentPlanItem[];
  savePlanItem: (item: Omit<DevelopmentPlanItem, 'id'> & { id?: string }) => DevelopmentPlanItem;
  deletePlanItem: (itemId: string) => void;

  // Strategy Modals
  goalModalOpen: boolean;
  goalToEdit: StrategicGoal | null;
  openCreateGoal: () => void;
  openEditGoal: (goal: StrategicGoal) => void;
  closeGoalModal: () => void;

  priorityModalOpen: boolean;
  priorityToEdit: StrategicPriority | null;
  openCreatePriority: () => void;
  openEditPriority: (priority: StrategicPriority) => void;
  closePriorityModal: () => void;

  planItemModalOpen: boolean;
  planItemToEdit: DevelopmentPlanItem | null;
  openCreatePlanItem: () => void;
  openEditPlanItem: (item: DevelopmentPlanItem) => void;
  closePlanItemModal: () => void;

  missionModalOpen: boolean;
  setMissionModalOpen: (open: boolean) => void;
  visionModalOpen: boolean;
  setVisionModalOpen: (open: boolean) => void;

  // Settings & Theme
  settings: WorkspaceSettings;
  updateSettings: (newSettings: Partial<WorkspaceSettings>) => void;
  setTheme: (mode: ThemeMode) => void;

  // Notifications
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;

  // Quick Action Modal
  quickCreateOpen: boolean;
  setQuickCreateOpen: (open: boolean) => void;

  // Helper getters
  getProjectById: (id: string) => Project | undefined;
  getMemberById: (id: string) => TeamMember | undefined;
  getClientById: (id: string) => Client | undefined;
  getGoalById: (id: string) => StrategicGoal | undefined;
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentWorkspace, user, profile } = useAuth();

  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Domain data
  const [tasks, setTasks] = useState<Task[]>(() => storageService.getTasks());
  const [projects, setProjects] = useState<Project[]>(() => storageService.getProjects());
  const [members, setMembers] = useState<TeamMember[]>(() => storageService.getMembers());
  const [clients, setClients] = useState<Client[]>(() => storageService.getClients());
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    storageService.getTransactions()
  );
  const [settings, setSettings] = useState<WorkspaceSettings>(() => storageService.getSettings());
  const [currency, setCurrency] = useState<Currency>(() => settings.defaultCurrency || 'KZT');
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    storageService.getNotifications()
  );

  // Strategy data
  const [mission, setMission] = useState<TeamMission>(() => storageService.getStrategyMission());
  const [vision, setVision] = useState<TeamVision>(() => storageService.getStrategyVision());
  const [goals, setGoals] = useState<StrategicGoal[]>(() => storageService.getStrategicGoals());
  const [priorities, setPriorities] = useState<StrategicPriority[]>(() =>
    storageService.getStrategicPriorities()
  );
  const [developmentPlan, setDevelopmentPlan] = useState<DevelopmentPlanItem[]>(() =>
    storageService.getDevelopmentPlan()
  );

  // Synchronize when currentWorkspace changes (Zero data leakage across workspaces)
  useEffect(() => {
    if (currentWorkspace?.id) {
      // Re-initialize state for new workspace
      setSettings((prev) => ({
        ...prev,
        workspaceName: currentWorkspace.name,
        workspaceDescription: currentWorkspace.description,
        workspaceAvatar: currentWorkspace.avatar,
        currentUser: profile
          ? {
              id: profile.id,
              name: profile.fullName,
              email: profile.email,
              position: profile.position || 'Специалист',
              role: 'owner',
              avatar: profile.avatarUrl || '',
            }
          : prev.currentUser,
      }));

      // Asynchronously fetch cloud data
      cloudDataService.loadWorkspaceData(currentWorkspace.id).then((data) => {
        if (data) {
          if (data.tasks.length > 0) setTasks(data.tasks);
          if (data.projects.length > 0) setProjects(data.projects);
          if (data.clients.length > 0) setClients(data.clients);
          if (data.transactions.length > 0) setTransactions(data.transactions);
          if (data.goals.length > 0) setGoals(data.goals);
          if (data.priorities.length > 0) setPriorities(data.priorities);
          if (data.plans.length > 0) setDevelopmentPlan(data.plans);
          if (data.mission) setMission(data.mission);
          if (data.vision) setVision(data.vision);
          if (data.members.length > 0) setMembers(data.members);
        }
      });
    }
  }, [currentWorkspace?.id, profile]);

  // Modals & Panels
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Client modals & panels
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  // Finance modals
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  // Strategy modals
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<StrategicGoal | null>(null);

  const [priorityModalOpen, setPriorityModalOpen] = useState(false);
  const [priorityToEdit, setPriorityToEdit] = useState<StrategicPriority | null>(null);

  const [planItemModalOpen, setPlanItemModalOpen] = useState(false);
  const [planItemToEdit, setPlanItemToEdit] = useState<DevelopmentPlanItem | null>(null);

  const [missionModalOpen, setMissionModalOpen] = useState(false);
  const [visionModalOpen, setVisionModalOpen] = useState(false);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  // Hydrate projects with dynamic task counts, progress, and clientName
  const enrichedProjects = projects.map((proj) => {
    const projTasks = tasks.filter((t) => t.projectId === proj.id);
    const total = projTasks.length;
    const completed = projTasks.filter((t) => t.completed || t.status === 'done').length;
    const computedProgress = total > 0 ? Math.round((completed / total) * 100) : proj.progress;
    const client = clients.find((c) => c.id === proj.clientId);

    return {
      ...proj,
      totalTasks: total,
      completedTasks: completed,
      progress: computedProgress,
      clientName: client?.name || proj.clientName,
    };
  });

  // Hydrate tasks with project and assignee names
  const enrichedTasks = tasks.map((t) => {
    const proj = projects.find((p) => p.id === t.projectId);
    const assignee = members.find((m) => m.id === t.assigneeId);
    return {
      ...t,
      projectName: proj?.name || 'Без проекта',
      assigneeName: assignee?.name || 'Не назначен',
      assigneeAvatar: assignee?.avatar,
    };
  });

  // Hydrate clients with associated project name
  const enrichedClients = clients.map((c) => {
    const proj = projects.find((p) => p.id === c.associatedProjectId);
    return {
      ...c,
      associatedProjectName: proj?.name,
    };
  });

  // Hydrate transactions with project and client names
  const enrichedTransactions = transactions.map((tx) => {
    const proj = projects.find((p) => p.id === tx.projectId);
    const client = clients.find((c) => c.id === tx.clientId);
    return {
      ...tx,
      projectName: proj?.name,
      clientName: client?.name,
    };
  });

  // Hydrate goals with owner name
  const enrichedGoals = goals.map((g) => {
    const owner = members.find((m) => m.id === g.ownerId);
    return {
      ...g,
      ownerName: owner?.name || g.ownerName || 'Руководитель',
    };
  });

  // Hydrate priorities with owner name and related goal title
  const enrichedPriorities = priorities.map((p) => {
    const owner = members.find((m) => m.id === p.ownerId);
    const goal = goals.find((g) => g.id === p.relatedGoalId);
    return {
      ...p,
      ownerName: owner?.name || p.ownerName,
      relatedGoalTitle: goal?.title || p.relatedGoalTitle,
    };
  });

  // Hydrate development plan with owner name and related goal title
  const enrichedPlan = developmentPlan.map((item) => {
    const owner = members.find((m) => m.id === item.ownerId);
    const goal = goals.find((g) => g.id === item.relatedGoalId);
    return {
      ...item,
      ownerName: owner?.name || item.ownerName,
      relatedGoalTitle: goal?.title || item.relatedGoalTitle,
    };
  });

  // Synchronize Theme
  useEffect(() => {
    const applyTheme = () => {
      const isDark =
        settings.theme === 'dark' ||
        (settings.theme === 'system' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [settings.theme]);

  const refreshData = () => {
    setTasks(storageService.getTasks());
    setProjects(storageService.getProjects());
    setMembers(storageService.getMembers());
    setClients(storageService.getClients());
    setTransactions(storageService.getTransactions());
    setSettings(storageService.getSettings());
    setNotifications(storageService.getNotifications());
  };

  // Task Actions
  const saveTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const saved = storageService.saveTask(taskData);
    setTasks(storageService.getTasks());
    if (currentWorkspace?.id) {
      cloudDataService.syncTask(currentWorkspace.id, saved);
    }
    return saved;
  };

  const deleteTask = (taskId: string) => {
    storageService.deleteTask(taskId);
    setTasks(storageService.getTasks());
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }
    if (currentWorkspace?.id) {
      cloudDataService.deleteTask(currentWorkspace.id, taskId);
    }
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    storageService.updateTaskStatus(taskId, status);
    setTasks(storageService.getTasks());
  };

  const toggleTaskCompletion = (taskId: string) => {
    storageService.toggleTaskCompletion(taskId);
    setTasks(storageService.getTasks());
  };

  const addTaskComment = (taskId: string, text: string) => {
    if (!text.trim()) return;
    storageService.addTaskComment(taskId, text, {
      name: settings.currentUser.name,
      avatar: settings.currentUser.avatar,
    });
    setTasks(storageService.getTasks());
  };

  const openCreateTask = (defaultProjectId?: string) => {
    setTaskToEdit(
      defaultProjectId
        ? ({
            id: '',
            title: '',
            description: '',
            status: 'todo',
            priority: 'medium',
            projectId: defaultProjectId,
            assigneeId: members[0]?.id || '',
            dueDate: new Date().toISOString().split('T')[0],
            completed: false,
            comments: [],
            activities: [],
            createdAt: '',
            updatedAt: '',
          } as Task)
        : null
    );
    setTaskModalOpen(true);
  };

  const openEditTask = (task: Task) => {
    setTaskToEdit(task);
    setTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setTaskModalOpen(false);
    setTaskToEdit(null);
  };

  // Project Actions
  const saveProject = (projData: Omit<Project, 'id' | 'createdAt'> & { id?: string }) => {
    const saved = storageService.saveProject(projData);
    setProjects(storageService.getProjects());
    if (currentWorkspace?.id) {
      cloudDataService.syncProject(currentWorkspace.id, saved);
    }
    return saved;
  };

  const deleteProject = (projectId: string) => {
    storageService.deleteProject(projectId);
    setProjects(storageService.getProjects());
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
    if (currentWorkspace?.id) {
      cloudDataService.deleteProject(currentWorkspace.id, projectId);
    }
  };

  const toggleArchiveProject = (projectId: string) => {
    storageService.toggleArchiveProject(projectId);
    setProjects(storageService.getProjects());
  };

  const openCreateProject = () => {
    setProjectToEdit(null);
    setProjectModalOpen(true);
  };

  const openEditProject = (project: Project) => {
    setProjectToEdit(project);
    setProjectModalOpen(true);
  };

  const closeProjectModal = () => {
    setProjectModalOpen(false);
    setProjectToEdit(null);
  };

  // Member Actions
  const saveMember = (memberData: Omit<TeamMember, 'id'> & { id?: string }) => {
    const saved = storageService.saveMember(memberData);
    setMembers(storageService.getMembers());
    return saved;
  };

  const deleteMember = (memberId: string) => {
    storageService.deleteMember(memberId);
    setMembers(storageService.getMembers());
    if (selectedMemberId === memberId) {
      setSelectedMemberId(null);
    }
  };

  // Client Actions
  const saveClient = (clientData: Omit<Client, 'id' | 'createdAt'> & { id?: string }) => {
    const saved = storageService.saveClient(clientData);
    setClients(storageService.getClients());
    if (currentWorkspace?.id) {
      cloudDataService.syncClient(currentWorkspace.id, saved);
    }
    return saved;
  };

  const deleteClient = (clientId: string) => {
    storageService.deleteClient(clientId);
    setClients(storageService.getClients());
    if (selectedClientId === clientId) {
      setSelectedClientId(null);
    }
    if (currentWorkspace?.id) {
      cloudDataService.deleteClient(currentWorkspace.id, clientId);
    }
  };

  const toggleArchiveClient = (clientId: string) => {
    storageService.toggleArchiveClient(clientId);
    setClients(storageService.getClients());
  };

  const openCreateClient = () => {
    setClientToEdit(null);
    setClientModalOpen(true);
  };

  const openEditClient = (client: Client) => {
    setClientToEdit(client);
    setClientModalOpen(true);
  };

  const closeClientModal = () => {
    setClientModalOpen(false);
    setClientToEdit(null);
  };

  const addClientNote = (clientId: string, text: string) => {
    storageService.addClientNote(clientId, text, settings.currentUser.name);
    setClients(storageService.getClients());
  };

  const addClientInteraction = (
    clientId: string,
    interaction: Omit<ClientInteraction, 'id'>
  ) => {
    storageService.addClientInteraction(clientId, interaction);
    setClients(storageService.getClients());
  };

  // Finance Actions
  const saveTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => {
    const saved = storageService.saveTransaction(txData);
    setTransactions(storageService.getTransactions());
    if (currentWorkspace?.id) {
      cloudDataService.syncTransaction(currentWorkspace.id, saved);
    }
    return saved;
  };

  const deleteTransaction = (txId: string) => {
    storageService.deleteTransaction(txId);
    setTransactions(storageService.getTransactions());
    if (currentWorkspace?.id) {
      cloudDataService.deleteTransaction(currentWorkspace.id, txId);
    }
  };

  const openCreateTransaction = (defaultType?: 'income' | 'expense') => {
    setTransactionToEdit(
      defaultType
        ? ({
            id: '',
            title: '',
            amount: 0,
            currency: currency,
            type: defaultType,
            category: defaultType === 'income' ? 'client_payment' : 'operations',
            date: new Date().toISOString().split('T')[0],
            status: 'completed',
            createdAt: '',
          } as Transaction)
        : null
    );
    setTransactionModalOpen(true);
  };

  const openEditTransaction = (tx: Transaction) => {
    setTransactionToEdit(tx);
    setTransactionModalOpen(true);
  };

  const closeTransactionModal = () => {
    setTransactionModalOpen(false);
    setTransactionToEdit(null);
  };

  // Strategy Actions
  const saveMission = (newMission: TeamMission) => {
    const saved = storageService.saveStrategyMission(newMission);
    setMission(saved);
  };

  const saveVision = (newVision: TeamVision) => {
    const saved = storageService.saveStrategyVision(newVision);
    setVision(saved);
  };

  const saveGoal = (
    goalData: Omit<StrategicGoal, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => {
    const saved = storageService.saveStrategicGoal(goalData);
    setGoals(storageService.getStrategicGoals());
    return saved;
  };

  const deleteGoal = (goalId: string) => {
    storageService.deleteStrategicGoal(goalId);
    setGoals(storageService.getStrategicGoals());
  };

  const openCreateGoal = () => {
    setGoalToEdit(null);
    setGoalModalOpen(true);
  };

  const openEditGoal = (goal: StrategicGoal) => {
    setGoalToEdit(goal);
    setGoalModalOpen(true);
  };

  const closeGoalModal = () => {
    setGoalModalOpen(false);
    setGoalToEdit(null);
  };

  const savePriority = (
    priorityData: Omit<StrategicPriority, 'id'> & { id?: string }
  ) => {
    const saved = storageService.saveStrategicPriority(priorityData);
    setPriorities(storageService.getStrategicPriorities());
    return saved;
  };

  const deletePriority = (priorityId: string) => {
    storageService.deleteStrategicPriority(priorityId);
    setPriorities(storageService.getStrategicPriorities());
  };

  const openCreatePriority = () => {
    setPriorityToEdit(null);
    setPriorityModalOpen(true);
  };

  const openEditPriority = (priority: StrategicPriority) => {
    setPriorityToEdit(priority);
    setPriorityModalOpen(true);
  };

  const closePriorityModal = () => {
    setPriorityModalOpen(false);
    setPriorityToEdit(null);
  };

  const savePlanItem = (
    itemData: Omit<DevelopmentPlanItem, 'id'> & { id?: string }
  ) => {
    const saved = storageService.saveDevelopmentPlanItem(itemData);
    setDevelopmentPlan(storageService.getDevelopmentPlan());
    return saved;
  };

  const deletePlanItem = (itemId: string) => {
    storageService.deleteDevelopmentPlanItem(itemId);
    setDevelopmentPlan(storageService.getDevelopmentPlan());
  };

  const openCreatePlanItem = () => {
    setPlanItemToEdit(null);
    setPlanItemModalOpen(true);
  };

  const openEditPlanItem = (item: DevelopmentPlanItem) => {
    setPlanItemToEdit(item);
    setPlanItemModalOpen(true);
  };

  const closePlanItemModal = () => {
    setPlanItemModalOpen(false);
    setPlanItemToEdit(null);
  };

  // Settings & Theme
  const updateSettings = (newSettings: Partial<WorkspaceSettings>) => {
    const updated = storageService.updateSettings(newSettings);
    setSettings(updated);
  };

  const setTheme = (mode: ThemeMode) => {
    updateSettings({ theme: mode });
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    storageService.markNotificationRead(id);
    setNotifications(storageService.getNotifications());
  };

  const markAllNotificationsRead = () => {
    storageService.markAllNotificationsRead();
    setNotifications(storageService.getNotifications());
  };

  const deleteNotification = (id: string) => {
    storageService.deleteNotification(id);
    setNotifications(storageService.getNotifications());
  };

  const getProjectById = (id: string) => enrichedProjects.find((p) => p.id === id);
  const getMemberById = (id: string) => members.find((m) => m.id === id);
  const getClientById = (id: string) => enrichedClients.find((c) => c.id === id);
  const getGoalById = (id: string) => enrichedGoals.find((g) => g.id === id);

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        sidebarCollapsed,
        setSidebarCollapsed,
        globalSearch,
        setGlobalSearch,
        tasks: enrichedTasks,
        saveTask,
        deleteTask,
        updateTaskStatus,
        toggleTaskCompletion,
        addTaskComment,
        selectedTaskId,
        setSelectedTaskId,
        taskModalOpen,
        taskToEdit,
        openCreateTask,
        openEditTask,
        closeTaskModal,
        projects: enrichedProjects,
        saveProject,
        deleteProject,
        toggleArchiveProject,
        selectedProjectId,
        setSelectedProjectId,
        projectModalOpen,
        projectToEdit,
        openCreateProject,
        openEditProject,
        closeProjectModal,
        members,
        saveMember,
        deleteMember,
        selectedMemberId,
        setSelectedMemberId,
        inviteModalOpen,
        setInviteModalOpen,
        clients: enrichedClients,
        saveClient,
        deleteClient,
        toggleArchiveClient,
        selectedClientId,
        setSelectedClientId,
        clientModalOpen,
        clientToEdit,
        openCreateClient,
        openEditClient,
        closeClientModal,
        addClientNote,
        addClientInteraction,
        transactions: enrichedTransactions,
        saveTransaction,
        deleteTransaction,
        transactionModalOpen,
        transactionToEdit,
        openCreateTransaction,
        openEditTransaction,
        closeTransactionModal,
        currency,
        setCurrency,
        mission,
        saveMission,
        vision,
        saveVision,
        goals: enrichedGoals,
        saveGoal,
        deleteGoal,
        priorities: enrichedPriorities,
        savePriority,
        deletePriority,
        developmentPlan: enrichedPlan,
        savePlanItem,
        deletePlanItem,
        goalModalOpen,
        goalToEdit,
        openCreateGoal,
        openEditGoal,
        closeGoalModal,
        priorityModalOpen,
        priorityToEdit,
        openCreatePriority,
        openEditPriority,
        closePriorityModal,
        planItemModalOpen,
        planItemToEdit,
        openCreatePlanItem,
        openEditPlanItem,
        closePlanItemModal,
        missionModalOpen,
        setMissionModalOpen,
        visionModalOpen,
        setVisionModalOpen,
        settings,
        updateSettings,
        setTheme,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        notificationsOpen,
        setNotificationsOpen,
        quickCreateOpen,
        setQuickCreateOpen,
        getProjectById,
        getMemberById,
        getClientById,
        getGoalById,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
