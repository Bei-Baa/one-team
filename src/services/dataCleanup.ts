/**
 * Safe Data Cleanup & Backup Service for ONE TEAM
 *
 * Safety requirements:
 * - Never deletes authenticated accounts (currentUser)
 * - Never deletes legitimate user profiles/members
 * - Never deletes workspace configurations (name, theme, etc.)
 * - Never deletes schema or role structures
 * - Removes demo tasks, projects, clients, transactions, goals, priorities, roadmap milestones, and notifications
 * - Performs automatic backup before cleanup
 * - Supports JSON file export, file import with schema validation, and pre-restoration safeguards
 */

import { storageService, STORAGE_KEYS } from './storage';
import { TeamMember } from '../types';

export interface DataBackup {
  timestamp: string;
  version: string;
  app: 'ONETEAM';
  data: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  version?: string;
  recordCounts?: {
    tasks?: number;
    projects?: number;
    members?: number;
    clients?: number;
    transactions?: number;
  };
}

export interface CleanupReport {
  timestamp: string;
  removedRecords: {
    tasks: number;
    projects: number;
    clients: number;
    transactions: number;
    goals: number;
    priorities: number;
    plan: number;
    notifications: number;
  };
  preservedRecords: {
    members: number;
    currentUser: string;
    workspaceName: string;
  };
  backupKey: string;
}

const BACKUP_STORAGE_KEY = 'oneteam_backup_last';

class DataCleanupService {
  /**
   * Export all current stored data to a serializable JSON backup structure.
   */
  createBackup(): DataBackup {
    const backup: DataBackup = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      app: 'ONETEAM',
      data: {
        tasks: storageService.getTasks(),
        projects: storageService.getProjects(),
        members: storageService.getMembers(),
        settings: storageService.getSettings(),
        notifications: storageService.getNotifications(),
        clients: storageService.getClients(),
        transactions: storageService.getTransactions(),
        mission: storageService.getStrategyMission(),
        vision: storageService.getStrategyVision(),
        goals: storageService.getStrategicGoals(),
        priorities: storageService.getStrategicPriorities(),
        plan: storageService.getDevelopmentPlan(),
      },
    };

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backup));
      }
    } catch (e) {
      console.warn('Failed to store backup in localStorage:', e);
    }

    return backup;
  }

  /**
   * Triggers a browser download of the current application backup file.
   */
  downloadBackupFile(): void {
    const backup = this.createBackup();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    const filename = `oneteam_backup_${new Date().toISOString().slice(0, 10)}.json`;
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  /**
   * Validates a backup object structure and version.
   */
  validateBackup(backup: any): ValidationResult {
    if (!backup || typeof backup !== 'object') {
      return { valid: false, error: 'Файл повреждён или не является корректным JSON' };
    }
    if (backup.app !== 'ONETEAM') {
      return { valid: false, error: 'Неверный формат: файл не является резервной копией ONE TEAM' };
    }
    if (!backup.version) {
      return { valid: false, error: 'В файле отсутствует информация о версии' };
    }
    if (!backup.data || typeof backup.data !== 'object') {
      return { valid: false, error: 'В резервной копии отсутствуют данные' };
    }

    const { data } = backup;
    return {
      valid: true,
      version: backup.version,
      recordCounts: {
        tasks: Array.isArray(data.tasks) ? data.tasks.length : 0,
        projects: Array.isArray(data.projects) ? data.projects.length : 0,
        members: Array.isArray(data.members) ? data.members.length : 0,
        clients: Array.isArray(data.clients) ? data.clients.length : 0,
        transactions: Array.isArray(data.transactions) ? data.transactions.length : 0,
      },
    };
  }

  /**
   * Restores a previously created backup with automatic pre-backup and validation.
   */
  restoreBackup(backup: DataBackup): boolean {
    const validation = this.validateBackup(backup);
    if (!validation.valid) {
      throw new Error(validation.error || 'Ошибка валидации резервной копии');
    }

    // Safety: create a safety snapshot of current data before overwriting
    this.createBackup();

    try {
      const { data } = backup;
      if (typeof localStorage !== 'undefined') {
        if (data.tasks) localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(data.tasks));
        if (data.projects) localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(data.projects));
        if (data.members) localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(data.members));
        if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
        if (data.notifications) localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
        if (data.clients) localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(data.clients));
        if (data.transactions) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
        if (data.mission) localStorage.setItem(STORAGE_KEYS.MISSION, JSON.stringify(data.mission));
        if (data.vision) localStorage.setItem(STORAGE_KEYS.VISION, JSON.stringify(data.vision));
        if (data.goals) localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(data.goals));
        if (data.priorities) localStorage.setItem(STORAGE_KEYS.PRIORITIES, JSON.stringify(data.priorities));
        if (data.plan) localStorage.setItem(STORAGE_KEYS.PLAN, JSON.stringify(data.plan));
        localStorage.setItem('oneteam_demo_cleaned_v1', 'false');
      }

      // Re-initialize IndexedDB sync
      storageService.initIndexedDbSync();
      return true;
    } catch (e) {
      console.error('Failed to restore backup:', e);
      return false;
    }
  }

  /**
   * Get the last backup if present.
   */
  getLastBackup(): DataBackup | null {
    try {
      const item = localStorage.getItem(BACKUP_STORAGE_KEY);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  /**
   * Safely cleans demo business records while strictly protecting authentic accounts,
   * user profiles, roles, and workspace settings.
   */
  executeSafeCleanup(): CleanupReport {
    // 1. Create a full backup first
    const backup = this.createBackup();

    // 2. Read counts of items to be removed
    const taskCount = storageService.getTasks().length;
    const projectCount = storageService.getProjects().length;
    const clientCount = storageService.getClients().length;
    const transactionCount = storageService.getTransactions().length;
    const goalCount = storageService.getStrategicGoals().length;
    const priorityCount = storageService.getStrategicPriorities().length;
    const planCount = storageService.getDevelopmentPlan().length;
    const notificationCount = storageService.getNotifications().length;

    // Read preserved info
    const currentMembers = storageService.getMembers();
    const currentSettings = storageService.getSettings();

    // 3. Clear domain operational records to clean empty states
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.PRIORITIES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.PLAN, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));

      const emptyMission = {
        ...storageService.getStrategyMission(),
        statement: '',
        purpose: '',
        customerValue: '',
        principles: [],
        revisions: [],
      };
      const emptyVision = {
        ...storageService.getStrategyVision(),
        statement: '',
        desiredState: '',
        direction: '',
        expectedOutcomes: [],
        revisions: [],
      };
      localStorage.setItem(STORAGE_KEYS.MISSION, JSON.stringify(emptyMission));
      localStorage.setItem(STORAGE_KEYS.VISION, JSON.stringify(emptyVision));

      const cleanedMembers: TeamMember[] = currentMembers.map((m) => ({
        ...m,
        assignedProjectIds: [],
        workload: 0,
      }));
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(cleanedMembers));

      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(currentSettings));
      localStorage.setItem('oneteam_demo_cleaned_v1', 'true');
    }

    storageService.initIndexedDbSync();

    return {
      timestamp: backup.timestamp,
      removedRecords: {
        tasks: taskCount,
        projects: projectCount,
        clients: clientCount,
        transactions: transactionCount,
        goals: goalCount,
        priorities: priorityCount,
        plan: planCount,
        notifications: notificationCount,
      },
      preservedRecords: {
        members: currentMembers.length,
        currentUser: currentSettings.currentUser.name,
        workspaceName: currentSettings.workspaceName,
      },
      backupKey: BACKUP_STORAGE_KEY,
    };
  }
}

export const dataCleanupService = new DataCleanupService();
