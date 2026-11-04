import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, FolderGit2, Trash2, Edit3, UserCheck, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Avatar } from '../common/Avatar';
import { ProgressBar } from '../common/ProgressBar';
import { TeamRole } from '../../types';
import { PriorityBadge } from '../common/PriorityBadge';

export const MemberDetailModal: React.FC = () => {
  const {
    selectedMemberId,
    setSelectedMemberId,
    members,
    saveMember,
    deleteMember,
    tasks,
    projects,
    setSelectedTaskId,
    setActivePage,
  } = useApp();

  const member = members.find((m) => m.id === selectedMemberId);

  const [role, setRole] = useState<TeamRole>('member');
  const [workload, setWorkload] = useState(50);
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (member) {
      setRole(member.role);
      setWorkload(member.workload);
      setPosition(member.position);
      setDepartment(member.department);
      setIsEditing(false);
    }
  }, [member]);

  if (!member) return null;

  const handleClose = () => {
    setSelectedMemberId(null);
    setIsEditing(false);
  };

  const memberTasks = tasks.filter((t) => t.assigneeId === member.id);
  const memberProjects = projects.filter((p) => member.assignedProjectIds.includes(p.id));

  const handleSave = () => {
    saveMember({
      ...member,
      role,
      workload: Number(workload),
      position: position.trim() || member.position,
      department: department.trim() || member.department,
    });
    setIsEditing(false);
  };

  return (
    <Modal
      isOpen={Boolean(selectedMemberId)}
      onClose={handleClose}
      title={member.name}
      subtitle={member.position}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Header Profile Info */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <Avatar
            src={member.avatar}
            name={member.name}
            size="xl"
            showOnlineStatus
            isOnline={member.isOnline}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                {member.name}
              </h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {isEditing ? 'Закрыть' : 'Изменить'}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {member.position} · {member.department}
            </p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-mono">
              <Mail className="w-3 h-3" />
              {member.email}
            </p>
          </div>
        </div>

        {/* Edit fields if in editing mode */}
        {isEditing && (
          <div className="p-4 rounded-xl border border-blue-500/50 bg-blue-50/20 dark:bg-blue-950/20 space-y-3">
            <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Редактирование профиля
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Должность
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Отдел
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Роль в системе
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as TeamRole)}
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="owner">Владелец (Owner)</option>
                <option value="admin">Администратор (Admin)</option>
                <option value="manager">Менеджер проектов (Manager)</option>
                <option value="member">Участник команды (Member)</option>
                <option value="viewer">Наблюдатель (Viewer)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                <span>Загрузка (%)</span>
                <span className="font-mono">{workload}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={workload}
                onChange={(e) => setWorkload(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Сохранить данные
              </button>
            </div>
          </div>
        )}

        {/* Workload analysis */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Рабочая нагрузка
            </span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {member.workload}%
            </span>
          </div>
          <ProgressBar
            progress={member.workload}
            color={member.workload >= 80 ? 'amber' : 'emerald'}
            height="md"
          />
          <p className="text-[11px] text-slate-400 mt-1.5">
            Индикатор рассчитывается на основе назначенных задач в текущем спринте и помогает распределять задачи равномерно.
          </p>
        </div>

        {/* Assigned Projects */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Проекты сотрудника ({memberProjects.length})
          </h4>
          <div className="space-y-1.5">
            {memberProjects.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Сотрудник пока не задействован в проектах</p>
            ) : (
              memberProjects.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                    <FolderGit2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>{p.name}</span>
                  </div>
                  <span className="font-mono text-slate-500">{p.progress}%</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assigned Tasks */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Назначенные задачи ({memberTasks.length})
          </h4>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {memberTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Нет назначенных задач</p>
            ) : (
              memberTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    handleClose();
                    setSelectedTaskId(t.id);
                    setActivePage('workspace');
                  }}
                  className="p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-between text-xs cursor-pointer group"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 truncate max-w-[200px]">
                    {t.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={t.priority} size="sm" />
                    <span className="font-mono text-slate-400 text-[11px]">
                      {t.status === 'done' ? '✓ Готово' : 'В процессе'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          {member.role !== 'owner' ? (
            <button
              onClick={() => {
                deleteMember(member.id);
                handleClose();
              }}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Исключить из команды
            </button>
          ) : (
            <span className="text-xs text-slate-400">Владелец пространства</span>
          )}

          <button
            onClick={handleClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </Modal>
  );
};
