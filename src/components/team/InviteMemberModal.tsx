import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { workspaceService } from '../../services/workspaceService';
import { Modal } from '../common/Modal';
import { TeamRole } from '../../types';
import { Send, CheckCircle2, Copy } from 'lucide-react';

export const InviteMemberModal: React.FC = () => {
  const { inviteModalOpen, setInviteModalOpen, saveMember } = useApp();
  const { currentWorkspace, currentRole } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('Разработка');
  const [role, setRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canInvite = currentRole === 'owner' || currentRole === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);

    try {
      if (currentWorkspace?.id) {
        // Generates token and stores token_hash in PostgreSQL workspace_invitations
        const result = await workspaceService.inviteUser(currentWorkspace.id, email.trim(), role);
        if (result?.token) {
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          setInviteLink(`${origin}/#invite=${result.token}`);
        }
      }

      // Also persist to local/memory team member store
      saveMember({
        name: name.trim(),
        email: email.trim(),
        position: position.trim() || 'Специалист',
        department,
        role: role as TeamRole,
        avatar: '',
        isOnline: false,
        workload: 0,
        assignedProjectIds: [],
      });

      if (!currentWorkspace?.id) {
        // If not in cloud workspace, close immediately
        setName('');
        setEmail('');
        setPosition('');
        setInviteModalOpen(false);
      }
    } catch (err: any) {
      alert(err.message || 'Ошибка отправки приглашения');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (inviteLink && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setPosition('');
    setInviteLink(null);
    setInviteModalOpen(false);
  };

  return (
    <Modal
      isOpen={inviteModalOpen}
      onClose={handleClose}
      title="Пригласить участника"
      subtitle="Новый участник получит доступ к рабочему пространству"
      maxWidth="md"
    >
      {!canInvite ? (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          У вас недостаточно прав для приглашения участников. Только Владелец и Администратор могут отправлять приглашения.
        </div>
      ) : inviteLink ? (
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Приглашение успешно создано! Токен захеширован и сохранён в базе данных.</span>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Ссылка для присоединения
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
              </button>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold rounded-xl"
            >
              Закрыть
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Имя и фамилия *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Алексей Смирнов"
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Корпоративный email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alexey@oneteam.io"
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Должность
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="QA Инженер"
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Отдел
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="Разработка">Разработка</option>
                <option value="Дизайн & Маркетинг">Дизайн & Маркетинг</option>
                <option value="Менеджмент">Менеджмент</option>
                <option value="Продажи">Продажи</option>
                <option value="Руководство">Руководство</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Роль в пространстве
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="editor">Редактор (Editor) — создание и редактирование проектов, задач</option>
              <option value="admin">Администратор (Admin) — управление настройками и командой</option>
              <option value="viewer">Наблюдатель (Viewer) — только чтение</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Создание...' : 'Отправить приглашение'}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
