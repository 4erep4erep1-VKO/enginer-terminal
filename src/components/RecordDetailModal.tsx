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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-2xl bg-[#111622] border border-[#1E273D] rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col relative">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#1E273D] bg-[#111622] relative">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 pr-10">
            <div className="flex items-center gap-2">
              <span className="bg-cyan-500/10 border border-cyan-500/25 text-[#06B6D4] text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase">
                {CATEGORY_NAMES[record.category] || record.category}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {record.id}
            </div>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
            {record.description}
          </h2>

          <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-1.5 bg-[#0B0E14] px-2.5 py-1 border border-[#1E273D] rounded-lg">
              <Calendar className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>{record.date}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#0B0E14] px-2.5 py-1 border border-[#1E273D] rounded-lg">
              <Gauge className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>{formatMileage(record.mileage)}</span>
            </div>
          </div>

          {/* Quick Header Actions: Edit & Delete buttons */}
          <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-[#1E273D] sm:border-t-0 sm:pt-0 sm:mt-0 sm:absolute sm:top-4 sm:right-4">
            <button
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                onEdit(record);
                onClose();
              }}
              className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-[#151C2C] hover:bg-[#1C253B] border border-[#1E273D] rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 font-medium"
              title="Редактировать запись"
              id="btn-modal-quick-edit"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>Изменить</span>
            </button>
            <button
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                onDelete(record.id);
                onClose();
              }}
              className="px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-200 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/40 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 font-medium"
              title="Удалить запись"
              id="btn-modal-quick-delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Удалить</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#151C2C] rounded-lg transition-colors cursor-pointer ml-auto sm:ml-0"
              title="Закрыть"
              id="btn-modal-close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-200">
          
          {/* Financial Breakdown Grid */}
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>Стоимость обслуживания</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-sans">
              <div className="bg-[#0B0E14] border border-[#1E273D] p-3 rounded-xl">
                <span className="block text-[11px] text-slate-400 uppercase mb-0.5">Запчасти</span>
                <span className="text-sm font-semibold font-mono text-slate-200">{formatCurrency(record.partsPrice)}</span>
              </div>
              <div className="bg-[#0B0E14] border border-[#1E273D] p-3 rounded-xl">
                <span className="block text-[11px] text-slate-400 uppercase mb-0.5">Работа</span>
                <span className="text-sm font-semibold font-mono text-slate-200">{formatCurrency(record.laborPrice)}</span>
              </div>
              <div className="bg-[#151C2C] border border-cyan-500/30 p-3 rounded-xl">
                <span className="block text-[11px] text-[#06B6D4] font-semibold uppercase mb-0.5">Итого</span>
                <span className="text-base font-bold font-mono text-[#06B6D4]">{formatCurrency(totalCost)}</span>
              </div>
            </div>
          </div>

          {/* Replaced Parts List */}
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>Использованные детали и расходники</span>
            </div>

            {record.partsUsed && record.partsUsed.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {record.partsUsed.map((partName, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[#0B0E14] border border-[#1E273D] p-2.5 rounded-xl text-xs text-slate-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#06B6D4] shrink-0" />
                    <span className="truncate">{partName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-3 border border-dashed border-[#1E273D] rounded-xl bg-[#0B0E14]/40">
                Перечень запчастей не указан
              </div>
            )}
          </div>

          {/* Voice Transcript (if available) */}
          {record.voiceTranscript && (
            <div className="space-y-1.5">
              <div className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>Голосовая заметка</span>
              </div>
              <div className="p-3 bg-[#0B0E14] border border-[#1E273D] rounded-xl text-xs text-slate-300 leading-relaxed italic">
                «{record.voiceTranscript}»
              </div>
            </div>
          )}

          {/* Attached Photos Gallery */}
          {record.photoUrls && record.photoUrls.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>Фотографии ({record.photoUrls.length})</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {record.photoUrls.map((url, i) => (
                  <div 
                    key={i} 
                    onClick={() => setLightboxImg(url)}
                    className="group relative h-24 border border-[#1E273D] bg-[#0B0E14] rounded-xl overflow-hidden cursor-pointer hover:border-cyan-500/50 transition-all shadow-sm"
                  >
                    <img 
                      src={url} 
                      alt={`record-photo-${i}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="w-5 h-5 text-[#06B6D4]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-[#1E273D] bg-[#111622] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(15);
              onEdit(record);
              onClose();
            }}
            className="btn-primary py-2 px-4 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            id="btn-modal-edit-full"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Редактировать</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary py-2 px-4 text-xs font-semibold rounded-xl cursor-pointer"
            id="btn-modal-close-full"
          >
            Закрыть
          </button>
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
