import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { ClientStatus, Currency } from '../../types';

export const ClientModal: React.FC = () => {
  const {
    clientModalOpen,
    clientToEdit,
    closeClientModal,
    saveClient,
    projects,
    currency: defaultCurrency,
  } = useApp();

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<ClientStatus>('new');
  const [dealValue, setDealValue] = useState<number | string>(1000000);
  const [dealCurrency, setDealCurrency] = useState<Currency>(defaultCurrency);
  const [associatedProjectId, setAssociatedProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('🏢');

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name || '');
      setContactPerson(clientToEdit.contactPerson || '');
      setEmail(clientToEdit.email || '');
      setPhone(clientToEdit.phone || '');
      setStatus(clientToEdit.status || 'new');
      setDealValue(clientToEdit.dealValue || 0);
      setDealCurrency(clientToEdit.dealCurrency || defaultCurrency);
      setAssociatedProjectId(clientToEdit.associatedProjectId || '');
      setDescription(clientToEdit.description || '');
      setAvatar(clientToEdit.avatar || '🏢');
    } else {
      setName('');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setStatus('new');
      setDealValue(1000000);
      setDealCurrency(defaultCurrency);
      setAssociatedProjectId(projects[0]?.id || '');
      setDescription('');
      setAvatar('🏢');
    }
  }, [clientToEdit, clientModalOpen, projects, defaultCurrency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contactPerson.trim()) return;

    saveClient({
      ...(clientToEdit?.id ? { id: clientToEdit.id } : {}),
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      status,
      dealValue: Number(dealValue),
      dealCurrency,
      associatedProjectId: associatedProjectId || undefined,
      description: description.trim(),
      avatar: avatar || '🏢',
      lastInteraction: new Date().toISOString().split('T')[0],
      notes: clientToEdit?.notes || [],
      interactions: clientToEdit?.interactions || [],
    });

    closeClientModal();
  };

  return (
    <Modal
      isOpen={clientModalOpen}
      onClose={closeClientModal}
      title={clientToEdit?.id ? 'Редактировать клиента' : 'Добавить нового клиента'}
      subtitle="Заполните карточку компании, контактное лицо и сумму сделки"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Company name & Emoji Avatar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Иконка
            </label>
            <input
              type="text"
              maxLength={2}
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full text-center text-lg py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Название компании / Бренд *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Kaspi Bank или BI Group"
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>

        {/* Contact person & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Контактное лицо (ФИО) *
            </label>
            <input
              type="text"
              required
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="Алихан Ибрагимов"
              className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Статус в воронке
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ClientStatus)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              <option value="new">Новый лид (New)</option>
              <option value="in_progress">В работе (In progress)</option>
              <option value="negotiation">Переговоры (Negotiation)</option>
              <option value="active">Активный клиент (Active)</option>
              <option value="completed">Сделка завершена (Completed)</option>
              <option value="archived">В архиве (Archived)</option>
            </select>
          </div>
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@company.kz"
              className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Телефон
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 777 000 00 00"
              className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>

        {/* Deal Value & Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Сумма сделки / контракта
            </label>
            <input
              type="number"
              min="0"
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
              className="w-full text-sm font-mono px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Валюта
            </label>
            <select
              value={dealCurrency}
              onChange={(e) => setDealCurrency(e.target.value as Currency)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              <option value="KZT">KZT (₸)</option>
              <option value="USD">USD ($)</option>
              <option value="RUB">RUB (₽)</option>
            </select>
          </div>
        </div>

        {/* Associated Project */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Связанный проект команды
          </label>
          <select
            value={associatedProjectId}
            onChange={(e) => setAssociatedProjectId(e.target.value)}
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
          >
            <option value="">Без привязки к проекту</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.progress}%)
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Краткое описание / Потребности клиента
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Сфера бизнеса, ключевые цели, специфика договора..."
            className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
          />
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={closeClientModal}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {clientToEdit?.id ? 'Сохранить изменения' : 'Создать клиента'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
