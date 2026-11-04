import React, { useState, useMemo } from 'react';
import {
  KanbanSquare,
  ListFilter,
  CalendarDays,
  Plus,
  Filter,
  Search,
  SlidersHorizontal,
  FolderGit2,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { KanbanBoard } from '../components/workspace/KanbanBoard';
import { TaskListView } from '../components/workspace/TaskListView';
import { TaskCalendarView } from '../components/workspace/TaskCalendarView';
import { TaskDetailDrawer } from '../components/workspace/TaskDetailDrawer';
import { TaskModal } from '../components/workspace/TaskModal';
import { Priority, TaskStatus } from '../types';

export const WorkspacePage: React.FC = () => {
  const {
    tasks,
    projects,
    members,
    openCreateTask,
    globalSearch,
    setGlobalSearch,
  } = useApp();

  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState<string>('all');

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Global/local search
      if (globalSearch.trim()) {
        const query = globalSearch.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        const matchesProj = task.projectName?.toLowerCase().includes(query);
        const matchesAssignee = task.assigneeName?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesProj && !matchesAssignee) {
          return false;
        }
      }

      // Project filter
      if (selectedProjectFilter !== 'all' && task.projectId !== selectedProjectFilter) {
        return false;
      }

      // Priority filter
      if (selectedPriorityFilter !== 'all' && task.priority !== selectedPriorityFilter) {
        return false;
      }

      // Assignee filter
      if (selectedAssigneeFilter !== 'all' && task.assigneeId !== selectedAssigneeFilter) {
        return false;
      }

      return true;
    });
  }, [
    tasks,
    globalSearch,
    selectedProjectFilter,
    selectedPriorityFilter,
    selectedAssigneeFilter,
  ]);

  const completedCount = filteredTasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Page Title & Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Рабочее пространство
            </h1>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono tabular-nums">
              {filteredTasks.length} задач
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Оперативное управление спринтом, распределение задач и контроль сроков
          </p>
        </div>

        {/* View Mode Switcher + Create Action */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Segmented View Mode Controls */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <KanbanSquare className="w-3.5 h-3.5" />
              <span>Канбан</span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Список</span>
            </button>

            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Календарь</span>
            </button>
          </div>

          {/* "+ Новая задача" button */}
          <button
            onClick={() => openCreateTask()}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs shadow-blue-600/30 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Новая задача</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold px-2">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Фильтры:</span>
        </div>

        {/* Project Selector */}
        <select
          value={selectedProjectFilter}
          onChange={(e) => setSelectedProjectFilter(e.target.value)}
          className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden cursor-pointer"
        >
          <option value="all">Все проекты ({projects.length})</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Priority Selector */}
        <select
          value={selectedPriorityFilter}
          onChange={(e) => setSelectedPriorityFilter(e.target.value)}
          className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden cursor-pointer"
        >
          <option value="all">Любой приоритет</option>
          <option value="high">Высокий</option>
          <option value="medium">Средний</option>
          <option value="low">Низкий</option>
        </select>

        {/* Assignee Selector */}
        <select
          value={selectedAssigneeFilter}
          onChange={(e) => setSelectedAssigneeFilter(e.target.value)}
          className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden cursor-pointer"
        >
          <option value="all">Все исполнители</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        {/* Reset filter button if active */}
        {(selectedProjectFilter !== 'all' ||
          selectedPriorityFilter !== 'all' ||
          selectedAssigneeFilter !== 'all' ||
          globalSearch !== '') && (
          <button
            onClick={() => {
              setSelectedProjectFilter('all');
              setSelectedPriorityFilter('all');
              setSelectedAssigneeFilter('all');
              setGlobalSearch('');
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 cursor-pointer font-medium"
          >
            Сбросить фильтры
          </button>
        )}

        <div className="ml-auto text-xs text-slate-400 font-mono hidden sm:block">
          Выполнено: {completedCount} из {filteredTasks.length}
        </div>
      </div>

      {/* Main Content View */}
      {tasks.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-xs">
          <KanbanSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Задачи отсутствуют
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Рабочее пространство готово к наполнению. Создайте первую задачу для организации командных процессов.
          </p>
          <button
            onClick={() => openCreateTask()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Создать первую задачу</span>
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'kanban' && <KanbanBoard tasks={filteredTasks} />}
          {viewMode === 'list' && <TaskListView tasks={filteredTasks} />}
          {viewMode === 'calendar' && <TaskCalendarView tasks={filteredTasks} />}
        </>
      )}

      {/* Detail Drawer and Edit Modal */}
      <TaskDetailDrawer />
      <TaskModal />
    </div>
  );
};
