import React from 'react';
import { Search, Bell, Plus, Calendar, Menu } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../common/Avatar';
import { NotificationsDropdown } from '../modals/NotificationsDropdown';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle }) => {
  const {
    globalSearch,
    setGlobalSearch,
    notifications,
    notificationsOpen,
    setNotificationsOpen,
    setQuickCreateOpen,
    members,
    settings,
  } = useApp();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const onlineMembers = members.filter((m) => m.isOnline);

  return (
    <header className="h-14 sm:h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-20 transition-colors pt-safe">
      {/* Left zone: Mobile toggle & Search */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-md">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 touch-target flex items-center justify-center shrink-0 cursor-pointer"
          aria-label="Открыть меню"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full min-w-0">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Поиск..."
            className="w-full pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 text-xs sm:text-sm bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl border border-transparent focus:border-blue-500 dark:focus:border-blue-500 outline-hidden transition-all duration-150"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right zone: Period, Online Team, Notifications, Create Button */}
      <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
        {/* Period badge matching reference "Эта неделя ∨" */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 cursor-pointer hover:bg-slate-200/60 transition-colors">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Ноябрь 2026</span>
        </div>

        {/* Team online avatars stack */}
        <div className="hidden sm:flex items-center -space-x-2 overflow-hidden px-1 py-0.5">
          {onlineMembers.slice(0, 3).map((member) => (
            <div key={member.id} title={`${member.name} (${member.position})`}>
              <Avatar
                src={member.avatar}
                name={member.name}
                size="sm"
                className="ring-2 ring-white dark:ring-slate-900"
              />
            </div>
          ))}
          {onlineMembers.length > 3 && (
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center ring-2 ring-white dark:ring-slate-900 font-mono">
              +{onlineMembers.length - 3}
            </div>
          )}
        </div>

        {/* Notifications Icon with Badge */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Уведомления"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>
          <NotificationsDropdown />
        </div>

        {/* Primary CTA: "+ Создать" */}
        <button
          onClick={() => setQuickCreateOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs shadow-blue-600/30 transition-all duration-150 transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline">Создать</span>
        </button>
      </div>
    </header>
  );
};
