import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, Plus, Sparkles, X } from 'lucide-react';

interface WorkspaceSetupModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const WorkspaceSetupModal: React.FC<WorkspaceSetupModalProps> = ({ isOpen, onClose }) => {
  const { createWorkspace } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('⚡');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const avatars = ['⚡', '🚀', '💼', '🏢', '🔥', '🌟', '🛡️', '🎯'];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createWorkspace(name.trim(), description.trim(), avatar);
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка создания рабочего пространства');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#0D1526] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-white relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Новое рабочее пространство</h3>
            <p className="text-xs text-slate-400">Создайте пространство для вашей команды</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Иконка пространства
            </label>
            <div className="flex gap-2">
              {avatars.map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm border transition-all ${
                    avatar === a
                      ? 'border-blue-500 bg-blue-600/30'
                      : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Название рабочего пространства *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: ONE TEAM Tech"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-blue-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Описание (необязательно)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Основной хаб команды разработки и менеджмента"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-blue-500 outline-hidden resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{loading ? 'Создание...' : 'Создать пространство'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
