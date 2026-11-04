import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Users, UserPlus, Search, SlidersHorizontal, Activity, Mail, Clock, X, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { TeamMemberCard } from '../components/team/TeamMemberCard';
import { MemberDetailModal } from '../components/team/MemberDetailModal';
import { InviteMemberModal } from '../components/team/InviteMemberModal';
import { workspaceService, WorkspaceInvitation } from '../services/workspaceService';

export const TeamPage: React.FC = () => {
  const { members, setInviteModalOpen, globalSearch } = useApp();
  const { currentWorkspace, currentRole } = useAuth();

  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [localSearch, setLocalSearch] = useState('');

  // Pending workspace invitations (for managers)
  const [pendingInvitations, setPendingInvitations] = useState<WorkspaceInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const canManage = currentRole === 'owner' || currentRole === 'admin';

  const loadPendingInvitations = useCallback(async () => {
    if (!currentWorkspace?.id || !canManage) {
      setPendingInvitations([]);
      return;
    }
    try {
      setLoadingInvitations(true);
      const invs = await workspaceService.getInvitations(currentWorkspace.id);
      setPendingInvitations(invs);
    } catch (err) {
      console.warn('Failed to load pending invitations:', err);
    } finally {
      setLoadingInvitations(false);
    }
  }, [currentWorkspace?.id, canManage]);

  useEffect(() => {
    loadPendingInvitations();
  }, [loadPendingInvitations]);

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      setCancellingId(invitationId);
      await workspaceService.cancelInvitation(invitationId);
      setPendingInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch (err) {
      console.warn('Failed to cancel invitation:', err);
    } finally {
      setCancellingId(null);
    }
  };

  // Summary statistics
  const totalCount = members.length;
  const onlineCount = members.filter((m) => m.isOnline).length;
  const avgWorkload =
    totalCount > 0 ? Math.round(members.reduce((acc, m) => acc + m.workload, 0) / totalCount) : 0;

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Role filter
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;

      // Department filter
      if (departmentFilter !== 'all' && m.department !== departmentFilter) return false;

      // Search term
      const query = (localSearch || globalSearch).toLowerCase().trim();
      if (query) {
        const matchesName = m.name.toLowerCase().includes(query);
        const matchesEmail = m.email.toLowerCase().includes(query);
        const matchesPos = m.position.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesPos) return false;
      }

      return true;
    });
  }, [members, roleFilter, departmentFilter, localSearch, globalSearch]);

  const departments = Array.from(new Set(members.map((m) => m.department)));

  const roleBadgeMap: Record<string, string> = {
    admin: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    editor: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    viewer: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Команда
            </h1>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono tabular-nums">
              {totalCount} участников
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Участники рабочего пространства и управление доступом
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs shadow-blue-600/30 transition-all active:scale-95 cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Пригласить</span>
          </button>
        )}
      </div>

      {/* Summary KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {totalCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Участников в команде</div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {onlineCount} из {totalCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Сейчас на связи</div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {avgWorkload}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Средняя загрузка команды</div>
          </div>
        </div>
      </div>

      {/* Pending Invitations Strip for Managers */}
      {canManage && pendingInvitations.length > 0 && (
        <div className="p-4 bg-slate-50/70 dark:bg-slate-850/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
                Ожидающие приглашения ({pendingInvitations.length})
              </h3>
            </div>
            {loadingInvitations && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-900 dark:text-white truncate">
                      {inv.email}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase ${
                        roleBadgeMap[inv.role] || roleBadgeMap.viewer
                      }`}
                    >
                      {inv.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(inv.createdAt).toLocaleDateString([], {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    <span>·</span>
                    <span className="text-amber-500">Ожидает</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={cancellingId === inv.id}
                  onClick={() => handleCancelInvitation(inv.id)}
                  className="px-2 py-1 text-[11px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  title="Отозвать приглашение"
                >
                  {cancellingId === inv.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    'Отозвать'
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold px-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Фильтр:</span>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex-1 sm:flex-none py-1.5 px-2.5 sm:px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden cursor-pointer text-xs"
          >
            <option value="all">Все роли</option>
            <option value="owner">Владелец</option>
            <option value="admin">Администратор</option>
            <option value="manager">Менеджер</option>
            <option value="member">Участник</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="flex-1 sm:flex-none py-1.5 px-2.5 sm:px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden cursor-pointer text-xs"
          >
            <option value="all">Все отделы</option>
            {departments.map((dep) => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Поиск по имени, должности..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
          />
        </div>
      </div>

      {/* Team Cards Grid */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-xs">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Участники не найдены
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Пригласите коллег для совместной работы в пространстве.
          </p>
          {canManage && (
            <button
              onClick={() => setInviteModalOpen(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Пригласить участника</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {filteredMembers.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </div>
      )}

      {/* Modals */}
      <MemberDetailModal />
      <InviteMemberModal onInvitationSent={loadPendingInvitations} />
    </div>
  );
};
