import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Target,
  Compass,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  Edit3,
  Plus,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  Users,
  ChevronRight,
  Filter,
  ListFilter,
  Eye,
  Flag,
  Share2,
  History,
  Check,
  AlertCircle,
  FolderGit2,
} from 'lucide-react';
import { KeyPrioritiesPanel } from '../components/strategy/KeyPrioritiesPanel';
import {
  StrategicGoal,
  GoalStatus,
  StrategicPriority,
  DevelopmentPlanItem,
  VisionHorizon,
  StrategyRevision,
} from '../types';
import { Avatar } from '../components/common/Avatar';

type StrategyTab = 'overview' | 'mission' | 'vision' | 'goals' | 'priorities' | 'plan';

export const StrategyPage: React.FC = () => {
  const {
    mission,
    vision,
    goals,
    priorities,
    developmentPlan,
    projects,
    openCreateGoal,
    openEditGoal,
    deleteGoal,
    openCreatePriority,
    openEditPriority,
    deletePriority,
    openCreatePlanItem,
    openEditPlanItem,
    deletePlanItem,
    setMissionModalOpen,
    setVisionModalOpen,
    saveGoal,
    savePlanItem,
  } = useApp();

  const [activeTab, setActiveTab] = useState<StrategyTab>('overview');
  const [goalStatusFilter, setGoalStatusFilter] = useState<'all' | GoalStatus>('all');
  const [planViewMode, setPlanViewMode] = useState<'timeline' | 'list'>('timeline');

  // Compute stats
  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.status === 'completed').length;
  const inProgressGoals = goals.filter((g) => g.status === 'in_progress').length;
  const avgGoalProgress =
    totalGoals > 0 ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / totalGoals) : 0;

  const getStatusBadge = (status: GoalStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/60">
            Выполнена
          </span>
        );
      case 'in_progress':
        return (
          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800/60">
            В процессе
          </span>
        );
      case 'not_started':
        return (
          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium">
            В планах
          </span>
        );
      case 'paused':
        return (
          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-medium">
            На паузе
          </span>
        );
      case 'cancelled':
        return (
          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-medium">
            Отменена
          </span>
        );
    }
  };

  const getHorizonLabel = (h: VisionHorizon) => {
    switch (h) {
      case '1_year':
        return '1 год (2027)';
      case '3_years':
        return '3 года (2029)';
      case '5_years':
        return '5 лет (2031)';
      default:
        return '3 года';
    }
  };

  const filteredGoals =
    goalStatusFilter === 'all'
      ? goals
      : goals.filter((g) => g.status === goalStatusFilter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header matching Reference UI Screen 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
              ONE TEAM HQ · Стратегический контур
            </span>
            <span className="text-[11px] text-slate-400">· Обновлено {mission.updatedAt}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">
            Стратегия команды
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Ясный курс. Чёткие цели. Единое направление и общие приоритеты.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMissionModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Редактировать стратегию</span>
          </button>
          <button
            onClick={openCreateGoal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Цель</span>
          </button>
        </div>
      </div>

      {/* 2. Strategy Internal Navigation Tabs (Reference Screen 2) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200/80 dark:border-slate-800 no-scrollbar">
        {[
          { id: 'overview', label: 'Обзор стратегии' },
          { id: 'mission', label: 'Миссия' },
          { id: 'vision', label: 'Видение' },
          { id: 'goals', label: `Цели (${goals.length})` },
          { id: 'priorities', label: `Приоритеты (${priorities.length})` },
          { id: 'plan', label: 'План развития' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as StrategyTab)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================
          TAB 1: ОБЗОР (OVERVIEW — Matches Reference UI Screen 2)
         ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 3-Column Layout from Reference Screen 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column (Mission & Vision Cards) - 4 cols */}
            <div className="lg:col-span-4 space-y-4">
              {/* Mission Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Compass className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Миссия команды
                    </span>
                  </div>
                  <button
                    onClick={() => setMissionModalOpen(true)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Редактировать миссию"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium mb-3">
                  «{mission.statement}»
                </p>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Ключевых принципов</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {mission.principles.length} принципа
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Ответственный лидер</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {mission.ownerName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vision Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Видение
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold">
                      {getHorizonLabel(vision.targetHorizon)}
                    </span>
                    <button
                      onClick={() => setVisionModalOpen(true)}
                      className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Редактировать видение"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium mb-3">
                  «{vision.statement}»
                </p>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Ожидаемый результат:
                  </span>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                    {vision.expectedOutcomes[0] || 'Масштабирование на ключевых рынках'}
                  </div>
                </div>
              </div>

              {/* Quick Strategy Health KPI Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-blue-100 uppercase tracking-wider">
                    Общий прогресс стратегии
                  </div>
                  <div className="text-2xl font-extrabold mt-0.5 font-display">
                    {avgGoalProgress}%
                  </div>
                  <div className="text-[11px] text-blue-200 mt-0.5">
                    {completedGoals} из {totalGoals} целей выполнены
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Center Column: «Наши цели» (Goals from Reference Screen 2) - 5 cols */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Наши цели
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Ключевые ориентиры компании на год
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('goals')}
                    className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Все цели <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Goals List Matching Reference UI Screen 2 */}
                <div className="space-y-3.5">
                  {goals.map((goal: StrategicGoal) => (
                    <div
                      key={goal.id}
                      onClick={() => openEditGoal(goal)}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-1 w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {goal.targetDate.substring(0, 4)}
                              </span>
                              <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                {goal.title}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {goal.description}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(goal.status)}
                      </div>

                      {/* Progress bar inside card */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span>{goal.category}</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {goal.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              goal.progress >= 100
                                ? 'bg-emerald-500'
                                : goal.progress > 50
                                ? 'bg-blue-600'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={openCreateGoal}
                className="mt-4 w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:border-blue-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Добавить новую цель
              </button>
            </div>

            {/* Right Column: «Ключевые приоритеты» (From Reference Screen 2) - 3 cols */}
            <div className="lg:col-span-3">
              <KeyPrioritiesPanel />
            </div>
          </div>

          {/* Bottom Section: План развития / Дорожная карта (Roadmap Milestones) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  План развития команды — Ближайшие вехи (Roadmap)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Поэтапная реализация стратегических инициатив по кварталам
                </p>
              </div>
              <button
                onClick={() => setActiveTab('plan')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Смотреть весь план <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Milestone Roadmap Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {developmentPlan.map((item: DevelopmentPlanItem, idx: number) => (
                <div
                  key={item.id}
                  onClick={() => openEditPlanItem(item)}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      {item.timePeriod}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        item.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-600'
                          : item.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {item.status === 'completed'
                        ? 'Готово'
                        : item.status === 'in_progress'
                        ? 'В работе'
                        : 'В планах'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2 mb-1.5">
                    {item.title}
                  </h4>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                    {item.expectedOutcome || item.description}
                  </p>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{item.ownerName}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: МИССИЯ (MISSION DEEP DIVE)
         ======================================================== */}
      {activeTab === 'mission' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Фундамент компании
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  Миссия ONE TEAM
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Зачем мы существуем, кому служим и какую пользу создаём в мире
                </p>
              </div>
              <button
                onClick={() => setMissionModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Редактировать формулировку</span>
              </button>
            </div>

            {/* Big Prominent Mission Statement Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50/80 via-slate-50 to-white dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-800/80 border border-blue-200/70 dark:border-blue-900/40">
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400">
                Формулировка миссии
              </span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-2 leading-relaxed font-display">
                «{mission.statement}»
              </p>
            </div>

            {/* Purpose & Customer Value Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-500" />
                  Главное предназначение
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {mission.purpose}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Ценность для клиентов
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {mission.customerValue}
                </p>
              </div>
            </div>

            {/* Team Principles */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Принципы команды (Code of Conduct)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mission.principles.map((pr, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-start gap-2.5"
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {pr}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Version Revision History */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                История редакций и утверждений
              </h4>
              <div className="space-y-2">
                {mission.revisions?.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {rev.authorName}
                      </span>
                      <span className="text-slate-400 ml-2">({rev.timestamp}):</span>
                      <span className="text-slate-600 dark:text-slate-300 ml-1.5">
                        {rev.content}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: ВИДЕНИЕ (VISION DEEP DIVE)
         ======================================================== */}
      {activeTab === 'vision' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                    Образ будущего
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold">
                    Горизонт: {getHorizonLabel(vision.targetHorizon)}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  Стратегическое видение ONE TEAM
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Кем и где команда стремится стать на горизонте планирования
                </p>
              </div>
              <button
                onClick={() => setVisionModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Редактировать видение</span>
              </button>
            </div>

            {/* Big Prominent Vision Statement Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50/80 via-slate-50 to-white dark:from-purple-950/20 dark:via-slate-900 dark:to-slate-800/80 border border-purple-200/70 dark:border-purple-900/40">
              <span className="text-[10px] font-bold tracking-wider uppercase text-purple-600 dark:text-purple-400">
                Формулировка видения
              </span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-2 leading-relaxed font-display">
                «{vision.statement}»
              </p>
            </div>

            {/* Desired State & Strategic Direction */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Желаемый образ будущего (Desired State)
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {vision.desiredState}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-500" />
                  Вектор развития (Strategic Direction)
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {vision.direction}
                </p>
              </div>
            </div>

            {/* Expected Key Outcomes List */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                Ключевые ожидаемые результаты к окончанию горизонта
              </h3>
              <div className="space-y-2.5">
                {vision.expectedOutcomes.map((outcome, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {outcome}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revision History */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                История редакций видения
              </h4>
              <div className="space-y-2">
                {vision.revisions?.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {rev.authorName}
                      </span>
                      <span className="text-slate-400 ml-2">({rev.timestamp}):</span>
                      <span className="text-slate-600 dark:text-slate-300 ml-1.5">
                        {rev.content}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: ЦЕЛИ (STRATEGIC GOALS DEDICATED VIEW)
         ======================================================== */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Статус:
              </span>
              {[
                { id: 'all', label: 'Все цели' },
                { id: 'in_progress', label: 'В процессе' },
                { id: 'completed', label: 'Выполнены' },
                { id: 'not_started', label: 'В планах' },
                { id: 'paused', label: 'На паузе' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setGoalStatusFilter(filter.id as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    goalStatusFilter === filter.id
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <button
              onClick={openCreateGoal}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Добавить цель
            </button>
          </div>

          {/* Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGoals.map((goal: StrategicGoal) => (
              <div
                key={goal.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-800 transition-all duration-150"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300">
                      {goal.category}
                    </span>
                    {getStatusBadge(goal.status)}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                    {goal.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    {goal.description}
                  </p>

                  {/* Success Criteria List */}
                  {goal.successCriteria && goal.successCriteria.length > 0 && (
                    <div className="mb-4 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Критерии успеха (Key Results):
                      </div>
                      {goal.successCriteria.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Associated Projects */}
                  {goal.relatedProjectIds && goal.relatedProjectIds.length > 0 && (
                    <div className="mb-4 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 mr-1">Проекты:</span>
                      {goal.relatedProjectIds.map((projId) => {
                        const proj = projects.find((p) => p.id === projId);
                        return (
                          <span
                            key={projId}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-medium"
                          >
                            {proj?.name || projId}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Progress bar and Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Прогресс выполнения</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {goal.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      до {goal.targetDate}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {goal.ownerName}
                      </span>
                      <button
                        onClick={() => openEditGoal(goal)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                        title="Редактировать цель"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: ПРИОРИТЕТЫ (STRATEGIC PRIORITIES DEDICATED VIEW)
         ======================================================== */}
      {activeTab === 'priorities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Операционные и стратегические приоритеты
              </h3>
              <p className="text-xs text-slate-400">
                Задачи наивысшего фокуса команды с прямым влиянием на цели
              </p>
            </div>
            <button
              onClick={openCreatePriority}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Новый приоритет
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {priorities.map((priority: StrategicPriority) => (
              <div
                key={priority.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        priority.importance === 'critical'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40'
                          : priority.importance === 'high'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40'
                          : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40'
                      }`}
                    >
                      {priority.importance === 'critical'
                        ? 'Критический'
                        : priority.importance === 'high'
                        ? 'Высокий'
                        : 'Средний'}
                    </span>
                    <button
                      onClick={() => openEditPriority(priority)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                    {priority.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                    {priority.description}
                  </p>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs mb-3 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      Ожидаемый результат:
                    </span>
                    <div className="font-medium text-slate-700 dark:text-slate-200">
                      {priority.expectedResult}
                    </div>
                  </div>

                  {priority.relatedGoalTitle && (
                    <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mb-3 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      <span>Цель: {priority.relatedGoalTitle}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Прогресс</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {priority.progress ?? 70}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${priority.progress ?? 70}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                    <span>{priority.ownerName}</span>
                    <span>до {priority.deadline}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 6: ПЛАН РАЗВИТИЯ (DEVELOPMENT PLAN ROADMAP)
         ======================================================== */}
      {activeTab === 'plan' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Дорожная карта развития (Strategic Roadmap)
              </h3>
              <p className="text-xs text-slate-400">
                Календарно-тематический план достижения целей по кварталам
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setPlanViewMode('timeline')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    planViewMode === 'timeline'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Таймлайн
                </button>
                <button
                  onClick={() => setPlanViewMode('list')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    planViewMode === 'list'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Список
                </button>
              </div>

              <button
                onClick={openCreatePlanItem}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Добавить веху
              </button>
            </div>
          </div>

          {planViewMode === 'timeline' ? (
            /* Timeline View */
            <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:top-3 before:bottom-3 before:left-3 sm:before:left-4 before:w-0.5 before:bg-blue-200 dark:before:bg-blue-900/60">
              {developmentPlan.map((item: DevelopmentPlanItem, idx: number) => (
                <div key={item.id} className="relative group">
                  {/* Timeline point */}
                  <div className="absolute -left-6 sm:-left-8 top-4 w-4 h-4 rounded-full bg-blue-600 border-4 border-white dark:border-slate-900 shadow-sm" />

                  <div
                    onClick={() => openEditPlanItem(item)}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-300 transition-all cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                          {item.timePeriod} · {item.month}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h4>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-md self-start ${
                          item.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-600'
                            : item.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.status === 'completed'
                          ? 'Завершён'
                          : item.status === 'in_progress'
                          ? 'В процессе'
                          : 'В планах'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                      {item.description}
                    </p>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs mb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Ожидаемый артефакт / результат:
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">
                        {item.expectedOutcome}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                      <div className="flex items-center gap-4">
                        <span>Ответственный: <strong>{item.ownerName}</strong></span>
                        {item.relatedGoalTitle && (
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            Цель: {item.relatedGoalTitle}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <span className="text-[11px] text-slate-400">Прогресс:</span>
                        <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {item.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
              {developmentPlan.map((item: DevelopmentPlanItem) => (
                <div
                  key={item.id}
                  onClick={() => openEditPlanItem(item)}
                  className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                        {item.timePeriod}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {item.expectedOutcome || item.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                    <span className="text-xs text-slate-500">{item.ownerName}</span>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 min-w-[36px] text-right">
                      {item.progress}%
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
