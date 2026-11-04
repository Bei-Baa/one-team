import React from 'react';
import { ArrowRight, Check, Calendar, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PriorityBadge } from '../common/PriorityBadge';
import { Task } from '../../types';

export const MyTasksWidget: React.FC = () => {
  const {
    tasks,
    toggleTaskCompletion,
    setSelectedTaskId,
    setActivePage,
    openCreateTask,
  } = useApp();

  // Get tasks, sorted with incomplete first, then by date
  const displayTasks = [...tasks]
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.dueDate.localeCompare(b.dueDate);
    })
    .slice(0, 5);

  const formatDueDateLabel = (dateStr: string) => {
    const today = '2026-11-04';
    const tomorrow = '2026-11-05';
    if (dateStr === today) return { label: 'Сегодня', isUrgent: true };
    if (dateStr === tomorrow) return { label: 'Завтра', isUrgent: false };
    const [, m, d] = dateStr.split('-');
    return { label: `${parseInt(d, 10)} ноя`, isUrgent: false };
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Мои задачи
            </h3>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              ({tasks.filter((t) => !t.completed).length})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => openCreateTask()}
              className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Добавить задачу"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActivePage('workspace')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 group transition-colors cursor-pointer"
            >
              <span>Все задачи</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Task rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-1">
          {displayTasks.map((task) => {
            const dateInfo = formatDueDateLabel(task.dueDate);
            return (
              <div
                key={task.id}
                className="py-3 px-2 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                onClick={() => setSelectedTaskId(task.id)}
              >
                {/* Left: Checkbox + Title */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskCompletion(task.id);
                    }}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all duration-150 cursor-pointer ${
                      task.completed
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'border-slate-300 dark:border-slate-600 hover:border-blue-500 bg-white dark:bg-slate-800'
                    }`}
                    aria-label={task.completed ? 'Отметить как невыполненную' : 'Отметить как выполненную'}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </button>

                  <div className="truncate">
                    <span
                      className={`text-sm font-medium transition-all ${
                        task.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.projectName && (
                      <span className="hidden sm:inline-block text-[11px] text-slate-400 ml-2">
                        · {task.projectName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Priority + Due Date */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <PriorityBadge priority={task.priority} size="sm" />
                  <span
                    className={`text-[11px] font-medium font-mono tabular-nums flex items-center gap-1 ${
                      dateInfo.isUrgent
                        ? 'text-rose-600 dark:text-rose-400 font-semibold'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    {dateInfo.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Кликните на задачу для просмотра деталей</span>
        <span className="font-mono tabular-nums">Спринт W45</span>
      </div>
    </div>
  );
};
