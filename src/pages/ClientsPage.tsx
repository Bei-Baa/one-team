import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  UserCheck,
  FolderGit2,
  Mail,
  Phone,
  ArrowRight,
  Edit,
  Trash2,
  Archive,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Client, ClientStatus } from '../types';
import { ClientModal } from '../components/clients/ClientModal';
import { ClientDetailDrawer } from '../components/clients/ClientDetailDrawer';

export const ClientsPage: React.FC = () => {
  const {
    clients,
    openCreateClient,
    openEditClient,
    deleteClient,
    toggleArchiveClient,
    setSelectedClientId,
    setSelectedProjectId,
    setActivePage,
    currency,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | ClientStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Status labels & color classes
  const statusConfigs: Record<ClientStatus, { label: string; badgeClass: string }> = {
    new: { label: 'Новый', badgeClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/60' },
    in_progress: { label: 'В работе', badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60' },
    negotiation: { label: 'Переговоры', badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60' },
    active: { label: 'Активный', badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60' },
    completed: { label: 'Завершённый', badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
    archived: { label: 'Архив', badgeClass: 'bg-slate-100 text-slate-500 border-slate-200' },
  };

  const filterTabs: { id: 'all' | ClientStatus; label: string; count: number }[] = [
    { id: 'all', label: 'Все клиенты', count: clients.filter((c) => c.status !== 'archived').length },
    { id: 'new', label: 'Новые', count: clients.filter((c) => c.status === 'new').length },
    { id: 'in_progress', label: 'В работе', count: clients.filter((c) => c.status === 'in_progress').length },
    { id: 'negotiation', label: 'Переговоры', count: clients.filter((c) => c.status === 'negotiation').length },
    { id: 'active', label: 'Активные', count: clients.filter((c) => c.status === 'active').length },
    { id: 'completed', label: 'Сделки', count: clients.filter((c) => c.status === 'completed').length },
    { id: 'archived', label: 'Архив', count: clients.filter((c) => c.status === 'archived').length },
  ];

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Status filter
      if (statusFilter === 'archived') {
        if (client.status !== 'archived') return false;
      } else {
        if (client.status === 'archived') return false;
        if (statusFilter !== 'all' && client.status !== statusFilter) return false;
      }

      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = client.name.toLowerCase().includes(q);
        const matchesPerson = client.contactPerson.toLowerCase().includes(q);
        const matchesEmail = client.email.toLowerCase().includes(q);
        const matchesPhone = client.phone.toLowerCase().includes(q);
        const matchesDesc = client.description.toLowerCase().includes(q);
        if (!matchesName && !matchesPerson && !matchesEmail && !matchesPhone && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [clients, statusFilter, searchTerm]);

  // Summary counts
  const totalClientsCount = clients.filter((c) => c.status !== 'archived').length;
  const newClientsCount = clients.filter((c) => c.status === 'new').length;
  const activeClientsCount = clients.filter((c) => c.status === 'active' || c.status === 'in_progress').length;
  const completedDealsCount = clients.filter((c) => c.status === 'completed').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Клиенты
            </h1>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              CRM воронка
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            База заказчиков, контактные лица, текущие стадии переговоров и объём сделок
          </p>
        </div>

        <button
          onClick={openCreateClient}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs shadow-blue-600/30 transition-all active:scale-95 cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Новый клиент</span>
        </button>
      </div>

      {/* TOP 4 SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Всего клиентов
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
            {totalClientsCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">В активной базе CRM</div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Новые лиды
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
            {newClientsCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">Требуют первичного контакта</div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Активные клиенты
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
            {activeClientsCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">В процессе выполнения проектов</div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Завершённые сделки
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
            {completedDealsCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">Успешно закрытые контракты</div>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === tab.id
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по клиентам..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
          />
        </div>
      </div>

      {/* CLIENTS LIST TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Компания / Бренд</th>
                <th className="py-3 px-4">Контактное лицо</th>
                <th className="py-3 px-4">Статус</th>
                <th className="py-3 px-4">Связанный проект</th>
                <th className="py-3 px-4 text-right">Сумма сделки</th>
                <th className="py-3 px-4 text-center">Контакт</th>
                <th className="py-3 px-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Клиенты не найдены
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const conf = statusConfigs[client.status] || statusConfigs.new;

                  return (
                    <tr
                      key={client.id}
                      onClick={() => setSelectedClientId(client.id)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Company Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl shrink-0">{client.avatar || '🏢'}</span>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {client.name}
                            </span>
                            {client.email && (
                              <span className="text-[11px] text-slate-400 block font-mono">
                                {client.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact person */}
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {client.contactPerson}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-xs">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${conf.badgeClass}`}
                        >
                          {conf.label}
                        </span>
                      </td>

                      {/* Associated project */}
                      <td className="py-3.5 px-4 text-xs">
                        {client.associatedProjectName ? (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              if (client.associatedProjectId) {
                                setSelectedProjectId(client.associatedProjectId);
                                setActivePage('projects');
                              }
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                          >
                            <FolderGit2 className="w-3.5 h-3.5" />
                            {client.associatedProjectName}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Deal Value */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {client.dealValue > 0
                          ? `${client.dealValue.toLocaleString('ru-RU')} ${client.dealCurrency}`
                          : '—'}
                      </td>

                      {/* Last interaction date */}
                      <td className="py-3.5 px-4 text-center text-xs font-mono text-slate-400 tabular-nums">
                        {client.lastInteraction.split('-').slice(1).join('.')}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditClient(client)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Редактировать"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleArchiveClient(client.id)}
                            className="p-1 text-slate-400 hover:text-amber-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                            title={client.status === 'archived' ? 'Восстановить' : 'В архив'}
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteClient(client.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Удалить"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Detail Drawer & Modal */}
      <ClientDetailDrawer />
      <ClientModal />
    </div>
  );
};
