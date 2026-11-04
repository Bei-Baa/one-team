import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Plus, Trash2, History } from 'lucide-react';

export const MissionModal: React.FC = () => {
  const { missionModalOpen, setMissionModalOpen, mission, saveMission, settings } = useApp();

  const [statement, setStatement] = useState('');
  const [purpose, setPurpose] = useState('');
  const [customerValue, setCustomerValue] = useState('');
  const [principles, setPrinciples] = useState<string[]>([]);
  const [newRevisionNote, setNewRevisionNote] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (mission) {
      setStatement(mission.statement);
      setPurpose(mission.purpose);
      setCustomerValue(mission.customerValue);
      setPrinciples(mission.principles || []);
      setNewRevisionNote('');
      setShowHistory(false);
    }
  }, [mission, missionModalOpen]);

  const handleAddPrinciple = () => {
    setPrinciples([...principles, '']);
  };

  const handleUpdatePrinciple = (idx: number, val: string) => {
    const updated = [...principles];
    updated[idx] = val;
    setPrinciples(updated);
  };

  const handleRemovePrinciple = (idx: number) => {
    setPrinciples(principles.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement.trim()) return;

    const cleanedPrinciples = principles.map((p) => p.trim()).filter(Boolean);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updatedRevisions = [...(mission.revisions || [])];
    if (newRevisionNote.trim()) {
      updatedRevisions.unshift({
        id: `rev-${Date.now()}`,
        field: 'mission',
        content: newRevisionNote.trim(),
        timestamp: now,
        authorName: settings.currentUser.name,
      });
    }

    saveMission({
      ...mission,
      statement: statement.trim(),
      purpose: purpose.trim(),
      customerValue: customerValue.trim(),
      principles: cleanedPrinciples,
      updatedAt: now.substring(0, 10),
      revisions: updatedRevisions,
    });

    setMissionModalOpen(false);
  };

  return (
    <Modal
      isOpen={missionModalOpen}
      onClose={() => setMissionModalOpen(false)}
      title="Редактировать миссию команды"
      subtitle="Сформулируйте предназначение компании и ценности для клиентов"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {/* Toggle History */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            {showHistory ? 'Скрыть историю редакций' : 'История изменений миссии'}
          </button>
        </div>

        {showHistory && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
            <div className="font-semibold text-slate-700 dark:text-slate-300">
              История редакций:
            </div>
            {mission.revisions && mission.revisions.length > 0 ? (
              mission.revisions.map((rev) => (
                <div
                  key={rev.id}
                  className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {rev.authorName}
                    </span>
                    <span>{rev.timestamp}</span>
                  </div>
                  <div>{rev.content}</div>
                </div>
              ))
            ) : (
              <div className="text-slate-400">Предыдущих редакций не зафиксировано.</div>
            )}
          </div>
        )}

        {/* Statement */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Формулировка миссии (Mission statement) *
          </label>
          <textarea
            rows={3}
            required
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="Создавать передовые цифровые продукты и решения..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Главное предназначение (Main Purpose)
          </label>
          <textarea
            rows={2}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Зачем существует команда и какую глобальную задачу решает..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Customer Value */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Ценность для клиентов и пользователей
          </label>
          <textarea
            rows={2}
            value={customerValue}
            onChange={(e) => setCustomerValue(e.target.value)}
            placeholder="Измеримый эффект и выгода, которую получают наши клиенты..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Principles */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Принципы команды (Core Principles)
            </label>
            <button
              type="button"
              onClick={handleAddPrinciple}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Добавить принцип
            </button>
          </div>
          <div className="space-y-2">
            {principles.map((pr, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Принцип ${idx + 1}...`}
                  value={pr}
                  onChange={(e) => handleUpdatePrinciple(idx, e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePrinciple(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Revision Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Комментарий к текущей редакции (необязательно)
          </label>
          <input
            type="text"
            placeholder="Что было скорректировано в этой версии..."
            value={newRevisionNote}
            onChange={(e) => setNewRevisionNote(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setMissionModalOpen(false)}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            Сохранить миссию
          </button>
        </div>
      </form>
    </Modal>
  );
};
