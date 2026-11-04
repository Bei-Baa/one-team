import React from 'react';
import { Mail, CheckCircle2, FolderGit2, ShieldCheck, MoreVertical, Edit } from 'lucide-react';
import { TeamMember, TeamRole } from '../../types';
import { Avatar } from '../common/Avatar';
import { ProgressBar } from '../common/ProgressBar';
import { useApp } from '../../context/AppContext';

interface TeamMemberCardProps {
  member: TeamMember;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member }) => {
  const { setSelectedMemberId, tasks, projects } = useApp();

  const memberTasks = tasks.filter((t) => t.assigneeId === member.id && !t.completed);
  const memberProjects = projects.filter((p) => member.assignedProjectIds.includes(p.id));

  const roleLabels: Record<TeamRole, { label: string; badgeClass: string }> = {
    owner: {
      label: 'Владелец',
      badgeClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/60',
    },
    admin: {
      label: 'Админ',
      badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60',
    },
    manager: {
      label: 'Менеджер',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60',
    },
    member: {
      label: 'Участник',
      badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    },
    viewer: {
      label: 'Наблюдатель',
      badgeClass: 'bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800',
    },
  };

  const roleInfo = roleLabels[member.role] || roleLabels.member;

  // Workload label
  const getWorkloadStatus = (workload: number) => {
    if (workload >= 85) return { text: 'Высокая загрузка', color: 'text-amber-600 dark:text-amber-400', barColor: 'amber' as const };
    if (workload >= 50) return { text: 'Оптимальная', color: 'text-emerald-600 dark:text-emerald-400', barColor: 'emerald' as const };
    return { text: 'Свободен для задач', color: 'text-blue-600 dark:text-blue-400', barColor: 'blue' as const };
  };

  const workloadInfo = getWorkloadStatus(member.workload);

  return (
    <div
      onClick={() => setSelectedMemberId(member.id)}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
    >
      <div>
        {/* Header: Avatar, Name, Role badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3.5">
            <Avatar
              src={member.avatar}
              name={member.name}
              size="lg"
              showOnlineStatus
              isOnline={member.isOnline}
            />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {member.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {member.position}
              </p>
            </div>
          </div>

          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border whitespace-nowrap ${roleInfo.badgeClass}`}
          >
            {roleInfo.label}
          </span>
        </div>

        {/* Email & Department */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{member.email}</span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="truncate">{member.department}</span>
        </div>

        {/* Workload Indicator (Help distribute work fairly, no competitive rankings) */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-slate-500 dark:text-slate-400">Текущая загрузка</span>
            <span className={`font-mono tabular-nums font-bold ${workloadInfo.color}`}>
              {member.workload}% ({workloadInfo.text})
            </span>
          </div>
          <ProgressBar
            progress={member.workload}
            color={workloadInfo.barColor}
            height="sm"
          />
        </div>

        {/* Tasks and Projects counters */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-mono tabular-nums">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
            <span>{memberTasks.length} активных задач</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono tabular-nums justify-end">
            <FolderGit2 className="w-3.5 h-3.5 text-purple-500" />
            <span>{memberProjects.length} проектов</span>
          </div>
        </div>
      </div>

      {/* Online indicator text */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              member.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
            }`}
          />
          {member.isOnline ? 'В сети' : 'Был недавно'}
        </span>
        <span className="text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
          Подробнее →
        </span>
      </div>
    </div>
  );
};
