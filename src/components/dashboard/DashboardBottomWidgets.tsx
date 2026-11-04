import React from 'react';
import {
  Clock,
  Calendar,
  FolderGit2,
  CheckCircle2,
  MessageSquare,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { Avatar } from '../common/Avatar';

export const DashboardBottomWidgets: React.FC = () => {
  const { tasks, projects, members, setSelectedTaskId, setSelectedProjectId, setActivePage } = useApp();

  // 1. Recent team activity (comments and recent task activities aggregated)
  const recentActivities = [
    {
      id: 'act-1',
      author: 'Мария Лебедева',
      avatar: '/src/assets/images/avatar_maria_1793774893832.jpg',
      text: 'добавила комментарий в "Запустить рекламную кампанию"',
      time: '15 мин назад',
      type: 'comment',
      taskId: 'task-4',
    },
    {
      id: 'act-2',
      author: 'Дмитрий Кузнецов',
      avatar: '/src/assets/images/avatar_dmitry_1793774893675.jpg',
      text: 'перевёл задачу "Сверстать интерфейс" в статус На проверке',
      time: '1 час назад',
      type: 'status',
      taskId: 'task-6',
    },
    {
      id: 'act-3',
      author: 'Екатерина Соколова',
      avatar: '/src/assets/images/avatar_ekaterina_1793774893419.jpg',
      text: 'обновила дедлайн проекта "AI Target для Celebrity Spa"',
      time: '3 часа назад',
      type: 'project',
      projectId: 'proj-1',
    },
    {
      id: 'act-4',
      author: 'Антон Васильев',
      avatar: '/src/assets/images/avatar_anton_1793774893419.jpg',
      text: 'завершил задачу "Настроить сквозную аналитику"',
      time: 'Вчера',
      type: 'complete',
      taskId: 'task-8',
    },
  ];

  // 2. Upcoming deadlines (sorted by dueDate)
  const upcomingDeadlines = [...tasks]
    .filter((t) => !t.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);

  // 3. Recently updated projects
  const recentProjects = [...projects].slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* 1. Recent Activity */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Активность команды
            </h4>
          </div>

          <div className="space-y-3.5">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                onClick={() => {
                  if (act.taskId) {
                    setSelectedTaskId(act.taskId);
                    setActivePage('workspace');
                  } else if (act.projectId) {
                    setSelectedProjectId(act.projectId);
                    setActivePage('projects');
                  }
                }}
                className="flex items-start gap-2.5 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
              >
                <Avatar src={act.avatar} name={act.author} size="xs" />
                <div className="flex-1 min-w-0 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {act.author}{' '}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">{act.text}</span>
                  <div className="text-[10px] text-slate-400 mt-0.5">{act.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Upcoming Deadlines */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Ближайшие дедлайны
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">
              {upcomingDeadlines.length} задачи
            </span>
          </div>

          <div className="space-y-2.5">
            {upcomingDeadlines.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  setSelectedTaskId(t.id);
                  setActivePage('workspace');
                }}
                className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate max-w-[170px]">
                    {t.title}
                  </span>
                  <PriorityBadge priority={t.priority} size="sm" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{t.projectName}</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
                    до {t.dueDate.split('-').slice(1).join('.')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Recently Updated Projects */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Проекты в фокусе
            </h4>
            <button
              onClick={() => setActivePage('projects')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              Все <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {recentProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedProjectId(p.id);
                  setActivePage('projects');
                }}
                className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                    {p.name}
                  </span>
                  <StatusBadge status={p.status} type="project" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{p.category || 'Проект'}</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {p.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
