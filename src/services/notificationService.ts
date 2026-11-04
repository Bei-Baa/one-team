/**
 * Centralized Notification Service for ONE TEAM
 *
 * Supports:
 * - Categories: task, project, team, client, finance, strategy, system
 * - Deduplication via event fingerprints
 * - Permission & preference checking
 * - Browser Web Notifications API integration
 * - Navigation metadata (entityId, targetPage)
 */

import { storageService } from './storage';
import { NotificationItem, NotificationCategory, PageId } from '../types';

export interface DispatchNotificationOptions {
  title: string;
  description: string;
  type: NotificationCategory;
  entityId?: string;
  targetPage?: PageId;
  recipientId?: string;
  fingerprint?: string;
}

class NotificationService {
  /**
   * Dispatches a notification if user preferences permit it.
   */
  dispatch(options: DispatchNotificationOptions): NotificationItem | null {
    const settings = storageService.getSettings();
    const prefs = settings.notifications;

    if (options.type === 'task' && prefs.taskNotifications === false) return null;
    if (options.type === 'project' && prefs.projectNotifications === false) return null;
    if (options.type === 'team' && prefs.teamNotifications === false) return null;
    if (options.type === 'client' && prefs.clientNotifications === false) return null;
    if (options.type === 'finance' && prefs.financeNotifications === false) return null;
    if (options.type === 'strategy' && prefs.strategyNotifications === false) return null;

    const saved = storageService.saveNotification({
      title: options.title,
      description: options.description,
      type: options.type,
      read: false,
      entityId: options.entityId,
      targetPage: options.targetPage,
      recipientId: options.recipientId,
      fingerprint: options.fingerprint,
    });

    // Native browser foreground notification if permitted
    if (prefs.browserNotifications && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          const browserNotif = new Notification(options.title, {
            body: options.description,
            icon: '/icons/icon-192.png',
          });

          browserNotif.onclick = () => {
            window.focus();
            if (options.targetPage) {
              window.dispatchEvent(
                new CustomEvent('oneteam_navigate', {
                  detail: { page: options.targetPage, entityId: options.entityId },
                })
              );
            }
          };
        } catch (e) {
          console.warn('Failed to display native browser notification:', e);
        }
      }
    }

    return saved;
  }

  // Task Events
  notifyTaskAssigned(taskTitle: string, assigneeName: string, taskId: string, assigneeId: string) {
    this.dispatch({
      title: 'Назначена задача',
      description: `Задача «${taskTitle}» назначена на ${assigneeName}.`,
      type: 'task',
      entityId: taskId,
      targetPage: 'workspace',
      recipientId: assigneeId,
      fingerprint: `task_assigned_${taskId}_${assigneeId}`,
    });
  }

  notifyTaskDeadlineChanged(taskTitle: string, newDeadline: string, taskId: string) {
    this.dispatch({
      title: 'Изменён дедлайн задачи',
      description: `Новый дедлайн по задаче «${taskTitle}»: ${newDeadline}.`,
      type: 'task',
      entityId: taskId,
      targetPage: 'workspace',
      fingerprint: `task_deadline_${taskId}_${newDeadline}`,
    });
  }

  notifyTaskCompleted(taskTitle: string, authorName: string, taskId: string) {
    this.dispatch({
      title: 'Задача выполнена',
      description: `${authorName} завершил(а) задачу «${taskTitle}».`,
      type: 'task',
      entityId: taskId,
      targetPage: 'workspace',
      fingerprint: `task_completed_${taskId}_${Date.now()}`,
    });
  }

  notifyTaskReopened(taskTitle: string, authorName: string, taskId: string) {
    this.dispatch({
      title: 'Задача возвращена в работу',
      description: `${authorName} вернул(а) задачу «${taskTitle}» в работу.`,
      type: 'task',
      entityId: taskId,
      targetPage: 'workspace',
      fingerprint: `task_reopened_${taskId}_${Date.now()}`,
    });
  }

  notifyTaskCommentAdded(taskTitle: string, authorName: string, commentSnippet: string, taskId: string) {
    this.dispatch({
      title: 'Новый комментарий в задаче',
      description: `${authorName} в «${taskTitle}»: «${commentSnippet}»`,
      type: 'task',
      entityId: taskId,
      targetPage: 'workspace',
      fingerprint: `task_comment_${taskId}_${Date.now()}`,
    });
  }

  // Project Events
  notifyProjectMemberAdded(projectName: string, memberName: string, projectId: string) {
    this.dispatch({
      title: 'Участник добавлен в проект',
      description: `${memberName} подключен(а) к проекту «${projectName}».`,
      type: 'project',
      entityId: projectId,
      targetPage: 'projects',
      fingerprint: `proj_member_${projectId}_${memberName}`,
    });
  }

  notifyProjectStatusChanged(projectName: string, newStatusLabel: string, projectId: string) {
    this.dispatch({
      title: 'Статус проекта обновлён',
      description: `Проект «${projectName}» переведён в статус «${newStatusLabel}».`,
      type: 'project',
      entityId: projectId,
      targetPage: 'projects',
      fingerprint: `proj_status_${projectId}_${newStatusLabel}_${Math.floor(Date.now() / 60000)}`,
    });
  }

  notifyProjectDeadlineChanged(projectName: string, deadline: string, projectId: string) {
    this.dispatch({
      title: 'Дедлайн проекта изменён',
      description: `Дедлайн проекта «${projectName}» установлен на ${deadline}.`,
      type: 'project',
      entityId: projectId,
      targetPage: 'projects',
      fingerprint: `proj_deadline_${projectId}_${deadline}`,
    });
  }

  notifyProjectCompleted(projectName: string, projectId: string) {
    this.dispatch({
      title: 'Проект завершён!',
      description: `Проект «${projectName}» успешно переведён в статус «Завершено».`,
      type: 'project',
      entityId: projectId,
      targetPage: 'projects',
      fingerprint: `proj_completed_${projectId}`,
    });
  }

  // Team Events
  notifyInvitationSent(workspaceName: string, inviteeEmail: string, role: string) {
    this.dispatch({
      title: 'Приглашение отправлено',
      description: `Приглашение для ${inviteeEmail} (роль: ${role}) создано для «${workspaceName}».`,
      type: 'team',
      targetPage: 'team',
      fingerprint: `invite_sent_${workspaceName}_${inviteeEmail}_${Math.floor(Date.now() / 60000)}`,
    });
  }

  notifyInvitationReceived(workspaceName: string, inviterName: string, role: string) {
    this.dispatch({
      title: 'Новое приглашение в команду',
      description: `${inviterName} пригласил(а) вас в «${workspaceName}» на роль ${role}. Откройте центр уведомлений для подтверждения.`,
      type: 'team',
      targetPage: 'team',
      fingerprint: `invite_received_${workspaceName}_${Date.now()}`,
    });
  }

  notifyInvitationAccepted(workspaceName: string, userName: string) {
    this.dispatch({
      title: 'Приглашение принято',
      description: `${userName} присоединился(-лась) к команде «${workspaceName}».`,
      type: 'team',
      targetPage: 'team',
      fingerprint: `invite_accepted_${workspaceName}_${userName}_${Date.now()}`,
    });
  }

  notifyInvitationDeclined(workspaceName: string, userName: string) {
    this.dispatch({
      title: 'Приглашение отклонено',
      description: `${userName} отклонил(а) приглашение в команду «${workspaceName}».`,
      type: 'team',
      targetPage: 'team',
      fingerprint: `invite_declined_${workspaceName}_${userName}_${Date.now()}`,
    });
  }

  notifyTeamMemberJoined(memberName: string, position: string, memberId: string) {
    this.dispatch({
      title: 'Новый участник в команде',
      description: `${memberName} (${position}) присоединился(-лась) к рабочему пространству.`,
      type: 'team',
      entityId: memberId,
      targetPage: 'team',
      fingerprint: `team_joined_${memberId}`,
    });
  }

  notifyTeamRoleChanged(memberName: string, newRole: string, memberId: string) {
    this.dispatch({
      title: 'Изменение роли участника',
      description: `Роль пользователя ${memberName} изменена на ${newRole}.`,
      type: 'team',
      entityId: memberId,
      targetPage: 'team',
      fingerprint: `team_role_${memberId}_${newRole}`,
    });
  }

  notifyTeamMemberRemoved(memberName: string) {
    this.dispatch({
      title: 'Участник покинул команду',
      description: `Пользователь ${memberName} исключён из рабочего пространства.`,
      type: 'team',
      targetPage: 'team',
      fingerprint: `team_removed_${memberName}_${Date.now()}`,
    });
  }

  // Client Events
  notifyClientCreated(clientName: string, clientId: string) {
    this.dispatch({
      title: 'Новый клиент добавлен',
      description: `Карточка клиента «${clientName}» успешно создана.`,
      type: 'client',
      entityId: clientId,
      targetPage: 'clients',
      fingerprint: `client_created_${clientId}`,
    });
  }

  notifyClientStatusChanged(clientName: string, statusLabel: string, clientId: string) {
    this.dispatch({
      title: 'Статус клиента изменён',
      description: `Клиент «${clientName}» переведён на этап «${statusLabel}».`,
      type: 'client',
      entityId: clientId,
      targetPage: 'clients',
      fingerprint: `client_status_${clientId}_${statusLabel}`,
    });
  }

  notifyClientInteraction(clientName: string, typeLabel: string, clientId: string) {
    this.dispatch({
      title: 'Новое взаимодействие с клиентом',
      description: `Зафиксирован контакт (${typeLabel}) с клиентом «${clientName}».`,
      type: 'client',
      entityId: clientId,
      targetPage: 'clients',
      fingerprint: `client_interact_${clientId}_${Date.now()}`,
    });
  }

  // Finance Events
  notifyFinancialTransaction(title: string, amountStr: string, isIncome: boolean, txId: string) {
    this.dispatch({
      title: isIncome ? 'Поступление средств' : 'Новый расход',
      description: `${isIncome ? '+' : '−'}${amountStr}: ${title}`,
      type: 'finance',
      entityId: txId,
      targetPage: 'finance',
      fingerprint: `finance_tx_${txId}`,
    });
  }

  // Strategy Events
  notifyGoalCreated(goalTitle: string, ownerName: string, goalId: string) {
    this.dispatch({
      title: 'Новая стратегическая цель',
      description: `Сформулирована цель «${goalTitle}». Ответственный: ${ownerName}.`,
      type: 'strategy',
      entityId: goalId,
      targetPage: 'strategy',
      fingerprint: `goal_created_${goalId}`,
    });
  }

  notifyGoalCompleted(goalTitle: string, goalId: string) {
    this.dispatch({
      title: 'Стратегическая цель достигнута!',
      description: `Команда выполнила цель «${goalTitle}» на 100%!`,
      type: 'strategy',
      entityId: goalId,
      targetPage: 'strategy',
      fingerprint: `goal_completed_${goalId}`,
    });
  }

  notifyPriorityChanged(priorityTitle: string, importance: string, priorityId: string) {
    this.dispatch({
      title: 'Обновлён приоритет',
      description: `Приоритет «${priorityTitle}» получил важность «${importance}».`,
      type: 'strategy',
      entityId: priorityId,
      targetPage: 'strategy',
      fingerprint: `priority_changed_${priorityId}_${importance}`,
    });
  }
}

export const notificationService = new NotificationService();
