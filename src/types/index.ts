export type PageId =
  | 'dashboard'
  | 'workspace'
  | 'projects'
  | 'strategy'
  | 'team'
  | 'analytics'
  | 'finance'
  | 'clients'
  | 'settings';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export type Priority = 'low' | 'medium' | 'high';

export type TeamRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';

export type ProjectStatus = 'planning' | 'in_progress' | 'review' | 'completed';

export interface TaskComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
}

export interface TaskActivity {
  id: string;
  action: string;
  authorName: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  projectId: string;
  projectName?: string;
  assigneeId: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  comments: TaskComment[];
  activities: TaskActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number; // 0-100
  deadline: string; // YYYY-MM-DD
  memberIds: string[];
  totalTasks?: number;
  completedTasks?: number;
  isArchived?: boolean;
  category?: string;
  clientId?: string;
  clientName?: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  position: string;
  role: TeamRole;
  email: string;
  avatar: string;
  isOnline: boolean;
  workload: number; // 0-100%
  assignedProjectIds: string[];
  department: string;
}

// STRATEGY MODULE TYPES
export type VisionHorizon = '1_year' | '3_years' | '5_years';

export interface StrategyRevision {
  id: string;
  field: 'mission' | 'vision';
  content: string;
  timestamp: string;
  authorName: string;
}

export interface TeamMission {
  id: string;
  statement: string;
  purpose: string;
  customerValue: string;
  principles: string[];
  ownerId: string;
  ownerName: string;
  updatedAt: string;
  revisions: StrategyRevision[];
}

export interface TeamVision {
  id: string;
  statement: string;
  desiredState: string;
  direction: string;
  targetHorizon: VisionHorizon;
  expectedOutcomes: string[];
  ownerId: string;
  ownerName: string;
  updatedAt: string;
  revisions: StrategyRevision[];
}

export type GoalStatus = 'not_started' | 'in_progress' | 'paused' | 'completed' | 'cancelled';

export interface StrategicGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  ownerId: string;
  ownerName?: string;
  startDate: string;
  targetDate: string;
  progress: number; // 0-100
  status: GoalStatus;
  relatedProjectIds: string[];
  successCriteria: string[];
  createdAt: string;
  updatedAt: string;
}

export type PriorityImportance = 'critical' | 'high' | 'medium' | 'low';

export interface StrategicPriority {
  id: string;
  name: string;
  description: string;
  importance: PriorityImportance;
  ownerId: string;
  ownerName?: string;
  expectedResult: string;
  deadline: string;
  status: 'active' | 'completed' | 'archived';
  relatedGoalId?: string;
  relatedGoalTitle?: string;
  order?: number;
  iconName?: string;
  progress?: number;
}

export interface DevelopmentPlanItem {
  id: string;
  title: string;
  description: string;
  timePeriod: string; // e.g. "Q4 2026", "Q1 2027"
  quarter: string;
  month?: string;
  ownerId: string;
  ownerName?: string;
  status: 'planned' | 'in_progress' | 'completed';
  progress: number;
  relatedGoalId?: string;
  relatedGoalTitle?: string;
  expectedOutcome: string;
  deadline: string;
  order?: number;
}

// Finance types
export type Currency = 'KZT' | 'USD' | 'RUB';

export type TransactionType = 'income' | 'expense';

export type FinancialCategory =
  | 'salaries'
  | 'software'
  | 'marketing'
  | 'infrastructure'
  | 'operations'
  | 'client_payment'
  | 'other';

export type TransactionStatus = 'completed' | 'pending' | 'planned';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  currency: Currency;
  type: TransactionType;
  category: FinancialCategory;
  date: string; // YYYY-MM-DD
  status: TransactionStatus;
  projectId?: string;
  projectName?: string;
  clientId?: string;
  clientName?: string;
  notes?: string;
  createdAt: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  currentBalance: number;
  currency: Currency;
}

// Client types
export type ClientStatus =
  | 'new'
  | 'in_progress'
  | 'negotiation'
  | 'active'
  | 'completed'
  | 'archived';

export interface ClientInteraction {
  id: string;
  type: 'call' | 'meeting' | 'email' | 'proposal' | 'contract';
  summary: string;
  date: string;
  authorName: string;
}

export interface ClientNote {
  id: string;
  text: string;
  authorName: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: ClientStatus;
  dealValue: number;
  dealCurrency: Currency;
  associatedProjectId?: string;
  associatedProjectName?: string;
  description: string;
  avatar?: string;
  lastInteraction: string;
  notes: ClientNote[];
  interactions: ClientInteraction[];
  createdAt: string;
}

// Analytics types
export type AnalyticsPeriod = 'week' | 'month' | '30days' | 'quarter';

export interface AnalyticsSummary {
  completedTasksCount: number;
  activeProjectsCount: number;
  overallTeamProgress: number;
  avgTaskCompletionDays: number;
  tasksCompletedTrend: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'task' | 'project' | 'team' | 'finance' | 'client' | 'strategy' | 'system';
}

export interface WorkspaceSettings {
  workspaceName: string;
  workspaceDescription: string;
  workspaceAvatar: string;
  theme: ThemeMode;
  defaultCurrency: Currency;
  notifications: {
    taskAssigned: boolean;
    taskCompleted: boolean;
    projectMilestone: boolean;
    teamActivity: boolean;
    financialUpdates: boolean;
    clientActivity: boolean;
    dailyDigest: boolean;
  };
  currentUser: {
    id: string;
    name: string;
    email: string;
    position: string;
    role: TeamRole;
    avatar: string;
  };
  sync: {
    lastSynced: string;
    status: 'synced' | 'syncing' | 'offline';
    pendingChangesCount: number;
  };
}
