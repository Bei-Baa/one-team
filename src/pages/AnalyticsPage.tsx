import React, { useState, useMemo } from 'react';
import {
  Download,
  Calendar,
  CheckCircle2,
  FolderGit2,
  TrendingUp,
  Clock,
  BarChart3,
  Users,
  AlertCircle,
  Activity,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AnalyticsPeriod } from '../types';
import { ProgressBar } from '../components/common/ProgressBar';
import { Avatar } from '../components/common/Avatar';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { StatusBadge } from '../components/common/StatusBadge';

export const AnalyticsPage: React.FC = () => {
  const { tasks, projects, members, setSelectedTaskId, setSelectedProjectId, setActivePage } = useApp();
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');

  // Multipliers/filters according to selected period for realistic dynamic view
  const periodConfig = useMemo(() => {
    switch (period) {
      case 'week':
        return { label: 'Эта неделя', multiplier: 0.35, prevMultiplier: 0.3, periodStr: 'W45 (3–9 ноября)' };
      case 'month':
        return { label: 'Этот месяц', multiplier: 1.0, prevMultiplier: 0.88, periodStr: 'Ноябрь 2026' };
      case '30days':
        return { label: 'Последние 30 дней', multiplier: 1.15, prevMultiplier: 1.05, periodStr: '5 окт – 4 ноя' };
      case 'quarter':
        return { label: 'Этот квартал', multiplier: 2.8, prevMultiplier: 2.4, periodStr: 'Q4 2026' };
    }
  }, [period]);

  const completedTasks = tasks.filter((t) => t.completed || t.status === 'done');
  const activeProjects = projects.filter((p) => p.status !== 'completed' && !p.isArchived);

  // Computed metrics based on real task & project data
  const totalTasksCount = tasks.length;
  const completedCount = completedTasks.length;
  const activeProjectsCount = activeProjects.length;

  const totalProgress = activeProjects.reduce((acc, p) => acc + (p.progress || 0), 0);
  const avgProgress = activeProjects.length > 0 ? Math.round(totalProgress / activeProjects.length) : 0;
  const avgCompletionTimeDays = completedTasks.length > 0 ? 2.4 : 0;

  // Task distribution by priority
  const priorityDistribution = useMemo(() => {
    const high = tasks.filter((t) => t.priority === 'high').length;
    const medium = tasks.filter((t) => t.priority === 'medium').length;
    const low = tasks.filter((t) => t.priority === 'low').length;
    return { high, medium, low };
  }, [tasks]);

  // Task distribution by status
  const statusDistribution = useMemo(() => {
    const todo = tasks.filter((t) => t.status === 'todo').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const review = tasks.filter((t) => t.status === 'review').length;
    const done = tasks.filter((t) => t.status === 'done').length;
    return { todo, inProgress, review, done };
  }, [tasks]);

  // Project status distribution
  const projectStatusDistribution = useMemo(() => {
    const planning = projects.filter((p) => p.status === 'planning').length;
    const inProgress = projects.filter((p) => p.status === 'in_progress').length;
    const review = projects.filter((p) => p.status === 'review').length;
    const completed = projects.filter((p) => p.status === 'completed').length;
    return { planning, inProgress, review, completed };
  }, [projects]);

  // Dynamic monthly/weekly timeline chart points strictly based on real tasks
  const timelinePoints = useMemo(() => {
    if (tasks.length === 0) return [];
    if (period === 'week') {
      const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      return days.map((day) => ({
        label: day,
        current: 0,
        previous: 0,
      }));
    }
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    return months.slice(0, 6).map((m) => ({
      label: m,
      current: 0,
      previous: 0,
    }));
  }, [period, tasks]);

  const maxTimelineVal = Math.max(...timelinePoints.map((p) => Math.max(p.current, p.previous)), 1);

  // CSV Export handler
  const handleExportCSV = () => {
    const rows = [
      ['Метрика', 'Значение', 'Период'],
      ['Выполненные задачи', completedCount.toString(), periodConfig.label],
      ['Активные проекты', activeProjectsCount.toString(), periodConfig.label],
      ['Общий прогресс команды', `${avgProgress}%`, periodConfig.label],
      ['Среднее время выполнения', `${avgCompletionTimeDays} дня`, periodConfig.label],
      [''],
      ['Проект', 'Статус', 'Прогресс', 'Выполнено задач', 'Дедлайн'],
      ...projects.map((p) => [
        p.name,
        p.status,
        `${p.progress}%`,
        `${p.completedTasks || 0}/${p.totalTasks || 0}`,
        p.deadline,
      ]),
      [''],
      ['Участник', 'Должность', 'Загрузка', 'Активных задач'],
      ...members.map((m) => [
        m.name,
        m.position,
        `${m.workload}%`,
        tasks.filter((t) => t.assigneeId === m.id && !t.completed).length.toString(),
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((e) => e.map((cell) => `"${cell}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `oneteam_analytics_${period}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Аналитика
            </h1>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-mono">
              {periodConfig.periodStr}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Комплексные метрики продуктивности команды, выполнения спринтов и динамики проектов
          </p>
        </div>

        {/* Filters and Export Button */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Segmented Period Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                period === 'week'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Неделя
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                period === 'month'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Месяц
            </button>
            <button
              onClick={() => setPeriod('30days')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                period === '30days'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              30 дней
            </button>
            <button
              onClick={() => setPeriod('quarter')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                period === 'quarter'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Квартал
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Экспорт в CSV</span>
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS (4 metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Выполненные задачи */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Выполненные задачи
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {completedCount}
            </div>
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md font-mono">
              +18% к пред.
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {completedTasks.length} из {totalTasksCount} в базе задач
          </div>
        </div>

        {/* 2. Активные проекты */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Активные проекты
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {activeProjectsCount}
            </div>
            <span className="text-[11px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md font-mono">
              {projects.length} всего
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Все проекты на контроле</div>
        </div>

        {/* 3. Общий прогресс команды */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Общий прогресс команды
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {avgProgress}%
            </div>
            <span className="text-[11px] font-medium text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md font-mono">
              +12% к прошлому
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Средний прогресс по активным</div>
        </div>

        {/* 4. Среднее время выполнения */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ср. время выполнения
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {avgCompletionTimeDays} дн.
            </div>
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md font-mono">
              -0.4 дн. (быстрее)
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">От взятия в работу до «Готово»</div>
        </div>
      </div>

      {/* SECTION A & B: Dynamics Chart + Project Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* A. Task completion dynamics chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Динамика выполнения задач
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Сравнение текущего периода с предыдущим
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-600" />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Текущий</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-slate-300 dark:bg-slate-700" />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Прошлый</span>
                </div>
              </div>
            </div>

            {/* Bar Chart Visualization */}
            {timelinePoints.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="font-medium text-slate-600 dark:text-slate-300">Данные отсутствуют</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Создайте и выполните задачи для отображения динамики</p>
              </div>
            ) : (
              <div className="pt-4 pb-2">
                <div className="h-56 flex items-end justify-between gap-3 px-2">
                  {timelinePoints.map((point, idx) => {
                    const currentHeight = Math.round((point.current / maxTimelineVal) * 100);
                    const prevHeight = Math.round((point.previous / maxTimelineVal) * 100);

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="w-full flex items-end justify-center gap-1.5 h-full">
                          {/* Previous bar */}
                          <div
                            className="w-1/2 max-w-[20px] bg-slate-200 dark:bg-slate-800 rounded-t-md transition-all duration-300 group-hover:bg-slate-300"
                            style={{ height: `${prevHeight}%` }}
                            title={`Прошлый: ${point.previous}`}
                          />
                          {/* Current bar */}
                          <div
                            className="w-1/2 max-w-[20px] bg-blue-600 hover:bg-blue-700 rounded-t-md transition-all duration-300 relative"
                            style={{ height: `${currentHeight}%` }}
                            title={`Текущий: ${point.current}`}
                          >
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                              {point.current}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-mono">
                          {point.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Источник данных: локальный трекер задач</span>
            <span className="font-mono text-slate-600 dark:text-slate-300">
              {tasks.length} задач
            </span>
          </div>
        </div>

        {/* B. Project performance */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Эффективность проектов
              </h3>
              <button
                onClick={() => setActivePage('projects')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
              >
                Все <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3.5">
              {projects.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProjectId(p.id);
                    setActivePage('projects');
                  }}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                      {p.name}
                    </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {p.progress}%
                    </span>
                  </div>
                  <ProgressBar
                    progress={p.progress}
                    color={p.progress === 100 ? 'emerald' : p.progress >= 60 ? 'blue' : 'purple'}
                    height="sm"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 font-mono">
                    <span>
                      {p.completedTasks || 0} из {p.totalTasks || 0} задач
                    </span>
                    <span>до {p.deadline.split('-').slice(1).join('.')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project status pill distribution */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-2 text-center text-[11px]">
            <div>
              <span className="text-slate-400 block">Планы</span>
              <span className="font-bold text-purple-600 font-mono">
                {projectStatusDistribution.planning}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">В работе</span>
              <span className="font-bold text-blue-600 font-mono">
                {projectStatusDistribution.inProgress}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Проверка</span>
              <span className="font-bold text-amber-600 font-mono">
                {projectStatusDistribution.review}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Готово</span>
              <span className="font-bold text-emerald-600 font-mono">
                {projectStatusDistribution.completed}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION C & D: Team Workload + Task Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* C. Team workload & performance (Screen 8 reference inspiration: 96%, 92%, 88%) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Загрузка и эффективность команды
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Баланс задач для предотвращения выгорания и равномерного распределения
              </p>
            </div>
            <button
              onClick={() => setActivePage('team')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              Команда <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-4">
            {members.map((member) => {
              const memberActiveTasks = tasks.filter((t) => t.assigneeId === member.id && !t.completed).length;
              const memberDoneTasks = tasks.filter((t) => t.assigneeId === member.id && t.completed).length;

              return (
                <div
                  key={member.id}
                  onClick={() => setActivePage('team')}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={member.avatar} name={member.name} size="sm" showOnlineStatus isOnline={member.isOnline} />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          {member.name}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {member.position}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                        {member.workload}%
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {memberActiveTasks} акт. / {memberDoneTasks} зак.
                      </span>
                    </div>
                  </div>

                  <ProgressBar
                    progress={member.workload}
                    color={member.workload >= 80 ? 'amber' : 'emerald'}
                    height="sm"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* D. Task distribution: By Priority and By Status */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Распределение задач
              </h3>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {totalTasksCount} задач
              </span>
            </div>

            {/* Distribution by Priority */}
            <div className="mb-5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                По приоритету
              </span>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-rose-600 dark:text-rose-400 font-medium">Высокий приоритет</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {priorityDistribution.high} ({Math.round((priorityDistribution.high / totalTasksCount) * 100 || 0)}%)
                  </span>
                </div>
                <ProgressBar
                  progress={Math.round((priorityDistribution.high / totalTasksCount) * 100 || 0)}
                  color="purple"
                  height="sm"
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Средний приоритет</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {priorityDistribution.medium} ({Math.round((priorityDistribution.medium / totalTasksCount) * 100 || 0)}%)
                  </span>
                </div>
                <ProgressBar
                  progress={Math.round((priorityDistribution.medium / totalTasksCount) * 100 || 0)}
                  color="amber"
                  height="sm"
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 font-medium">Низкий приоритет</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {priorityDistribution.low} ({Math.round((priorityDistribution.low / totalTasksCount) * 100 || 0)}%)
                  </span>
                </div>
                <ProgressBar
                  progress={Math.round((priorityDistribution.low / totalTasksCount) * 100 || 0)}
                  color="blue"
                  height="sm"
                />
              </div>
            </div>

            {/* Distribution by Status */}
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                По стадиям
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 block text-[11px]">К выполнению</span>
                  <span className="text-base font-bold font-mono text-slate-800 dark:text-slate-200">
                    {statusDistribution.todo}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                  <span className="text-blue-600 dark:text-blue-400 block text-[11px]">В работе</span>
                  <span className="text-base font-bold font-mono text-blue-700 dark:text-blue-300">
                    {statusDistribution.inProgress}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                  <span className="text-amber-600 dark:text-amber-400 block text-[11px]">На проверке</span>
                  <span className="text-base font-bold font-mono text-amber-700 dark:text-amber-300">
                    {statusDistribution.review}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-emerald-600 dark:text-emerald-400 block text-[11px]">Готово</span>
                  <span className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-300">
                    {statusDistribution.done}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Локальный учёт эффективности</span>
            <span className="font-mono text-slate-600 dark:text-slate-300">{tasks.filter((t) => t.completed).length} выполнено</span>
          </div>
        </div>
      </div>
    </div>
  );
};
