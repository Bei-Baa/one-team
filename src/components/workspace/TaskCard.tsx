import React from 'react';
import { Calendar, CheckCircle2, MoreVertical, MessageSquare } from 'lucide-react';
import { Task, TaskStatus } from '../../types';
import { PriorityBadge } from '../common/PriorityBadge';
import { Avatar } from '../common/Avatar';
import { useApp } from '../../context/AppContext';

interface TaskCardProps {
  task: Task;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onDragStart }) => {
  const { setSelectedTaskId, updateTaskStatus } = useApp();

  const formatDueDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [, m, d] = dateStr.split('-');
    return `${parseInt(d, 10)}.${m}`;
  };

  const nextStatusMap: Record<TaskStatus, TaskStatus | null> = {
    todo: 'in_progress',
    in_progress: 'review',
    review: 'done',
    done: null,
  };

  const nextStatus = nextStatusMap[task.status];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, task.id)}
      onClick={() => setSelectedTaskId(task.id)}
      className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-150 cursor-pointer group flex flex-col justify-between select-none"
    >
      <div>
        {/* Project tag & Priority badge */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
            {task.projectName}
          </span>
          <PriorityBadge priority={task.priority} size="sm" />
        </div>

        {/* Task Title */}
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
          {task.title}
        </h4>

        {/* Optional short description */}
        {task.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Footer: Assignee, Comments count, Deadline, Quick advance */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <Avatar
            src={task.assigneeAvatar}
            name={task.assigneeName || 'User'}
            size="xs"
            title={task.assigneeName}
          />
          {task.comments && task.comments.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
              <MessageSquare className="w-3 h-3" />
              {task.comments.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className="text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDueDate(task.dueDate)}
            </span>
          )}

          {nextStatus && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                updateTaskStatus(task.id, nextStatus);
              }}
              className="text-xs font-semibold px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors touch-target flex items-center justify-center cursor-pointer min-h-[32px] min-w-[32px]"
              title="Перевести на следующий статус"
              aria-label="Перевести на следующий статус"
            >
              →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
