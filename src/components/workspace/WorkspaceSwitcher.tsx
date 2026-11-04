import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Check, ChevronDown, Plus, Sparkles, Building2 } from 'lucide-react';
import { WorkspaceSetupModal } from './WorkspaceSetupModal';

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({ collapsed = false }) => {
  const { workspaces, currentWorkspace, switchWorkspace, currentRole } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);

  return (
    <>
      <div className="relative">
        {!collapsed ? (
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800/80 transition-colors cursor-pointer border border-slate-700/40 text-left"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                {currentWorkspace?.avatar || '⚡'}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-white truncate">
                  {currentWorkspace?.name || 'ONE TEAM'}
                </div>
                <div className="text-[10px] text-slate-400 capitalize">
                  {currentRole === 'owner' && 'Владелец (Owner)'}
                  {currentRole === 'admin' && 'Администратор (Admin)'}
                  {currentRole === 'editor' && 'Редактор (Editor)'}
                  {currentRole === 'viewer' && 'Наблюдатель (Viewer)'}
                </div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>
        ) : (
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-10 h-10 mx-auto rounded-xl bg-slate-800/60 hover:bg-slate-800 flex items-center justify-center text-sm cursor-pointer border border-slate-700/40"
            title={currentWorkspace?.name || 'Рабочее пространство'}
          >
            {currentWorkspace?.avatar || '⚡'}
          </button>
        )}

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute left-0 bottom-full mb-2 w-64 bg-[#111827] border border-slate-800 rounded-2xl shadow-2xl p-2 z-40 text-slate-200">
              <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Мои пространства
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 my-1">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      ws.id === currentWorkspace?.id
                        ? 'bg-blue-600/20 text-blue-400 font-semibold'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span>{ws.avatar}</span>
                      <span className="truncate">{ws.name}</span>
                    </div>
                    {ws.id === currentWorkspace?.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="pt-1.5 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setSetupModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Создать пространство</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <WorkspaceSetupModal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
      />
    </>
  );
};
