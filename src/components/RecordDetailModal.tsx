/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MaintenanceRecord, RecordCategory } from '../types';
import { 
  X, 
  Edit3, 
  Trash2, 
  Calendar, 
  Gauge, 
  Layers, 
  DollarSign, 
  Image as ImageIcon, 
  Mic, 
  ZoomIn, 
  Download,
  Wrench,
  CheckCircle2
} from 'lucide-react';
import { CATEGORY_NAMES } from './AddRecordForm';
import { useUserSettings } from './UserSettingsContext';

interface RecordDetailModalProps {
  record: MaintenanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (record: MaintenanceRecord) => void;
  onDelete: (id: string) => void;
}

export function RecordDetailModal({ record, isOpen, onClose, onEdit, onDelete }: RecordDetailModalProps) {
  const { formatCurrency, formatMileage } = useUserSettings();
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const totalCost = record.partsPrice + record.laborPrice;

  const getSystemTag = (category: RecordCategory) => {
    switch (category) {
      case 'Engine': return 'РАЗДЕЛ-01: ДВИГАТЕЛЬ';
      case 'Suspension': return 'РАЗДЕЛ-02: ПОДВЕСКА И ХОДОВАЯ';
      case 'Brakes': return 'РАЗДЕЛ-03: ТОРМОЗНАЯ СИСТЕМА';
      case 'Transmission': return 'РАЗДЕЛ-04: КОРОБКА ПЕРЕДАЧ (КПП)';
      case 'Electrical': return 'РАЗДЕЛ-05: ЭЛЕКТРИКА И СВЕТ';
      case 'Body': return 'РАЗДЕЛ-06: КУЗОВНОЙ РЕМОНТ';
      case 'Oil & Fluids': return 'РАЗДЕЛ-07: МАСЛА И ЖИДКОСТИ';
      case 'Diagnostics': return 'РАЗДЕЛ-08: ДИАГНОСТИКА';
      default: return 'РАЗДЕЛ-09: РАЗНОЕ';
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl bg-slate-900/95 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col relative blueprint-corner">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-cyan-800/40 bg-cyan-950/40 relative">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pr-10">
            <div className="flex items-center gap-2">
              <span className="bg-blueprint-cyan/15 border border-blueprint-cyan/40 text-blueprint-cyan text-[10px] font-mono px-2.5 py-0.5 tracking-wider uppercase font-bold">
                {CATEGORY_NAMES[record.category] || record.category}
              </span>
              <span className="text-[10px] text-cyan-400/60 font-mono">
                {getSystemTag(record.category)}
              </span>
            </div>
            <div className="text-[10px] text-blueprint-cyan/60 font-mono tracking-wider">
              ID: {record.id.toUpperCase()}
            </div>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white font-mono tracking-tight leading-snug">
            {record.description}
          </h2>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-cyan-300/80 font-mono">
            <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 border border-cyan-800/40 rounded">
              <Calendar className="w-3.5 h-3.5 text-blueprint-cyan" />
              <span>{record.date}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 border border-cyan-800/40 rounded">
              <Gauge className="w-3.5 h-3.5 text-blueprint-cyan" />
              <span>{formatMileage(record.mileage)}</span>
            </div>
          </div>

          {/* Quick Header Actions: Edit & Delete buttons with clear labels */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-cyan-800/30 sm:border-t-0 sm:pt-0 sm:mt-0 sm:absolute sm:top-4 sm:right-4">
            <button
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                onEdit(record);
                onClose();
              }}
              className="px-3 py-1.5 text-xs text-cyan-300 hover:text-white bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/60 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 font-medium shadow-sm"
              title="Редактировать запись"
              id="btn-modal-quick-edit"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Редактировать</span>
            </button>
            <button
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                onDelete(record.id);
                onClose();
              }}
              className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 font-medium shadow-sm"
              title="Удалить запись"
              id="btn-modal-quick-delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Удалить</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer ml-auto sm:ml-0"
              title="Закрыть"
              id="btn-modal-close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Financial Breakdown Grid */}
          <div className="space-y-2.5">
            <div className="text-[10px] text-blueprint-cyan/80 tracking-wider uppercase font-mono flex items-center gap-1.5 font-bold">
              <DollarSign className="w-3.5 h-3.5 text-blueprint-cyan" />
              <span>ФИНАНСОВАЯ РАЗБИВКА И СТОИМОСТЬ ОБСЛУЖИВАНИЯ</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
              <div className="bg-black/50 border border-cyan-800/30 p-3.5 rounded-xl blueprint-corner">
                <span className="block text-[10px] text-cyan-400/70 uppercase mb-1 font-semibold">Запчасти</span>
                <span className="text-base font-bold text-cyan-100">{formatCurrency(record.partsPrice)}</span>
              </div>
              <div className="bg-black/50 border border-cyan-800/30 p-3.5 rounded-xl blueprint-corner">
                <span className="block text-[10px] text-cyan-400/70 uppercase mb-1 font-semibold">Работа</span>
                <span className="text-base font-bold text-cyan-100">{formatCurrency(record.laborPrice)}</span>
              </div>
              <div className="bg-cyan-950/40 border border-blueprint-cyan/50 p-3.5 rounded-xl blueprint-corner shadow-[0_0_20px_rgba(6,182,212,0.18)]">
                <span className="block text-[10px] text-cyan-300 font-extrabold uppercase mb-1">ИТОГО К ОПЛАТЕ</span>
                <span className="text-lg font-extrabold text-blueprint-cyan">{formatCurrency(totalCost)}</span>
              </div>
            </div>
            
            {/* Equation summary line */}
            <div className="text-xs font-mono text-cyan-400/70 bg-cyan-950/20 border border-cyan-900/30 px-3 py-1.5 rounded-lg flex items-center justify-between">
              <span>Расчет:</span>
              <span>[Запчасти: {formatCurrency(record.partsPrice)}] + [Работа: {formatCurrency(record.laborPrice)}] = <strong className="text-cyan-300 font-bold">[ИТОГО: {formatCurrency(totalCost)}]</strong></span>
            </div>
          </div>

          {/* Replaced Parts List */}
          <div className="space-y-2">
            <div className="text-[10px] text-blueprint-cyan/70 tracking-wider uppercase font-mono flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blueprint-cyan" />
              <span>ИСПОЛЬЗОВАННЫЕ ДЕТАЛИ И РАСХОДНЫЕ МАТЕРИАЛЫ</span>
            </div>

            {record.partsUsed && record.partsUsed.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {record.partsUsed.map((partName, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-950/60 border border-cyan-800/30 p-2.5 rounded-lg text-xs font-mono text-cyan-100">
                    <CheckCircle2 className="w-4 h-4 text-blueprint-cyan shrink-0" />
                    <span className="truncate">{partName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs font-mono text-cyan-400/40 italic p-3 border border-dashed border-cyan-800/30 rounded-lg">
                Конкретный перечень запчастей не указан
              </div>
            )}
          </div>

          {/* Voice Transcript (if available) */}
          {record.voiceTranscript && (
            <div className="space-y-2">
              <div className="text-[10px] text-blueprint-cyan/70 tracking-wider uppercase font-mono flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-blueprint-cyan" />
                <span>ГОЛОСОВАЯ ЗАМЕТКА / ТРАНСКРИПЦИЯ</span>
              </div>
              <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-xl text-xs font-mono text-cyan-200/90 leading-relaxed italic">
                "{record.voiceTranscript}"
              </div>
            </div>
          )}

          {/* Attached Photos Gallery */}
          {record.photoUrls && record.photoUrls.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] text-blueprint-cyan/70 tracking-wider uppercase font-mono flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blueprint-cyan" />
                <span>ФОТООТЧЕТ И СНИМКИ РЕМОНТА ({record.photoUrls.length})</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {record.photoUrls.map((url, i) => (
                  <div 
                    key={i} 
                    onClick={() => setLightboxImg(url)}
                    className="group relative h-28 border border-cyan-800/40 bg-black/60 rounded-xl overflow-hidden cursor-pointer hover:border-blueprint-cyan transition-all shadow-md"
                  >
                    <img 
                      src={url} 
                      alt={`record-photo-${i}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-100" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-cyan-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="w-6 h-6 text-blueprint-cyan" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-cyan-800/40 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-cyan-300/50 hidden sm:block">
            Нажмите на любую фотографию для полноэкранного просмотра
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                onEdit(record);
                onClose();
              }}
              className="flex-1 sm:flex-none btn-primary px-5 py-2.5 text-xs font-bold font-mono rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              id="btn-modal-edit-full"
            >
              <Edit3 className="w-4 h-4" />
              <span>Редактировать</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none btn-secondary px-5 py-2.5 text-xs font-bold font-mono rounded-xl cursor-pointer"
              id="btn-modal-close-full"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Fullscreen Modal */}
      {lightboxImg && (
        <div className="fixed inset-0 z-[120] bg-black/95 flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
            <a
              href={lightboxImg}
              download="repair-photo.jpg"
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl transition-colors cursor-pointer"
              title="Скачать фото"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              onClick={() => setLightboxImg(null)}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl transition-colors cursor-pointer"
              title="Закрыть"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="max-w-4xl max-h-[85vh] p-2 relative flex items-center justify-center">
            <img 
              src={lightboxImg} 
              alt="Fullscreen photo" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg border border-cyan-800/60 shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
