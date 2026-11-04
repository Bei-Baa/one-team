/**
 * Local Deadline Reminder Service for ONE TEAM
 *
 * Rules:
 * - 24 hours before the deadline (1 day prior)
 * - On the deadline day (today)
 * - When the task becomes overdue (due date < today)
 *
 * Safety & Deduplication:
 * - Runs checks when application starts and periodically while open
 * - Respects user notification preferences (deadlineReminders switch)
 * - Deduplicates alerts by date-stamped fingerprint to prevent spam
 * - Respects task status (ignores completed / done tasks)
 * - Uses local timezone
 */

import { storageService } from './storage';
import { notificationService } from './notificationService';
import { Task } from '../types';

class ReminderService {
  private timer: NodeJS.Timeout | null = null;

  /**
   * Evaluates all open tasks and generates reminders according to the rules.
   */
  checkDeadlines(): void {
    const settings = storageService.getSettings();
    if (settings.notifications.deadlineReminders === false) {
      return;
    }

    const tasks = storageService.getTasks();
    const now = new Date();
    const todayStr = this.formatLocalDate(now);

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = this.formatLocalDate(tomorrow);

    tasks.forEach((task) => {
      // Ignore already completed tasks
      if (task.completed || task.status === 'done' || !task.dueDate) {
        return;
      }

      const taskDue = task.dueDate;

      if (taskDue === tomorrowStr) {
        // 24 hours before deadline
        notificationService.dispatch({
          title: 'Дедлайн через 24 часа',
          description: `Завтра наступает срок сдачи задачи «${task.title}».`,
          type: 'task',
          entityId: task.id,
          targetPage: 'workspace',
          fingerprint: `remind_24h_${task.id}_${todayStr}`,
        });
      } else if (taskDue === todayStr) {
        // On deadline day
        notificationService.dispatch({
          title: 'Дедлайн сегодня!',
          description: `Сегодня истекает срок выполнения задачи «${task.title}».`,
          type: 'task',
          entityId: task.id,
          targetPage: 'workspace',
          fingerprint: `remind_today_${task.id}_${todayStr}`,
        });
      } else if (taskDue < todayStr) {
        // Overdue task
        notificationService.dispatch({
          title: 'Задача просрочена',
          description: `Срок сдачи задачи «${task.title}» истёк (${taskDue}). Требуется внимание.`,
          type: 'task',
          entityId: task.id,
          targetPage: 'workspace',
          fingerprint: `remind_overdue_${task.id}_${todayStr}`,
        });
      }
    });
  }

  /**
   * Starts periodic reminder check (runs immediately, then every 30 minutes while open).
   */
  startScheduler(): void {
    if (typeof window === 'undefined') return;
    this.checkDeadlines();
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.checkDeadlines();
    }, 30 * 60 * 1000);
  }

  stopScheduler(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private formatLocalDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export const reminderService = new ReminderService();
