import React from 'react';
import {
  Calendar,
  Users,
  CheckSquare,
  Plus,
  Trash2,
  Edit,
  Archive,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { ProgressBar } from '../common/ProgressBar';
import { Avatar } from '../common/Avatar';

export const ProjectDetailModal: React.FC = () => {
  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    tasks,
    members,
    toggleTaskCompletion,
    setSelectedTaskId,
    openCreateTask,
    openEditProject,
    deleteProject,
    toggleArchiveProject,
    setActivePage,
  } = useApp();

  const project = projects.find((p) => p.id === selectedProjectId);

  if (!project) return null;

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const assignedMembers = members.filter((m) => project.memberIds.includes(m.id));

  const handleClose = () => {
    setSelectedProjectId(null);
  };

  return (
    <Modal
      isOpen={Boolean(selectedProjectId)}
      onClose={handleClose}
      title={project.name}
      subtitle={project.category || 'Проект компании'}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Status & Actions Row */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <StatusBadge status={project.status} type="project" />
            {project.isArchived && (
              <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md font-medium">
                В архиве
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                handleClose();
                openEditProject(project);
              }}
              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Редактировать"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                toggleArchiveProject(project.id);
              }}
              className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={project.isArchived ? 'Разархивировать' : 'В архив'}
            >
              <Archive className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                deleteProject(project.id);
                handleClose();
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Удалить"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
            Описание
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
            {project.description}
          </p>
        </div>

        {/* Progress & Metrics */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Общий прогресс
            </span>
            <span className="font-bold text-slate-900 dark:text-white font-mono tabular-nums text-sm">
              {project.progress}%
            </span>
          </div>
          <ProgressBar progress={project.progress} color="blue" height="md" />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Всего задач</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {projectTasks.length}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Выполнено</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {projectTasks.filter((t) => t.completed).length}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Дедлайн проекта</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {project.deadline}
              </span>
            </div>
          </div>
        </div>

        {/* Team Members in Project */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Команда проекта ({assignedMembers.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {assignedMembers.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-850"
              >
                <Avatar src={m.avatar} name={m.name} size="sm" showOnlineStatus isOnline={m.isOnline} />
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {m.name}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {m.position}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks in Project */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Задачи проекта ({projectTasks.length})
            </h4>
            <button
              onClick={() => {
                handleClose();
                openCreateTask(project.id);
              }}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Добавить задачу
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {projectTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 italic">В проекте пока нет задач</p>
            ) : (
              projectTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => {
                    handleClose();
                    setSelectedTaskId(task.id);
                    setActivePage('workspace');
                  }}
                  className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`text-xs font-medium truncate ${
                        task.completed
                          ? 'line-through text-slate-400'
                          : 'text-slate-800 dark:text-slate-200 group-hover:text-blue-600'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={task.priority} size="sm" />
                    <span className="text-[11px] font-mono text-slate-400">
                      до {task.dueDate.split('-').slice(1).join('.')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
