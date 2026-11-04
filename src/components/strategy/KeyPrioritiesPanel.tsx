import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserPlus,
  TrendingUp,
  Users,
  Cpu,
  Plus,
  Sparkles,
  ArrowUpRight,
  Target,
} from 'lucide-react';
import { PriorityImportance, StrategicPriority } from '../../types';

export const KeyPrioritiesPanel: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { priorities, openCreatePriority, openEditPriority } = useApp();

  const getImportanceBadge = (imp: PriorityImportance) => {
    switch (imp) {
      case 'critical':
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 font-semibold border border-rose-200 dark:border-rose-900/50">
            Критический
          </span>
        );
      case 'high':
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 font-semibold border border-amber-200 dark:border-amber-900/50">
            Высокий
          </span>
        );
      case 'medium':
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-900/50">
            Средний
          </span>
        );
      default:
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-medium">
            Обычный
          </span>
        );
    }
  };

  const getPriorityIcon = (index: number) => {
    switch (index % 4) {
      case 0:
        return <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 1:
        return <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 2:
        return <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 3:
      default:
        return <Cpu className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Ключевые приоритеты
              </h3>
              <p className="text-[11px] text-slate-400">Фокус внимания команды</p>
            </div>
          </div>
          <button
            onClick={openCreatePriority}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Добавить приоритет"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Priority items list matching reference */}
        {priorities.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <Target className="w-6 h-6 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="font-medium text-slate-600 dark:text-slate-300">Приоритеты не заданы</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Определите главный фокус для команды</p>
          </div>
        ) : (
          <div className="space-y-3">
            {priorities.slice(0, 5).map((priority: StrategicPriority, idx: number) => {
              const progress = priority.progress ?? 0;
              return (
                <div
                  key={priority.id}
                  onClick={() => openEditPriority(priority)}
                  className="group p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/80 hover:border-blue-200 dark:hover:border-blue-900/60 transition-all duration-150 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 shadow-2xs border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center shrink-0">
                        {getPriorityIcon(idx)}
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {priority.name}
                      </span>
                    </div>
                    {getImportanceBadge(priority.importance)}
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate max-w-[170px] text-[10px]">
                        {priority.expectedResult || priority.ownerName}
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/80 dark:bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inspiring quote box at the bottom (From reference Screen 2) */}
      <div className="mt-5 p-3.5 rounded-xl bg-gradient-to-br from-blue-50/60 to-slate-50 dark:from-blue-950/20 dark:to-slate-800/30 border border-blue-100 dark:border-blue-900/30 text-center">
        <div className="flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold tracking-wider uppercase">Принцип ONE TEAM</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 italic font-medium leading-relaxed">
          «Стратегия — это план, который превращает мечты в результаты»
        </p>
      </div>
    </div>
  );
};
