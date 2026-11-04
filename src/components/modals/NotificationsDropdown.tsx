import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Bell,
  CheckCheck,
  Clock,
  CheckCircle2,
  FolderGit2,
  Users,
  Wallet,
  Building2,
  Target,
  AlertCircle,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NotificationCategory } from '../../types';

export const NotificationsDropdown: React.FC = () => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    notificationsOpen,
    setNotificationsOpen,
    setActivePage,
    setSelectedTaskId,
    setSelectedProjectId,
    setSelectedClientId,
  } = useApp();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedCategory, setSelectedCategory] = useState<'all' | NotificationCategory>('all');

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

  const filteredNotifications = useMemo(() => {
    if (selectedCategory === 'all') return notifications;
    return notifications.filter((n) => n.type === selectedCategory);
  }, [notifications, selectedCategory]);

  if (!notificationsOpen) return null;

  const getTypeIcon = (type: NotificationCategory) => {
    switch (type) {
      case 'task':
        return <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />;
      case 'project':
        return <FolderGit2 className="w-4 h-4 text-purple-500 shrink-0" />;
      case 'team':
        return <Users className="w-4 h-4 text-indigo-500 shrink-0" />;
      case 'client':
        return <Building2 className="w-4 h-4 text-cyan-500 shrink-0" />;
      case 'finance':
        return <Wallet className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'strategy':
        return <Target className="w-4 h-4 text-rose-500 shrink-0" />;
      default:
        return <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />;
    }
  };

  const handleItemClick = (notif: (typeof notifications)[0]) => {
    markNotificationRead(notif.id);
    if (notif.targetPage) {
      setActivePage(notif.targetPage);
      if (notif.targetPage === 'workspace' && notif.entityId) {
        setSelectedTaskId(notif.entityId);
      } else if (notif.targetPage === 'projects' && notif.entityId) {
        setSelectedProjectId(notif.entityId);
      } else if (notif.targetPage === 'clients' && notif.entityId) {
        setSelectedClientId(notif.entityId);
      }
      setNotificationsOpen(false);
    }
  };

  const categories: { id: 'all' | NotificationCategory; label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'task', label: 'Задачи' },
    { id: 'project', label: 'Проекты' },
    { id: 'team', label: 'Команда' },
    { id: 'client', label: 'Клиенты' },
    { id: 'finance', label: 'Финансы' },
    { id: 'strategy', label: 'Стратегия' },
  ];

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[520px]"
    >
      {/* Header */}
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

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-850/50 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 flex-1">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Пока нет уведомлений.
            </div>
            <div className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
              Здесь будут отображаться оперативные события, дедлайн-напоминания и активность вашей команды.
            </div>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleItemClick(notif)}
              className={`p-3.5 transition-colors cursor-pointer flex gap-3 group relative ${
                notif.read
                  ? 'bg-white dark:bg-slate-900 opacity-80 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  : 'bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/40'
              }`}
            >
              <div className="mt-0.5">{getTypeIcon(notif.type)}</div>
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {notif.title}
                  </span>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {notif.description}
                </p>
                <div className="flex items-center justify-between gap-2 mt-1.5 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{notif.timestamp}</span>
                  </div>
                  {notif.targetPage && (
                    <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 group-hover:underline text-[10px]">
                      <span>Перейти</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Single Delete Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notif.id);
                }}
                className="absolute right-2 top-2 p-1 text-slate-300 hover:text-rose-600 dark:text-slate-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                title="Удалить уведомление"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
