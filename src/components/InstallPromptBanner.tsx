import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare } from 'lucide-react';

interface InstallPromptBannerProps {
  deferredPrompt: any;
  isInstalled: boolean;
  onInstall: () => Promise<void> | void;
}

export const InstallPromptBanner: React.FC<InstallPromptBannerProps> = ({
  deferredPrompt,
  isInstalled,
  onInstall,
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('pwa_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('pwa_banner_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  // If already installed as standalone PWA or dismissed, don't show the banner
  if (isInstalled || isDismissed) {
    return null;
  }

  // Only show if deferredPrompt is captured (Chromium/Android/Desktop) OR if on iOS device in browser
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  const handleActionClick = () => {
    if (isIOS) {
      setShowIOSGuide(true);
    } else {
      onInstall();
    }
  };

  return (
    <>
      <div
        id="pwa-install-banner"
        className="relative mx-3 sm:mx-auto mt-2 mb-2 max-w-4xl bg-gradient-to-r from-[#0f172a] via-[#111c38] to-[#0f172a] border border-cyan-500/30 rounded-xl p-3 sm:p-3.5 shadow-lg shadow-cyan-950/30 backdrop-blur-md transition-all duration-300 animate-fadeIn"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-[#0b1329] border border-cyan-500/40 p-1 flex items-center justify-center shadow-inner">
              <img
                src="/icon-192.png"
                alt="Инженерный Терминал"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/icon.svg';
                }}
              />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-cyan-300 tracking-wide uppercase">
                  Инженерный Терминал PWA
                </span>
                <span className="hidden xs:inline-block px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-500/20">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate">
                Автономный доступ к гаражу и диагностике в один клик
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            <button
              id="install-terminal-button"
              type="button"
              onClick={handleActionClick}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-[#0f172a] font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Добавить Терминал на рабочий стол</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
              title="Закрыть уведомление"
              aria-label="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Installation Instruction Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0f172a] border border-cyan-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Установка на iPhone / iPad</span>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#0b1329] border border-cyan-500/15">
                <span className="shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs flex items-center justify-center font-bold">
                  1
                </span>
                <p>
                  В браузере Safari нажмите кнопку <strong className="text-cyan-200 font-semibold">«Поделиться»</strong>{' '}
                  <Share className="inline w-3.5 h-3.5 text-cyan-400 mx-0.5" /> в нижней панели.
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#0b1329] border border-cyan-500/15">
                <span className="shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs flex items-center justify-center font-bold">
                  2
                </span>
                <p>
                  Прокрутите список действий вниз и выберите <strong className="text-cyan-200 font-semibold">«На экран „Домой“»</strong>{' '}
                  <PlusSquare className="inline w-3.5 h-3.5 text-cyan-400 mx-0.5" />.
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#0b1329] border border-cyan-500/15">
                <span className="shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs flex items-center justify-center font-bold">
                  3
                </span>
                <p>
                  Нажмите <strong className="text-cyan-200 font-semibold">«Добавить»</strong> в правом верхнем углу для завершения установки.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </>
  );
};
