/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FluidKey, DEFAULT_FLUID_PRESETS } from '../lib/calcFluidHealth';
import { Car } from '../types';
import { 
  X, 
  Sliders, 
  RotateCcw, 
  Check, 
  Droplet, 
  Gauge, 
  Calendar,
  Layers,
  Wrench,
  Sparkles,
  Info
} from 'lucide-react';

export interface EditRegulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCar: Car | null;
  customLimits: Partial<Record<FluidKey, { maxKm: number; maxDays: number }>>;
  onSaveLimits: (newLimits: Partial<Record<FluidKey, { maxKm: number; maxDays: number }>>) => void;
  onResetAllToDefault: () => void;
}

const FLUID_KEYS: FluidKey[] = ['engine_oil', 'brake_fluid', 'coolant', 'transmission_oil'];

export function EditRegulationsModal({
  isOpen,
  onClose,
  activeCar,
  customLimits,
  onSaveLimits,
  onResetAllToDefault,
}: EditRegulationsModalProps) {
  // Local draft state for all 4 fluids
  const [draft, setDraft] = useState<Record<FluidKey, { maxKm: number; maxDays: number }>>(() => {
    const initial: any = {};
    FLUID_KEYS.forEach((key) => {
      const preset = DEFAULT_FLUID_PRESETS[key];
      const custom = customLimits[key];
      initial[key] = {
        maxKm: custom?.maxKm ?? preset.maxKm,
        maxDays: custom?.maxDays ?? preset.maxDays,
      };
    });
    return initial;
  });

  // Re-sync when modal opens or customLimits change
  useEffect(() => {
    if (isOpen) {
      const updated: any = {};
      FLUID_KEYS.forEach((key) => {
        const preset = DEFAULT_FLUID_PRESETS[key];
        const custom = customLimits[key];
        updated[key] = {
          maxKm: custom?.maxKm ?? preset.maxKm,
          maxDays: custom?.maxDays ?? preset.maxDays,
        };
      });
      setDraft(updated);
    }
  }, [isOpen, customLimits]);

  if (!isOpen) return null;

  const handleFieldChange = (key: FluidKey, field: 'maxKm' | 'maxDays', value: number) => {
    const safeValue = Math.max(1, value);
    setDraft((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: safeValue,
      },
    }));
  };

  const handleResetSingle = (key: FluidKey) => {
    const preset = DEFAULT_FLUID_PRESETS[key];
    setDraft((prev) => ({
      ...prev,
      [key]: {
        maxKm: preset.maxKm,
        maxDays: preset.maxDays,
      },
    }));
  };

  const handleSave = () => {
    onSaveLimits(draft);
    onClose();
  };

  const handleResetAll = () => {
    const defaultDraft: any = {};
    FLUID_KEYS.forEach((key) => {
      defaultDraft[key] = {
        maxKm: DEFAULT_FLUID_PRESETS[key].maxKm,
        maxDays: DEFAULT_FLUID_PRESETS[key].maxDays,
      };
    });
    setDraft(defaultDraft);
    onResetAllToDefault();
    onClose();
  };

  const getFluidVisuals = (key: FluidKey) => {
    switch (key) {
      case 'engine_oil':
        return {
          icon: <Droplet className="w-4 h-4 text-amber-400" />,
          accentBg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
          borderHover: 'hover:border-amber-500/30',
          quickKm: [5000, 7500, 10000, 15000],
        };
      case 'brake_fluid':
        return {
          icon: <Gauge className="w-4 h-4 text-rose-400" />,
          accentBg: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
          borderHover: 'hover:border-rose-500/30',
          quickKm: [30000, 40000, 50000],
        };
      case 'coolant':
        return {
          icon: <Droplet className="w-4 h-4 text-cyan-400" />,
          accentBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
          borderHover: 'hover:border-cyan-500/30',
          quickKm: [40000, 50000, 60000, 80000],
        };
      case 'transmission_oil':
        return {
          icon: <Layers className="w-4 h-4 text-purple-400" />,
          accentBg: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
          borderHover: 'hover:border-purple-500/30',
          quickKm: [45000, 60000, 80000],
        };
    }
  };

  const formatDaysToYears = (days: number) => {
    if (days % 365 === 0) {
      const years = days / 365;
      return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;
    }
    const years = (days / 365).toFixed(1);
    return `~${years} г.`;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-[#0F141E] border border-cyan-500/30 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-5 my-auto max-h-[90vh] flex flex-col"
        id="modal-edit-regulations"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E273D] pb-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Настройка регламентов жидкостей
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Dual-Limit
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {activeCar 
                  ? `Интервалы ТО для ${activeCar.make} ${activeCar.model} (${activeCar.year || ''})`
                  : 'Кастомизация сервисных интервалов'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Закрыть"
            id="btn-close-regulations-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-3.5 py-2.5 rounded-xl bg-cyan-950/25 border border-cyan-500/20 text-xs text-cyan-300 flex items-start gap-2.5 shrink-0">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-slate-300">
            Износ рассчитывается параллельно по пробегу и времени старения: срабатывает лимит, который наступил раньше. Изменения сохраняются и сразу обновляют индикаторы на приборной панели.
          </div>
        </div>

        {/* Fluid Limits Form List */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0 custom-scrollbar">
          {FLUID_KEYS.map((key) => {
            const preset = DEFAULT_FLUID_PRESETS[key];
            const current = draft[key];
            const visuals = getFluidVisuals(key);
            const isModified = current.maxKm !== preset.maxKm || current.maxDays !== preset.maxDays;

            return (
              <div
                key={key}
                className={`p-3.5 sm:p-4 rounded-xl bg-[#090C12] border border-[#1E273D] transition-colors ${visuals.borderHover}`}
              >
                {/* Item Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg border ${visuals.accentBg}`}>
                      {visuals.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                          {preset.nameRu}
                        </h4>
                        {isModified && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Кастомный
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {preset.description}
                      </p>
                    </div>
                  </div>

                  {isModified && (
                    <button
                      type="button"
                      onClick={() => handleResetSingle(key)}
                      className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Вернуть заводские значения для этой жидкости"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span className="hidden sm:inline">Сбросить</span>
                    </button>
                  )}
                </div>

                {/* Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Max Km */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-cyan-400" />
                        Макс. пробег (км):
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Завод: {preset.maxKm.toLocaleString('ru-RU')} км
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="500"
                        step="500"
                        value={current.maxKm}
                        onChange={(e) => handleFieldChange(key, 'maxKm', Number(e.target.value))}
                        className="w-full bg-[#111622] border border-[#1E273D] focus:border-cyan-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-mono outline-none transition-colors"
                      />
                      <span className="absolute right-3 top-2.5 text-[11px] text-slate-500 font-mono pointer-events-none">
                        км
                      </span>
                    </div>

                    {/* Quick Km suggestions */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[9px] text-slate-500">Быстро:</span>
                      {visuals.quickKm.map((km) => (
                        <button
                          key={km}
                          type="button"
                          onClick={() => handleFieldChange(key, 'maxKm', km)}
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                            current.maxKm === km
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                              : 'bg-[#111622] text-slate-400 border-[#1E273D] hover:text-white'
                          }`}
                        >
                          {(km / 1000).toLocaleString('ru-RU')}к
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Max Days */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        Макс. срок (дней):
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Завод: {preset.maxDays} дн. ({formatDaysToYears(preset.maxDays)})
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="30"
                        step="30"
                        value={current.maxDays}
                        onChange={(e) => handleFieldChange(key, 'maxDays', Number(e.target.value))}
                        className="w-full bg-[#111622] border border-[#1E273D] focus:border-cyan-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-mono outline-none transition-colors"
                      />
                      <span className="absolute right-3 top-2.5 text-[11px] text-cyan-400 font-mono pointer-events-none">
                        {formatDaysToYears(current.maxDays)}
                      </span>
                    </div>

                    {/* Quick Days suggestions */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[9px] text-slate-500">Срок:</span>
                      {[
                        { label: '6 мес.', days: 180 },
                        { label: '1 год', days: 365 },
                        { label: '2 года', days: 730 },
                        { label: '3 года', days: 1095 },
                        { label: '4 года', days: 1460 },
                      ].map((d) => (
                        <button
                          key={d.days}
                          type="button"
                          onClick={() => handleFieldChange(key, 'maxDays', d.days)}
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                            current.maxDays === d.days
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                              : 'bg-[#111622] text-slate-400 border-[#1E273D] hover:text-white'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#1E273D] shrink-0">
          <button
            type="button"
            onClick={handleResetAll}
            className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-rose-300 border border-[#1E273D] hover:border-rose-500/30 bg-[#090C12] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            id="btn-reset-all-regulations"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сбросить всё к заводским</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#090C12] text-slate-400 hover:text-white border border-[#1E273D] text-xs font-semibold cursor-pointer transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.35)] flex items-center justify-center gap-1.5 transition-all"
              id="btn-save-all-regulations"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Сохранить регламенты</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
