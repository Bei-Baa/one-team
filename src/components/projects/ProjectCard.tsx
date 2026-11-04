import React from 'react';
import { Calendar, Users, CheckSquare, MoreVertical, Archive, Edit } from 'lucide-react';
import { Project } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ProgressBar } from '../common/ProgressBar';
import { Avatar } from '../common/Avatar';
import { useApp } from '../../context/AppContext';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const {
    setSelectedProjectId,
    openEditProject,
    toggleArchiveProject,
    members,
  } = useApp();

  const assignedMembers = members.filter((m) => project.memberIds.includes(m.id));

  return (
    <div
      onClick={() => setSelectedProjectId(project.id)}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
    >
      <div>
        {/* Top: Category & Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            {project.category || 'Проект'}
          </span>
          <StatusBadge status={project.status} type="project" />
        </div>

        {/* Project Name */}
        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
          {project.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
          {project.description}
        </p>

        {/* Progress Bar & Stats */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-slate-500 dark:text-slate-400">Прогресс проекта</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {project.progress}%
            </span>
          </div>
          <ProgressBar
            progress={project.progress}
            color={
              project.progress === 100
                ? 'emerald'
                : project.progress >= 60
                ? 'blue'
                : 'purple'
            }
            height="sm"
          />
        </div>

        {/* Tasks and Deadline info */}
        <div className="grid grid-cols-2 gap-2 mt-3.5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-mono tabular-nums">
            <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {project.completedTasks || 0} / {project.totalTasks || 0} задач
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono tabular-nums justify-end">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>до {project.deadline.split('-').slice(1).join('.')}</span>
          </div>
        </div>
      </div>

      {/* Footer: Member avatars stack & Quick Actions */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center -space-x-2">
          {assignedMembers.slice(0, 4).map((m) => (
            <Avatar
              key={m.id}
              src={m.avatar}
              name={m.name}
              size="xs"
              className="ring-2 ring-white dark:ring-slate-900"
            />
          ))}
          {assignedMembers.length > 4 && (
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center ring-2 ring-white dark:ring-slate-900 font-mono">
              +{assignedMembers.length - 4}
            </div>
          )}
          <span className="text-[11px] text-slate-400 ml-3">
            {assignedMembers.length} уч.
          </span>
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => openEditProject(project)}
            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Редактировать проект"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => toggleArchiveProject(project.id)}
            className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={project.isArchived ? 'Разархивировать' : 'Архивировать'}
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
