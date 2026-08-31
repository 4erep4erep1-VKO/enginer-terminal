import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Shield, Mail, Lock, UserCheck, AlertCircle, ArrowRight, Wrench, CheckCircle2 } from 'lucide-react';

function parseAuthError(error: any, mode: 'signin' | 'signup' | 'google'): string {
  const code = error?.code || '';
  const message = error?.message || '';

  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
    return mode === 'signin'
      ? 'Пользователь не найден или пароль неверен. Если вы тут впервые, нажмите переключатель «РЕГИСТРАЦИЯ» выше и создайте аккаунт.'
      : 'Учетные данные недействительны.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'Аккаунт с таким Email уже зарегистрирован! Нажмите «ВХОД В ТЕРМИНАЛ» выше для авторизации.';
  }
  if (code === 'auth/weak-password') {
    return 'Пароль слишком простой (требуется минимум 6 символов).';
  }
  if (code === 'auth/invalid-email') {
    return 'Введен некорректный адрес электронной почты.';
  }
  if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
    return 'Всплывающее окно Google закрыто или заблокировано браузером. Войдите по Email или используйте Демо-доступ.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'Домен предпросмотра не авторизован в Google Cloud OAuth. Воспользуйтесь регистрацией по Email/паролю или Демо-доступом.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Провайдер авторизации не активирован в консоли Firebase. Воспользуйтесь Демо-доступом.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Ошибка подключения к сети. Проверьте интернет-соединение.';
  }

  return message || 'Произошел сбой авторизации. Проверьте введенные данные.';
}

export function AuthModal() {
  const { 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGoogle, 
    signInAsDemoUser
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Пожалуйста, укажите Email и Пароль');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Пароль должен быть не менее 6 символов');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          setErrorMsg(parseAuthError(error, 'signin'));
        }
      } else {
        const { error } = await signUpWithEmail(email, password);
        if (error) {
          setErrorMsg(parseAuthError(error, 'signup'));
        } else {
          setSuccessMsg('Аккаунт успешно создан! Доступ открыт.');
        }
      }
    } catch (err: any) {
      setErrorMsg(parseAuthError(err, mode));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMsg(parseAuthError(error, 'google'));
      }
    } catch (err: any) {
      setErrorMsg(parseAuthError(err, 'google'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
      <div className="relative w-full max-w-md bg-[#111622] border border-[#1E273D] rounded-2xl shadow-2xl p-5 sm:p-6 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E273D] pb-3 mb-4">
          <div className="flex items-center space-x-2 text-[#06B6D4]">
            <Wrench className="w-4 h-4" />
            <span className="font-semibold text-xs tracking-wide uppercase text-white">АвтоГараж</span>
          </div>
          <span className="text-[10px] text-slate-400 bg-[#151C2C] px-2 py-0.5 rounded border border-[#1E273D]">
            Аккаунт
          </span>
        </div>

        {/* Title Banner */}
        <div className="mb-4">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#06B6D4]" />
            Вход в систему
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Войдите для синхронизации данных гаража и записей ТО
          </p>
        </div>

        {/* OAuth Google Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full mb-4 py-2.5 px-4 bg-[#0B0E14] border border-[#1E273D] hover:border-cyan-500/50 text-white flex items-center justify-center gap-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="font-semibold text-xs">Войти через Google</span>
        </button>

        {/* Separator */}
        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#1E273D]"></div>
          </div>
          <span className="relative bg-[#111622] px-2.5 text-[11px] text-slate-500">
            или по email
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 mb-4 bg-[#0B0E14] p-1 rounded-xl border border-[#1E273D]">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-[#151C2C] text-[#06B6D4] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Вход
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-[#151C2C] text-[#06B6D4] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Регистрация
          </button>
        </div>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="mb-3 p-2.5 bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-2.5 bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs rounded-xl flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-[#0B0E14] border border-[#1E273D] focus:border-cyan-400 text-white pl-9 pr-3 py-2 text-xs rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Пароль</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0B0E14] border border-[#1E273D] focus:border-cyan-400 text-white pl-9 pr-3 py-2 text-xs rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 btn-primary font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Подключение...</span>
            ) : (
              <>
                <span>{mode === 'signin' ? 'Войти' : 'Создать аккаунт'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Demo Mode Button */}
        <div className="mt-4 pt-3 border-t border-[#1E273D]">
          <button
            type="button"
            onClick={() => signInAsDemoUser()}
            className="w-full py-2 bg-[#0B0E14] border border-[#1E273D] text-slate-300 hover:border-cyan-500/40 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Демо-режим (без регистрации)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
