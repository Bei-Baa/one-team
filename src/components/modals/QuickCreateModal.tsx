import React from 'react';
import { CheckSquare, FolderGit2, Wallet, Building2, Target } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';

export const QuickCreateModal: React.FC = () => {
  const {
    quickCreateOpen,
    setQuickCreateOpen,
    openCreateTask,
    openCreateProject,
    openCreateTransaction,
    openCreateClient,
    openCreateGoal,
  } = useApp();

  const handleSelect = (action: () => void) => {
    setQuickCreateOpen(false);
    action();
  };

  return (
    <Modal
      isOpen={quickCreateOpen}
      onClose={() => setQuickCreateOpen(false)}
      title="Что вы хотите создать?"
      subtitle="Выберите объект для добавления в рабочее пространство ONE TEAM"
      maxWidth="lg"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 py-2">
        {/* 1. Task */}
        <button
          onClick={() => handleSelect(() => openCreateTask())}
          className="flex flex-col items-start p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-left transition-all duration-150 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <CheckSquare className="w-5 h-5" />
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            Новая задача
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Назначьте исполнителя, дедлайн, приоритет и статус
          </span>
        </button>

        {/* 2. Project */}
        <button
          onClick={() => handleSelect(() => openCreateProject())}
          className="flex flex-col items-start p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 bg-white dark:bg-slate-800/50 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-left transition-all duration-150 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            Новый проект
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Объедините задачи, команду и контролируйте стадии
          </span>
        </button>

        {/* 3. Strategic Goal */}
        <button
          onClick={() => handleSelect(() => openCreateGoal())}
          className="flex flex-col items-start p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-left transition-all duration-150 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <Target className="w-5 h-5" />
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            Стратегическая цель
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Задайте ключевую веху развития, метрики и проекты
          </span>
        </button>

        {/* 4. Client */}
        <button
          onClick={() => handleSelect(() => openCreateClient())}
          className="flex flex-col items-start p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 bg-white dark:bg-slate-800/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-left transition-all duration-150 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            Новый клиент
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Внесите компанию в CRM и привяжите сделку
          </span>
        </button>

        {/* 5. Transaction */}
        <button
          onClick={() => handleSelect(() => openCreateTransaction())}
          className="flex flex-col items-start p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-slate-800/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-left transition-all duration-150 group cursor-pointer sm:col-span-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                Финансовая операция
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Зафиксируйте доход или расход с привязкой к проекту и клиенту
              </span>
            </div>
          </div>
        </button>
      </div>
    </Modal>
  );
};
