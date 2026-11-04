import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { workspaceService, InviteUserResult } from '../../services/workspaceService';
import { Modal } from '../common/Modal';
import { Send, CheckCircle2, AlertCircle, Mail, Info, Loader2 } from 'lucide-react';

interface InviteMemberModalProps {
  onInvitationSent?: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ onInvitationSent }) => {
  const { inviteModalOpen, setInviteModalOpen } = useApp();
  const { currentWorkspace, currentRole } = useAuth();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<InviteUserResult | null>(null);

  const canInvite = currentRole === 'owner' || currentRole === 'admin';

  const validateInputs = () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Укажите email сотрудника');
      return false;
    }
    if (!workspaceService.validateEmail(cleanEmail)) {
      setErrorMessage('Введите корректный адрес электронной почты');
      return false;
    }
    if ((role as string) === 'owner') {
      setErrorMessage('Роль владельца (Owner) нельзя назначить через приглашение');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      if (!currentWorkspace?.id) {
        throw new Error('Рабочее пространство не выбрано');
      }

      const result = await workspaceService.inviteUser(
        currentWorkspace.id,
        email.trim(),
        '', // Имя определяется пользователем при регистрации
        role
      );

      setInviteResult(result);
      onInvitationSent?.();
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка отправки приглашения');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('editor');
    setErrorMessage(null);
    setInviteResult(null);
    setInviteModalOpen(false);
  };

  return (
    <Modal
      isOpen={inviteModalOpen}
      onClose={handleClose}
      title="Пригласить участника"
      subtitle="Приглашение по email с подтверждением в личном кабинете"
      maxWidth="sm"
    >
      {!canInvite ? (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Только Владелец и Администратор могут отправлять приглашения в рабочее пространство.</span>
        </div>
      ) : inviteResult ? (
        <div className="space-y-4 py-1">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block text-xs">Приглашение создано</span>
              <p className="text-emerald-400/90 leading-relaxed text-[11px]">
                Пользователь <strong>{email.trim().toLowerCase()}</strong> сможет принять его в личном кабинете после входа или регистрации.
              </p>
            </div>
          </div>

          {inviteResult.emailDelivery?.error === 'EMAIL_PROVIDER_UNCONFIGURED' ? (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-medium block text-xs">Email-провайдер не настроен</span>
                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                  Приглашение сохранено в базе данных. Пользователь увидит его в центре уведомлений после входа под адресом {email}.
                </p>
              </div>
            </div>
          ) : inviteResult.emailDelivery?.sent ? (
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px]">Письмо с уведомлением отправлено на <strong>{email}</strong>.</span>
            </div>
          ) : null}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSendInvitation} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Email пользователя
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
              />
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
              <option value="editor">Редактор (Editor) — работа с проектами и задачами</option>
              <option value="admin">Администратор (Admin) — управление настройками и командой</option>
              <option value="viewer">Наблюдатель (Viewer) — только чтение</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Отправка...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Отправить приглашение</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
