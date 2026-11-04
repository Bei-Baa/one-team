import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export const AuthScreen: React.FC = () => {
  const {
    signIn,
    signUp,
    resetPassword,
    updatePassword,
    needsEmailVerification,
    setNeedsEmailVerification,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ['Очень слабый', 'Слабый', 'Средний', 'Надёжный', 'Отличный'];
  const strengthColors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else if (mode === 'register') {
        if (password.length < 6) {
          throw new Error('Пароль должен содержать минимум 6 символов');
        }
        if (password !== confirmPassword) {
          throw new Error('Пароли не совпадают');
        }
        await signUp(email.trim(), password, fullName.trim());
        setSuccessMsg('Проверьте почту для подтверждения регистрации.');
      } else if (mode === 'forgot') {
        await resetPassword(email.trim());
        setSuccessMsg('Инструкции по сбросу пароля отправлены на ваш email.');
      } else if (mode === 'reset') {
        if (password.length < 6) {
          throw new Error('Пароль должен содержать минимум 6 символов');
        }
        if (password !== confirmPassword) {
          throw new Error('Пароли не совпадают');
        }
        await updatePassword(password);
        setSuccessMsg('Пароль успешно обновлён. Теперь вы можете войти.');
        setTimeout(() => setMode('login'), 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Произошла ошибка при выполнении операции.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#080C14] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-5xl bg-[#0D1526]/80 border border-slate-800/80 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px] z-10 transition-all">
        {/* Left Side: Brand & Visuals */}
        <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/60 bg-gradient-to-br from-[#101B33]/60 via-[#0D1526]/40 to-[#080C14]/90 relative">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-600/30">
                <svg
                  className="w-6 h-6 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m3 19 9-14 9 14" />
                  <path d="M7.5 13h9" />
                </svg>
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-wider text-white font-display">
                  ONE TEAM
                </span>
                <p className="text-[10px] text-cyan-400 tracking-widest uppercase font-semibold">
                  Cloud Platform
                </p>
              </div>
            </div>

            {/* Tagline & Description */}
            <div className="mt-12 space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                Work Together.<br />
                <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Move Forward.
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                Единая облачная платформа для управления командой, проектами, задачами, стратегией, финансами и клиентами.
              </p>
            </div>
          </div>

          {/* Value Prop Badges */}
          <div className="mt-8 pt-8 border-t border-slate-800/60 space-y-3 hidden sm:block">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Multi-Workspace изоляция данных</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Безопасный PostgreSQL + Row Level Security</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Синхронизация в реальном времени</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          {needsEmailVerification ? (
            <div className="max-w-md mx-auto text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
                <Mail className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Подтвердите ваш email</h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Мы отправили ссылку для подтверждения на ваш почтовый ящик. Пожалуйста, перейдите по ссылке в письме, чтобы активировать аккаунт.
              </p>
              <button
                onClick={() => {
                  setNeedsEmailVerification(false);
                  setMode('login');
                }}
                className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer"
              >
                Вернуться ко входу
              </button>
            </div>
          ) : (
            <div className="max-w-md mx-auto w-full">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {mode === 'login' && 'С возвращением'}
                  {mode === 'register' && 'Создайте свой аккаунт'}
                  {mode === 'forgot' && 'Восстановление пароля'}
                  {mode === 'reset' && 'Новый пароль'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {mode === 'login' && 'Продолжайте работу над важными проектами вместе с командой.'}
                  {mode === 'register' && 'Начните организовывать работу команды в одном пространстве.'}
                  {mode === 'forgot' && 'Введите почту для получения ссылки сброса пароля.'}
                  {mode === 'reset' && 'Придумайте надежный пароль для вашей учётной записи.'}
                </p>
              </div>

              {/* Status Messages */}
              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Ваше имя *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Алексей Смирнов"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 focus:border-blue-500 text-sm text-white placeholder-slate-500 outline-hidden transition-colors"
                      />
                    </div>
                  </div>
                )}

                {mode !== 'reset' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alexey@company.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 focus:border-blue-500 text-sm text-white placeholder-slate-500 outline-hidden transition-colors"
                      />
                    </div>
                  </div>
                )}

                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        {mode === 'reset' ? 'Новый пароль *' : 'Пароль *'}
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot');
                            setErrorMsg(null);
                            setSuccessMsg(null);
                          }}
                          className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Забыли пароль?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 focus:border-blue-500 text-sm text-white placeholder-slate-500 outline-hidden transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator for Register */}
                    {(mode === 'register' || mode === 'reset') && password.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex gap-1 h-1">
                          {[0, 1, 2, 3].map((idx) => (
                            <div
                              key={idx}
                              className={`flex-1 rounded-full ${
                                idx < strength ? strengthColors[strength] : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-[10px] text-slate-400 flex justify-between">
                          <span>Сложность: {strengthLabels[strength]}</span>
                          <span>Мин. 6 символов</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(mode === 'register' || mode === 'reset') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Повторите пароль *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 focus:border-blue-500 text-sm text-white placeholder-slate-500 outline-hidden transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>
                        {mode === 'login' && 'Войти'}
                        {mode === 'register' && 'Создать аккаунт'}
                        {mode === 'forgot' && 'Отправить ссылку'}
                        {mode === 'reset' && 'Обновить пароль'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Mode Switcher */}
              <div className="mt-6 text-center text-xs text-slate-400">
                {mode === 'login' ? (
                  <p>
                    Нет аккаунта?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                    >
                      Создать аккаунт
                    </button>
                  </p>
                ) : (
                  <p>
                    Уже есть аккаунт?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                    >
                      Войти
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
