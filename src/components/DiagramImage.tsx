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
      <div className={`p-4 bg-[#0B0E14] border border-[#1E273D] rounded-xl text-center flex flex-col items-center justify-center space-y-3 ${containerClassName}`}>
        <div className="p-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-white">
            Прямой просмотр изображения заблокирован сайтом-источником
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-md">
            {diagram.source ? `Источник: ${diagram.source}` : 'Изображение защищено внешним сервером.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {targetLink && (
            <a
              href={targetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[#06B6D4] text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 hover:bg-cyan-400 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Открыть на сайте</span>
            </a>
          )}

          <a
            href={yandexUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-[#151C2C] border border-[#1E273D] hover:border-cyan-500/50 text-slate-200 hover:text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all"
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Найти в картинках</span>
          </a>

          <button
            onClick={handleRetry}
            className="px-2.5 py-1.5 bg-[#151C2C] border border-[#1E273D] text-slate-300 hover:text-white text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Повторить</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={src}
        alt={diagram.title}
        className={className}
        draggable={draggable}
        onLoad={() => setIsLoading(false)}
        onError={handleError}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
