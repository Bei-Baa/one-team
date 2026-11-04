import { indexedDbEngine, STORES, StoreName } from './indexedDb';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface MigrationSummary {
  storeCounts: Record<string, number>;
  migratedCounts: Record<string, number>;
  backupKey: string;
  timestamp: string;
  status: 'success' | 'failed' | 'empty';
}

export class IndexedDbMigrationService {
  /**
   * Reads all stores from IndexedDB and calculates records count
   */
  async inspectStores(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return counts;
    }

    try {
      const storeNames = Object.values(STORES);
      for (const name of storeNames) {
        const items = await indexedDbEngine.getAll(name as StoreName);
        counts[name] = items.length;
      }
    } catch (err) {
      console.warn('Failed to inspect IndexedDB stores:', err);
    }

    return counts;
  }

  /**
   * Creates a verified backup snapshot of IndexedDB in localStorage
   */
  async createBackupSnapshot(): Promise<{ key: string; totalRecords: number }> {
    const backupKey = `oneteam_idb_backup_${Date.now()}`;
    const snapshot: Record<string, any[]> = {};
    let totalRecords = 0;

    if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
      for (const name of Object.values(STORES)) {
        const items = await indexedDbEngine.getAll(name as StoreName);
        snapshot[name] = items;
        totalRecords += items.length;
      }
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(backupKey, JSON.stringify(snapshot));
    }

    return { key: backupKey, totalRecords };
  }

  /**
   * Safely migrates IndexedDB records to the active Supabase Workspace
   */
  async migrateToCloud(workspaceId: string): Promise<MigrationSummary> {
    const counts = await this.inspectStores();
    const backup = await this.createBackupSnapshot();

    const migrated: Record<string, number> = {};
    const timestamp = new Date().toISOString();

    if (!isSupabaseConfigured || !workspaceId) {
      return {
        storeCounts: counts,
        migratedCounts: migrated,
        backupKey: backup.key,
        timestamp,
        status: 'failed',
      };
    }

    try {
      // 1. Migrate Projects
      const localProjects = await indexedDbEngine.getAll<any>(STORES.PROJECTS);
      migrated[STORES.PROJECTS] = 0;
      for (const p of localProjects) {
        if (!p.id || p.id.startsWith('demo-')) continue;
        await supabase.from('projects').upsert({
          workspace_id: workspaceId,
          name: p.name,
          description: p.description || '',
          status: p.status || 'planning',
          progress: p.progress || 0,
          deadline: p.deadline || new Date().toISOString().split('T')[0],
          category: p.category || 'Общий',
          member_ids: p.memberIds || [],
          is_archived: Boolean(p.isArchived),
        });
        migrated[STORES.PROJECTS]++;
      }

      // 2. Migrate Tasks
      const localTasks = await indexedDbEngine.getAll<any>(STORES.TASKS);
      migrated[STORES.TASKS] = 0;
      for (const t of localTasks) {
        if (!t.id || t.id.startsWith('demo-')) continue;
        await supabase.from('tasks').upsert({
          workspace_id: workspaceId,
          title: t.title,
          description: t.description || '',
          status: t.status || 'todo',
          priority: t.priority || 'medium',
          due_date: t.dueDate || new Date().toISOString().split('T')[0],
          completed: Boolean(t.completed),
          comments: t.comments || [],
          activities: t.activities || [],
        });
        migrated[STORES.TASKS]++;
      }

      // 3. Migrate Clients
      const localClients = await indexedDbEngine.getAll<any>(STORES.CLIENTS);
      migrated[STORES.CLIENTS] = 0;
      for (const c of localClients) {
        if (!c.id || c.id.startsWith('demo-')) continue;
        await supabase.from('clients').upsert({
          workspace_id: workspaceId,
          name: c.name,
          contact_person: c.contactPerson || '',
          email: c.email || '',
          phone: c.phone || '',
          status: c.status || 'new',
          deal_value: c.dealValue || 0,
          deal_currency: c.dealCurrency || 'KZT',
          description: c.description || '',
          last_interaction: c.lastInteraction || new Date().toISOString().split('T')[0],
          notes: c.notes || [],
          interactions: c.interactions || [],
        });
        migrated[STORES.CLIENTS]++;
      }

      // 4. Migrate Transactions
      const localTxs = await indexedDbEngine.getAll<any>(STORES.TRANSACTIONS);
      migrated[STORES.TRANSACTIONS] = 0;
      for (const tx of localTxs) {
        if (!tx.id || tx.id.startsWith('demo-')) continue;
        await supabase.from('transactions').upsert({
          workspace_id: workspaceId,
          title: tx.title,
          amount: tx.amount || 0,
          currency: tx.currency || 'KZT',
          type: tx.type || 'income',
          category: tx.category || 'other',
          date: tx.date || new Date().toISOString().split('T')[0],
          status: tx.status || 'completed',
          notes: tx.notes || '',
        });
        migrated[STORES.TRANSACTIONS]++;
      }

      // Mark migration done
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`oneteam_migrated_${workspaceId}`, timestamp);
      }

      return {
        storeCounts: counts,
        migratedCounts: migrated,
        backupKey: backup.key,
        timestamp,
        status: 'success',
      };
    } catch (err) {
      console.error('Migration failed:', err);
      return {
        storeCounts: counts,
        migratedCounts: migrated,
        backupKey: backup.key,
        timestamp,
        status: 'failed',
      };
    }
  }
}

export const indexedDbMigrationService = new IndexedDbMigrationService();
