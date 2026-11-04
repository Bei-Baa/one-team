import React from 'react';
import { Priority } from '../../types';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const configs: Record<Priority, { label: string; textClass: string; bgClass: string; dotClass: string }> = {
    high: {
      label: 'Высокий',
      textClass: 'text-rose-700 dark:text-rose-400',
      bgClass: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/40',
      dotClass: 'bg-rose-500',
    },
    medium: {
      label: 'Средний',
      textClass: 'text-amber-700 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40',
      dotClass: 'bg-amber-500',
    },
    low: {
      label: 'Низкий',
      textClass: 'text-slate-600 dark:text-slate-400',
      bgClass: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
      dotClass: 'bg-slate-400',
    },
  };

  const conf = configs[priority] || configs.medium;
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-md whitespace-nowrap shrink-0 ${conf.bgClass} ${conf.textClass} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dotClass}`} aria-hidden="true" />
      {conf.label}
    </span>
  );
};
