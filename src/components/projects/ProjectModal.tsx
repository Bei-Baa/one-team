import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { ProjectStatus } from '../../types';

export const ProjectModal: React.FC = () => {
  const {
    projectModalOpen,
    projectToEdit,
    closeProjectModal,
    saveProject,
    members,
  } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Маркетинг');
  const [status, setStatus] = useState<ProjectStatus>('in_progress');
  const [progress, setProgress] = useState(50);
  const [deadline, setDeadline] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name || '');
      setDescription(projectToEdit.description || '');
      setCategory(projectToEdit.category || 'Маркетинг');
      setStatus(projectToEdit.status || 'in_progress');
      setProgress(projectToEdit.progress || 0);
      setDeadline(projectToEdit.deadline || '2026-11-30');
      setSelectedMemberIds(projectToEdit.memberIds || []);
    } else {
      setName('');
      setDescription('');
      setCategory('Разработка');
      setStatus('in_progress');
      setProgress(0);
      setDeadline('2026-11-30');
      setSelectedMemberIds(members.slice(0, 2).map((m) => m.id));
    }
  }, [projectToEdit, projectModalOpen, members]);

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    saveProject({
      ...(projectToEdit?.id ? { id: projectToEdit.id } : {}),
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      status,
      progress: Number(progress),
      deadline: deadline || '2026-11-30',
      memberIds: selectedMemberIds.length > 0 ? selectedMemberIds : [members[0]?.id || 'user-1'],
    });

    closeProjectModal();
  };

  return (
    <Modal
      isOpen={projectModalOpen}
      onClose={closeProjectModal}
      title={projectToEdit?.id ? 'Редактировать проект' : 'Создать новый проект'}
      subtitle="Укажите цели, команду и плановые сроки реализации"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Name */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Название проекта *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Запуск нового личного кабинета"
            className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
          />
        </div>

        {/* Category & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Категория
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              <option value="Маркетинг">Маркетинг</option>
              <option value="Разработка">Разработка</option>
              <option value="Дизайн & Веб">Дизайн & Веб</option>
              <option value="Аналитика">Аналитика</option>
              <option value="Автоматизация">Автоматизация</option>
              <option value="Менеджмент">Менеджмент</option>
              <option value="Искусственный интеллект">Искусственный интеллект</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Статус проекта
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              <option value="planning">Планирование</option>
              <option value="in_progress">В работе</option>
              <option value="review">На проверке</option>
              <option value="completed">Завершено</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Краткое описание
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Опишите ключевые цели, ожидаемый результат и скоуп работ..."
            className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
          />
        </div>

        {/* Progress & Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Прогресс проекта
              </label>
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                {progress}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Дедлайн
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full text-xs sm:text-sm font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Member assignment */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
            Участники команды
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1">
            {members.map((m) => {
              const isSelected = selectedMemberIds.includes(m.id);
              return (
                <div
                  key={m.id}
                  onClick={() => toggleMember(m.id)}
                  className={`p-2 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="accent-blue-600"
                  />
                  <span className="truncate font-medium">{m.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={closeProjectModal}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {projectToEdit?.id ? 'Сохранить изменения' : 'Создать проект'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
