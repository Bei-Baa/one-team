import React from 'react';
import { ArrowUpRight, FolderGit2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProgressRing } from '../common/ProgressRing';
import { ProgressBar } from '../common/ProgressBar';

export const TeamProgressWidget: React.FC = () => {
  const { projects, setActivePage, setSelectedProjectId } = useApp();

  const activeProjects = projects.filter((p) => !p.isArchived).slice(0, 4);

  // Compute overall percentage
  const totalProg = activeProjects.reduce((acc, p) => acc + (p.progress || 0), 0);
  const overallPct = activeProjects.length > 0 ? Math.round(totalProg / activeProjects.length) : 76;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Общий прогресс команды
          </h3>
          <button
            onClick={() => setActivePage('projects')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Все проекты</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Ring & Goal Card banner matching reference */}
        <div className="flex items-center gap-6 py-4 px-2">
          <ProgressRing percentage={overallPct} size={105} strokeWidth={9} />

          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Цель месяца
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
              {overallPct}% / 100%
            </div>
            <div className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
              <span>↑ +12% к прошлому месяцу</span>
            </div>
          </div>
        </div>

        {/* Project progress items */}
        <div className="mt-2 space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {activeProjects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => {
                setSelectedProjectId(proj.id);
                setActivePage('projects');
              }}
              className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate max-w-[220px]">
                  <FolderGit2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{proj.name}</span>
                </div>
                <span className="font-mono tabular-nums font-bold text-slate-700 dark:text-slate-300">
                  {proj.progress}%
                </span>
              </div>
              <ProgressBar
                progress={proj.progress}
                color={proj.progress >= 80 ? 'emerald' : proj.progress >= 50 ? 'blue' : 'amber'}
                height="sm"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 text-[11px] text-slate-400 dark:text-slate-500 flex justify-between">
        <span>Данные синхронизированы</span>
        <span className="font-mono">Обновлено сегодня</span>
      </div>
    </div>
  );
};
