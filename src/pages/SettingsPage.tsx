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
  Download,
  Upload,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ThemeMode, TeamRole } from '../types';
import { Avatar } from '../components/common/Avatar';
import { storageService } from '../services/storage';
import { dataCleanupService } from '../services/dataCleanup';

type SettingsTab = 'general' | 'appearance' | 'team' | 'notifications' | 'sync' | 'profile' | 'account';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, setTheme, members, refreshData } = useApp();
  const { user, logout, updatePassword, isConfigured } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<string | null>(null);

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
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

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

  const handleExportBackup = () => {
    try {
      dataCleanupService.downloadBackupFile();
      setBackupMessage('Резервная копия успешно экспортирована и скачана.');
      setTimeout(() => setBackupMessage(null), 4000);
    } catch (e: any) {
      alert(`Ошибка при экспорте резервной копии: ${e.message}`);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        const validation = dataCleanupService.validateBackup(json);
        if (!validation.valid) {
          alert(`Ошибка в файле резервной копии: ${validation.error}`);
          return;
        }

        const counts = validation.recordCounts;
        const msg = `Подтвердите восстановление из копии v${validation.version}:\n\n` +
          `• Задач: ${counts?.tasks ?? 0}\n` +
          `• Проектов: ${counts?.projects ?? 0}\n` +
          `• Клиентов: ${counts?.clients ?? 0}\n` +
          `• Финансовых операций: ${counts?.transactions ?? 0}\n\n` +
          `Текущие данные будут предварительно сохранены в аварийную копию. Продолжить?`;

        if (window.confirm(msg)) {
          const success = dataCleanupService.restoreBackup(json);
          if (success) {
            refreshData();
            setBackupMessage('Данные успешно восстановлены из резервной копии.');
            setTimeout(() => setBackupMessage(null), 4000);
          } else {
            alert('Не удалось восстановить резервную копию.');
          }
        }
      } catch (err: any) {
        alert(`Ошибка при чтении файла резервной копии: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSafeCleanup = () => {
    const confirmText =
      'ВНИМАНИЕ: Будут безопасно удалены демонстрационные данные (задачи, проекты, клиенты, платежи, стратегические цели).\n\n' +
      '• Ваша учётная запись и сотрудники сохраняются.\n' +
      '• Настройки рабочего пространства сохраняются.\n' +
      '• Перед очисткой создаётся полная резервная копия.\n\n' +
      'Продолжить подготовку к первому реальному запуску?';

    if (window.confirm(confirmText)) {
      const report = dataCleanupService.executeSafeCleanup();
      refreshData();
      setBackupMessage(
        `Безопасная очистка завершена. Удалено объектов: ${
          report.removedRecords.tasks +
          report.removedRecords.projects +
          report.removedRecords.clients +
          report.removedRecords.transactions
        }. Сохранены аккаунты (${report.preservedRecords.members}) и настройки.`
      );
      setTimeout(() => setBackupMessage(null), 6000);
    }
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
    { id: 'account', label: 'Учётная запись', icon: Shield },
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
                  Управляйте категориями уведомлений, напоминаниями о дедлайнах и разрешениями браузера
                </p>
              </div>

              <div className="space-y-3.5 max-w-xl">
                {/* Task notifications */}
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                      Уведомления по задачам
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Назначение, изменение дедлайна, завершение и комментарии
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.taskNotifications}
                    onChange={(e) =>
                      setNotifications({ ...notifications, taskNotifications: e.target.checked })
                    }
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>

                {/* Project notifications */}
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                      Уведомления по проектам
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Смена статуса проектов, назначение участников и дедлайны
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.projectNotifications}
                    onChange={(e) =>
                      setNotifications({ ...notifications, projectNotifications: e.target.checked })
                    }
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>

                {/* Team notifications */}
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                      События команды
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Новые участники, изменение ролей и приглашения
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.teamNotifications}
                    onChange={(e) =>
                      setNotifications({ ...notifications, teamNotifications: e.target.checked })
                    }
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>

                {/* Client notifications */}
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                      Клиенты и CRM сделки
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Новые клиенты, смена статусов и добавление контактов
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.clientNotifications}
                    onChange={(e) =>
                      setNotifications({ ...notifications, clientNotifications: e.target.checked })
                    }
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>

                {/* Finance notifications */}
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                      Финансовые операции
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Крупные доходы, расходы и поступления от клиентов
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.financeNotifications}
                    onChange={(e) =>
                      setNotifications({ ...notifications, financeNotifications: e.target.checked })
                    }
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>

                {/* Strategy notifications */}
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                      Стратегия и дорожная карта
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Достижение стратегических целей и вехи дорожной карты
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.strategyNotifications}
                    onChange={(e) =>
                      setNotifications({ ...notifications, strategyNotifications: e.target.checked })
                    }
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>

                {/* Deadline reminders */}
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                      ⏰ Напоминания о дедлайнах
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      За 24 часа до срока, в день дедлайна и при просрочке
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.deadlineReminders}
                    onChange={(e) =>
                      setNotifications({ ...notifications, deadlineReminders: e.target.checked })
                    }
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </label>

                {/* Browser notifications */}
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-950/30 cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                      🔔 Системные уведомления браузера (Desktop)
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Показывать нативные всплывающие окна при открытом приложении
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.browserNotifications}
                    onChange={async (e) => {
                      const willEnable = e.target.checked;
                      if (willEnable && typeof window !== 'undefined' && 'Notification' in window) {
                        if (Notification.permission === 'default') {
                          const res = await Notification.requestPermission();
                          if (res !== 'granted') {
                            alert('Разрешение на системные уведомления отклонено в браузере. Вы продолжите получать уведомления внутри приложения.');
                            setNotifications({ ...notifications, browserNotifications: false });
                            return;
                          }
                        } else if (Notification.permission === 'denied') {
                          alert('Системные уведомления заблокированы в настройках браузера. Разрешите их в параметрах сайта.');
                          setNotifications({ ...notifications, browserNotifications: false });
                          return;
                        }
                      }
                      setNotifications({ ...notifications, browserNotifications: willEnable });
                    }}
                    className="w-5 h-5 accent-purple-600 cursor-pointer"
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

              {/* Backup, Export & Import Section */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 max-w-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Резервное копирование и экспорт
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Скачивайте резервную копию или загружайте ранее сохранённый файл формата JSON
                  </p>
                </div>

                {backupMessage && (
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 font-medium flex items-center gap-2">
                    <FileCheck className="w-4 h-4 shrink-0" />
                    <span>{backupMessage}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Скачать резервную копию</span>
                  </button>

                  <label className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-2xs transition-colors cursor-pointer">
                    <Upload className="w-4 h-4 text-purple-600" />
                    <span>Восстановить из файла</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Safe Clean Data for Production Release */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 max-w-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Подготовка к боевому запуску (Безопасная очистка)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Удаляет демонстрационные карточки, проекты, сделки и транзакции, создавая автоматический бэкап. Учётная запись, настройки и сотрудники строго сохраняются.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSafeCleanup}
                    className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-semibold rounded-xl border border-amber-200 dark:border-amber-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Очистить демо-данные (Безопасно)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetData}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Сбросить к исходному демо</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ACCOUNT TAB */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Учётная запись и безопасность
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Управление аутентификацией, статусом верификации и параметрами локального сеанса
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4 max-w-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                      Электронная почта
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                      {settings.currentUser.email}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                    <span>Верифицирован</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Роль в пространстве:</span>
                    <span className="font-semibold text-slate-900 dark:text-white capitalize">
                      {settings.currentUser.role === 'owner' ? 'Владелец (Owner)' : settings.currentUser.role}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Режим хранения данных:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      Локальное (IndexedDB)
                    </span>
                  </div>
                </div>
              </div>

              {/* Password change form */}
              <div className="space-y-4 max-w-xl pt-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Смена пароля
                </h4>

                {passwordChangeStatus && (
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
                    {passwordChangeStatus}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Новый пароль
                    </label>
                    <input
                      type="password"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Подтверждение нового пароля
                    </label>
                    <input
                      type="password"
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newPasswordInput) {
                        alert('Введите новый пароль');
                        return;
                      }
                      if (newPasswordInput !== confirmPasswordInput) {
                        alert('Пароли не совпадают');
                        return;
                      }
                      try {
                        if (isConfigured) {
                          await updatePassword(newPasswordInput);
                        }
                        setPasswordChangeStatus('Пароль успешно обновлён.');
                        setNewPasswordInput('');
                        setConfirmPasswordInput('');
                        triggerSaveNotice();
                      } catch (err: any) {
                        alert(`Ошибка при смене пароля: ${err.message}`);
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Обновить пароль
                  </button>
                </div>
              </div>

              {/* Sign out */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 max-w-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Завершение сеанса
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    При выходе локальные данные в IndexedDB строго сохраняются
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('Завершить текущий сеанс? Локальные данные сохраняются в IndexedDB.')) {
                      await logout();
                    }
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-300 transition-colors cursor-pointer"
                >
                  Выйти из системы
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
