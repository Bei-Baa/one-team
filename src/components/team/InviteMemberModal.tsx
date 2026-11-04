import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { workspaceService, InviteUserResult } from '../../services/workspaceService';
import { Modal } from '../common/Modal';
import { TeamRole } from '../../types';
import { Send, CheckCircle2, AlertCircle, Mail, User, Shield, Info, ArrowRight } from 'lucide-react';

export const InviteMemberModal: React.FC = () => {
  const { inviteModalOpen, setInviteModalOpen, saveMember } = useApp();
  const { currentWorkspace, currentRole } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('Разработка');
  const [role, setRole] = useState<'admin' | 'editor' | 'viewer'>('editor');

  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<InviteUserResult | null>(null);

  const canInvite = currentRole === 'owner' || currentRole === 'admin';

  const validateInputs = () => {
    if (!email.trim()) {
      setErrorMessage('Укажите email сотрудника');
      return false;
    }
    if (!workspaceService.validateEmail(email.trim())) {
      setErrorMessage('Введите корректный адрес электронной почты');
      return false;
    }
    if (!name.trim()) {
      setErrorMessage('Укажите имя и фамилию сотрудника');
      return false;
    }
    if ((role as string) === 'owner') {
      setErrorMessage('Роль владельца (Owner) нельзя назначить через приглашение');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateInputs()) {
      setStep('confirm');
    }
  };

  const handleSendInvitation = async () => {
    if (!validateInputs()) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      let result: InviteUserResult | null = null;
      if (currentWorkspace?.id) {
        result = await workspaceService.inviteUser(
          currentWorkspace.id,
          email.trim(),
          name.trim(),
          role
        );
        setInviteResult(result);
      }

      // Persist to local team member store if needed
      saveMember({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        position: position.trim() || 'Специалист',
        department,
        role: role as TeamRole,
        avatar: '',
        isOnline: false,
        workload: 0,
        assignedProjectIds: [],
      });

      setStep('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка отправки приглашения');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setPosition('');
    setStep('form');
    setErrorMessage(null);
    setInviteResult(null);
    setInviteModalOpen(false);
  };

  const roleDescriptions: Record<string, string> = {
    admin: 'Администратор (Admin) — управление настройками пространства и участниками',
    editor: 'Редактор (Editor) — создание и редактирование проектов, задач и документов',
    viewer: 'Наблюдатель (Viewer) — доступ только на чтение без права изменений',
  };

  return (
    <Modal
      isOpen={inviteModalOpen}
      onClose={handleClose}
      title="Пригласить участника по email"
      subtitle="Приглашение отправляется по email и принимается внутри личного кабинета ONE TEAM"
      maxWidth="md"
    >
      {!canInvite ? (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>У вас недостаточно прав. Только Владелец и Администратор могут отправлять приглашения в рабочее пространство.</span>
        </div>
      ) : step === 'success' ? (
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block text-sm">Приглашение успешно создано!</span>
              <p className="text-emerald-400/90 leading-relaxed">
                Пользователь <strong>{email.trim().toLowerCase()}</strong> сможет принять приглашение сразу после входа или регистрации в ONE TEAM.
              </p>
            </div>
          </div>

          {inviteResult?.emailDelivery?.error === 'EMAIL_PROVIDER_UNCONFIGURED' ? (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-medium block">Email-провайдер ещё не настроен в Supabase</span>
                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                  Приглашение сохранено в базе данных. Как только сотрудник войдёт под адресом <strong>{email}</strong>, он увидит приглашение в разделе уведомлений. Для реальной отправки писем подключите Resend или SMTP согласно инструкции в документации.
                </p>
              </div>
            </div>
          ) : inviteResult?.emailDelivery?.sent ? (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0" />
              <span>Уведомительное письмо успешно отправлено на <strong>{email}</strong>.</span>
            </div>
          ) : null}

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5">
            <div className="text-slate-500 dark:text-slate-400 text-[11px]">Параметры созданного приглашения:</div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-300">Сотрудник:</span>
              <span className="font-medium text-slate-900 dark:text-white">{name} ({email})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-300">Роль:</span>
              <span className="font-medium text-blue-600 dark:text-blue-400 capitalize">{role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-300">Пространство:</span>
              <span className="font-medium text-slate-900 dark:text-white">{currentWorkspace?.name}</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
            >
              Готово
            </button>
          </div>
        </div>
      ) : step === 'confirm' ? (
        <div className="space-y-4 py-1">
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Пожалуйста, проверьте введённые данные перед отправкой приглашения в рабочее пространство <strong>«{currentWorkspace?.name}»</strong>.
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
            <div className="flex justify-between p-3 bg-white dark:bg-slate-900">
              <span className="text-slate-500 dark:text-slate-400">Email получателя:</span>
              <span className="font-semibold text-slate-900 dark:text-white font-mono">{email.trim().toLowerCase()}</span>
            </div>
            <div className="flex justify-between p-3 bg-white dark:bg-slate-900">
              <span className="text-slate-500 dark:text-slate-400">Имя и фамилия:</span>
              <span className="font-medium text-slate-900 dark:text-white">{name.trim()}</span>
            </div>
            <div className="flex justify-between p-3 bg-white dark:bg-slate-900">
              <span className="text-slate-500 dark:text-slate-400">Предлагаемая роль:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase">{role}</span>
            </div>
            {position.trim() && (
              <div className="flex justify-between p-3 bg-white dark:bg-slate-900">
                <span className="text-slate-500 dark:text-slate-400">Должность:</span>
                <span className="font-medium text-slate-900 dark:text-white">{position.trim()}</span>
              </div>
            )}
            <div className="flex justify-between p-3 bg-white dark:bg-slate-900">
              <span className="text-slate-500 dark:text-slate-400">Отдел:</span>
              <span className="font-medium text-slate-900 dark:text-white">{department}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={loading}
              onClick={() => setStep('form')}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Назад
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSendInvitation}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Отправка...' : 'Подтвердить и отправить'}</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleProceedToConfirm} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Email приглашаемого сотрудника *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full text-sm pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Приглашение связывается строго с этим email-адресом.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Имя и фамилия *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Алексей Смирнов"
                className="w-full text-sm pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>
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
                placeholder="Product Designer"
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
              Роль в пространстве *
            </label>
            <div className="relative">
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
            <p className="text-[11px] text-slate-400 mt-1">
              {roleDescriptions[role]}
            </p>
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Продолжить</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
