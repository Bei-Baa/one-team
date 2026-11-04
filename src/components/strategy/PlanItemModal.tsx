import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { DevelopmentPlanItem } from '../../types';

export const PlanItemModal: React.FC = () => {
  const {
    planItemModalOpen,
    closePlanItemModal,
    planItemToEdit,
    savePlanItem,
    members,
    goals,
    settings,
  } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timePeriod, setTimePeriod] = useState('Q4 2026');
  const [quarter, setQuarter] = useState('Q4');
  const [month, setMonth] = useState('Ноябрь');
  const [ownerId, setOwnerId] = useState('');
  const [status, setStatus] = useState<'planned' | 'in_progress' | 'completed'>('in_progress');
  const [progress, setProgress] = useState(0);
  const [relatedGoalId, setRelatedGoalId] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (planItemToEdit) {
      setTitle(planItemToEdit.title);
      setDescription(planItemToEdit.description);
      setTimePeriod(planItemToEdit.timePeriod);
      setQuarter(planItemToEdit.quarter);
      setMonth(planItemToEdit.month || '');
      setOwnerId(planItemToEdit.ownerId);
      setStatus(planItemToEdit.status);
      setProgress(planItemToEdit.progress);
      setRelatedGoalId(planItemToEdit.relatedGoalId || '');
      setExpectedOutcome(planItemToEdit.expectedOutcome);
      setDeadline(planItemToEdit.deadline);
    } else {
      setTitle('');
      setDescription('');
      setTimePeriod('Q4 2026');
      setQuarter('Q4');
      setMonth('Ноябрь');
      setOwnerId(members[0]?.id || settings.currentUser.id);
      setStatus('in_progress');
      setProgress(0);
      setRelatedGoalId(goals[0]?.id || '');
      setExpectedOutcome('');
      setDeadline(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );
    }
  }, [planItemToEdit, planItemModalOpen, members, goals, settings.currentUser.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    savePlanItem({
      id: planItemToEdit ? planItemToEdit.id : undefined,
      title: title.trim(),
      description: description.trim(),
      timePeriod,
      quarter,
      month,
      ownerId: ownerId || members[0]?.id || 'user-1',
      status,
      progress: Math.min(100, Math.max(0, Number(progress))),
      relatedGoalId: relatedGoalId || undefined,
      expectedOutcome: expectedOutcome.trim(),
      deadline,
      order: planItemToEdit ? planItemToEdit.order : 10,
    });

    closePlanItemModal();
  };

  return (
    <Modal
      isOpen={planItemModalOpen}
      onClose={closePlanItemModal}
      title={planItemToEdit ? 'Редактировать этап плана' : 'Новый этап плана развития'}
      subtitle="Зафиксируйте веху на стратегической дорожной карте (Roadmap)"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Название этапа / вехи *
          </label>
          <input
            type="text"
            required
            placeholder="Например, Релиз дизайн-системы и веб-интерфейса ONE TEAM 2.0"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Описание работ
          </label>
          <textarea
            rows={2}
            placeholder="Ключевые активности, состав задач и скоуп..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Expected Outcome */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Ожидаемый результат
          </label>
          <input
            type="text"
            placeholder="Например, Полная готовность платформы к коммерческому масштабированию"
            value={expectedOutcome}
            onChange={(e) => setExpectedOutcome(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Period, Quarter, Month */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Период
            </label>
            <input
              type="text"
              placeholder="Q4 2026"
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Квартал
            </label>
            <select
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="Q1">Q1</option>
              <option value="Q2">Q2</option>
              <option value="Q3">Q3</option>
              <option value="Q4">Q4</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Месяц
            </label>
            <input
              type="text"
              placeholder="Ноябрь"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Owner, Status, Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Статус этапа
            </label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as 'planned' | 'in_progress' | 'completed')
              }
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="planned">В планах</option>
              <option value="in_progress">В процессе</option>
              <option value="completed">Завершён</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Дедлайн
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Linked Goal & Progress */}
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
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Прогресс реализации
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
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={closePlanItemModal}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            {planItemToEdit ? 'Сохранить изменения' : 'Добавить этап'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
