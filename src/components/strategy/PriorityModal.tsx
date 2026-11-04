import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { PriorityImportance, StrategicPriority } from '../../types';

export const PriorityModal: React.FC = () => {
  const {
    priorityModalOpen,
    closePriorityModal,
    priorityToEdit,
    savePriority,
    members,
    goals,
    settings,
  } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState<PriorityImportance>('high');
  const [ownerId, setOwnerId] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [deadline, setDeadline] = useState('');
  const [relatedGoalId, setRelatedGoalId] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (priorityToEdit) {
      setName(priorityToEdit.name);
      setDescription(priorityToEdit.description);
      setImportance(priorityToEdit.importance);
      setOwnerId(priorityToEdit.ownerId);
      setExpectedResult(priorityToEdit.expectedResult);
      setDeadline(priorityToEdit.deadline);
      setRelatedGoalId(priorityToEdit.relatedGoalId || '');
      setProgress(priorityToEdit.progress ?? 0);
    } else {
      setName('');
      setDescription('');
      setImportance('high');
      setOwnerId(members[0]?.id || settings.currentUser.id);
      setExpectedResult('');
      setDeadline(
        new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );
      setRelatedGoalId(goals[0]?.id || '');
      setProgress(0);
    }
  }, [priorityToEdit, priorityModalOpen, members, goals, settings.currentUser.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    savePriority({
      id: priorityToEdit ? priorityToEdit.id : undefined,
      name: name.trim(),
      description: description.trim(),
      importance,
      ownerId: ownerId || members[0]?.id || 'user-1',
      expectedResult: expectedResult.trim(),
      deadline,
      status: 'active',
      relatedGoalId: relatedGoalId || undefined,
      progress: Math.min(100, Math.max(0, Number(progress))),
      order: priorityToEdit ? priorityToEdit.order : 10,
    });

    closePriorityModal();
  };

  return (
    <Modal
      isOpen={priorityModalOpen}
      onClose={closePriorityModal}
      title={priorityToEdit ? 'Редактировать приоритет' : 'Новый стратегический приоритет'}
      subtitle="Сфокусируйте команду на ключевых точках роста текущего периода"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Название приоритета *
          </label>
          <input
            type="text"
            required
            placeholder="Например, Рост клиентской базы"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Описание приоритета
          </label>
          <textarea
            rows={2}
            placeholder="Что именно необходимо сделать в первую очередь..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Expected Result */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Ожидаемый результат (Deliverable)
          </label>
          <input
            type="text"
            placeholder="Например, +15 новых квалифицированных лидов до конца квартала"
            value={expectedResult}
            onChange={(e) => setExpectedResult(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Importance & Owner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Уровень важности
            </label>
            <select
              value={importance}
              onChange={(e) => setImportance(e.target.value as PriorityImportance)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="critical">Критический (Critical)</option>
              <option value="high">Высокий (High)</option>
              <option value="medium">Средний (Medium)</option>
              <option value="low">Низкий (Low)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ответственный
            </label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.position})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Linked Goal & Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Связанная стратегическая цель
            </label>
            <select
              value={relatedGoalId}
              onChange={(e) => setRelatedGoalId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Без привязки к цели</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Крайний срок (Deadline)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Progress Slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Текущий прогресс
            </label>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {progress}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={closePriorityModal}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            {priorityToEdit ? 'Сохранить изменения' : 'Создать приоритет'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
