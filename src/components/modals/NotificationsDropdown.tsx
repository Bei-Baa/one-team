import React, { useRef, useEffect } from 'react';
import { Bell, CheckCheck, Clock, CheckCircle2, FolderGit2, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NotificationsDropdown: React.FC = () => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    notificationsOpen,
    setNotificationsOpen,
  } = useApp();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen, setNotificationsOpen]);

  if (!notificationsOpen) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />;
      case 'project':
        return <FolderGit2 className="w-4 h-4 text-purple-500 shrink-0" />;
      default:
        return <AlertCircle className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            Уведомления
          </h4>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-full font-mono tabular-nums">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Прочитать всё
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Нет новых уведомлений
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationRead(notif.id)}
              className={`p-3.5 transition-colors cursor-pointer flex gap-3 ${
                notif.read
                  ? 'bg-white dark:bg-slate-900 opacity-75 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  : 'bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/40'
              }`}
            >
              <div className="mt-0.5">{getTypeIcon(notif.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {notif.title}
                  </span>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  {notif.description}
                </p>
                <div className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>{notif.timestamp}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
