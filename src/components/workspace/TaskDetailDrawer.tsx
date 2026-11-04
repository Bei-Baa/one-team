import React, { useState } from 'react';
import {
  X,
  Check,
  Calendar,
  User,
  FolderGit2,
  AlertCircle,
  MessageSquare,
  History,
  Send,
  Trash2,
  Edit3,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TaskStatus, Priority } from '../../types';
import { Avatar } from '../common/Avatar';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';

export const TaskDetailDrawer: React.FC = () => {
  const {
    tasks,
    selectedTaskId,
    setSelectedTaskId,
    updateTaskStatus,
    toggleTaskCompletion,
    addTaskComment,
    deleteTask,
    saveTask,
    projects,
    members,
    settings,
  } = useApp();

  const [commentText, setCommentText] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionInput, setDescriptionInput] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  const task = tasks.find((t) => t.id === selectedTaskId);

  if (!task) return null;

  const handleClose = () => {
    setSelectedTaskId(null);
    setIsEditingDescription(false);
    setIsEditingTitle(false);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addTaskComment(task.id, commentText.trim());
    setCommentText('');
  };

  const handleSaveDescription = () => {
    saveTask({
      ...task,
      description: descriptionInput,
    });
    setIsEditingDescription(false);
  };

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      saveTask({
        ...task,
        title: titleInput.trim(),
      });
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          {/* Drawer Header */}
          <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleTaskCompletion(task.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  task.completed
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                }`}
              >
                <Check className={`w-3.5 h-3.5 ${task.completed ? 'stroke-[3]' : ''}`} />
                <span>{task.completed ? 'Выполнено' : 'Отметить выполненной'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  deleteTask(task.id);
                  handleClose();
                }}
                className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Удалить задачу"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Закрыть панель"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Task Title */}
            <div>
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className="flex-1 text-lg font-bold text-slate-900 dark:text-white px-3 py-1.5 rounded-lg border border-blue-500 bg-white dark:bg-slate-800 outline-hidden"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                  >
                    Готово
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between group">
                  <h2
                    className={`text-xl font-bold text-slate-900 dark:text-white leading-tight ${
                      task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                    }`}
                  >
                    {task.title}
                  </h2>
                  <button
                    onClick={() => {
                      setTitleInput(task.title);
                      setIsEditingTitle(true);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                    title="Редактировать заголовок"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
              {/* Status */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  Статус
                </label>
                <select
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                  className="w-full text-xs font-medium py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                >
                  <option value="todo">К выполнению</option>
                  <option value="in_progress">В работе</option>
                  <option value="review">На проверке</option>
                  <option value="done">Готово</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  Приоритет
                </label>
                <select
                  value={task.priority}
                  onChange={(e) =>
                    saveTask({
                      ...task,
                      priority: e.target.value as Priority,
                    })
                  }
                  className="w-full text-xs font-medium py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                >
                  <option value="high">Высокий</option>
                  <option value="medium">Средний</option>
                  <option value="low">Низкий</option>
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  Исполнитель
                </label>
                <select
                  value={task.assigneeId}
                  onChange={(e) =>
                    saveTask({
                      ...task,
                      assigneeId: e.target.value,
                    })
                  }
                  className="w-full text-xs font-medium py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deadline */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  Дедлайн
                </label>
                <input
                  type="date"
                  value={task.dueDate}
                  onChange={(e) =>
                    saveTask({
                      ...task,
                      dueDate: e.target.value,
                    })
                  }
                  className="w-full text-xs font-medium font-mono py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                />
              </div>

              {/* Project */}
              <div className="col-span-2">
                <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  Проект
                </label>
                <select
                  value={task.projectId}
                  onChange={(e) =>
                    saveTask({
                      ...task,
                      projectId: e.target.value,
                    })
                  }
                  className="w-full text-xs font-medium py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Описание
                </h4>
                {!isEditingDescription && (
                  <button
                    onClick={() => {
                      setDescriptionInput(task.description || '');
                      setIsEditingDescription(true);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    Редактировать
                  </button>
                )}
              </div>

              {isEditingDescription ? (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden"
                    placeholder="Добавьте детальное описание задачи..."
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditingDescription(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 rounded-lg"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleSaveDescription}
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-semibold"
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800/60 min-h-[60px]">
                  {task.description || 'Описание отсутствует. Нажмите «Редактировать», чтобы добавить.'}
                </div>
              )}
            </div>

            {/* Comments Feed */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Комментарии ({task.comments?.length || 0})
                </h4>
              </div>

              <div className="space-y-3 mb-4">
                {task.comments && task.comments.length > 0 ? (
                  task.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex items-start gap-3"
                    >
                      <Avatar
                        src={comment.authorAvatar}
                        name={comment.authorName}
                        size="xs"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            {comment.authorName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {comment.createdAt}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Комментариев пока нет</p>
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Написать комментарий..."
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Отправить</span>
                </button>
              </form>
            </div>

            {/* Activity History */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-slate-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  История активности
                </h4>
              </div>

              <div className="border-l-2 border-slate-200 dark:border-slate-800 ml-2 space-y-3 pl-3">
                {task.activities && task.activities.length > 0 ? (
                  task.activities.map((act) => (
                    <div key={act.id} className="relative text-xs">
                      <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-900" />
                      <div className="text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">{act.authorName}</span>: {act.action}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {act.timestamp}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400">Создано {task.createdAt}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
