import React, { useState, useMemo } from 'react';
import { FolderGit2, Plus, Search, Filter, Archive } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProjectCard } from '../components/projects/ProjectCard';
import { ProjectDetailModal } from '../components/projects/ProjectDetailModal';
import { ProjectModal } from '../components/projects/ProjectModal';
import { ProjectStatus } from '../types';

export const ProjectsPage: React.FC = () => {
  const { projects, openCreateProject, globalSearch, setGlobalSearch } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus | 'archived'>('all');
  const [localSearch, setLocalSearch] = useState('');

  const filterTabs: { id: 'all' | ProjectStatus | 'archived'; label: string; count: number }[] = [
    {
      id: 'all',
      label: 'Все',
      count: projects.filter((p) => !p.isArchived).length,
    },
    {
      id: 'planning',
      label: 'Планирование',
      count: projects.filter((p) => p.status === 'planning' && !p.isArchived).length,
    },
    {
      id: 'in_progress',
      label: 'В работе',
      count: projects.filter((p) => p.status === 'in_progress' && !p.isArchived).length,
    },
    {
      id: 'review',
      label: 'На проверке',
      count: projects.filter((p) => p.status === 'review' && !p.isArchived).length,
    },
    {
      id: 'completed',
      label: 'Завершено',
      count: projects.filter((p) => p.status === 'completed' && !p.isArchived).length,
    },
    {
      id: 'archived',
      label: 'Архив',
      count: projects.filter((p) => p.isArchived).length,
    },
  ];

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Archive filter
      if (statusFilter === 'archived') {
        if (!project.isArchived) return false;
      } else {
        if (project.isArchived) return false;
        if (statusFilter !== 'all' && project.status !== statusFilter) {
          return false;
        }
      }

      // Search term
      const query = (localSearch || globalSearch).toLowerCase().trim();
      if (query) {
        const matchesName = project.name.toLowerCase().includes(query);
        const matchesDesc = project.description.toLowerCase().includes(query);
        const matchesCat = project.category?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }

      return true;
    });
  }, [projects, statusFilter, localSearch, globalSearch]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Проекты
            </h1>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono tabular-nums">
              {projects.length} всего
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Координация стратегических направлений, отслеживание стадий и прогресса
          </p>
        </div>

        <button
          onClick={openCreateProject}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs shadow-blue-600/30 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Новый проект</span>
        </button>
      </div>

      {/* Filter Tabs & Local Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-2.5 sm:p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[38px] ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === tab.id
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Local Search Input */}
        <div className="relative w-full lg:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Поиск по проектам..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8">
          <FolderGit2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Проекты не найдены
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Попробуйте изменить параметры фильтрации или создайте новый проект для вашей команды.
          </p>
          <button
            onClick={openCreateProject}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Создать первый проект
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Project detail and edit modals */}
      <ProjectDetailModal />
      <ProjectModal />
    </div>
  );
};
