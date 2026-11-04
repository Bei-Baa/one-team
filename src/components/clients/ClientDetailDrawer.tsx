import React, { useState } from 'react';
import {
  X,
  Mail,
  Phone,
  Building2,
  FolderGit2,
  CheckSquare,
  MessageSquare,
  Clock,
  Plus,
  Trash2,
  Edit,
  Archive,
  ArrowRight,
  Send,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClientStatus } from '../../types';

export const ClientDetailDrawer: React.FC = () => {
  const {
    clients,
    selectedClientId,
    setSelectedClientId,
    saveClient,
    deleteClient,
    toggleArchiveClient,
    openEditClient,
    addClientNote,
    addClientInteraction,
    projects,
    tasks,
    setSelectedTaskId,
    setSelectedProjectId,
    setActivePage,
  } = useApp();

  const [noteText, setNoteText] = useState('');
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [interactionSummary, setInteractionSummary] = useState('');
  const [interactionType, setInteractionType] = useState<'call' | 'meeting' | 'email' | 'proposal' | 'contract'>('call');

  const client = clients.find((c) => c.id === selectedClientId);

  if (!client) return null;

  const handleClose = () => {
    setSelectedClientId(null);
    setShowInteractionForm(false);
  };

  const associatedProject = projects.find((p) => p.id === client.associatedProjectId);
  const relatedTasks = associatedProject ? tasks.filter((t) => t.projectId === associatedProject.id) : [];

  const statusConfigs: Record<ClientStatus, { label: string; badgeClass: string }> = {
    new: { label: 'Новый', badgeClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200' },
    in_progress: { label: 'В работе', badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200' },
    negotiation: { label: 'Переговоры', badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200' },
    active: { label: 'Активный', badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200' },
    completed: { label: 'Завершённый', badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200' },
    archived: { label: 'В архиве', badgeClass: 'bg-slate-100 text-slate-500 border-slate-200' },
  };

  const handleStatusChange = (newStatus: ClientStatus) => {
    saveClient({
      ...client,
      status: newStatus,
    });
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    addClientNote(client.id, noteText.trim());
    setNoteText('');
  };

  const handleAddInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactionSummary.trim()) return;
    addClientInteraction(client.id, {
      type: interactionType,
      summary: interactionSummary.trim(),
      date: new Date().toISOString().split('T')[0],
      authorName: 'Екатерина Соколова',
    });
    setInteractionSummary('');
    setShowInteractionForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen sm:max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between pt-safe pb-safe">
          {/* Header */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{client.avatar || '🏢'}</span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {client.name}
                </h2>
                <span className="text-xs text-slate-400">Карточка клиента</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  handleClose();
                  openEditClient(client);
                }}
                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Редактировать клиента"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleArchiveClient(client.id)}
                className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={client.status === 'archived' ? 'Восстановить' : 'В архив'}
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  deleteClient(client.id);
                  handleClose();
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Удалить клиента"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-2"
                aria-label="Закрыть панель"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Status & Deal Value Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Статус клиента
                </label>
                <select
                  value={client.status}
                  onChange={(e) => handleStatusChange(e.target.value as ClientStatus)}
                  className="w-full text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="new">Новый лид</option>
                  <option value="in_progress">В работе</option>
                  <option value="negotiation">Переговоры</option>
                  <option value="active">Активный</option>
                  <option value="completed">Завершённый</option>
                  <option value="archived">В архиве</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Сумма контракта
                </label>
                <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 pt-1">
                  {client.dealValue.toLocaleString('ru-RU')} {client.dealCurrency}
                </div>
              </div>
            </div>

            {/* Contacts & Info */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Контактная информация
              </h4>
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Контактное лицо:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {client.contactPerson}
                  </span>
                </div>
                {client.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Email:</span>
                    <a
                      href={`mailto:${client.email}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-mono"
                    >
                      {client.email}
                    </a>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Телефон:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {client.phone}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Последний контакт:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">
                    {client.lastInteraction}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {client.description && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  О клиенте
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {client.description}
                </p>
              </div>
            )}

            {/* Cross-Module: Associated Project */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Связанный проект команды
              </h4>
              {associatedProject ? (
                <div
                  onClick={() => {
                    handleClose();
                    setSelectedProjectId(associatedProject.id);
                    setActivePage('projects');
                  }}
                  className="p-3.5 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50 transition-colors cursor-pointer group flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200 group-hover:text-blue-600 flex items-center gap-1.5">
                      <FolderGit2 className="w-3.5 h-3.5" />
                      {associatedProject.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block font-mono">
                      Прогресс: {associatedProject.progress}% · Дедлайн: {associatedProject.deadline}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-600 transform group-hover:translate-x-1 transition-transform" />
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                  Проект не привязан. Нажмите «Редактировать», чтобы связать с проектом.
                </div>
              )}
            </div>

            {/* Cross-Module: Related Tasks in this Project */}
            {relatedTasks.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Задачи по клиенту ({relatedTasks.length})
                </h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {relatedTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        handleClose();
                        setSelectedTaskId(t.id);
                        setActivePage('workspace');
                      }}
                      className="p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-between text-xs cursor-pointer group"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 truncate max-w-[240px]">
                        {t.title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {t.status === 'done' ? '✓ Готово' : 'В работе'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interaction History */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  История взаимодействий ({client.interactions?.length || 0})
                </h4>
                <button
                  onClick={() => setShowInteractionForm(!showInteractionForm)}
                  className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Записать контакт
                </button>
              </div>

              {/* Form to log call/meeting */}
              {showInteractionForm && (
                <form
                  onSubmit={handleAddInteraction}
                  className="p-3 mb-3 rounded-xl border border-blue-500/50 bg-blue-50/20 dark:bg-blue-950/20 space-y-2 text-xs"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={interactionType}
                      onChange={(e) => setInteractionType(e.target.value as any)}
                      className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    >
                      <option value="call">Телефонный звонок</option>
                      <option value="meeting">Личная встреча</option>
                      <option value="proposal">Отправка КП</option>
                      <option value="contract">Подписание договора</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    required
                    value={interactionSummary}
                    onChange={(e) => setInteractionSummary(e.target.value)}
                    placeholder="Краткие итоги переговоров..."
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowInteractionForm(false)}
                      className="px-2.5 py-1 text-slate-500"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg font-semibold"
                    >
                      Сохранить
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {client.interactions && client.interactions.length > 0 ? (
                  client.interactions.map((inter) => (
                    <div
                      key={inter.id}
                      className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs flex items-start gap-2.5"
                    >
                      <span className="text-blue-600 font-bold mt-0.5">•</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {inter.type === 'call'
                              ? 'Звонок'
                              : inter.type === 'meeting'
                              ? 'Встреча'
                              : inter.type === 'contract'
                              ? 'Договор'
                              : 'Коммерческое предложение'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {inter.date}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">
                          {inter.summary}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">История взаимодействий пуста</p>
                )}
              </div>
            </div>

            {/* Internal Notes Feed */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Внутренние заметки команды
              </h4>

              <div className="space-y-2 mb-3">
                {client.notes && client.notes.length > 0 ? (
                  client.notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {note.authorName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {note.createdAt}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{note.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Заметок пока нет</p>
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Добавить внутреннюю заметку..."
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!noteText.trim()}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Добавить</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
