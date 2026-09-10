/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MaintenanceRecord, RecordCategory } from '../types';
import { 
  Wrench, 
  Settings, 
  CircleDot, 
  DollarSign, 
  Calendar, 
  Gauge, 
  Layers,
  FileText,
  Image as ImageIcon,
  Edit3,
  Trash2,
  Cpu,
  Disc,
  Sliders,
  Droplets,
  Zap,
  Shield,
  Clock,
  Receipt,
  Paperclip,
  ZoomIn,
  X
} from 'lucide-react';
import { CATEGORY_NAMES } from './AddRecordForm';
import { useUserSettings } from './UserSettingsContext';

export interface ServiceRecordCardProps {
  key?: string;
  record: MaintenanceRecord;
  onDelete?: (id: string) => void;
  onEdit?: (record: MaintenanceRecord) => void;
  onSelect?: (record: MaintenanceRecord) => void;
}

export function ServiceRecordCard({ record, onDelete, onEdit, onSelect }: ServiceRecordCardProps) {
  const { formatCurrency, formatMileage } = useUserSettings();
  const [cardLightboxImg, setCardLightboxImg] = useState<string | null>(null);

  if (!record) return null;

  const totalCost = (record?.partsPrice ?? 0) + (record?.laborPrice ?? 0);

  // Unified list of photo receipts and documents with optional chaining
  const allPhotos = Array.from(new Set([
    ...(record?.attachments || []),
    ...(record?.photoUrls || []),
    ...(record?.photoReceiptUrl ? [record.photoReceiptUrl] : [])
  ])).filter(Boolean);

  // Helper to get node/category icon
  const getCategoryIcon = (category?: RecordCategory) => {
    switch (category) {
      case 'Engine':
        return Cpu;
      case 'Brakes':
        return Disc;
      case 'Suspension':
        return Sliders;
      case 'Transmission':
        return Layers;
      case 'Oil & Fluids':
        return Droplets;
      case 'Electrical':
        return Zap;
      case 'Diagnostics':
        return Gauge;
      case 'Body':
        return Shield;
      default:
        return Wrench;
    }
  };

  // Helper to get system tag based on category
  const getSystemTag = (category?: RecordCategory) => {
    switch (category) {
      case 'Engine': return 'Раздел-01: Двигатель';
      case 'Suspension': return 'Раздел-02: Подвеска и ходовая';
      case 'Brakes': return 'Раздел-03: Тормозная система';
      case 'Transmission': return 'Раздел-04: Коробка передач';
      case 'Electrical': return 'Раздел-05: Электрика и свет';
      case 'Body': return 'Раздел-06: Кузовной ремонт';
      case 'Oil & Fluids': return 'Раздел-07: Масла и жидкости';
      case 'Diagnostics': return 'Раздел-08: Диагностика';
      default: return 'Раздел-09: Разное';
    }
  };

  const CategoryIcon = getCategoryIcon(record?.category);

  return (
    <div 
      onClick={() => {
        if (navigator.vibrate) navigator.vibrate(10);
        if (onSelect && record) onSelect(record);
      }}
      className="bg-[#111622] hover:bg-[#151C2C] border border-[#1E273D] hover:border-cyan-500/30 rounded-2xl p-3.5 sm:p-4 transition-all group cursor-pointer font-sans relative overflow-hidden shadow-sm"
    >
      {/* Header section with compact category icon on the top-left */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1E273D] pb-3 mb-3 gap-2">
        <div className="flex items-center gap-2.5">
          {/* Category icon badge */}
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-[#06B6D4] flex items-center justify-center shrink-0">
            <CategoryIcon className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-100 leading-snug group-hover:text-cyan-300 transition-colors">
              {record?.description || record?.title || 'Запись ТО'}
            </h4>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {(record?.category && CATEGORY_NAMES[record.category]) || record?.category || 'Обслуживание'}
            </div>
          </div>
        </div>

        {/* Date & Badges */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pl-10 sm:pl-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {record?.relatedDtc && (
              <span className="bg-rose-950/80 border border-rose-500/30 text-rose-300 text-[10px] font-mono px-1.5 py-0.5 rounded-md">
                {record.relatedDtc}
              </span>
            )}
            {record?.source === 'task' && (
              <span className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-md">
                Из плана
              </span>
            )}
            {allPhotos.length > 0 && (
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  if (navigator.vibrate) navigator.vibrate(10);
                  setCardLightboxImg(allPhotos[0]);
                }}
                className="bg-cyan-950/80 hover:bg-cyan-900/90 border border-cyan-500/30 text-cyan-300 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                title="Посмотреть прикрепленный чек"
              >
                <Receipt className="w-3 h-3 text-cyan-400" />
                <span>Чек ({allPhotos.length})</span>
              </span>
            )}
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500 sm:hidden" />
              {record?.date || ''}
            </span>
          </div>

          {/* Quick Edit icon */}
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (navigator.vibrate) navigator.vibrate(15);
                if (record) onEdit(record);
              }}
              className="p-1 rounded-lg border border-[#1E273D] hover:border-cyan-500/40 bg-[#0B0E14] text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Редактировать"
              id={`btn-quick-edit-${record?.id || 'new'}`}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pb-2 text-xs">
        {/* Main Info */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-start space-y-2">
          {/* Mileage */}
          <div className="inline-flex items-center text-xs text-slate-300 bg-[#0B0E14] border border-[#1E273D] px-2.5 py-1 rounded-lg w-fit">
            <Gauge className="w-3.5 h-3.5 mr-1.5 text-[#06B6D4] shrink-0" />
            <span className="text-slate-400 mr-1">Пробег:</span>
            <span className="font-semibold text-slate-100 font-mono">{formatMileage(record?.mileage ?? record?.odometer ?? 0)}</span>
          </div>

          {/* Parts Used */}
          {(record?.partsUsed?.length ?? 0) > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#06B6D4]" />
                <span>Замененные запчасти:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {record?.partsUsed?.map((part: any, idx) => {
                  const partName = typeof part === 'string' ? part : (part?.name || String(part));
                  return (
                    <span 
                      key={idx}
                      className="text-[11px] bg-[#0B0E14] border border-[#1E273D] text-slate-300 px-2 py-0.5 rounded-md"
                      title={partName}
                    >
                      {partName}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Voice transcript */}
          {record?.voiceTranscript && (
            <div className="text-[11px] bg-[#0B0E14] border border-[#1E273D] rounded-lg p-2 text-slate-400 italic leading-relaxed">
              «{record.voiceTranscript}»
            </div>
          )}
        </div>

        {/* Cost Summary */}
        <div className="md:col-span-5 lg:col-span-4 border-t md:border-t-0 md:border-l border-[#1E273D] pt-2 md:pt-0 md:pl-3 flex flex-col justify-between">
          <div className="space-y-1 text-xs">
            {(record?.partsPrice ?? 0) > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Запчасти:</span>
                <span className="font-mono text-slate-300">{formatCurrency(record?.partsPrice ?? 0)}</span>
              </div>
            )}
            {(record?.laborPrice ?? 0) > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Работы:</span>
                <span className="font-mono text-slate-300">{formatCurrency(record?.laborPrice ?? 0)}</span>
              </div>
            )}
          </div>

          <div className="mt-2 pt-1.5 border-t border-[#1E273D] flex justify-between items-center">
            <span className="text-[11px] text-slate-400">Итого:</span>
            <span className="text-xs sm:text-sm font-bold text-cyan-300 font-mono">
              {formatCurrency(totalCost)}
            </span>
          </div>
        </div>
      </div>

      {/* Attached Receipts & Media */}
      {allPhotos.length > 0 && (
        <div className="mt-2 pt-2.5 border-t border-[#1E273D]">
          <div className="text-[11px] text-slate-300 font-medium mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span className="text-slate-200">Чеки и документы ({allPhotos.length}):</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">нажмите для зума</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
            {allPhotos.map((url, i) => (
              <div 
                key={i} 
                onClick={(e) => {
                  e.stopPropagation();
                  if (navigator.vibrate) navigator.vibrate(10);
                  setCardLightboxImg(url);
                }}
                className="relative group w-20 h-16 border border-[#1E273D] hover:border-cyan-500/50 rounded-xl overflow-hidden bg-[#0B0E14] shrink-0 cursor-pointer transition-all shadow-sm"
                title={`Чек #${i + 1} — нажать для просмотра`}
              >
                <img 
                  src={url} 
                  alt={`receipt-${i + 1}`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 opacity-90 group-hover:opacity-100" 
                  referrerPolicy="no-referrer" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-black/75 backdrop-blur-xs text-[9px] text-center font-mono text-cyan-300 py-0.5">
                  Чек #{i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-2.5 pt-2 border-t border-[#1E273D] flex items-center justify-end gap-2">
        {onEdit && (
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (navigator.vibrate) navigator.vibrate(15);
              if (record) onEdit(record);
            }}
            className="text-xs text-slate-300 hover:text-white border border-[#1E273D] hover:border-cyan-500/40 bg-[#151C2C] px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors font-medium"
            id={`btn-edit-${record?.id || 'new'}`}
            title="Редактировать запись"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Редактировать</span>
          </button>
        )}
        {onDelete && (
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (navigator.vibrate) navigator.vibrate(15);
              if (record?.id) onDelete(record.id);
            }}
            className="text-xs text-rose-400 hover:text-rose-200 border border-[#1E273D] hover:border-rose-500/40 bg-[#151C2C] px-3 py-1.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 font-medium"
            id={`btn-del-${record?.id || 'new'}`}
            title="Удалить запись"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Удалить</span>
          </button>
        )}
      </div>

      {/* Fullscreen Lightbox for Card */}
      {cardLightboxImg && (
        <div 
          className="fixed inset-0 z-[150] bg-black/95 flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setCardLightboxImg(null);
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCardLightboxImg(null);
            }}
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
              src={cardLightboxImg} 
              alt="Чек / Документ" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl border border-cyan-500/40 shadow-2xl" 
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Alias for backward compatibility
export const RecordCard = ServiceRecordCard;
