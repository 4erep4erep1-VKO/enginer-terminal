/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Car, Part, ObdSnapshot, DtcDiagnosisPayload } from '../types';
import { useUserSettings } from './UserSettingsContext';
import { 
  Bot, 
  Package, 
  Plus, 
  Wrench, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  ArrowRight,
  PlusCircle
} from 'lucide-react';

interface DtcActionBridgeProps {
  activeCar: Car | null;
  dtcCode: string;
  dtcDescription: string;
  severity?: string;
  category?: string;
  possibleCauses?: string[];
  availableParts: Part[];
  obdSnapshot?: ObdSnapshot | null;
  onAskVasilich: (payload: DtcDiagnosisPayload | string) => void;
  onCreateTask: (taskData: {
    title: string;
    description: string;
    relatedDtc: string;
    relatedPartIds?: string[];
    category?: any;
  }) => void;
  onNavigateToPartsWithFilter: (filter: string) => void;
  onAddCandidatePartToStock?: (partName: string) => void;
}

// Map common DTC patterns to suggested candidate repair parts
export function getCandidatePartsForDtc(dtcCode: string): string[] {
  const code = dtcCode.toUpperCase().trim();
  
  // Misfires (P0300 - P0308)
  if (code.startsWith('P030') || code === 'P0300') {
    return ['Свечи зажигания', 'Катушка зажигания', 'Высоковольтные провода', 'Топливная форсунка'];
  }
  // Fuel Trim / Air-Fuel (P0170, P0171, P0172, P0174)
  if (code === 'P0171' || code === 'P0172' || code === 'P0170' || code === 'P0174') {
    return ['Датчик кислорода (Лямбда-зонд)', 'ДМРВ (Датчик массового расхода воздуха)', 'Топливный фильтр', 'Регулятор давления топлива'];
  }
  // MAF / MAP (P0100 - P0108)
  if (code.startsWith('P010')) {
    return ['ДМРВ (Датчик расхода воздуха)', 'Воздушный фильтр', 'Датчик абсолютного давления (MAP)'];
  }
  // Coolant / Thermostat (P0115 - P0119, P0128)
  if (code.startsWith('P011') || code === 'P0128') {
    return ['Датчик температуры ОЖ (ДТОЖ)', 'Термостат', 'Антифриз'];
  }
  // Throttle / TPS (P0120 - P0124, P2135)
  if (code.startsWith('P012') || code === 'P2135') {
    return ['Датчик положения дроссельной заслонки (ДПДЗ)', 'Дроссельная заслонка'];
  }
  // Catalyst (P0420, P0430)
  if (code === 'P0420' || code === 'P0430') {
    return ['Датчик кислорода (2-й лямбда-зонд)', 'Каталитический нейтрализатор', 'Прокладка приемной трубы'];
  }
  // Crankshaft / Camshaft (P0335, P0340)
  if (code === 'P0335' || code === 'P0336' || code === 'P0340' || code === 'P0341') {
    return ['Датчик положения коленвала (ДПКВ)', 'Датчик положения распредвала (ДПРВ)', 'Ремень / цепь ГРМ'];
  }
  // EGR / EVAP (P0400, P0440 - P0455)
  if (code.startsWith('P040') || code.startsWith('P044') || code.startsWith('P045')) {
    return ['Клапан продувки адсорбера', 'Клапан EGR', 'Крышка бензобака'];
  }
  // Generic Fallback
  return ['Датчик системы', 'Расходные материалы'];
}

export function DtcActionBridge({
  activeCar,
  dtcCode,
  dtcDescription,
  severity = 'warning',
  category = 'Engine',
  possibleCauses = [],
  availableParts = [],
  obdSnapshot,
  onAskVasilich,
  onCreateTask,
  onNavigateToPartsWithFilter,
  onAddCandidatePartToStock,
}: DtcActionBridgeProps) {
  const { formatCurrency } = useUserSettings();
  const [isPartsExpanded, setIsPartsExpanded] = useState(false);
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);

  // 1. Candidate repair parts based on DTC code
  const candidatePartNames = useMemo(() => getCandidatePartsForDtc(dtcCode), [dtcCode]);

  // 2. Find parts actually present in user's inventory
  const matchingParts = useMemo(() => {
    return availableParts.filter(part => {
      const pName = part.name.toLowerCase();
      const pNum = (part.partNumber || '').toLowerCase();
      const dCode = dtcCode.toLowerCase();

      // Check direct DTC or candidate words
      if (pName.includes(dCode) || pNum.includes(dCode)) return true;

      return candidatePartNames.some(candidate => {
        const words = candidate.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        return words.some(w => pName.includes(w));
      });
    });
  }, [availableParts, candidatePartNames, dtcCode]);

  const hasInStock = matchingParts.some(p => p.quantity > (p.reservedQuantity || 0));

  // Handle Ask Vasilich with structured payload
  const handleAskVasilich = () => {
    if (navigator.vibrate) navigator.vibrate(15);
    const payload: DtcDiagnosisPayload = {
      type: 'dtc_diagnosis',
      dtcCode,
      dtcDescription,
      severity,
      vehicle: activeCar ? {
        make: activeCar.make,
        model: activeCar.model,
        year: activeCar.year,
        engine: activeCar.engine,
        mileage: activeCar.mileage,
        vin: activeCar.vin
      } : undefined,
      obdSnapshot,
      relevantParts: matchingParts,
    };
    onAskVasilich(payload);
  };

  // Handle Create Task with linked DTC and selected parts
  const handleCreateTask = () => {
    if (navigator.vibrate) navigator.vibrate(20);
    const chosenPartIds = selectedPartIds.length > 0 
      ? selectedPartIds 
      : matchingParts.filter(p => p.quantity > (p.reservedQuantity || 0)).map(p => p.id);

    onCreateTask({
      title: `Устранение ${dtcCode}: ${dtcDescription}`,
      description: `Диагностика и устранение неисправности ЭБУ (${dtcCode}). ` + 
        (possibleCauses.length > 0 ? `Возможные причины: ${possibleCauses.slice(0, 2).join(', ')}.` : ''),
      relatedDtc: dtcCode,
      relatedPartIds: chosenPartIds,
      category: category === 'Transmission' ? 'Transmission' : category === 'Brakes' ? 'Brakes' : 'Engine',
    });
  };

  const togglePartSelection = (partId: string) => {
    setSelectedPartIds(prev => 
      prev.includes(partId) ? prev.filter(id => id !== partId) : [...prev, partId]
    );
  };

  const isCritical = severity === 'critical' || dtcCode.startsWith('P03') || dtcCode.startsWith('P01');

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isCritical 
        ? 'bg-rose-950/30 border-rose-500/40 shadow-[0_4px_20px_rgba(244,63,94,0.1)]' 
        : 'bg-slate-900/90 border-slate-800 shadow-md'
    }`}>
      
      {/* Top Header: DTC Code, Badges, Severity */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`text-xl font-black font-mono tracking-wider ${
            isCritical ? 'text-rose-400' : 'text-amber-400'
          }`}>
            {dtcCode}
          </span>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
            isCritical 
              ? 'bg-rose-950 text-rose-300 border-rose-500/40' 
              : 'bg-amber-950 text-amber-300 border-amber-500/40'
          }`}>
            {category} • {severity}
          </span>
          {hasInStock && (
            <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Запчасть на складе
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm font-semibold text-slate-100 font-sans mb-3 leading-snug">
        {dtcDescription}
      </p>

      {/* Possible causes list */}
      {possibleCauses && possibleCauses.length > 0 && (
        <div className="mb-3.5 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Вероятные причины:
          </span>
          <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
            {possibleCauses.map((cause, idx) => (
              <li key={idx} className="leading-tight">{cause}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Accordion / Drawer: Warehouse Parts Linking */}
      {isPartsExpanded && (
        <div className="mb-4 p-3 bg-[#0a0f18] rounded-xl border border-cyan-500/30 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-cyan-400" />
              <span>Запчасти для устранения {dtcCode}</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigateToPartsWithFilter(dtcCode)}
              className="text-[11px] text-cyan-400 hover:text-cyan-200 underline font-medium cursor-pointer"
            >
              Открыть весь склад
            </button>
          </div>

          {/* 1. Parts found in user inventory */}
          {matchingParts.length > 0 ? (
            <div className="space-y-2">
              <span className="text-[10px] text-emerald-400 font-bold uppercase">В наличии на складе:</span>
              {matchingParts.map(part => {
                const availableQty = Math.max(0, part.quantity - (part.reservedQuantity || 0));
                const isSelected = selectedPartIds.includes(part.id);
                return (
                  <div 
                    key={part.id}
                    onClick={() => togglePartSelection(part.id)}
                    className={`p-2.5 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200 shadow-sm'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold truncate text-slate-100">{part.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Арт: {part.partNumber || '—'} • {formatCurrency(part.price)}
                        {part.location && ` • Ячейка: ${part.location}`}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                        availableQty > 0 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950 text-rose-300'
                      }`}>
                        {availableQty} шт. свободно
                      </span>
                      {part.reservedQuantity ? (
                        <div className="text-[9px] text-amber-400 mt-0.5 font-mono">
                          (резерв: {part.reservedQuantity})
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-2.5 bg-slate-900/80 rounded-lg text-xs text-slate-400">
              На складе не найдено готовых деталей под этот узел.
            </div>
          )}

          {/* 2. Suggested candidate parts to add */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Рекомендуемые узлы к проверке/замене:</span>
            <div className="flex flex-wrap gap-1.5">
              {candidatePartNames.map((name, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (onAddCandidatePartToStock) {
                      onAddCandidatePartToStock(name);
                    } else {
                      onNavigateToPartsWithFilter(name);
                    }
                  }}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-300 rounded-lg text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                  title="Добавить позицию на склад"
                >
                  <PlusCircle className="w-3 h-3 text-cyan-400" />
                  <span>{name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MAIN 3 DTC ACTIONS (P0 Touch-Targets >= 44-48px) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
        
        {/* 1. РАЗОБРАТЬ С ВАСИЛИЧЕМ */}
        <button
          type="button"
          onClick={handleAskVasilich}
          className="min-h-[46px] px-3.5 bg-cyan-950/80 hover:bg-cyan-900/90 border border-cyan-500/50 text-cyan-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_12px_rgba(6,182,212,0.15)] active:scale-[0.98]"
          id={`btn-dtc-vasilich-${dtcCode}`}
        >
          <Bot className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="truncate">Разобрать с Василичем</span>
        </button>

        {/* 2. ПРОВЕРИТЬ ЗАПЧАСТИ */}
        <button
          type="button"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(10);
            setIsPartsExpanded(prev => !prev);
          }}
          className={`min-h-[46px] px-3.5 border rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] ${
            isPartsExpanded 
              ? 'bg-slate-800 border-cyan-500/60 text-cyan-300' 
              : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-200'
          }`}
          id={`btn-dtc-parts-${dtcCode}`}
        >
          <Package className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">Запчасти ({matchingParts.length})</span>
          {isPartsExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        {/* 3. СОЗДАТЬ ЗАДАЧУ */}
        <button
          type="button"
          onClick={handleCreateTask}
          className="min-h-[46px] px-3.5 bg-amber-950/80 hover:bg-amber-900/90 border border-amber-500/60 text-amber-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_12px_rgba(245,158,11,0.15)] active:scale-[0.98]"
          id={`btn-dtc-task-${dtcCode}`}
        >
          <Plus className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">Создать задачу</span>
        </button>

      </div>

    </div>
  );
}
