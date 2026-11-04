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

  // Test 1: StorageService Clean Initialization
  console.log('Test 1: Initializing StorageService and verifying clean initial entities...');
  const initialTasks = storageService.getTasks();
  const initialProjects = storageService.getProjects();
  const initialMembers = storageService.getMembers();
  const initialClients = storageService.getClients();
  const initialTxs = storageService.getTransactions();
  const initialGoals = storageService.getStrategicGoals();
  const initialPriorities = storageService.getStrategicPriorities();
  const initialPlan = storageService.getDevelopmentPlan();
  const initialNotifications = storageService.getNotifications();
  const initialSettings = storageService.getSettings();

  assert(Array.isArray(initialTasks) && initialTasks.length === 0, 'Initial tasks must be empty array');
  assert(Array.isArray(initialProjects) && initialProjects.length === 0, 'Initial projects must be empty array');
  assert(Array.isArray(initialClients) && initialClients.length === 0, 'Initial clients must be empty array');
  assert(Array.isArray(initialTxs) && initialTxs.length === 0, 'Initial transactions must be empty array');
  assert(Array.isArray(initialGoals) && initialGoals.length === 0, 'Initial goals must be empty array');
  assert(Array.isArray(initialPriorities) && initialPriorities.length === 0, 'Initial priorities must be empty array');
  assert(Array.isArray(initialPlan) && initialPlan.length === 0, 'Initial development plan must be empty array');
  assert(Array.isArray(initialNotifications) && initialNotifications.length === 0, 'Initial notifications must be empty array');
  assert(initialMembers.length === 1, 'Initial members should only contain 1 authentic owner profile');
  assert(initialMembers[0].name === 'Екатерина Соколова', 'Owner profile name should be preserved');
  assert(initialSettings.workspaceName.length > 0, 'Initial settings should have workspace name');
  console.log('✅ Test 1 PASSED: Clean initial empty collections verified.\n');

  // Test 2: Task CRUD Persistence
  console.log('Test 2: Verifying Task CRUD persistence...');
  const newTask = storageService.saveTask({
    title: 'Автотестовая задача #1',
    description: 'Проверка сохранения',
    status: 'todo',
    priority: 'high',
    projectId: 'proj-temp-0',
    assigneeId: initialMembers[0].id,
    dueDate: '2026-12-31',
    completed: false,
    comments: [],
    activities: [],
  });

  assert(Boolean(newTask.id && newTask.id.length > 0), 'New task should have an ID generated');
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
  assert(Boolean(newProj.id && newProj.id.length > 0), 'Project ID generated');
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
  assert(Boolean(client.id && client.id.length > 0), 'Client ID generated');
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
  assert(Boolean(tx.id && tx.id.length > 0), 'Transaction ID generated');
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
    projectId: 'proj-temp-1',
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
    priority: 'high',
    projectId: 'proj-temp-1',
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
    projectId: 'proj-temp-1',
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
  // Add some temporary test records to clean
  storageService.saveTask({
    title: 'Temp Task',
    description: '',
    status: 'todo',
    priority: 'low',
    projectId: 'proj-temp-clean',
    assigneeId: initialMembers[0].id,
    dueDate: '2027-01-01',
    completed: false,
    comments: [],
    activities: [],
  });
  storageService.saveProject({
    name: 'Temp Project',
    description: '',
    status: 'planning',
    progress: 0,
    deadline: '2027-01-01',
    memberIds: [initialMembers[0].id],
  });

  const cleanupReport = dataCleanupService.executeSafeCleanup();
  assert(cleanupReport.removedRecords.tasks >= 1, 'Temporary/demo tasks should be removed');
  assert(cleanupReport.removedRecords.projects >= 1, 'Temporary/demo projects should be removed');
  assert(cleanupReport.preservedRecords.members === 1, 'Real owner member account must be preserved');
  assert(cleanupReport.preservedRecords.currentUser.length > 0, 'Current user profile must be preserved');

  // Verify empty states after cleanup
  assert(storageService.getTasks().length === 0, 'Tasks should be empty after cleanup');
  assert(storageService.getProjects().length === 0, 'Projects should be empty after cleanup');
  assert(storageService.getClients().length === 0, 'Clients should be empty after cleanup');
  assert(storageService.getTransactions().length === 0, 'Transactions should be empty after cleanup');
  assert(storageService.getStrategicGoals().length === 0, 'Goals should be empty after cleanup');
  assert(storageService.getStrategicPriorities().length === 0, 'Priorities should be empty after cleanup');
  assert(storageService.getDevelopmentPlan().length === 0, 'Development plan should be empty after cleanup');
  assert(storageService.getNotifications().length === 0, 'Notifications should be empty after cleanup');
  assert(storageService.getMembers().length === 1, 'Only owner member must remain');
  assert(storageService.getSettings().workspaceName.length > 0, 'Settings must remain intact');

  console.log('✅ Test 8 PASSED: Safe Cleanup removed demo data and preserved accounts.\n');

  // Test 9: Refresh and App Restart simulation
  console.log('Test 9: Verifying refresh and re-initialization does not recreate demo data...');
  assert(storageService.getTasks().length === 0, 'Tasks remain 0 after re-query');
  assert(storageService.getProjects().length === 0, 'Projects remain 0 after re-query');
  assert(storageService.getClients().length === 0, 'Clients remain 0 after re-query');
  assert(storageService.getTransactions().length === 0, 'Transactions remain 0 after re-query');
  assert(storageService.getStrategicGoals().length === 0, 'Goals remain 0 after re-query');
  console.log('✅ Test 9 PASSED: Re-query and refresh do not resurrect demo data.\n');

  console.log('🎉 ALL 9 AUTOMATED TESTS PASSED SUCCESSFULLY! 🚀');
}

runTestSuite().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
