import React, { useState, useEffect } from 'react';
import { CarDiagram } from '../types';
import { ExternalLink, RefreshCw, AlertTriangle, Image as ImageIcon } from 'lucide-react';

interface DiagramImageProps {
  diagram: CarDiagram;
  className?: string;
  containerClassName?: string;
  carName?: string;
  draggable?: boolean;
}

export const DiagramImage: React.FC<DiagramImageProps> = ({
  diagram,
  className = "max-w-full max-h-full object-contain",
  containerClassName = "relative flex items-center justify-center w-full h-full",
  carName = "",
  draggable = false
}) => {
  const getInitialSrc = () => {
    return diagram.imageUrl || (diagram.originalUrl ? `/api/diagrams/proxy-image?url=${encodeURIComponent(diagram.originalUrl)}` : '');
  };

  const [src, setSrc] = useState<string>(getInitialSrc());
  const [errorCount, setErrorCount] = useState<number>(0);
  const [isFailed, setIsFailed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setSrc(getInitialSrc());
    setErrorCount(0);
    setIsFailed(false);
    setIsLoading(true);
  }, [diagram.id, diagram.imageUrl, diagram.originalUrl]);

  const handleError = () => {
    const rawUrl = diagram.originalUrl || (diagram.imageUrl ? diagram.imageUrl.replace('/api/diagrams/proxy-image?url=', '') : '');
    
    if (!rawUrl) {
      setIsFailed(true);
      setIsLoading(false);
      return;
    }

    const cleanRawUrl = decodeURIComponent(rawUrl);

    if (errorCount === 0) {
      // Step 1: Fallback to weserv proxy
      setErrorCount(1);
      setSrc(`https://images.weserv.nl/?url=${encodeURIComponent(cleanRawUrl)}`);
    } else if (errorCount === 1) {
      // Step 2: Fallback to secondary wsrv proxy
      setErrorCount(2);
      setSrc(`https://wsrv.nl/?url=${encodeURIComponent(cleanRawUrl)}`);
    } else if (errorCount === 2) {
      // Step 3: Direct original URL fallback
      setErrorCount(3);
      setSrc(cleanRawUrl);
    } else {
      // Failed all proxy layers
      setIsFailed(true);
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setIsFailed(false);
    setIsLoading(true);
    setErrorCount(0);
    setSrc(getInitialSrc());
  };

  const targetLink = diagram.sourceUrl || diagram.originalUrl || (diagram.imageUrl.startsWith('http') ? diagram.imageUrl : '');
  const searchQuery = encodeURIComponent(`${carName || ''} ${diagram.title} схема электропроводки предохранители`);
  const yandexUrl = `https://yandex.ru/images/search?text=${searchQuery}`;

  if (isFailed) {
    return (
      <div className={`p-4 bg-slate-950 border border-cyan-800/60 rounded-none text-center flex flex-col items-center justify-center space-y-3 ${containerClassName}`}>
        <div className="p-2.5 bg-cyan-950/80 border border-amber-500/50 text-amber-400">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h4 className="text-xs font-mono font-bold text-white uppercase">
            Сайт-источник блокирует прямой просмотр картинки (Hotlink Protection)
          </h4>
          <p className="text-[11px] font-mono text-cyan-300/70 mt-1 max-w-md">
            {diagram.source ? `Источник: ${diagram.source}` : 'Изображение защищено авторским сайтом.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {targetLink && (
            <a
              href={targetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-blueprint-cyan text-blueprint-bg font-mono font-bold text-[11px] uppercase flex items-center gap-1.5 hover:bg-cyan-300 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>ОТКРЫТЬ НА САЙТЕ-ИСТОЧНИКЕ</span>
            </a>
          )}

          <a
            href={yandexUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-slate-900 border border-cyan-700 hover:border-blueprint-cyan text-cyan-200 hover:text-white font-mono text-[11px] uppercase flex items-center gap-1.5 transition-all"
          >
            <ImageIcon className="w-3.5 h-3.5 text-blueprint-cyan" />
            <span>НАЙТИ В ЯНДЕКС.КАРТИНКАХ</span>
          </a>

          <button
            onClick={handleRetry}
            className="px-2.5 py-1.5 bg-cyan-950 border border-cyan-800 text-cyan-300 hover:text-white font-mono text-[11px] uppercase flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ПОВТОРИТЬ</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
          <div className="w-5 h-5 border-2 border-blueprint-cyan border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={src}
        alt={diagram.title}
        className={className}
        draggable={draggable}
        onLoad={() => setIsLoading(false)}
        onError={handleError}
      />
    </div>
  );
};
