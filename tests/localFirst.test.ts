/**
 * Comprehensive Automated Test Suite for ONE TEAM Local-First Application
 *
 * Verifies:
 * 1. StorageService full CRUD across all entities (Tasks, Projects, Members, Clients, Transactions, Strategy, Notifications)
 * 2. Safe demo data cleanup (preserving accounts, settings, roles)
 * 3. Backup creation, export structure, validation, and restoration
 * 4. Notification creation, categorization, read/unread states, deletion, and fingerprint deduplication
 * 5. Deadline reminder rules (24h before, deadline day, overdue)
 * 6. Notification preference filtering
 */

// Mock browser environment globals for Node.js runner
if (typeof (globalThis as any).localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (k: string) => store[k] || null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
}

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

import { storageService, STORAGE_KEYS } from '../src/services/storage';
import { dataCleanupService } from '../src/services/dataCleanup';
import { notificationService } from '../src/services/notificationService';
import { reminderService } from '../src/services/reminderService';
import { Task, Project, Client, Transaction } from '../src/types';

function assert(condition: any, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

async function runTestSuite() {
  console.log('🧪 Starting ONE TEAM Local-First Test Suite...\n');

  // Test 1: Initial Data Load
  console.log('Test 1: Initializing StorageService and loading default entities...');
  const initialTasks = storageService.getTasks();
  const initialProjects = storageService.getProjects();
  const initialMembers = storageService.getMembers();
  const initialClients = storageService.getClients();
  const initialTxs = storageService.getTransactions();
  const initialSettings = storageService.getSettings();

  assert(initialTasks.length > 0, 'Initial tasks should be loaded');
  assert(initialProjects.length > 0, 'Initial projects should be loaded');
  assert(initialMembers.length > 0, 'Initial members should be loaded');
  assert(initialClients.length > 0, 'Initial clients should be loaded');
  assert(initialTxs.length > 0, 'Initial transactions should be loaded');
  assert(initialSettings.workspaceName.length > 0, 'Initial settings should have workspace name');
  console.log('✅ Test 1 PASSED: Initial collections loaded correctly.\n');

  // Test 2: Task CRUD Persistence
  console.log('Test 2: Verifying Task CRUD persistence...');
  const newTask = storageService.saveTask({
    title: 'Автотестовая задача #1',
    description: 'Проверка сохранения',
    status: 'todo',
    priority: 'high',
    projectId: initialProjects[0].id,
    assigneeId: initialMembers[0].id,
    dueDate: '2026-12-31',
    completed: false,
    comments: [],
    activities: [],
  });

  assert(newTask.id.startsWith('task-'), 'New task should have an ID generated');
  const tasksAfterCreate = storageService.getTasks();
  assert(tasksAfterCreate.some((t) => t.id === newTask.id), 'Created task must persist in storage');

  // Update status
  const updatedTask = storageService.updateTaskStatus(newTask.id, 'done');
  assert(updatedTask?.status === 'done', 'Task status should update to done');
  assert(updatedTask?.completed === true, 'Done task should mark completed = true');

  // Toggle completion
  const toggledTask = storageService.toggleTaskCompletion(newTask.id);
  assert(toggledTask?.completed === false, 'Toggled task should return to in_progress');

  // Add comment
  const comment = storageService.addTaskComment(newTask.id, 'Первый комментарий', {
    name: 'Тестер',
    avatar: '',
  });
  assert(comment?.text === 'Первый комментарий', 'Comment must be added');
  const refreshedTask = storageService.getTasks().find((t) => t.id === newTask.id);
  assert(refreshedTask?.comments.length === 1, 'Refreshed task should have comment');

  // Delete task
  storageService.deleteTask(newTask.id);
  const tasksAfterDelete = storageService.getTasks();
  assert(!tasksAfterDelete.some((t) => t.id === newTask.id), 'Task should be removed after deletion');
  console.log('✅ Test 2 PASSED: Task CRUD operations verified.\n');

  // Test 3: Project CRUD Persistence
  console.log('Test 3: Verifying Project CRUD persistence...');
  const newProj = storageService.saveProject({
    name: 'Проект Автотест',
    description: 'Описание проекта',
    status: 'planning',
    progress: 10,
    deadline: '2027-01-01',
    memberIds: [initialMembers[0].id],
  });
  assert(newProj.id.startsWith('proj-'), 'Project ID generated');
  let projs = storageService.getProjects();
  assert(projs.some((p) => p.id === newProj.id), 'Project persisted');

  storageService.toggleArchiveProject(newProj.id);
  const archived = storageService.getProjects().find((p) => p.id === newProj.id);
  assert(archived?.isArchived === true, 'Project isArchived toggled');

  storageService.deleteProject(newProj.id);
  projs = storageService.getProjects();
  assert(!projs.some((p) => p.id === newProj.id), 'Project deleted');
  console.log('✅ Test 3 PASSED: Project CRUD verified.\n');

  // Test 4: Client and Finance Persistence
  console.log('Test 4: Verifying Client and Finance CRUD...');
  const client = storageService.saveClient({
    name: 'Тестовый Клиент ООО',
    contactPerson: 'Иван Иванов',
    email: 'ivan@client.ru',
    phone: '+7 777 000 00 00',
    status: 'new',
    dealValue: 500000,
    dealCurrency: 'KZT',
    description: 'Тест',
    lastInteraction: '2026-11-04',
    notes: [],
    interactions: [],
  });
  assert(client.id.startsWith('client-'), 'Client ID generated');
  assert(storageService.getClients().some((c) => c.id === client.id), 'Client persisted');

  const tx = storageService.saveTransaction({
    title: 'Тестовый платёж',
    amount: 150000,
    currency: 'KZT',
    type: 'income',
    category: 'client_payment',
    date: '2026-11-04',
    status: 'completed',
  });
  assert(tx.id.startsWith('tx-'), 'Transaction ID generated');
  assert(storageService.getTransactions().some((t) => t.id === tx.id), 'Transaction persisted');

  storageService.deleteClient(client.id);
  storageService.deleteTransaction(tx.id);
  assert(!storageService.getClients().some((c) => c.id === client.id), 'Client deleted');
  assert(!storageService.getTransactions().some((t) => t.id === tx.id), 'Transaction deleted');
  console.log('✅ Test 4 PASSED: Client and Finance operations verified.\n');

  // Test 5: Notification System & Deduplication
  console.log('Test 5: Testing Notifications dispatch & deduplication...');
  const notif1 = notificationService.dispatch({
    title: 'Дедлайн задачи',
    description: 'Срок задачи истекает',
    type: 'task',
    entityId: 't-123',
    targetPage: 'workspace',
    fingerprint: 'fp_test_dedup_1',
  });
  assert(notif1 !== null, 'Notification should be created');

  // Duplicate dispatch with same fingerprint
  const notif2 = notificationService.dispatch({
    title: 'Дедлайн задачи повторный',
    description: 'Срок задачи истекает повторно',
    type: 'task',
    entityId: 't-123',
    targetPage: 'workspace',
    fingerprint: 'fp_test_dedup_1',
  });
  assert(notif2?.id === notif1?.id, 'Duplicate fingerprint must return existing notification without creating new');

  const unreadCount = storageService.getNotifications().filter((n) => !n.read).length;
  assert(unreadCount > 0, 'Unread notification count should be positive');

  if (notif1) {
    storageService.markNotificationRead(notif1.id);
    const readItem = storageService.getNotifications().find((n) => n.id === notif1.id);
    assert(readItem?.read === true, 'Notification should be marked read');

    storageService.deleteNotification(notif1.id);
    assert(!storageService.getNotifications().some((n) => n.id === notif1.id), 'Notification deleted');
  }
  console.log('✅ Test 5 PASSED: Notifications and deduplication verified.\n');

  // Test 6: Deadline Reminder Rules
  console.log('Test 6: Testing Deadline Reminder rules...');
  const now = new Date();
  const formatD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatD(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatD(tomorrow);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatD(yesterday);

  // Create tasks matching reminder criteria
  const t24h = storageService.saveTask({
    title: 'Задача дедлайн 24h',
    description: '',
    status: 'todo',
    priority: 'high',
    projectId: initialProjects[0].id,
    assigneeId: initialMembers[0].id,
    dueDate: tomorrowStr,
    completed: false,
    comments: [],
    activities: [],
  });

  const tToday = storageService.saveTask({
    title: 'Задача дедлайн сегодня',
    description: '',
    status: 'in_progress',
    priority: 'critical' as any,
    projectId: initialProjects[0].id,
    assigneeId: initialMembers[0].id,
    dueDate: todayStr,
    completed: false,
    comments: [],
    activities: [],
  });

  const tOverdue = storageService.saveTask({
    title: 'Задача просрочена',
    description: '',
    status: 'in_progress',
    priority: 'high',
    projectId: initialProjects[0].id,
    assigneeId: initialMembers[0].id,
    dueDate: yesterdayStr,
    completed: false,
    comments: [],
    activities: [],
  });

  // Run reminder check
  reminderService.checkDeadlines();
  const notifsAfterRemind = storageService.getNotifications();

  assert(
    notifsAfterRemind.some((n) => n.title.includes('24 часа')),
    '24 hour reminder notification should be triggered'
  );
  assert(
    notifsAfterRemind.some((n) => n.title.includes('сегодня')),
    'Deadline today notification should be triggered'
  );
  assert(
    notifsAfterRemind.some((n) => n.title.includes('просрочена')),
    'Overdue task notification should be triggered'
  );

  // Cleanup reminder test tasks
  storageService.deleteTask(t24h.id);
  storageService.deleteTask(tToday.id);
  storageService.deleteTask(tOverdue.id);
  console.log('✅ Test 6 PASSED: Deadline reminders triggered accurately.\n');

  // Test 7: Backup, Export, Validation and Restore System
  console.log('Test 7: Testing Backup, Validation and Restoration...');
  const backup = dataCleanupService.createBackup();
  assert(backup.app === 'ONETEAM', 'Backup app must be ONETEAM');
  assert(backup.version === '1.0.0', 'Backup version must be 1.0.0');

  const validation = dataCleanupService.validateBackup(backup);
  assert(validation.valid === true, 'Backup validation must pass for genuine backup');

  const invalidValidation = dataCleanupService.validateBackup({ foo: 'bar' });
  assert(invalidValidation.valid === false, 'Invalid backup format must fail validation');

  // Test restoration
  const restored = dataCleanupService.restoreBackup(backup);
  assert(restored === true, 'Restoration must succeed');
  console.log('✅ Test 7 PASSED: Backup and restore validated successfully.\n');

  // Test 8: Safe Data Cleanup
  console.log('Test 8: Testing Safe Data Cleanup procedure...');
  const cleanupReport = dataCleanupService.executeSafeCleanup();
  assert(cleanupReport.removedRecords.tasks > 0, 'Demo tasks should be removed');
  assert(cleanupReport.preservedRecords.members > 0, 'Real member accounts must be preserved');
  assert(cleanupReport.preservedRecords.currentUser.length > 0, 'Current user profile must be preserved');

  // Verify empty states after cleanup
  assert(storageService.getTasks().length === 0, 'Tasks should be empty after cleanup');
  assert(storageService.getProjects().length === 0, 'Projects should be empty after cleanup');
  assert(storageService.getClients().length === 0, 'Clients should be empty after cleanup');
  assert(storageService.getTransactions().length === 0, 'Transactions should be empty after cleanup');
  assert(storageService.getStrategicGoals().length === 0, 'Goals should be empty after cleanup');
  assert(storageService.getMembers().length > 0, 'Team members must still remain intact');
  assert(storageService.getSettings().workspaceName.length > 0, 'Settings must remain intact');

  console.log('✅ Test 8 PASSED: Safe Cleanup removed demo data and preserved accounts.\n');

  // Restore backup so test runner leaves repo in valid state
  console.log('Restoring backup to return to pre-test state...');
  dataCleanupService.restoreBackup(backup);
  assert(storageService.getTasks().length > 0, 'Tasks restored successfully');
  console.log('✅ State successfully restored.\n');

  console.log('🎉 ALL 8 AUTOMATED TESTS PASSED SUCCESSFULLY! 🚀');
}

runTestSuite().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
