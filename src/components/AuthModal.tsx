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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      {/* Background blueprint grid styling */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffcc08_1px,transparent_1px),linear-gradient(to_bottom,#00ffcc08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#0a1219] border-2 border-blueprint-cyan shadow-[0_0_50px_rgba(0,255,204,0.2)] p-6 sm:p-8 font-mono overflow-hidden">
        
        {/* Top Decorative Terminal Header */}
        <div className="flex items-center justify-between border-b border-blueprint-cyan/30 pb-4 mb-6">
          <div className="flex items-center space-x-2 text-blueprint-cyan">
            <Wrench className="w-5 h-5 animate-pulse" />
            <span className="font-bold tracking-widest text-sm uppercase">ИНЖЕНЕРНЫЙ ТЕРМИНАЛ v2.5</span>
          </div>
          <span className="text-[10px] text-blueprint-cyan/60 bg-blueprint-cyan/10 px-2 py-0.5 border border-blueprint-cyan/30 uppercase">
            FIREBASE AUTH
          </span>
        </div>

        {/* Title Banner */}
        <div className="mb-6">
          <h2 className="text-xl font-black text-white tracking-wider uppercase flex items-center gap-2">
            <Shield className="w-6 h-6 text-blueprint-cyan" />
            АВТОРИЗАЦИЯ ОПЕРАТОРА
          </h2>
          <p className="text-xs text-blueprint-cyan/70 mt-1">
            Введите учетные данные для доступа к многопользовательскому гаражу и записям ТО
          </p>
        </div>

        {/* OAuth Google Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full mb-6 py-3 px-4 bg-slate-900 border border-slate-700 hover:border-blueprint-cyan text-white hover:text-blueprint-cyan flex items-center justify-center gap-3 transition-all shadow-md group cursor-pointer"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
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
          <span className="font-bold text-xs uppercase tracking-wider">ВОЙТИ ЧЕРЕЗ GOOGLE</span>
        </button>

        {/* Separator */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-blueprint-cyan/20"></div>
          </div>
          <span className="relative bg-[#0a1219] px-3 text-[11px] text-blueprint-cyan/60 uppercase">
            ИЛИ ИСПОЛЬЗУЙТЕ EMAIL
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 mb-6 bg-slate-950 p-1 border border-blueprint-cyan/20">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 text-xs font-bold uppercase transition-all ${
              mode === 'signin'
                ? 'bg-blueprint-cyan text-blueprint-bg font-black shadow-md'
                : 'text-blueprint-cyan/60 hover:text-blueprint-cyan'
            }`}
          >
            ВХОД В ТЕРМИНАЛ
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 text-xs font-bold uppercase transition-all ${
              mode === 'signup'
                ? 'bg-blueprint-cyan text-blueprint-bg font-black shadow-md'
                : 'text-blueprint-cyan/60 hover:text-blueprint-cyan'
            }`}
          >
            РЕГИСТРАЦИЯ
          </button>
        </div>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-500 text-red-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-blueprint-cyan/80 uppercase mb-1">EMAIL АДРЕС</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-blueprint-cyan/50 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@garage.com"
                className="w-full bg-slate-950 border border-blueprint-cyan/30 focus:border-blueprint-cyan text-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blueprint-cyan"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-blueprint-cyan/80 uppercase mb-1">ПАРОЛЬ</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-blueprint-cyan/50 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-blueprint-cyan/30 focus:border-blueprint-cyan text-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blueprint-cyan"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blueprint-cyan text-blueprint-bg font-bold text-sm uppercase hover:bg-cyan-300 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,204,0.3)] cursor-pointer"
          >
            {isSubmitting ? (
              <span className="animate-pulse">ПОДКЛЮЧЕНИЕ К БАЗЕ...</span>
            ) : (
              <>
                <span>{mode === 'signin' ? 'АВТОРИЗОВАТЬСЯ' : 'СОЗДАТЬ АККАУНТ'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Mode Button */}
        <div className="mt-6 pt-4 border-t border-blueprint-cyan/20">
          <button
            type="button"
            onClick={() => signInAsDemoUser()}
            className="w-full py-2 bg-slate-900/80 border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:border-amber-400 text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>БЫСТРЫЙ ДЕМО-ДОСТУП ИНЖЕНЕРА</span>
          </button>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            Использовать локальный изолированный профиль для тестирования возможностей
          </p>
        </div>

      </div>
    </div>
  );
}
