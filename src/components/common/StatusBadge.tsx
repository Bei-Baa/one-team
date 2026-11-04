import React from 'react';
import { TaskStatus, ProjectStatus } from '../../types';

interface StatusBadgeProps {
  status: TaskStatus | ProjectStatus;
  type?: 'task' | 'project';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'task' }) => {
  const taskMap: Record<TaskStatus, { label: string; textClass: string; bgClass: string }> = {
    todo: {
      label: 'К выполнению',
      textClass: 'text-slate-700 dark:text-slate-300',
      bgClass: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    },
    in_progress: {
      label: 'В работе',
      textClass: 'text-blue-700 dark:text-blue-400',
      bgClass: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/40',
    },
    review: {
      label: 'На проверке',
      textClass: 'text-amber-700 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40',
    },
    done: {
      label: 'Готово',
      textClass: 'text-emerald-700 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40',
    },
  };

  const projectMap: Record<ProjectStatus, { label: string; textClass: string; bgClass: string }> = {
    planning: {
      label: 'Планирование',
      textClass: 'text-purple-700 dark:text-purple-400',
      bgClass: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200/60 dark:border-purple-900/40',
    },
    in_progress: {
      label: 'В работе',
      textClass: 'text-blue-700 dark:text-blue-400',
      bgClass: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/40',
    },
    review: {
      label: 'На проверке',
      textClass: 'text-amber-700 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40',
    },
    completed: {
      label: 'Завершено',
      textClass: 'text-emerald-700 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40',
    },
  };

  const conf =
    type === 'project'
      ? projectMap[status as ProjectStatus] || projectMap.in_progress
      : taskMap[status as TaskStatus] || taskMap.todo;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded-md whitespace-nowrap shrink-0 ${conf.bgClass} ${conf.textClass}`}
    >
      {conf.label}
    </span>
  );
};
