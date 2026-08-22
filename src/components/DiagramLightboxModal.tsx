import React, { useState, useRef } from 'react';
import { CarDiagram } from '../types';
import { DiagramImage } from './DiagramImage';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RefreshCw, 
  Bookmark, 
  BookmarkCheck, 
  Zap, 
  Check, 
  Info,
  Maximize2,
  Move,
  ExternalLink
} from 'lucide-react';

interface DiagramLightboxModalProps {
  diagram: CarDiagram;
  carName?: string;
  carId?: string;
  isSavedOffline?: boolean;
  onToggleSaveOffline?: (diagram: CarDiagram) => void;
  onClose: () => void;
}

export function DiagramLightboxModal({
  diagram,
  carName = 'Автомобиль',
  carId,
  isSavedOffline = false,
  onToggleSaveOffline,
  onClose
}: DiagramLightboxModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<'image' | 'pinouts'>('image');
  const [isConvertingData, setIsConvertingData] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartDist = useRef<number | null>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.35, 5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.35, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(prev + 0.2, 5));
    } else {
      setZoom((prev) => Math.max(prev - 0.2, 0.5));
    }
  };

  // Mouse Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch Events for Mobile Pinch & Pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = dist;
    } else if (e.touches.length === 1 && zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDist.current;
      setZoom((prev) => Math.min(Math.max(prev * factor, 0.5), 5));
      touchStartDist.current = dist;
    } else if (e.touches.length === 1 && isDragging) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDist.current = null;
  };

  // Convert Image to Base64 Data URL so it stays available 100% offline in LocalStorage
  const handleSaveOfflineWithConversion = async () => {
    if (!onToggleSaveOffline) return;
    setIsConvertingData(true);
    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = diagram.imageUrl;

      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });

      let finalDataUrl = diagram.imageUrl;
      if (img.complete && img.naturalWidth > 0) {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            finalDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          }
        } catch (e) {
          console.warn("Canvas conversion fallback:", e);
        }
      }

      const offlineDiagram: CarDiagram = {
        ...diagram,
        imageUrl: finalDataUrl,
        savedAt: new Date().toLocaleDateString('ru-RU')
      };

      onToggleSaveOffline(offlineDiagram);
    } catch (err) {
      console.error("Failed to save image offline:", err);
      onToggleSaveOffline(diagram);
    } finally {
      setIsConvertingData(false);
    }
  };

  const searchVehText = encodeURIComponent(`${carName} схема электропроводки предохранители`);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md transition-all">
      <div className="w-full max-w-6xl bg-[#050b18] border-2 border-blueprint-cyan rounded-none shadow-[0_0_60px_rgba(0,255,204,0.35)] h-[calc(100vh-70px)] md:h-[94vh] mb-14 md:mb-0 flex flex-col overflow-hidden relative blueprint-corner">
        
        {/* Header Bar */}
        <div className="p-3 sm:p-4 bg-cyan-950/80 border-b border-cyan-800/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 bg-cyan-950 border border-blueprint-cyan text-blueprint-cyan shrink-0">
              <Zap className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold uppercase text-blueprint-cyan bg-cyan-950 px-1.5 py-0.5 border border-cyan-800/40 shrink-0">
                  {diagram.category.toUpperCase()}
                </span>
                <span className="text-[10px] text-cyan-300/80 font-mono truncate hidden sm:inline">
                  {carName}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white font-mono truncate">
                {diagram.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Direct External Search Buttons */}
            <a
              href={`https://yandex.ru/images/search?text=${searchVehText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-cyan-950 border border-cyan-800 hover:border-blueprint-cyan text-cyan-300 hover:text-white font-mono text-[10px] uppercase transition-all flex items-center gap-1"
              title="Открыть поиск картинок Яндекса в новой вкладке"
            >
              <ExternalLink className="w-3 h-3 text-blueprint-cyan" />
              <span className="hidden md:inline">Яндекс.Картинки</span>
            </a>

            {/* Save Offline Button */}
            {onToggleSaveOffline && (
              <button
                onClick={handleSaveOfflineWithConversion}
                disabled={isConvertingData}
                className={`px-3 py-1.5 border font-mono text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSavedOffline
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300 hover:bg-emerald-900'
                    : 'bg-cyan-950 border-cyan-800 text-cyan-200 hover:border-blueprint-cyan hover:text-white'
                }`}
                title={isSavedOffline ? 'Схема сохранена оффлайн' : 'Сохранить в авто для работы без интернета'}
              >
                {isSavedOffline ? (
                  <>
                    <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>В ГАРАЖЕ</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5 text-blueprint-cyan" />
                    <span>{isConvertingData ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ В АВТО'}</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 border border-cyan-800/60 bg-cyan-950 text-blueprint-cyan hover:bg-blueprint-cyan hover:text-blueprint-bg transition-colors cursor-pointer"
              title="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Controls */}
        <div className="bg-slate-950 border-b border-cyan-800/40 p-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Zoom & View Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomIn}
              className="p-1.5 bg-cyan-950/80 border border-cyan-800/60 hover:border-blueprint-cyan text-cyan-200 hover:text-white transition-all cursor-pointer text-xs flex items-center gap-1"
              title="Увеличить (Zoom In)"
            >
              <ZoomIn className="w-3.5 h-3.5 text-blueprint-cyan" />
              <span className="font-mono text-[11px]">{(zoom * 100).toFixed(0)}%</span>
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 bg-cyan-950/80 border border-cyan-800/60 hover:border-blueprint-cyan text-cyan-200 hover:text-white transition-all cursor-pointer text-xs"
              title="Уменьшить (Zoom Out)"
            >
              <ZoomOut className="w-3.5 h-3.5 text-blueprint-cyan" />
            </button>
            <button
              onClick={handleRotate}
              className="p-1.5 bg-cyan-950/80 border border-cyan-800/60 hover:border-blueprint-cyan text-cyan-200 hover:text-white transition-all cursor-pointer text-xs"
              title="Повернуть на 90°"
            >
              <RotateCw className="w-3.5 h-3.5 text-blueprint-cyan" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 bg-cyan-950/80 border border-cyan-800/60 hover:border-blueprint-cyan text-cyan-200 hover:text-white transition-all cursor-pointer text-xs"
              title="Сбросить масштаб"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blueprint-cyan" />
            </button>
          </div>

          {/* View mode toggle if pinouts are available */}
          {diagram.pinouts && diagram.pinouts.length > 0 && (
            <div className="flex border border-cyan-800/40 p-0.5 bg-slate-900">
              <button
                onClick={() => setActiveTab('image')}
                className={`px-2.5 py-1 text-[10px] font-mono uppercase transition-all ${
                  activeTab === 'image' ? 'bg-blueprint-cyan text-blueprint-bg font-bold' : 'text-cyan-300 hover:text-white'
                }`}
              >
                ВИЗУАЛЬНАЯ СХЕМА
              </button>
              <button
                onClick={() => setActiveTab('pinouts')}
                className={`px-2.5 py-1 text-[10px] font-mono uppercase transition-all ${
                  activeTab === 'pinouts' ? 'bg-blueprint-cyan text-blueprint-bg font-bold' : 'text-cyan-300 hover:text-white'
                }`}
              >
                РАСПИНОВКА (КОНТАКТЫ)
              </button>
            </div>
          )}

          <div className="text-[10px] font-mono text-cyan-400/60 flex items-center gap-1.5">
            <Move className="w-3 h-3 text-blueprint-cyan" />
            <span>Колесико мыши: зум / Перетаскивание зажатием</span>
          </div>
        </div>

        {/* Main Viewing Canvas */}
        <div 
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex-1 bg-black/95 overflow-hidden relative flex items-center justify-center p-2 select-none cursor-grab active:cursor-grabbing"
        >
          {activeTab === 'image' ? (
            <div 
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out'
              }}
              className="max-w-full max-h-full flex items-center justify-center"
            >
              <DiagramImage
                diagram={diagram}
                carName={carName}
                className="max-w-full max-h-[78vh] object-contain border border-cyan-800/40 shadow-[0_0_40px_rgba(0,0,0,0.9)]"
                draggable={false}
              />
            </div>
          ) : (
            /* Pinouts / Wiring Pins Table */
            <div className="w-full h-full overflow-y-auto p-4 max-w-3xl">
              <h3 className="text-xs font-mono font-bold text-blueprint-cyan uppercase mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span>ТАБЛИЦА РАСПИНОВКИ И ЦВЕТОВОЙ МАРКИРОВКИ ПРОВОДОВ</span>
              </h3>
              <div className="border border-cyan-800/40 bg-slate-950 overflow-hidden">
                <table className="w-full text-left font-mono text-xs text-cyan-100">
                  <thead className="bg-cyan-950/80 text-blueprint-cyan uppercase text-[10px] border-b border-cyan-800/40">
                    <tr>
                      <th className="p-2 border-r border-cyan-800/30">Контакт / Пин</th>
                      <th className="p-2 border-r border-cyan-800/30">Цвет провода</th>
                      <th className="p-2">Назначение / Цепь сигнала</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-950">
                    {diagram.pinouts?.map((pin, idx) => (
                      <tr key={idx} className="hover:bg-cyan-950/30">
                        <td className="p-2 font-bold text-blueprint-cyan border-r border-cyan-800/20">{pin.pin}</td>
                        <td className="p-2 border-r border-cyan-800/20">
                          <span className="inline-block px-2 py-0.5 border border-cyan-800/30 bg-slate-900 text-[10px]">
                            {pin.color}
                          </span>
                        </td>
                        <td className="p-2 text-cyan-200">{pin.signal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info & Description */}
        <div className="p-3 bg-slate-950 border-t border-cyan-800/40 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p className="text-xs font-mono text-cyan-300/80 leading-relaxed max-w-3xl">
            {diagram.description}
          </p>

          {diagram.source && (
            <span className="text-[10px] font-mono text-cyan-500/60 shrink-0">
              Источник: {diagram.source}
            </span>
          )}
        </div>

      </div>
    </div>
  );
}

