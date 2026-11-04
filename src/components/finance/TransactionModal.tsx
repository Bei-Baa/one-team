import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import {
  Currency,
  FinancialCategory,
  TransactionStatus,
  TransactionType,
} from '../../types';

export const TransactionModal: React.FC = () => {
  const {
    transactionModalOpen,
    transactionToEdit,
    closeTransactionModal,
    saveTransaction,
    projects,
    clients,
    currency: defaultCurrency,
  } = useApp();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | string>(100000);
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<FinancialCategory>('operations');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<TransactionStatus>('completed');
  const [projectId, setProjectId] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (transactionToEdit) {
      setTitle(transactionToEdit.title || '');
      setAmount(transactionToEdit.amount || 0);
      setCurrency(transactionToEdit.currency || defaultCurrency);
      setType(transactionToEdit.type || 'expense');
      setCategory(transactionToEdit.category || 'operations');
      setDate(transactionToEdit.date || new Date().toISOString().split('T')[0]);
      setStatus(transactionToEdit.status || 'completed');
      setProjectId(transactionToEdit.projectId || '');
      setClientId(transactionToEdit.clientId || '');
      setNotes(transactionToEdit.notes || '');
    } else {
      setTitle('');
      setAmount(100000);
      setCurrency(defaultCurrency);
      setType('expense');
      setCategory('operations');
      setDate(new Date().toISOString().split('T')[0]);
      setStatus('completed');
      setProjectId('');
      setClientId('');
      setNotes('');
    }
  }, [transactionToEdit, transactionModalOpen, defaultCurrency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || Number(amount) <= 0) return;

    saveTransaction({
      ...(transactionToEdit?.id ? { id: transactionToEdit.id } : {}),
      title: title.trim(),
      amount: Number(amount),
      currency,
      type,
      category,
      date,
      status,
      projectId: projectId || undefined,
      clientId: clientId || undefined,
      notes: notes.trim() || undefined,
    });

    closeTransactionModal();
  };

  return (
    <Modal
      isOpen={transactionModalOpen}
      onClose={closeTransactionModal}
      title={transactionToEdit?.id ? 'Редактировать операцию' : 'Новая финансовая операция'}
      subtitle="Укажите сумму, категорию и привязку к проекту или клиенту"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type toggle: Income or Expense */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setType('income');
              setCategory('client_payment');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            + Доход (Поступление)
          </button>
          <button
            type="button"
            onClick={() => {
              setType('expense');
              setCategory('operations');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              type === 'expense'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            − Расход (Списание)
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Название операции *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Оплата хостинга Cloud Run"
            className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
          />
        </div>

        {/* Amount & Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Сумма *
            </label>
            <input
              type="number"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-sm font-mono px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Валюта
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              <option value="KZT">KZT (₸)</option>
              <option value="USD">USD ($)</option>
              <option value="RUB">RUB (₽)</option>
            </select>
          </div>
        </div>

        {/* Category & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Категория
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FinancialCategory)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              {type === 'income' ? (
                <>
                  <option value="client_payment">Оплата от клиента</option>
                  <option value="other">Прочие доходы</option>
                </>
              ) : (
                <>
                  <option value="salaries">ФОТ и зарплаты</option>
                  <option value="software">ПО и подписки</option>
                  <option value="marketing">Маркетинг и реклама</option>
                  <option value="infrastructure">Инфраструктура и серверы</option>
                  <option value="operations">Операционные расходы</option>
                  <option value="other">Прочие расходы</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Дата проводки
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs sm:text-sm font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Cross-Module: Project & Client linkage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Связанный проект (опционально)
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              <option value="">Без проекта</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Клиент (опционально)
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              <option value="">Без клиента</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Статус проведения
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TransactionStatus)}
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
          >
            <option value="completed">Проведено (Completed)</option>
            <option value="pending">В обработке (Pending)</option>
            <option value="planned">Запланировано (Planned)</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Примечание / Назначение платежа
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Номер счёта или договора..."
            className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
          />
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={closeTransactionModal}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {transactionToEdit?.id ? 'Сохранить изменения' : 'Записать операцию'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
