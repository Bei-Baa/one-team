import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Task, TaskStatus } from '../../types';
import { TaskCard } from './TaskCard';
import { useApp } from '../../context/AppContext';

interface KanbanBoardProps {
  tasks: Task[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks }) => {
  const { updateTaskStatus, openCreateTask } = useApp();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeDropColumn, setActiveDropColumn] = useState<TaskStatus | null>(null);

  const columns: { id: TaskStatus; title: string; headerColor: string; bgBadge: string }[] = [
    {
      id: 'todo',
      title: 'К выполнению',
      headerColor: 'text-slate-700 dark:text-slate-300',
      bgBadge: 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    },
    {
      id: 'in_progress',
      title: 'В работе',
      headerColor: 'text-blue-700 dark:text-blue-400',
      bgBadge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    },
    {
      id: 'review',
      title: 'На проверке',
      headerColor: 'text-amber-700 dark:text-amber-400',
      bgBadge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    },
    {
      id: 'done',
      title: 'Готово',
      headerColor: 'text-emerald-700 dark:text-emerald-400',
      bgBadge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    },
  ];

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setActiveDropColumn(status);
  };

  const handleDragLeave = () => {
    setActiveDropColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      updateTaskStatus(taskId, status);
    }
    setDraggedTaskId(null);
    setActiveDropColumn(null);
  };

  return (
    <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start min-h-[500px] pb-6">
      {columns.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.id);
        const isDropTarget = activeDropColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`w-full flex flex-col bg-slate-100/70 dark:bg-slate-900/50 rounded-2xl p-3 border transition-colors min-h-[300px] sm:min-h-[500px] ${
              isDropTarget
                ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 ring-2 ring-blue-500/20'
                : 'border-slate-200/60 dark:border-slate-800/60'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 py-1.5 mb-3">
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-bold ${col.headerColor}`}>
                  {col.title}
                </h3>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full font-mono tabular-nums ${col.bgBadge}`}
                >
                  {columnTasks.length}
                </span>
              </div>

              <button
                onClick={() => openCreateTask()}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                title={`Добавить задачу в ${col.title}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task list container */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDragStart={handleDragStart}
                />
              ))}

              {columnTasks.length === 0 && (
                <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400">
                  Перетащите задачу сюда
                </div>
              )}
            </div>

            {/* Add task button at bottom */}
            <button
              onClick={() => openCreateTask()}
              className="mt-3 py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить задачу</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
