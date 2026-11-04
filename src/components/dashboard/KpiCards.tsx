import React from 'react';
import { CheckCircle2, ListTodo, FolderGit2, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const KpiCards: React.FC = () => {
  const { tasks, projects, settings, setActivePage } = useApp();

  const myTasks = tasks.filter(
    (t) => t.assigneeId === settings.currentUser.id && !t.completed
  );

  const teamActiveTasks = tasks.filter((t) => !t.completed);
  const activeProjects = projects.filter((p) => p.status !== 'completed' && !p.isArchived);

  // Calculate average team progress across active projects
  const totalProgress = activeProjects.reduce((acc, p) => acc + (p.progress || 0), 0);
  const avgProgress = activeProjects.length > 0 ? Math.round(totalProgress / activeProjects.length) : 76;

  const cards = [
    {
      title: 'Мои активные задачи',
      value: myTasks.length,
      subValue: 'требуют внимания',
      change: '+2 новые',
      trend: 'neutral',
      icon: CheckCircle2,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-950/40',
      onClick: () => setActivePage('workspace'),
    },
    {
      title: 'Задачи команды',
      value: teamActiveTasks.length,
      subValue: `из ${tasks.length} всего`,
      change: '+8% за неделю',
      trend: 'up',
      icon: ListTodo,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/40',
      onClick: () => setActivePage('workspace'),
    },
    {
      title: 'Активные проекты',
      value: activeProjects.length,
      subValue: 'в производстве',
      change: '1 завершён',
      trend: 'neutral',
      icon: FolderGit2,
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-50 dark:bg-purple-950/40',
      onClick: () => setActivePage('projects'),
    },
    {
      title: 'Общий прогресс команды',
      value: `${avgProgress}%`,
      subValue: 'к цели месяца',
      change: '+12% к прошлому',
      trend: 'up',
      icon: TrendingUp,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      onClick: () => setActivePage('projects'),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            onClick={card.onClick}
            className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div
                className={`w-9 h-9 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center transition-transform group-hover:scale-110 duration-200`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-1">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono tabular-nums">
                {card.value}
              </div>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md font-mono">
                {card.change}
              </span>
            </div>

            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
              <span>{card.subValue}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
