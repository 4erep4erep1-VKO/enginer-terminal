/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
  Clock
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
  const totalCost = record.partsPrice + record.laborPrice;

  // Helper to get node/category icon
  const getCategoryIcon = (category: RecordCategory) => {
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
  const getSystemTag = (category: RecordCategory) => {
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

  const CategoryIcon = getCategoryIcon(record.category);

  return (
    <div 
      onClick={() => {
        if (navigator.vibrate) navigator.vibrate(10);
        if (onSelect) onSelect(record);
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
              {record.description}
            </h4>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {CATEGORY_NAMES[record.category] || record.category}
            </div>
          </div>
        </div>

        {/* Date & Badges */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pl-10 sm:pl-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {record.relatedDtc && (
              <span className="bg-rose-950/80 border border-rose-500/30 text-rose-300 text-[10px] font-mono px-1.5 py-0.5 rounded-md">
                {record.relatedDtc}
              </span>
            )}
            {record.source === 'task' && (
              <span className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-md">
                Из плана
              </span>
            )}
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500 sm:hidden" />
              {record.date}
            </span>
          </div>

          {/* Quick Edit icon */}
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (navigator.vibrate) navigator.vibrate(15);
                onEdit(record);
              }}
              className="p-1 rounded-lg border border-[#1E273D] hover:border-cyan-500/40 bg-[#0B0E14] text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Редактировать"
              id={`btn-quick-edit-${record.id}`}
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
            <span className="font-semibold text-slate-100 font-mono">{formatMileage(record.mileage)}</span>
          </div>

          {/* Parts Used */}
          {record.partsUsed && record.partsUsed.length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#06B6D4]" />
                <span>Замененные запчасти:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {record.partsUsed.map((part, idx) => (
                  <span 
                    key={idx}
                    className="text-[11px] bg-[#0B0E14] border border-[#1E273D] text-slate-300 px-2 py-0.5 rounded-md"
                    title={part}
                  >
                    {part}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Voice transcript */}
          {record.voiceTranscript && (
            <div className="text-[11px] bg-[#0B0E14] border border-[#1E273D] rounded-lg p-2 text-slate-400 italic leading-relaxed">
              «{record.voiceTranscript}»
            </div>
          )}
        </div>

        {/* Cost Summary */}
        <div className="md:col-span-5 lg:col-span-4 border-t md:border-t-0 md:border-l border-[#1E273D] pt-2 md:pt-0 md:pl-3 flex flex-col justify-between">
          <div className="space-y-1 text-xs">
            {record.partsPrice > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Запчасти:</span>
                <span className="font-mono text-slate-300">{formatCurrency(record.partsPrice)}</span>
              </div>
            )}
            {record.laborPrice > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Работы:</span>
                <span className="font-mono text-slate-300">{formatCurrency(record.laborPrice)}</span>
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

      {/* Attached Media */}
      {record.photoUrls && record.photoUrls.length > 0 && (
        <div className="mt-1.5 pt-2 border-t border-[#1E273D]">
          <div className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1">
            <ImageIcon className="w-3 h-3 text-[#06B6D4]" />
            <span>Фотоотчет</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {record.photoUrls.map((url, i) => (
              <div key={i} className="w-16 h-12 border border-[#1E273D] rounded-lg overflow-hidden bg-[#0B0E14] shrink-0">
                <img src={url} alt={`record-${i}`} className="w-full h-full object-cover opacity-90" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-2 pt-2 border-t border-[#1E273D] flex items-center justify-end gap-1.5">
        {onEdit && (
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (navigator.vibrate) navigator.vibrate(15);
              onEdit(record);
            }}
            className="text-xs text-slate-300 hover:text-white border border-[#1E273D] hover:border-cyan-500/40 bg-[#151C2C] px-2.5 py-1 rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
            id={`btn-edit-${record.id}`}
            title="Редактировать запись"
          >
            <Edit3 className="w-3 h-3 text-[#06B6D4]" />
            <span>Редактировать</span>
          </button>
        )}
        {onDelete && (
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (navigator.vibrate) navigator.vibrate(15);
              onDelete(record.id);
            }}
            className="text-xs text-rose-400 hover:text-rose-200 border border-[#1E273D] hover:border-rose-500/40 bg-[#151C2C] px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
            id={`btn-del-${record.id}`}
            title="Удалить запись"
          >
            <Trash2 className="w-3 h-3" />
            <span>Удалить</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Alias for backward compatibility
export const RecordCard = ServiceRecordCard;
