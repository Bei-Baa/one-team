/**
 * IndexedDB Persistent Storage Engine for ONE TEAM
 *
 * Provides robust asynchronous IndexedDB storage for all 9 application modules:
 * - tasks
 * - projects
 * - members
 * - settings
 * - notifications
 * - clients
 * - transactions
 * - strategy_mission
 * - strategy_vision
 * - strategy_goals
 * - strategy_priorities
 * - strategy_plan
 */

const DB_NAME = 'OneTeamDB_v1';
const DB_VERSION = 1;

export const STORES = {
  TASKS: 'tasks',
  PROJECTS: 'projects',
  MEMBERS: 'members',
  SETTINGS: 'settings',
  NOTIFICATIONS: 'notifications',
  CLIENTS: 'clients',
  TRANSACTIONS: 'transactions',
  MISSION: 'mission',
  VISION: 'vision',
  GOALS: 'goals',
  PRIORITIES: 'priorities',
  PLAN: 'plan',
  METADATA: 'metadata',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

class IndexedDbEngine {
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initializes the IndexedDB database, creating object stores if needed.
   */
  async getDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    if (typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB is not supported in this environment');
    }

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        Object.values(STORES).forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            if (storeName === STORES.SETTINGS || storeName === STORES.MISSION || storeName === STORES.VISION) {
              // Singleton stores using key-value pair
              db.createObjectStore(storeName, { keyPath: 'id' });
            } else if (storeName === STORES.METADATA) {
              db.createObjectStore(storeName, { keyPath: 'key' });
            } else {
              // Entity collection stores with 'id' keyPath
              db.createObjectStore(storeName, { keyPath: 'id' });
            }
          }
        });
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Retrieves all items from a given object store.
   */
  async getAll<T>(storeName: StoreName): Promise<T[]> {
    try {
      const db = await this.getDb();
      return new Promise<T[]>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();

        req.onsuccess = () => resolve(req.result as T[]);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn(`IndexedDB getAll error for ${storeName}:`, err);
      return [];
    }
  }

  /**
   * Retrieves a single item by key.
   */
  async get<T>(storeName: StoreName, key: IDBValidKey): Promise<T | null> {
    try {
      const db = await this.getDb();
      return new Promise<T | null>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);

        req.onsuccess = () => resolve((req.result as T) || null);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn(`IndexedDB get error for ${storeName}/${key}:`, err);
      return null;
    }
  }

  /**
   * Saves or updates a single item.
   */
  async put<T>(storeName: StoreName, value: T): Promise<T> {
    const db = await this.getDb();
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value);

      req.onsuccess = () => resolve(value);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Sets entire collection in a single transaction (clears and rewrites).
   */
  async setAll<T extends { id?: string | number }>(storeName: StoreName, items: T[]): Promise<void> {
    const db = await this.getDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      const clearReq = store.clear();
      clearReq.onsuccess = () => {
        items.forEach((item) => {
          store.put(item);
        });
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Deletes an item by ID.
   */
  async delete(storeName: StoreName, key: IDBValidKey): Promise<void> {
    const db = await this.getDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Clears a store.
   */
  async clear(storeName: StoreName): Promise<void> {
    const db = await this.getDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Clears all stores (for clean reset).
   */
  async clearAll(): Promise<void> {
    const db = await this.getDb();
    return new Promise<void>((resolve, reject) => {
      const storeNames = Array.from(db.objectStoreNames);
      const tx = db.transaction(storeNames, 'readwrite');

      storeNames.forEach((name) => {
        tx.objectStore(name).clear();
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const indexedDbEngine = new IndexedDbEngine();
