import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { VisionHorizon } from '../../types';
import { Plus, Trash2, History } from 'lucide-react';

export const VisionModal: React.FC = () => {
  const { visionModalOpen, setVisionModalOpen, vision, saveVision, settings } = useApp();

  const [statement, setStatement] = useState('');
  const [desiredState, setDesiredState] = useState('');
  const [direction, setDirection] = useState('');
  const [targetHorizon, setTargetHorizon] = useState<VisionHorizon>('3_years');
  const [expectedOutcomes, setExpectedOutcomes] = useState<string[]>([]);
  const [newRevisionNote, setNewRevisionNote] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (vision) {
      setStatement(vision.statement);
      setDesiredState(vision.desiredState);
      setDirection(vision.direction);
      setTargetHorizon(vision.targetHorizon);
      setExpectedOutcomes(vision.expectedOutcomes || []);
      setNewRevisionNote('');
      setShowHistory(false);
    }
  }, [vision, visionModalOpen]);

  const handleAddOutcome = () => {
    setExpectedOutcomes([...expectedOutcomes, '']);
  };

  const handleUpdateOutcome = (idx: number, val: string) => {
    const updated = [...expectedOutcomes];
    updated[idx] = val;
    setExpectedOutcomes(updated);
  };

  const handleRemoveOutcome = (idx: number) => {
    setExpectedOutcomes(expectedOutcomes.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement.trim()) return;

    const cleanedOutcomes = expectedOutcomes.map((o) => o.trim()).filter(Boolean);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const updatedRevisions = [...(vision.revisions || [])];
    if (newRevisionNote.trim()) {
      updatedRevisions.unshift({
        id: `rev-${Date.now()}`,
        field: 'vision',
        content: newRevisionNote.trim(),
        timestamp: now,
        authorName: settings.currentUser.name,
      });
    }

    saveVision({
      ...vision,
      statement: statement.trim(),
      desiredState: desiredState.trim(),
      direction: direction.trim(),
      targetHorizon,
      expectedOutcomes: cleanedOutcomes,
      updatedAt: now.substring(0, 10),
      revisions: updatedRevisions,
    });

    setVisionModalOpen(false);
  };

  return (
    <Modal
      isOpen={visionModalOpen}
      onClose={() => setVisionModalOpen(false)}
      title="Редактировать стратегическое видение"
      subtitle="Определите целевой горизонт и желаемое состояние команды в будущем"
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
            {showHistory ? 'Скрыть историю редакций' : 'История изменений видения'}
          </button>
        </div>

        {showHistory && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
            <div className="font-semibold text-slate-700 dark:text-slate-300">
              История редакций:
            </div>
            {vision.revisions && vision.revisions.length > 0 ? (
              vision.revisions.map((rev) => (
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

        {/* Target Horizon */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Целевой горизонт планирования
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: '1_year', label: '1 год (Тактический)' },
              { id: '3_years', label: '3 года (Стратегический)' },
              { id: '5_years', label: '5 лет (Долгосрочный)' },
            ].map((h) => (
              <button
                type="button"
                key={h.id}
                onClick={() => setTargetHorizon(h.id as VisionHorizon)}
                className={`py-2 px-3 text-xs rounded-xl border text-center transition-all cursor-pointer ${
                  targetHorizon === h.id
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        {/* Statement */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Формулировка видения (Vision statement) *
          </label>
          <textarea
            rows={3}
            required
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="Стать ведущей экосистемой управления проектами..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Desired State */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Желаемый будущий образ (Desired Future State)
          </label>
          <textarea
            rows={2}
            value={desiredState}
            onChange={(e) => setDesiredState(e.target.value)}
            placeholder="Каких масштабов достигла компания, сколько клиентов нам доверяют..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Direction */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Стратегический вектор развития (Direction)
          </label>
          <textarea
            rows={2}
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            placeholder="На чем именно концентрируем усилия, технологии и инвестиции..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Expected Outcomes */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ключевые ожидаемые результаты (Outcomes)
            </label>
            <button
              type="button"
              onClick={handleAddOutcome}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Добавить результат
            </button>
          </div>
          <div className="space-y-2">
            {expectedOutcomes.map((out, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Ожидаемый результат ${idx + 1}...`}
                  value={out}
                  onChange={(e) => handleUpdateOutcome(idx, e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveOutcome(idx)}
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
            placeholder="Что изменилось в стратегическом видении..."
            value={newRevisionNote}
            onChange={(e) => setNewRevisionNote(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setVisionModalOpen(false)}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            Сохранить видение
          </button>
        </div>
      </form>
    </Modal>
  );
};
