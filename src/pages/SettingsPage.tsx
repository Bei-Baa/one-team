import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Palette,
  Users,
  Bell,
  RefreshCw,
  User,
  Check,
  Sun,
  Moon,
  Laptop,
  Save,
  Shield,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ThemeMode, TeamRole } from '../types';
import { Avatar } from '../components/common/Avatar';
import { storageService } from '../services/storage';

type SettingsTab = 'general' | 'appearance' | 'team' | 'notifications' | 'sync' | 'profile';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, setTheme, members, refreshData } = useApp();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [workspaceName, setWorkspaceName] = useState(settings.workspaceName);
  const [workspaceDesc, setWorkspaceDesc] = useState(settings.workspaceDescription);
  const [workspaceAvatar, setWorkspaceAvatar] = useState(settings.workspaceAvatar);

  // Profile states
  const [userName, setUserName] = useState(settings.currentUser.name);
  const [userEmail, setUserEmail] = useState(settings.currentUser.email);
  const [userPosition, setUserPosition] = useState(settings.currentUser.position);

  // Notifications states
  const [notifications, setNotifications] = useState(settings.notifications);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState('Только что');

  const triggerSaveNotice = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      workspaceName,
      workspaceDescription: workspaceDesc,
      workspaceAvatar,
    });
    triggerSaveNotice();
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      currentUser: {
        ...settings.currentUser,
        name: userName,
        email: userEmail,
        position: userPosition,
      },
    });
    triggerSaveNotice();
  };

  const handleSaveNotifications = () => {
    updateSettings({ notifications });
    triggerSaveNotice();
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setSyncStatus('syncing');
    setTimeout(() => {
      setIsSyncing(false);
      setSyncStatus('synced');
      const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(`Сегодня в ${timeStr}`);
      triggerSaveNotice();
    }, 900);
  };

  const handleResetData = () => {
    if (window.confirm('Сбросить все данные к исходному демо-состоянию?')) {
      storageService.resetDemoData();
      refreshData();
      triggerSaveNotice();
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'Общие', icon: SettingsIcon },
    { id: 'appearance', label: 'Оформление', icon: Palette },
    { id: 'team', label: 'Команда и роли', icon: Users },
    { id: 'notifications', label: 'Уведомления', icon: Bell },
    { id: 'sync', label: 'Синхронизация', icon: RefreshCw },
    { id: 'profile', label: 'Профиль', icon: User },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Настройки
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Конфигурация рабочего пространства, темы оформления и параметров синхронизации
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Настройки успешно сохранены</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Settings Navigation Menu */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 shadow-xs space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Settings Content Area */}
        <div className="lg:col-span-9 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
          {/* 1. GENERAL TAB */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneral} className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Общие настройки пространства
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Название, описание и символ вашей организации
                </p>
              </div>

              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Символ / Эмодзи пространства
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    value={workspaceAvatar}
                    onChange={(e) => setWorkspaceAvatar(e.target.value)}
                    className="w-20 text-center text-lg py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Название компании или команды
                  </label>
                  <input
                    type="text"
                    required
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Описание деятельности
                  </label>
                  <textarea
                    rows={3}
                    value={workspaceDesc}
                    onChange={(e) => setWorkspaceDesc(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Сохранить изменения</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* 2. APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Оформление интерфейса
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Выберите предпочтительный визуальный режим. Боковая панель всегда остаётся глубокого тёмно-синего цвета.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
                {/* Light */}
                <div
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center ${
                    settings.theme === 'light'
                      ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                    <Sun className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Светлая тема
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Светлый фон, высокая контрастность для дневной работы
                  </span>
                  {settings.theme === 'light' && (
                    <span className="mt-3 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                      Активна
                    </span>
                  )}
                </div>

                {/* Dark */}
                <div
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center ${
                    settings.theme === 'dark'
                      ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-800 text-blue-400 flex items-center justify-center mb-3">
                    <Moon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Тёмная тема
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Тёмный фон поверхностей, комфорт для глаз при слабом освещении
                  </span>
                  {settings.theme === 'dark' && (
                    <span className="mt-3 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                      Активна
                    </span>
                  )}
                </div>

                {/* System */}
                <div
                  onClick={() => setTheme('system')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center ${
                    settings.theme === 'system'
                      ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mb-3">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Адаптивная
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Автоматически подстраивается под настройки вашей ОС
                  </span>
                  {settings.theme === 'system' && (
                    <span className="mt-3 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                      Активна
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. TEAM TAB */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Управление ролями и правами доступа
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Матрица разрешений для участников команды ONE TEAM
                </p>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                      <th className="p-3">Роль</th>
                      <th className="p-3">Создание задач</th>
                      <th className="p-3">Управление проектами</th>
                      <th className="p-3">Приглашение коллег</th>
                      <th className="p-3">Настройки системы</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="p-3 font-semibold text-purple-700 dark:text-purple-400">Владелец (Owner)</td>
                      <td className="p-3 text-emerald-600 font-bold">✓ Полный</td>
                      <td className="p-3 text-emerald-600 font-bold">✓ Полный</td>
                      <td className="p-3 text-emerald-600 font-bold">✓ Полный</td>
                      <td className="p-3 text-emerald-600 font-bold">✓ Полный</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-blue-700 dark:text-blue-400">Администратор (Admin)</td>
                      <td className="p-3 text-emerald-600 font-bold">✓ Полный</td>
                      <td className="p-3 text-emerald-600 font-bold">✓ Полный</td>
                      <td className="p-3 text-emerald-600 font-bold">✓ Полный</td>
                      <td className="p-3 text-emerald-600 font-bold">✓ Полный</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-emerald-700 dark:text-emerald-400">Менеджер (Manager)</td>
                      <td className="p-3 text-emerald-600 font-bold">✓ Полный</td>
                      <td className="p-3 text-emerald-600 font-bold">✓ Полный</td>
                      <td className="p-3 text-slate-400">Только запрос</td>
                      <td className="p-3 text-slate-400">—</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">Участник (Member)</td>
                      <td className="p-3 text-emerald-600 font-bold">✓ Свои задачи</td>
                      <td className="p-3 text-slate-400">Просмотр</td>
                      <td className="p-3 text-slate-400">—</td>
                      <td className="p-3 text-slate-400">—</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-500">Наблюдатель (Viewer)</td>
                      <td className="p-3 text-slate-400">Только чтение</td>
                      <td className="p-3 text-slate-400">Только чтение</td>
                      <td className="p-3 text-slate-400">—</td>
                      <td className="p-3 text-slate-400">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-2 text-xs text-slate-500">
                Всего участников в организации: <span className="font-bold">{members.length}</span>. Назначение ролей осуществляется на странице «Команда».
              </div>
            </div>
          )}

          {/* 4. NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Настройки оповещений
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Управляйте событиями, о которых вы хотите получать уведомления в приложении
                </p>
              </div>

              <div className="space-y-4 max-w-xl">
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                      Назначение новой задачи
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Уведомлять меня, когда мне назначают задачу
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.taskAssigned}
                    onChange={(e) =>
                      setNotifications({ ...notifications, taskAssigned: e.target.checked })
                    }
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                      Выполнение задачи
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Уведомлять при завершении задач в моих проектах
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.taskCompleted}
                    onChange={(e) =>
                      setNotifications({ ...notifications, taskCompleted: e.target.checked })
                    }
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                      Контрольные точки проектов (Milestones)
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Оповещения о смене статуса или приближении дедлайна проекта
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.projectMilestone}
                    onChange={(e) =>
                      setNotifications({ ...notifications, projectMilestone: e.target.checked })
                    }
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                      Ежедневный дайджест
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Утренний обзор приоритетов и дедлайнов команды
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.dailyDigest}
                    onChange={(e) =>
                      setNotifications({ ...notifications, dailyDigest: e.target.checked })
                    }
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveNotifications}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Сохранить параметры уведомлений</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. SYNC TAB */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Синхронизация и хранилище данных
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Архитектура Local-First с поддержкой работы офлайн и мгновенной синхронизацией
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4 max-w-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                      Статус подключения
                    </span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Подключено к локальному хранилищу
                    </span>
                  </div>

                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Синхронизация...' : 'Синхронизировать сейчас'}</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Последняя синхронизация:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {lastSyncTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Несохранённых изменений:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      0 объектов
                    </span>
                  </div>
                </div>
              </div>

              {/* Reset to initial demo */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Сброс демонстрационных данных
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Сбросить состояние всех задач, проектов и карточек к первоначальному демо-набору.
                </p>
                <button
                  type="button"
                  onClick={handleResetData}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Сбросить демо-данные</span>
                </button>
              </div>
            </div>
          )}

          {/* 6. PROFILE TAB */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Личный профиль
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Информация об учётной записи текущего пользователя
                </p>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 max-w-xl">
                <Avatar
                  src={settings.currentUser.avatar}
                  name={userName}
                  size="xl"
                  showOnlineStatus
                  isOnline={true}
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {userName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {userPosition} · Владелец
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Полное имя
                  </label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Email адрес
                  </label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Должность
                  </label>
                  <input
                    type="text"
                    required
                    value={userPosition}
                    onChange={(e) => setUserPosition(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Обновить профиль</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
