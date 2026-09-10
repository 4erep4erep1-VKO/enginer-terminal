import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Database } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        if ('caches' in window) {
          caches.keys().then((keys) => {
            keys.forEach((key) => caches.delete(key));
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }

    if (this.props.onReset) {
      this.props.onReset();
    }
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle || 'Произошла ошибка при загрузке данных';
      const message = this.props.fallbackMessage || 
        'Интерфейс перехвачен экраном защиты. Возможно, в локальном хранилище браузера сохранены устаревшие или неполные данные автомобиля.';

      return (
        <div className="min-h-[360px] w-full bg-[#090C12] text-white flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="max-w-lg w-full bg-[#0f172a] border-2 border-rose-500/60 p-6 sm:p-7 rounded-2xl shadow-2xl space-y-5">
            <div className="flex items-start gap-4 text-rose-400">
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl shrink-0">
                <AlertTriangle className="w-8 h-8 text-rose-400 animate-pulse" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                  {title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            {/* Error stack snippet */}
            <div className="p-3.5 bg-black/60 border border-slate-800 rounded-xl text-xs text-rose-300 font-mono max-h-36 overflow-x-auto space-y-1">
              <div className="font-semibold text-rose-400">
                {this.state.error ? this.state.error.toString() : 'Непредвиденный сбой рендеринга'}
              </div>
              {this.state.errorInfo?.componentStack && (
                <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1 mt-1 opacity-80">
                  {this.state.errorInfo.componentStack.slice(0, 240)}...
                </div>
              )}
            </div>

            {/* Actions with >= 48px touch targets */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <button
                type="button"
                onClick={this.handleResetCache}
                className="min-h-[48px] flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm uppercase tracking-wide flex items-center justify-center gap-2 rounded-xl transition-all shadow-lg cursor-pointer"
                title="Очистить устаревший кэш и вернуть дефолтное состояние"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>Сбросить кэш</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="min-h-[48px] px-4 py-3 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 hover:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 rounded-xl border border-slate-700 transition-all cursor-pointer"
                title="Перезагрузить страницу"
              >
                <RefreshCw className="w-4 h-4 shrink-0" />
                <span>Перезагрузить</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Кнопка «Сбросить кэш» восстановит стандартный профиль автомобиля</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
