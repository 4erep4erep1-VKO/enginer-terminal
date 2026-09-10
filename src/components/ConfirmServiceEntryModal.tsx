/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ParsedServiceEntry, ServiceCategory, ServicePartUsed } from '../types/car';
import { useUserSettings } from './UserSettingsContext';
import { 
  Check, 
  Edit3, 
  X, 
  CheckCircle2, 
  Bot, 
  Wrench, 
  Gauge, 
  Tag, 
  DollarSign, 
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Camera,
  Paperclip,
  Trash2,
  ZoomIn,
  Image as ImageIcon,
  Receipt
} from 'lucide-react';

interface ConfirmServiceEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedEntry: ParsedServiceEntry | null;
  carName?: string;
  currentCarOdometer?: number;
  onConfirmSave: (finalEntry: ParsedServiceEntry) => void;
  onEditRequest?: (entry: ParsedServiceEntry) => void;
}

export function ConfirmServiceEntryModal({
  isOpen,
  onClose,
  parsedEntry,
  carName = 'Автомобиль',
  currentCarOdometer = 0,
  onConfirmSave,
  onEditRequest,
}: ConfirmServiceEntryModalProps) {
  const { currencySymbol, distanceLabel, formatCurrency } = useUserSettings();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [odometer, setOdometer] = useState<number | ''>('');
  const [partsText, setPartsText] = useState('');
  const [costParts, setCostParts] = useState<number | ''>('');
  const [costWork, setCostWork] = useState<number | ''>('');
  const [totalCost, setTotalCost] = useState<number | ''>('');
  const [category, setCategory] = useState<ServiceCategory>('maintenance');
  const [isSaved, setIsSaved] = useState(false);
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state when parsedEntry changes
  useEffect(() => {
    if (parsedEntry) {
      setTitle(parsedEntry?.title || '');
      setOdometer(parsedEntry?.odometer !== undefined ? parsedEntry.odometer : (currentCarOdometer ?? 0));
      
      const partsNames = (parsedEntry?.partsUsed && parsedEntry.partsUsed.length > 0)
        ? parsedEntry.partsUsed.map(p => (typeof p === 'string' ? p : p?.name || '')).filter(Boolean).join(', ')
        : '';
      setPartsText(partsNames);

      setCostParts(parsedEntry?.costParts || '');
      setCostWork(parsedEntry?.costWork || '');
      setTotalCost(parsedEntry?.totalCost || ((parsedEntry?.costParts || 0) + (parsedEntry?.costWork || 0)) || '');
      setCategory(parsedEntry?.category || 'maintenance');
      setAttachedPhotos(parsedEntry?.photoUrls || parsedEntry?.attachments || []);
      setIsEditing(false);
      setIsSaved(false);
    }
  }, [parsedEntry, currentCarOdometer]);

  if (!isOpen || !parsedEntry) return null;

  // Process & compress uploaded image files
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawData = e.target?.result as string;
        if (!rawData) return resolve('');

        const img = new Image();
        img.onload = () => {
          const maxDim = 1280;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          } else {
            resolve(rawData);
          }
        };
        img.onerror = () => resolve(rawData);
        img.src = rawData;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (navigator.vibrate) navigator.vibrate(20);
    setIsProcessingPhoto(true);

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const compressed = await processImageFile(file);
          if (compressed) newUrls.push(compressed);
        }
      }
      if (newUrls.length > 0) {
        setAttachedPhotos(prev => [...prev, ...newUrls]);
      }
    } catch (err) {
      console.error('Error reading receipt photos:', err);
    } finally {
      setIsProcessingPhoto(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.vibrate) navigator.vibrate(15);
    setAttachedPhotos(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = () => {
    if (navigator.vibrate) navigator.vibrate(25);

    // Build final entry
    const finalOdometer = typeof odometer === 'number' ? odometer : (currentCarOdometer ?? 0);
    const finalCostParts = typeof costParts === 'number' ? costParts : 0;
    const finalCostWork = typeof costWork === 'number' ? costWork : 0;
    const finalTotalCost = typeof totalCost === 'number'
      ? totalCost
      : (finalCostParts + finalCostWork);

    const partsUsedList: ServicePartUsed[] = partsText.trim()
      ? partsText.split(',').map(s => ({ name: s.trim() })).filter(p => p.name.length > 0)
      : (parsedEntry?.partsUsed ?? []);

    const finalEntry: ParsedServiceEntry = {
      title: title.trim() || parsedEntry?.title || 'Техническое обслуживание',
      odometer: finalOdometer,
      worksDone: [title.trim() || parsedEntry?.title || 'Обслуживание'],
      partsUsed: partsUsedList,
      costParts: finalCostParts,
      costWork: finalCostWork,
      totalCost: finalTotalCost,
      category: category,
      comment: parsedEntry?.comment,
      rawTranscript: parsedEntry?.rawTranscript,
      photoUrls: attachedPhotos,
      attachments: attachedPhotos,
    };

    setIsSaved(true);
    setTimeout(() => {
      onConfirmSave(finalEntry);
    }, 450);
  };

  const handleStartEditing = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    setIsEditing(true);
  };

  const handleAskToRedictate = () => {
    if (onEditRequest) {
      const finalEntry: ParsedServiceEntry = {
        title,
        odometer: typeof odometer === 'number' ? odometer : (currentCarOdometer ?? 0),
        worksDone: [title || 'Обслуживание'],
        partsUsed: partsText ? partsText.split(',').map(s => ({ name: s.trim() })) : [],
        costParts: typeof costParts === 'number' ? costParts : 0,
        costWork: typeof costWork === 'number' ? costWork : 0,
        totalCost: typeof totalCost === 'number' ? totalCost : 0,
        category,
        rawTranscript: parsedEntry?.rawTranscript,
      };
      onEditRequest(finalEntry);
    } else {
      setIsEditing(true);
    }
  };

  // Formatted parts display string with optional chaining
  const displayParts = partsText.trim() || 
    ((parsedEntry?.partsUsed?.length ?? 0) > 0
      ? parsedEntry!.partsUsed.map(p => (typeof p === 'string' ? p : p?.name || '')).filter(Boolean).join(', ')
      : 'Не указаны');

  // Formatted cost display
  const displayCostNum = typeof totalCost === 'number'
    ? totalCost
    : ((typeof costParts === 'number' ? costParts : 0) + (typeof costWork === 'number' ? costWork : 0));

  const displayOdometer = typeof odometer === 'number' ? odometer : (currentCarOdometer ?? 0);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-[#0f172a] border-2 border-cyan-500/30 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
        id="confirm-service-modal"
      >
        
        {/* Header with Vasilich Badge */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E273D] bg-[#111622]/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Василич проверил запись
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-semibold">
                  ПРОВЕРКА
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {carName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 flex items-center justify-center cursor-pointer transition-colors"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {isSaved ? (
            <div className="py-8 flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-white">Запись успешно сохранена!</h3>
              <p className="text-sm text-slate-400">
                Одометр обновлен, данные зафиксированы в истории авто.
              </p>
            </div>
          ) : !isEditing ? (
            <>
              {/* Vasilich Speech Bubble */}
              <div className="bg-[#111622] border border-cyan-500/20 rounded-xl p-4 text-slate-200">
                <div className="flex items-start gap-2.5 mb-3">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base font-semibold text-white">
                    «Я понял так:
                  </span>
                </div>

                {/* Structured verification summary list */}
                <div className="space-y-2.5 pl-3 border-l-2 border-cyan-500/30 font-sans text-sm sm:text-[15px]">
                  {/* 1. Работа */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-slate-400 font-medium shrink-0">• Работа:</span>
                    <span className="text-white font-bold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                      {title || 'Обслуживание'}
                    </span>
                  </div>

                  {/* 2. Пробег */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-slate-400 font-medium shrink-0">• Пробег:</span>
                    <span className="text-cyan-400 font-mono font-bold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                      {displayOdometer.toLocaleString('ru-RU')}
                    </span>
                    <span className="text-slate-400 text-xs font-mono">{distanceLabel}</span>
                  </div>

                  {/* 3. Запчасти */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-slate-400 font-medium shrink-0">• Запчасти:</span>
                    <span className="text-amber-300 font-medium bg-amber-950/30 px-2 py-0.5 rounded border border-amber-500/20">
                      {displayParts}
                    </span>
                  </div>

                  {/* 4. Стоимость */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-slate-400 font-medium shrink-0">• Стоимость:</span>
                    <span className="text-emerald-400 font-mono font-bold text-base bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/20">
                      {displayCostNum > 0 ? displayCostNum.toLocaleString('ru-RU') : '0'} {currencySymbol}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-800 text-sm font-semibold text-cyan-300">
                  Всё верно?»
                </div>
              </div>

              {/* Raw speech hint */}
              {parsedEntry.rawTranscript && (
                <div className="px-1 text-[11px] text-slate-400 font-mono truncate">
                  Исходный текст: «{parsedEntry.rawTranscript}»
                </div>
              )}
            </>
          ) : (
            /* Inline Edit Mode */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" /> Редактирование полей
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Отмена правки
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Название работы / Что сделано:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Замена свечей зажигания"
                  className="w-full bg-[#111622] border border-[#1E273D] focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none"
                  id="edit-field-title"
                />
              </div>

              {/* Odometer & Cost in 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Пробег ({distanceLabel}):
                  </label>
                  <input
                    type="number"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="60000"
                    className="w-full bg-[#111622] border border-[#1E273D] focus:border-cyan-500 text-white font-mono rounded-xl px-3.5 py-2.5 text-sm outline-none"
                    id="edit-field-odometer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Стоимость ({currencySymbol}):
                  </label>
                  <input
                    type="number"
                    value={totalCost}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setTotalCost(val);
                      setCostParts(val);
                    }}
                    placeholder="6000"
                    className="w-full bg-[#111622] border border-[#1E273D] focus:border-cyan-500 text-emerald-400 font-mono rounded-xl px-3.5 py-2.5 text-sm outline-none font-bold"
                    id="edit-field-cost"
                  />
                </div>
              </div>

              {/* Parts */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Запчасти и материалы (через запятую):
                </label>
                <input
                  type="text"
                  value={partsText}
                  onChange={(e) => setPartsText(e.target.value)}
                  placeholder="Свечи NGK, Масляный фильтр"
                  className="w-full bg-[#111622] border border-[#1E273D] focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none"
                  id="edit-field-parts"
                />
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Категория:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'maintenance', label: 'ТО' },
                    { id: 'repair', label: 'Ремонт' },
                    { id: 'tuning', label: 'Тюнинг' },
                    { id: 'symptom', label: 'Жалоба' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id as ServiceCategory)}
                      className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                        category === cat.id
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-[#111622] border-[#1E273D] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              ФОТОГРАФИИ ЧЕКОВ И ДОКУМЕНТОВ (ATTACHMENTS)
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div className="bg-[#111622] border border-cyan-500/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Чеки и документы {attachedPhotos.length > 0 && `(${attachedPhotos.length})`}
                </span>
              </div>
              {isProcessingPhoto && (
                <span className="text-[11px] text-cyan-400 animate-pulse font-mono">
                  Сжатие фото...
                </span>
              )}
            </div>

            {/* Hidden Inputs for Camera and File Picker */}
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={cameraInputRef} 
              onChange={(e) => handleFilesSelected(e.target.files)} 
              className="hidden" 
              id="receipt-camera-input"
            />
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              ref={fileInputRef} 
              onChange={(e) => handleFilesSelected(e.target.files)} 
              className="hidden" 
              id="receipt-gallery-input"
            />

            {/* Action Buttons for Upload - Minimum 48px height touch zones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(20);
                  cameraInputRef.current?.click();
                }}
                disabled={isProcessingPhoto}
                className="min-h-[48px] px-4 py-2.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shadow-sm"
                id="btn-take-receipt-photo"
              >
                <Camera className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>📷 Снять чек на камеру</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(15);
                  fileInputRef.current?.click();
                }}
                disabled={isProcessingPhoto}
                className="min-h-[48px] px-4 py-2.5 bg-[#151C2C] hover:bg-[#1E273D] border border-[#1E273D] hover:border-slate-500 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shadow-sm"
                id="btn-upload-receipt-gallery"
              >
                <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Прикрепить из файлов</span>
              </button>
            </div>

            {/* Attached Photos Gallery Preview */}
            {attachedPhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {attachedPhotos.map((url, idx) => (
                  <div 
                    key={idx}
                    className="relative group h-24 bg-[#090C12] border border-[#1E273D] hover:border-cyan-500/50 rounded-xl overflow-hidden shadow-sm transition-all"
                  >
                    <img 
                      src={url} 
                      alt={`receipt-${idx + 1}`} 
                      className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-200" 
                      onClick={() => setActiveLightboxImg(url)}
                    />
                    <div className="absolute top-1 left-1 bg-black/75 backdrop-blur-xs text-[9px] font-mono text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/20">
                      Чек #{idx + 1}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleRemovePhoto(idx, e)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center cursor-pointer shadow transition-transform active:scale-90"
                      title="Удалить фото"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLightboxImg(url)}
                      className="absolute bottom-1 right-1 w-6 h-6 rounded-md bg-black/70 text-slate-200 hover:text-white flex items-center justify-center cursor-pointer"
                      title="Увеличить"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 text-center py-1">
                Можно сфотографировать кассовый чек, заказ-наряд или накладную на запчасти
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions (Garage-friendly large buttons) */}
        {!isSaved && (
          <div className="p-4 border-t border-[#1E273D] bg-[#111622] flex flex-col sm:flex-row items-center gap-3">
            {/* Button 1: Сохранить в историю */}
            <button
              type="button"
              onClick={handleSave}
              className="w-full sm:flex-1 h-13 sm:h-14 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-sans font-extrabold text-base sm:text-lg rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2.5 cursor-pointer active:scale-98 transition-all"
              id="btn-confirm-save-service"
            >
              <Check className="w-6 h-6 stroke-[3]" />
              <span>Сохранить в историю</span>
            </button>

            {/* Button 2: Исправить */}
            {!isEditing ? (
              <button
                type="button"
                onClick={handleStartEditing}
                className="w-full sm:w-auto px-5 h-13 sm:h-14 bg-[#1a2234] hover:bg-[#222d46] border border-cyan-500/20 hover:border-cyan-500/40 text-slate-200 font-sans font-semibold text-sm sm:text-base rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
                id="btn-confirm-edit-service"
              >
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <span>Исправить</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAskToRedictate}
                className="w-full sm:w-auto px-4 h-13 sm:h-14 bg-[#1a2234] hover:bg-[#222d46] border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                title="Надиктовать заново"
              >
                <ArrowLeft className="w-4 h-4 text-slate-400" />
                <span>Надиктовать</span>
              </button>
            )}
          </div>
        )}

        {/* Lightbox Preview Modal for receipts */}
        {activeLightboxImg && (
          <div 
            className="fixed inset-0 z-[140] bg-black/95 flex flex-col items-center justify-center p-4 animate-fade-in"
            onClick={() => setActiveLightboxImg(null)}
          >
            <button
              type="button"
              onClick={() => setActiveLightboxImg(null)}
              className="absolute top-4 right-4 p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl cursor-pointer"
              title="Закрыть"
            >
              <X className="w-6 h-6" />
            </button>
            <div 
              className="max-w-4xl max-h-[85vh] p-2 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={activeLightboxImg} 
                alt="Увеличенный чек" 
                className="max-w-full max-h-[85vh] object-contain rounded-xl border border-cyan-500/30 shadow-2xl" 
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
