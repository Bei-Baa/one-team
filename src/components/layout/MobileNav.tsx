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

export const MobileNav: React.FC = () => {
  const { activePage, setActivePage } = useApp();

  const navItems: { id: PageId; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Главная', icon: LayoutDashboard },
    { id: 'workspace', label: 'Задачи', icon: KanbanSquare },
    { id: 'projects', label: 'Проекты', icon: FolderGit2 },
    { id: 'strategy', label: 'Стратегия', icon: Target },
    { id: 'team', label: 'Команда', icon: Users },
    { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
    { id: 'finance', label: 'Финансы', icon: Wallet },
    { id: 'clients', label: 'Клиенты', icon: Building2 },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 px-2 py-1 flex items-center justify-start overflow-x-auto gap-1 shadow-lg no-scrollbar">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activePage === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors shrink-0 ${
              isActive
                ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-950/40'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className="whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
