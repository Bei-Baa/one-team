import React, { useState, useEffect } from 'react';
import { Mail, Check, X, Building2, Calendar, Shield, Loader2, Sparkles } from 'lucide-react';
import { workspaceService, WorkspaceInvitation } from '../../services/workspaceService';
import { useAuth } from '../../context/AuthContext';

interface InvitationsSectionProps {
  onInvitationHandled?: () => void;
  onSelectWorkspace?: (workspaceId: string) => void;
}

export const InvitationsSection: React.FC<InvitationsSectionProps> = ({
  onInvitationHandled,
  onSelectWorkspace,
}) => {
  const { refreshWorkspaces, switchWorkspace, user } = useAuth();
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; type: 'success' | 'error'; message: string } | null>(null);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const list = await workspaceService.getUserInvitations();
      setInvitations(list);
    } catch (err) {
      console.warn('Failed to load pending invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, [user?.email]);

  const handleAccept = async (invitation: WorkspaceInvitation) => {
    setProcessingId(invitation.id);
    setFeedback(null);
    try {
      const res = await workspaceService.acceptInvitation(invitation.id);
      setFeedback({
        id: invitation.id,
        type: 'success',
        message: `Вы успешно присоединились к «${invitation.workspaceName || 'команде'}»!`,
      });

      // Refresh workspaces in context and switch to the newly accepted workspace
      await refreshWorkspaces();
      if (res.workspaceId) {
        await switchWorkspace(res.workspaceId);
        onSelectWorkspace?.(res.workspaceId);
      }

      // Remove from list after brief moment
      setTimeout(() => {
        setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
        setFeedback(null);
        onInvitationHandled?.();
      }, 1500);
    } catch (err: any) {
      setFeedback({
        id: invitation.id,
        type: 'error',
        message: err.message || 'Ошибка принятия приглашения',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (invitation: WorkspaceInvitation) => {
    setProcessingId(invitation.id);
    setFeedback(null);
    try {
      await workspaceService.declineInvitation(invitation.id);
      setFeedback({
        id: invitation.id,
        type: 'success',
        message: 'Приглашение отклонено.',
      });

      setTimeout(() => {
        setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
        setFeedback(null);
        onInvitationHandled?.();
      }, 1200);
    } catch (err: any) {
      setFeedback({
        id: invitation.id,
        type: 'error',
        message: err.message || 'Ошибка отклонения приглашения',
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        <span>Загрузка приглашений...</span>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="py-8 px-4 text-center">
        <Mail className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Нет ожидающих приглашений
        </div>
        <div className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
          Когда вас пригласят в новое рабочее пространство по email, оно появится здесь.
        </div>
      </div>
    );
  }

  const roleBadgeMap: Record<string, { label: string; color: string }> = {
    admin: { label: 'Admin', color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' },
    editor: { label: 'Editor', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
    viewer: { label: 'Viewer', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
  };

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
      {invitations.map((inv) => {
        const isCurrentProcessing = processingId === inv.id;
        const currentFeedback = feedback?.id === inv.id ? feedback : null;
        const roleInfo = roleBadgeMap[inv.role] || roleBadgeMap.editor;
        const formattedDate = new Date(inv.createdAt).toLocaleDateString([], {
          day: 'numeric',
          month: 'short',
        });

        return (
          <div
            key={inv.id}
            className="p-3.5 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                    {inv.workspaceName}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide ${roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Пригласил: <span className="font-medium text-slate-700 dark:text-slate-300">{inv.inviterName}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>Отправлено {formattedDate}</span>
                </div>
              </div>

              {/* Action buttons */}
              {!currentFeedback && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={isCurrentProcessing}
                    onClick={() => handleAccept(inv)}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    title="Принять приглашение"
                  >
                    {isCurrentProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Принять</span>
                  </button>
                  <button
                    type="button"
                    disabled={isCurrentProcessing}
                    onClick={() => handleDecline(inv)}
                    className="px-2 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 disabled:opacity-50 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    title="Отклонить"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {currentFeedback && (
              <div
                className={`mt-2 p-2 rounded-lg text-[11px] font-medium flex items-center gap-1.5 ${
                  currentFeedback.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                <span>{currentFeedback.message}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
