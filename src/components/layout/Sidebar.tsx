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
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
} from 'lucide-react';
import { PageId } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher';

export const Sidebar: React.FC = () => {
  const {
    activePage,
    setActivePage,
    sidebarCollapsed,
    setSidebarCollapsed,
    settings,
    members,
  } = useApp();
  const { profile, signOut } = useAuth();

  const navItems: { id: PageId; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Главная', icon: LayoutDashboard },
    { id: 'workspace', label: 'Рабочее пространство', icon: KanbanSquare },
    { id: 'projects', label: 'Проекты', icon: FolderGit2 },
    { id: 'strategy', label: 'Стратегия', icon: Target },
    { id: 'team', label: 'Команда', icon: Users },
    { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
    { id: 'finance', label: 'Финансы', icon: Wallet },
    { id: 'clients', label: 'Клиенты', icon: Building2 },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col bg-[#111827] text-slate-300 transition-all duration-300 ease-in-out shrink-0 border-r border-slate-800/80 select-none z-30 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      } hidden md:flex min-h-screen`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/60">
        <div
          onClick={() => setActivePage('dashboard')}
          className="flex items-center gap-3 cursor-pointer overflow-hidden group"
        >
          {/* Geometric Mountain/A Emblem from reference */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-900/30 shrink-0 transform group-hover:scale-105 transition-transform duration-200">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 19 9-14 9 14" />
              <path d="M7.5 13h9" />
            </svg>
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-wider text-white font-display">
                ONE TEAM
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">
                Workspace
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          title={sidebarCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
          aria-label={sidebarCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Main Navigation Items (8 sections) */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4.5 h-4.5 shrink-0 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              {!sidebarCollapsed && (
                <span className="truncate text-xs font-semibold">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Workspace Switcher */}
      <div className="px-3 py-2.5 border-t border-slate-800/60">
        <WorkspaceSwitcher collapsed={sidebarCollapsed} />
      </div>

      {/* Current User Profile Footer */}
      <div className="p-3 border-t border-slate-800/80 flex items-center justify-between">
        <div
          onClick={() => setActivePage('settings')}
          className={`flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-800/60 transition-colors cursor-pointer flex-1 min-w-0 ${
            sidebarCollapsed ? 'justify-center p-1' : ''
          }`}
          title="Профиль и настройки"
        >
          <Avatar
            src={profile?.avatarUrl || settings.currentUser.avatar}
            name={profile?.fullName || settings.currentUser.name}
            size={sidebarCollapsed ? 'sm' : 'md'}
            showOnlineStatus
            isOnline={true}
          />
          {!sidebarCollapsed && (
            <div className="truncate text-left flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">
                {profile?.fullName || settings.currentUser.name}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {profile?.position || settings.currentUser.position}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
