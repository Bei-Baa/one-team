import React from 'react';
import {
  LayoutDashboard,
  KanbanSquare,
  FolderGit2,
  Target,
  Users,
  BarChart3,
  Wallet,
  Building2,
  Settings,
} from 'lucide-react';
import { PageId } from '../../types';
import { useApp } from '../../context/AppContext';

import { Menu } from 'lucide-react';

interface MobileNavProps {
  onOpenMenu?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenMenu }) => {
  const { activePage, setActivePage } = useApp();

  const primaryTabs: { id: PageId; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Главная', icon: LayoutDashboard },
    { id: 'workspace', label: 'Задачи', icon: KanbanSquare },
    { id: 'projects', label: 'Проекты', icon: FolderGit2 },
    { id: 'finance', label: 'Финансы', icon: Wallet },
  ];

  const isMoreActive = !primaryTabs.some((t) => t.id === activePage);

  return (
    <nav className="tablet-hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 z-40 px-3 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-lg select-none">
      {primaryTabs.map((item) => {
        const Icon = item.icon;
        const isActive = activePage === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl text-[11px] font-medium transition-all duration-150 touch-target flex-1 max-w-[76px] cursor-pointer ${
              isActive
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  : ''
              }`}
            >
              <Icon className={`w-4.5 h-4.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            </div>
            <span className="truncate leading-none">{item.label}</span>
          </button>
        );
      })}

      <button
        onClick={onOpenMenu}
        className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl text-[11px] font-medium transition-all duration-150 touch-target flex-1 max-w-[76px] cursor-pointer ${
          isMoreActive
            ? 'text-blue-600 dark:text-blue-400 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
        aria-label="Все разделы и меню"
      >
        <div
          className={`p-1 rounded-lg transition-colors ${
            isMoreActive
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
              : ''
          }`}
        >
          <Menu className={`w-4.5 h-4.5 ${isMoreActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
        </div>
        <span className="truncate leading-none">Ещё</span>
      </button>
    </nav>
  );
};
