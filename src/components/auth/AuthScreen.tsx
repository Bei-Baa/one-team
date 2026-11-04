import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type AuthMode = 'login' | 'register' | 'forgot_password' | 'verification_sent' | 'reset_password';

export const AuthScreen: React.FC = () => {
  const { login, register, resetPassword, updatePassword, resendVerification, isConfigured } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Пароли не совпадают');
        }
        if (password.length < 6) {
          throw new Error('Пароль должен содержать не менее 6 символов');
        }
        const data = await register(email, password, fullName);
        if (data.session) {
          // Immediately logged in
        } else {
          setMode('verification_sent');
        }
      } else if (mode === 'forgot_password') {
        await resetPassword(email);
        setSuccessMsg('Инструкции по восстановлению пароля отправлены на ваш email.');
      } else if (mode === 'reset_password') {
        if (password !== confirmPassword) {
          throw new Error('Пароли не совпадают');
        }
        await updatePassword(password);
        setSuccessMsg('Пароль успешно обновлён. Вы можете войти в систему.');
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'Произошла непредвиденная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    try {
      await resendVerification(email);
      setSuccessMsg('Письмо подтверждения отправлено повторно.');
    } catch (err: any) {
      setError(err.message || 'Не удалось отправить письмо');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F7FB] dark:bg-[#0B0F19] p-4 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-7 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-cyan-400 flex items-center justify-center mb-3 shadow-md">
            <span className="text-white font-black text-xl">A</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">ONE TEAM</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {mode === 'login' && 'Вход в единое рабочее пространство'}
            {mode === 'register' && 'Регистрация новой учётной записи'}
            {mode === 'forgot_password' && 'Восстановление доступа к аккаунту'}
            {mode === 'verification_sent' && 'Подтверждение адреса электронной почты'}
            {mode === 'reset_password' && 'Установка нового пароля'}
          </p>
        </div>

        {!isConfigured && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Параметры Supabase Auth не настроены</span>
            </div>
            Для использования облачной аутентификации укажите <code>VITE_SUPABASE_URL</code> и <code>VITE_SUPABASE_ANON_KEY</code> в файле <code>.env</code>. Локальные данные в IndexedDB сохраняются автономно.
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
            {successMsg}
          </div>
        )}

        {/* Verification Sent Screen */}
        {mode === 'verification_sent' ? (
          <div className="space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Мы отправили письмо с подтверждением на адрес <strong className="font-mono">{email}</strong>. Перейдите по ссылке в письме для завершения активации.
            </p>
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleResend}
                className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Отправить письмо повторно
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full py-2 px-4 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Вернуться ко входу
              </button>
            </div>
          </div>
        ) : (
          /* Main Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Имя и фамилия *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Например: Екатерина Соколова"
                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {mode !== 'reset_password' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Корпоративный Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {mode !== 'forgot_password' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Пароль *
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot_password')}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Забыли пароль?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-2.5 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {(mode === 'register' || mode === 'reset_password') && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Подтверждение пароля *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>
                {mode === 'login' && 'Войти в ONE TEAM'}
                {mode === 'register' && 'Создать аккаунт'}
                {mode === 'forgot_password' && 'Отправить ссылку для сброса'}
                {mode === 'reset_password' && 'Сохранить новый пароль'}
              </span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>

            {/* Toggle Modes */}
            <div className="pt-3 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
              {mode === 'login' && (
                <span>
                  Ещё нет учётной записи?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                    }}
                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    Зарегистрироваться
                  </button>
                </span>
              )}

              {mode === 'register' && (
                <span>
                  Уже есть аккаунт?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    Войти
                  </button>
                </span>
              )}

              {mode === 'forgot_password' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Вернуться ко входу
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
