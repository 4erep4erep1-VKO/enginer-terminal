import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
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

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-mono">
          <div className="max-w-lg w-full bg-slate-900 border border-red-500/80 p-6 rounded-lg shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-8 h-8 shrink-0 animate-bounce" />
              <div>
                <h2 className="text-lg font-bold uppercase tracking-wider">Системная ошибка рендеринга</h2>
                <p className="text-xs text-red-300/80">Приложение перехвачено экраном защиты (ErrorBoundary)</p>
              </div>
            </div>

            <div className="p-3 bg-black/60 border border-red-500/30 rounded text-xs text-red-200 overflow-x-auto font-mono max-h-40">
              {this.state.error ? this.state.error.toString() : 'Сбой компонента'}
              {this.state.errorInfo?.componentStack && (
                <div className="mt-2 pt-2 border-t border-red-900/40 text-[10px] text-slate-400">
                  {this.state.errorInfo.componentStack.slice(0, 300)}...
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-[10px] text-slate-400">
                Попробуйте перезагрузить страницу или переключиться в Демо-режим.
              </span>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase flex items-center gap-2 rounded transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Перезапустить</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
