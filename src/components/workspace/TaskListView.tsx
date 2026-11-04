import React from 'react';
import { Check, Calendar, MoreHorizontal, MessageSquare, Trash2, Edit } from 'lucide-react';
import { Task, TaskStatus } from '../../types';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { Avatar } from '../common/Avatar';
import { useApp } from '../../context/AppContext';

interface TaskListViewProps {
  tasks: Task[];
}

export const TaskListView: React.FC<TaskListViewProps> = ({ tasks }) => {
  const {
    toggleTaskCompletion,
    setSelectedTaskId,
    updateTaskStatus,
    deleteTask,
    openEditTask,
  } = useApp();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4 w-10"></th>
              <th className="py-3 px-4">Название задачи</th>
              <th className="py-3 px-4">Проект</th>
              <th className="py-3 px-4">Исполнитель</th>
              <th className="py-3 px-4">Приоритет</th>
              <th className="py-3 px-4">Срок</th>
              <th className="py-3 px-4">Статус</th>
              <th className="py-3 px-4 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                  Задачи не найдены
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  {/* Checkbox */}
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => toggleTaskCompletion(task.id)}
                      className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all ${
                        task.completed
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 hover:border-blue-500 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {task.completed && <Check className="w-3 h-3 stroke-[2.5]" />}
                    </button>
                  </td>

                  {/* Title & Comment counter */}
                  <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2 max-w-md">
                      <span
                        className={`truncate ${
                          task.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.comments && task.comments.length > 0 && (
                        <span className="flex items-center gap-0.5 text-[11px] text-slate-400 font-mono">
                          <MessageSquare className="w-3 h-3" />
                          {task.comments.length}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Project */}
                  <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {task.projectName}
                  </td>

                  {/* Assignee */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={task.assigneeAvatar}
                        name={task.assigneeName || ''}
                        size="xs"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                        {task.assigneeName}
                      </span>
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4">
                    <PriorityBadge priority={task.priority} size="sm" />
                  </td>

                  {/* Due Date */}
                  <td className="py-3.5 px-4 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {task.dueDate}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                      className="text-xs py-1 px-2 rounded-md font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-hidden cursor-pointer"
                    >
                      <option value="todo">К выполнению</option>
                      <option value="in_progress">В работе</option>
                      <option value="review">На проверке</option>
                      <option value="done">Готово</option>
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditTask(task)}
                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Редактировать"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
