import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { GoalStatus } from '../../types';
import { Target, CheckCircle2, Calendar, FolderGit2, User, Plus, Trash2 } from 'lucide-react';

export const GoalModal: React.FC = () => {
  const {
    goalModalOpen,
    closeGoalModal,
    goalToEdit,
    saveGoal,
    members,
    projects,
    settings,
  } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Финансы & Рост');
  const [ownerId, setOwnerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<GoalStatus>('in_progress');
  const [relatedProjectIds, setRelatedProjectIds] = useState<string[]>([]);
  const [successCriteria, setSuccessCriteria] = useState<string[]>(['']);

  useEffect(() => {
    if (goalToEdit) {
      setTitle(goalToEdit.title);
      setDescription(goalToEdit.description);
      setCategory(goalToEdit.category);
      setOwnerId(goalToEdit.ownerId);
      setStartDate(goalToEdit.startDate);
      setTargetDate(goalToEdit.targetDate);
      setProgress(goalToEdit.progress);
      setStatus(goalToEdit.status);
      setRelatedProjectIds(goalToEdit.relatedProjectIds || []);
      setSuccessCriteria(
        goalToEdit.successCriteria && goalToEdit.successCriteria.length > 0
          ? goalToEdit.successCriteria
          : ['']
      );
    } else {
      setTitle('');
      setDescription('');
      setCategory('Финансы & Рост');
      setOwnerId(members[0]?.id || settings.currentUser.id);
      setStartDate(new Date().toISOString().split('T')[0]);
      setTargetDate(
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );
      setProgress(0);
      setStatus('in_progress');
      setRelatedProjectIds([]);
      setSuccessCriteria(['']);
    }
  }, [goalToEdit, goalModalOpen, members, settings.currentUser.id]);

  const handleAddCriterion = () => {
    setSuccessCriteria([...successCriteria, '']);
  };

  const handleUpdateCriterion = (index: number, val: string) => {
    const updated = [...successCriteria];
    updated[index] = val;
    setSuccessCriteria(updated);
  };

  const handleRemoveCriterion = (index: number) => {
    setSuccessCriteria(successCriteria.filter((_, i) => i !== index));
  };

  const toggleProject = (projId: string) => {
    if (relatedProjectIds.includes(projId)) {
      setRelatedProjectIds(relatedProjectIds.filter((id) => id !== projId));
    } else {
      setRelatedProjectIds([...relatedProjectIds, projId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const cleanedCriteria = successCriteria.map((c) => c.trim()).filter(Boolean);

    saveGoal({
      id: goalToEdit ? goalToEdit.id : undefined,
      title: title.trim(),
      description: description.trim(),
      category,
      ownerId: ownerId || members[0]?.id || 'user-1',
      startDate,
      targetDate,
      progress: Math.min(100, Math.max(0, Number(progress))),
      status,
      relatedProjectIds,
      successCriteria: cleanedCriteria,
    });

    closeGoalModal();
  };

  return (
    <Modal
      isOpen={goalModalOpen}
      onClose={closeGoalModal}
      title={goalToEdit ? 'Редактировать стратегическую цель' : 'Новая стратегическая цель'}
      subtitle="Определите фокус развития, метрики успеха и ответственного"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Название цели *
          </label>
          <input
            type="text"
            required
            placeholder="Например, Рост выручки компании на 50% в 2026 году"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Описание и контекст
          </label>
          <textarea
            rows={2}
            placeholder="За счёт чего достигается цель, какие барьеры преодолеваем..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Category & Status & Progress */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Категория
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="Финансы & Рост">Финансы & Рост</option>
              <option value="Продукт & Инновации">Продукт & Инновации</option>
              <option value="Клиенты & Рынок">Клиенты & Рынок</option>
              <option value="Команда & Культура">Команда & Культура</option>
              <option value="Операционная эффективность">Операционная эффективность</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Статус
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as GoalStatus)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="not_started">Не начата</option>
              <option value="in_progress">В процессе</option>
              <option value="paused">На паузе</option>
              <option value="completed">Выполнена</option>
              <option value="cancelled">Отменена</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Прогресс
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

        {/* Owner & Dates */}
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
                  {m.name} ({m.position})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Дата старта
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Целевой дедлайн
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Success Criteria List */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              Критерии успеха (Key Results)
            </label>
            <button
              type="button"
              onClick={handleAddCriterion}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Добавить критерий
            </button>
          </div>
          <div className="space-y-2">
            {successCriteria.map((criterion, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Критерий ${idx + 1}...`}
                  value={criterion}
                  onChange={(e) => handleUpdateCriterion(idx, e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                {successCriteria.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCriterion(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Associated Projects */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FolderGit2 className="w-3.5 h-3.5 text-purple-500" />
            Связанные проекты
          </label>
          <div className="flex flex-wrap gap-2">
            {projects.map((proj) => {
              const isSelected = relatedProjectIds.includes(proj.id);
              return (
                <button
                  type="button"
                  key={proj.id}
                  onClick={() => toggleProject(proj.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {proj.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={closeGoalModal}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            {goalToEdit ? 'Сохранить изменения' : 'Создать цель'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
