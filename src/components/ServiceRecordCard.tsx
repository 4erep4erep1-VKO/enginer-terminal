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
      className="bento-card p-5 transition-all group cursor-pointer font-sans relative overflow-hidden"
    >
      {/* Background ID Spec Tag */}
      <div className="absolute top-0 right-4 -translate-y-1/2 bg-[#0a0d14] px-2.5 py-0.5 rounded-full text-[10px] text-cyan-400/80 tracking-wide border border-cyan-500/30 font-mono flex items-center gap-1.5 shadow-sm">
        <span>ID: {record.id.slice(0, 8).toUpperCase()}</span>
      </div>

      {/* Header section with compact category icon on the top-left */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3.5 mb-3.5 gap-3">
        <div className="flex items-center gap-3">
          {/* Compact category node icon badge: w-9 h-9 rounded-xl */}
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 shadow-sm">
            <CategoryIcon className="w-4.5 h-4.5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-cyan-400 font-medium tracking-wide">
              {getSystemTag(record.category)}
            </div>
            <h4 className="text-base font-bold text-slate-100 tracking-tight leading-snug group-hover:text-cyan-300 transition-colors truncate sm:whitespace-normal">
              {record.description}
            </h4>
          </div>
        </div>

        {/* Category badge & Date & Header Quick Actions */}
        <div className="flex items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pl-12 sm:pl-0">
          <div className="flex flex-col sm:items-end gap-1">
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {record.relatedDtc && (
                <span className="bg-rose-950/90 border border-rose-500/50 text-rose-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg">
                  {record.relatedDtc}
                </span>
              )}
              {record.source === 'task' && (
                <span className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-lg">
                  Из задачи
                </span>
              )}
              <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold px-2.5 py-0.5 rounded-lg tracking-wide whitespace-nowrap">
                {CATEGORY_NAMES[record.category] || record.category}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500 sm:hidden" />
              {record.date}
            </span>
          </div>

          {/* Quick Edit icon button right on card header on mobile/desktop */}
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (navigator.vibrate) navigator.vibrate(15);
                onEdit(record);
              }}
              className="p-1.5 rounded-lg border border-cyan-500/30 hover:border-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 hover:text-white transition-all cursor-pointer shadow-sm"
              title="Редактировать запись"
              id={`btn-quick-edit-${record.id}`}
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Detail Grid: Optimized compact layout without bulky wireframe */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pb-4">
        {/* Main Info: Mileage, Replaced parts list, Voice transcript */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-start space-y-3">
          {/* Mileage Badge */}
          <div className="inline-flex items-center text-xs text-slate-300 bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-xl w-fit">
            <Gauge className="w-4 h-4 mr-2 text-cyan-400 shrink-0" />
            <span className="text-slate-400 mr-1.5 text-xs">Пробег:</span>
            <span className="font-semibold text-slate-100 font-mono">{formatMileage(record.mileage)}</span>
          </div>

          {/* Parts Used List */}
          {record.partsUsed && record.partsUsed.length > 0 && (
            <div className="text-xs space-y-1.5">
              <div className="flex items-center text-slate-300 font-medium">
                <Layers className="w-3.5 h-3.5 mr-1.5 text-cyan-400 shrink-0" />
                <span className="text-slate-300">Замененные детали:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pl-5">
                {record.partsUsed.map((part, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center text-[11px] bg-slate-900 border border-slate-800 text-slate-200 px-2.5 py-1 rounded-lg"
                    title={part}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1.5 shrink-0" />
                    {part}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Voice transcript */}
          {record.voiceTranscript && (
            <div className="text-xs bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 text-slate-300 leading-relaxed">
              <span className="text-[10px] text-cyan-400 font-semibold block mb-1">Распознанный голос:</span>
              "{record.voiceTranscript}"
            </div>
          )}
        </div>

        {/* Bill of Materials (BOM) Costing */}
        <div className="md:col-span-5 lg:col-span-4 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4 flex flex-col justify-between">
          <div className="space-y-2 text-xs">
            <div className="text-[11px] text-cyan-400/80 font-semibold tracking-wide uppercase">Финансовый отчет</div>
            
            <div className="flex justify-between text-xs text-slate-300">
              <span className="text-slate-400">Запчасти:</span>
              <span className="font-semibold font-mono text-slate-200">{formatCurrency(record.partsPrice)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-300">
              <span className="text-slate-400">Стоимость работ:</span>
              <span className="font-semibold font-mono text-slate-200">{formatCurrency(record.laborPrice)}</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Итого</span>
              <span className="text-base font-bold text-cyan-300 font-mono">
                {formatCurrency(totalCost)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Attached Media */}
      {record.photoUrls && record.photoUrls.length > 0 && (
        <div className="mt-2 pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Фотоотчет ремонта</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {record.photoUrls.map((url, i) => (
              <div key={i} className="w-20 h-16 border border-slate-800 rounded-lg overflow-hidden bg-slate-900 relative group/img shrink-0">
                <img src={url} alt={`record-${i}`} className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons (Edit + Delete) */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
        {onEdit && (
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (navigator.vibrate) navigator.vibrate(15);
              onEdit(record);
            }}
            className="text-xs text-cyan-300 hover:text-white border border-cyan-500/30 hover:border-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/60 px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-all font-medium"
            id={`btn-edit-${record.id}`}
            title="Редактировать запись"
          >
            <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
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
            className="text-xs text-rose-400 hover:text-rose-200 border border-rose-500/30 hover:border-rose-500 bg-rose-950/30 hover:bg-rose-900/50 px-3 py-1.5 rounded-lg cursor-pointer transition-all font-medium flex items-center gap-1"
            id={`btn-del-${record.id}`}
            title="Удалить запись"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Удалить</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Alias for backward compatibility
export const RecordCard = ServiceRecordCard;
