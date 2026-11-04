import React from 'react';
import { Sparkles, Calendar, Plus, Wallet, Building2, BarChart3, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { KpiCards } from '../components/dashboard/KpiCards';
import { MyTasksWidget } from '../components/dashboard/MyTasksWidget';
import { TeamProgressWidget } from '../components/dashboard/TeamProgressWidget';
import { DashboardBottomWidgets } from '../components/dashboard/DashboardBottomWidgets';

export const DashboardPage: React.FC = () => {
  const { settings, openCreateTask, transactions, clients, setActivePage, currency } = useApp();

  const totalIncome = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((acc, tx) => acc + tx.amount, 0);

  const activeClients = clients.filter((c) => c.status !== 'archived');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Greeting Header from reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Доброе утро, {settings.currentUser.name.split(' ')[0]}!
            </h1>
            <span className="text-2xl" role="img" aria-label="wave">
              👋
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span>Двигаемся к большим целям</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">🚀</span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="font-mono text-xs">Все 9 разделов синхронизированы</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('strategy')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <span>🎯 Стратегия компании</span>
          </button>
          <button
            onClick={() => openCreateTask()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить задачу</span>
          </button>
        </div>
      </div>

      {/* Top KPI row */}
      <KpiCards />

      {/* Cross-Module Quick Insights Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Strategy Quick Peek */}
        <div
          onClick={() => setActivePage('strategy')}
          className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors block">
                Стратегия 2026–2029
              </span>
              <span className="text-[11px] text-slate-400 truncate block">
                Ясный курс · 4 цели
              </span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transform group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
        </div>
        {/* Finance Quick Peek */}
        <div
          onClick={() => setActivePage('finance')}
          className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors block">
                {totalIncome.toLocaleString('ru-RU')} ₸ доход
              </span>
              <span className="text-[11px] text-slate-400 truncate block">
                Финансовый отчёт за октябрь
              </span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transform group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
        </div>

        {/* Clients Quick Peek */}
        <div
          onClick={() => setActivePage('clients')}
          className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors block">
                {activeClients.length} активных клиентов
              </span>
              <span className="text-[11px] text-slate-400 truncate block">
                Воронка продаж и CRM сделки
              </span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transform group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
        </div>

        {/* Analytics Quick Peek */}
        <div
          onClick={() => setActivePage('analytics')}
          className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 transition-colors cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors block">
                94% задач в срок
              </span>
              <span className="text-[11px] text-slate-400 truncate block">
                Сводная аналитика спринтов
              </span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transform group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
        </div>
      </div>

      {/* Middle row: Left MyTasks, Right TeamProgress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 h-full">
          <MyTasksWidget />
        </div>
        <div className="lg:col-span-5 h-full">
          <TeamProgressWidget />
        </div>
      </div>

      {/* Bottom section: Recent team activity, Upcoming deadlines, Recently updated projects */}
      <div>
        <DashboardBottomWidgets />
      </div>
    </div>
  );
};
