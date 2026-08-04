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
  Image as ImageIcon
} from 'lucide-react';
import { CATEGORY_NAMES } from './AddRecordForm';
import { useUserSettings } from './UserSettingsContext';

interface RecordCardProps {
  key?: string;
  record: MaintenanceRecord;
  onDelete?: (id: string) => void;
}

export function RecordCard({ record, onDelete }: RecordCardProps) {
  const { formatCurrency, formatMileage } = useUserSettings();
  const totalCost = record.partsPrice + record.laborPrice;

  // Helper to get system tag based on category
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

  // Helper to render an SVG blueprint wireframe depending on the category for a custom drafted feel
  const renderBlueprintSchematic = (category: RecordCategory) => {
    switch (category) {
      case 'Engine':
        return (
          <svg viewBox="0 0 100 100" className="w-16 h-16 stroke-cyan-500 fill-none opacity-80" strokeWidth="1.2">
            {/* Piston / Engine outline */}
            <path d="M30,20 L70,20 L70,35 L65,35 L65,60 L35,60 L35,35 L30,35 Z" />
            <circle cx="50" cy="75" r="12" />
            <line x1="50" y1="48" x2="50" y2="75" strokeDasharray="3,3" />
            <rect x="35" y="25" width="30" height="5" />
          </svg>
        );
      case 'Brakes':
        return (
          <svg viewBox="0 0 100 100" className="w-16 h-16 stroke-cyan-500 fill-none opacity-80" strokeWidth="1.2">
            {/* Brake rotor and caliper */}
            <circle cx="50" cy="50" r="32" />
            <circle cx="50" cy="50" r="10" />
            <path d="M25,25 C30,18 40,15 50,15 L60,15 L60,35 L45,35 Z" strokeWidth="2" />
            <line x1="50" y1="18" x2="50" y2="82" strokeDasharray="4,4" />
            <line x1="18" y1="50" x2="82" y2="50" strokeDasharray="4,4" />
          </svg>
        );
      case 'Oil & Fluids':
        return (
          <svg viewBox="0 0 100 100" className="w-16 h-16 stroke-cyan-500 fill-none opacity-80" strokeWidth="1.2">
            {/* Lubrication droplet & canister */}
            <path d="M50,15 L70,55 A22,22 0 1,1 30,55 Z" />
            <path d="M42,28 C45,32 55,32 58,28" />
            <line x1="50" y1="15" x2="50" y2="85" strokeDasharray="4,4" />
          </svg>
        );
      case 'Suspension':
        return (
          <svg viewBox="0 0 100 100" className="w-16 h-16 stroke-cyan-500 fill-none opacity-80" strokeWidth="1.2">
            {/* Shock absorber spring coil */}
            <path d="M50,10 L50,25 M50,75 L50,90" />
            <path d="M50,25 L35,30 L65,38 L35,46 L65,54 L35,62 L65,70 L50,75" strokeLinejoin="round" />
            <circle cx="50" cy="10" r="3" fill="currentColor" />
            <circle cx="50" cy="90" r="3" fill="currentColor" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 100 100" className="w-16 h-16 stroke-cyan-400 fill-none opacity-60" strokeWidth="1.2">
            {/* Gear / general tech outline */}
            <circle cx="50" cy="50" r="22" />
            <circle cx="50" cy="50" r="8" />
            {/* Gear teeth */}
            <path d="M50,12 L50,20 M50,80 L50,88 M12,50 L20,50 M80,50 L88,50 M23,23 L29,29 M71,71 L77,77 M23,77 L29,71 M71,23 L77,29" />
          </svg>
        );
    }
  };

  return (
    <div className="relative bento-card p-5 blueprint-corner transition-all hover:border-blueprint-cyan/50 group">
      {/* Background ID Spec Tag */}
      <div className="absolute top-0 right-4 -translate-y-1/2 bg-[#050a14] px-2 text-[10px] text-blueprint-cyan/60 tracking-wider border border-cyan-800/40 font-mono">
        НОМЕР ЗАПИСИ: {record.id.slice(0, 8).toUpperCase()}
      </div>

      {/* Grid crosshair accents */}
      <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-blueprint-cyan opacity-40"></div>
      <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-blueprint-cyan opacity-40"></div>

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between border-b border-cyan-800/30 pb-3 mb-4 gap-2">
        <div>
          <div className="text-[11px] text-blueprint-cyan tracking-widest uppercase font-mono mb-1">
            {getSystemTag(record.category)}
          </div>
          <h4 className="text-md font-bold text-cyan-100 tracking-tight leading-snug font-mono group-hover:text-cyan-400 transition-colors">
            {record.description}
          </h4>
        </div>
        <div className="text-right flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-1">
          <span className="bg-blueprint-cyan/10 border border-blueprint-cyan/30 text-blueprint-cyan text-[10px] font-mono px-2 py-0.5 tracking-wider uppercase">
            {CATEGORY_NAMES[record.category] || record.category}
          </span>
          <span className="text-[11px] text-cyan-300/60 font-mono mt-1">
            {record.date}
          </span>
        </div>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Schematic Wireframe */}
        <div className="md:col-span-3 flex items-center justify-center border border-cyan-800/40 bg-cyan-950/20 p-2 relative blueprint-corner">
          <div className="absolute inset-0 bg-[radial-gradient(#1e3b8a_1px,transparent_1px)] [background-size:8px_8px] opacity-10"></div>
          {renderBlueprintSchematic(record.category)}
          <div className="absolute bottom-1 right-1 text-[8px] text-blueprint-cyan/40 tracking-widest">ЧЕРТЕЖ</div>
        </div>

        {/* Diagnostic Metadata */}
        <div className="md:col-span-5 flex flex-col justify-center space-y-2">
          <div className="flex items-center text-xs text-cyan-200/80">
            <Gauge className="w-3.5 h-3.5 mr-2 text-blueprint-cyan shrink-0" />
            <span className="text-cyan-400/50 mr-1.5 uppercase tracking-wider text-[10px]">Пробег:</span>
            <span className="font-semibold text-cyan-100">{formatMileage(record.mileage)}</span>
          </div>

          {record.partsUsed && record.partsUsed.length > 0 && (
            <div className="text-xs">
              <div className="flex items-center text-cyan-200/80 mb-1">
                <Layers className="w-3.5 h-3.5 mr-2 text-blueprint-cyan shrink-0" />
                <span className="text-cyan-400/50 uppercase tracking-wider text-[10px]">Замененные детали:</span>
              </div>
              <ul className="pl-5 list-disc space-y-0.5 text-[11px] text-cyan-300/70 font-mono">
                {record.partsUsed.map((p, idx) => (
                  <li key={idx} className="truncate" title={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {record.voiceTranscript && (
            <div className="text-[10px] bg-cyan-950/10 border border-cyan-800/30 p-2 text-blueprint-cyan/80 font-mono leading-relaxed relative blueprint-corner">
              <span className="text-[8px] text-cyan-400/40 uppercase block mb-1">Распознанный голос:</span>
              "{record.voiceTranscript}"
            </div>
          )}
        </div>

        {/* Bill of Materials (BOM) Costing */}
        <div className="md:col-span-4 border-l border-cyan-800/30 pl-4 flex flex-col justify-between">
          <div className="space-y-1.5 text-xs">
            <div className="text-[10px] text-blueprint-cyan/60 tracking-wider uppercase font-mono">ФИНАНСОВЫЙ ОТЧЕТ</div>
            
            <div className="flex justify-between text-[11px] text-cyan-300/80">
              <span>Запчасти:</span>
              <span className="font-semibold">{formatCurrency(record.partsPrice)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-cyan-300/80">
              <span>Стоимость работ:</span>
              <span className="font-semibold">{formatCurrency(record.laborPrice)}</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-dashed border-cyan-800/40">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-blueprint-cyan font-mono uppercase tracking-widest font-semibold">ИТОГО</span>
              <span className="text-md font-bold text-cyan-400 font-mono">
                {formatCurrency(totalCost)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Attached Media */}
      {record.photoUrls && record.photoUrls.length > 0 && (
        <div className="mt-4 pt-3 border-t border-cyan-800/30">
          <div className="text-[9px] text-blueprint-cyan/50 tracking-wider uppercase mb-1.5 flex items-center">
            <ImageIcon className="w-3 h-3 mr-1" /> ФОТООТЧЕТ И СНИМКИ РЕМОНТА
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {record.photoUrls.map((url, i) => (
              <div key={i} className="w-16 h-12 border border-cyan-800/40 bg-blueprint-bg/60 relative group/img cursor-zoom-in shrink-0 blueprint-corner">
                <img src={url} alt={`record-${i}`} className="w-full h-full object-cover opacity-70 group-hover/img:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 border border-cyan-500/0 group-hover/img:border-cyan-500/40 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete / Action Trigger */}
      {onDelete && (
        <div className="absolute bottom-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0 z-10">
          <button 
            onClick={() => onDelete(record.id)}
            className="text-[10px] text-red-400/80 hover:text-red-400 border border-red-500/40 hover:border-red-500 bg-red-950/40 px-2 py-0.5 font-mono cursor-pointer whitespace-nowrap shrink-0 flex-shrink-0"
            id={`btn-del-${record.id}`}
          >
            УДАЛИТЬ ЗАПИСЬ
          </button>
        </div>
      )}
    </div>
  );
}
