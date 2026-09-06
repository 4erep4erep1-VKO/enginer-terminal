/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Car, MaintenanceRecord } from '../types';
import {
  FluidKey,
  DEFAULT_FLUID_PRESETS,
  calculateAllFluidsHealth,
  FluidHealthCalculation,
  FluidStatusLevel
} from '../lib/calcFluidHealth';
import { EditRegulationsModal } from './EditRegulationsModal';
import {
  Droplet,
  Droplets,
  Disc,
  ThermometerSnowflake,
  Cog,
  Clock,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Plus,
  ArrowUpRight,
  Sliders,
  X,
  Check,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface FluidHealthWidgetProps {
  activeCar: Car | null;
  records: MaintenanceRecord[];
  onOpenAddRecord?: (initialData?: { description?: string; category?: any; mileage?: number; date?: string }) => void;
  onNavigateToRagWithQuestion?: (question: string) => void;
  className?: string;
  compact?: boolean;
}

export function FluidHealthWidget({
  activeCar,
  records,
  onOpenAddRecord,
  onNavigateToRagWithQuestion,
  className = '',
  compact = false,
}: FluidHealthWidgetProps) {
  // Local storage for user custom limits and manual overrides per vehicle
  const storageKey = activeCar ? `fluid_custom_limits_${activeCar.id}` : null;
  const lastServiceStorageKey = activeCar ? `fluid_manual_last_service_${activeCar.id}` : null;

  const [customLimits, setCustomLimits] = useState<Record<string, { maxKm?: number; maxDays?: number }>>(() => {
    if (!storageKey) return {};
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [customLastService, setCustomLastService] = useState<Record<string, { lastServicedKm?: number; lastServicedDate?: string }>>(() => {
    if (!lastServiceStorageKey) return {};
    try {
      const saved = localStorage.getItem(lastServiceStorageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<FluidKey | null>(null);
  const [tempLimits, setTempLimits] = useState<{ maxKm: number; maxDays: number }>({ maxKm: 7500, maxDays: 365 });
  const [tempLastService, setTempLastService] = useState<{ km: number | ''; date: string }>({ km: '', date: '' });

  // Re-sync storage when activeCar changes
  useEffect(() => {
    if (!storageKey) {
      setCustomLimits({});
      setCustomLastService({});
      return;
    }
    try {
      const savedLimits = localStorage.getItem(storageKey);
      setCustomLimits(savedLimits ? JSON.parse(savedLimits) : {});
    } catch {
      setCustomLimits({});
    }

    try {
      const savedLast = lastServiceStorageKey ? localStorage.getItem(lastServiceStorageKey) : null;
      setCustomLastService(savedLast ? JSON.parse(savedLast) : {});
    } catch {
      setCustomLastService({});
    }
  }, [storageKey, lastServiceStorageKey]);

  // Save all regulations from modal
  const handleSaveAllRegulations = (newLimits: Partial<Record<FluidKey, { maxKm: number; maxDays: number }>>) => {
    setCustomLimits(newLimits);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(newLimits));
    }
  };

  // Reset all regulations to factory presets
  const handleResetAllRegulations = () => {
    setCustomLimits({});
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  };

  // Update storage when single fluid custom limits change
  const handleSaveLimits = (key: FluidKey, maxKm: number, maxDays: number, manualKm?: number, manualDate?: string) => {
    if (!storageKey || !lastServiceStorageKey) return;

    const newLimits = {
      ...customLimits,
      [key]: { maxKm, maxDays }
    };
    setCustomLimits(newLimits);
    localStorage.setItem(storageKey, JSON.stringify(newLimits));

    if (manualKm !== undefined || manualDate !== undefined) {
      const newLastService = {
        ...customLastService,
        [key]: {
          lastServicedKm: manualKm !== undefined && manualKm > 0 ? manualKm : undefined,
          lastServicedDate: manualDate ? manualDate : undefined
        }
      };
      setCustomLastService(newLastService);
      localStorage.setItem(lastServiceStorageKey, JSON.stringify(newLastService));
    }

    setEditingKey(null);
  };

  const handleResetToDefault = (key: FluidKey) => {
    if (!storageKey || !lastServiceStorageKey) return;
    const preset = DEFAULT_FLUID_PRESETS[key];
    const newLimits = { ...customLimits };
    delete newLimits[key];
    setCustomLimits(newLimits);
    localStorage.setItem(storageKey, JSON.stringify(newLimits));

    const newLast = { ...customLastService };
    delete newLast[key];
    setCustomLastService(newLast);
    localStorage.setItem(lastServiceStorageKey, JSON.stringify(newLast));

    setEditingKey(null);
  };

  // Instant reactive calculation when activeCar.mileage or records change
  const fluidsHealth = useMemo(() => {
    return calculateAllFluidsHealth({
      carId: activeCar?.id || null,
      currentMileage: activeCar?.mileage || 0,
      records,
      customLimits: customLimits as any,
      customLastService: customLastService as any,
    });
  }, [activeCar?.id, activeCar?.mileage, records, customLimits, customLastService]);

  const fluidsList = useMemo(() => {
    return Object.values(fluidsHealth);
  }, [fluidsHealth]);

  // Overall counts for summary chip
  const { criticalCount, replaceDueCount, normalCount } = useMemo(() => {
    let critical = 0;
    let replaceDue = 0;
    let normal = 0;

    fluidsList.forEach(f => {
      if (f.statusLevel === 'critical') critical++;
      else if (f.statusLevel === 'replace_due') replaceDue++;
      else normal++;
    });

    return { criticalCount: critical, replaceDueCount: replaceDue, normalCount: normal };
  }, [fluidsList]);

  // Icon selector
  const getFluidIcon = (key: FluidKey) => {
    switch (key) {
      case 'engine_oil':
        return <Droplet className="w-4 h-4 text-cyan-400" />;
      case 'brake_fluid':
        return <Disc className="w-4 h-4 text-amber-400" />;
      case 'coolant':
        return <ThermometerSnowflake className="w-4 h-4 text-teal-300" />;
      case 'transmission_oil':
        return <Cog className="w-4 h-4 text-indigo-400" />;
    }
  };

  // Status badge styling according to user specification
  // • 🟢 Зеленый (> 30%): "В норме"
  // • 🟡 Оранжевый (10% - 30%): "Требуется замена (Срок/Пробег)"
  // • 🔴 Красный (< 10%): "Критический износ / Потеря свойств"
  const getStatusBadge = (statusLevel: FluidStatusLevel, statusText: string) => {
    switch (statusLevel) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.25)] animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            {statusText}
          </span>
        );
      case 'replace_due':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {statusText}
          </span>
        );
      case 'normal':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/35">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {statusText}
          </span>
        );
    }
  };

  // Progress Bar Gradient
  const getProgressBarClass = (statusLevel: FluidStatusLevel) => {
    switch (statusLevel) {
      case 'critical':
        return 'bg-gradient-to-r from-red-600 via-rose-500 to-red-400 shadow-[0_0_12px_rgba(239,68,68,0.5)]';
      case 'replace_due':
        return 'bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)]';
      case 'normal':
      default:
        return 'bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 shadow-[0_0_10px_rgba(16,185,129,0.35)]';
    }
  };

  const openEditModal = (fluid: FluidHealthCalculation) => {
    const preset = DEFAULT_FLUID_PRESETS[fluid.fluidKey];
    setEditingKey(fluid.fluidKey);
    setTempLimits({
      maxKm: fluid.maxKm || preset.maxKm,
      maxDays: fluid.maxDays || preset.maxDays,
    });
    setTempLastService({
      km: fluid.lastServicedKm > 0 ? fluid.lastServicedKm : '',
      date: fluid.lastServicedDate ? fluid.lastServicedDate.slice(0, 10) : '',
    });
  };

  if (!activeCar) {
    return null;
  }

  return (
    <section
      className={`rounded-2xl bg-[#10151E]/90 backdrop-blur-md border border-cyan-500/20 p-4 sm:p-5 shadow-[0_0_25px_rgba(6,182,212,0.06)] relative font-sans ${className}`}
      id="widget-fluid-health"
    >
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-cyan-500/15">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <Droplets className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                Здоровье жидкостей
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Dual-Limit
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Контроль износа по пробегу и сроку старения • Текущий одометр: <span className="font-mono text-cyan-300 font-semibold">{activeCar.mileage?.toLocaleString('ru-RU') || 0} км</span>
            </p>
          </div>
        </div>

        {/* Header Status Badges & Action */}
        <div className="flex items-center gap-2 flex-wrap">
          {criticalCount > 0 && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/35 animate-pulse">
              Критично: {criticalCount}
            </span>
          )}
          {replaceDueCount > 0 && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/35">
              К замене: {replaceDueCount}
            </span>
          )}
          {criticalCount === 0 && replaceDueCount === 0 && (
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Все в норме
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsSettingsOpen(true);
            }}
            className="p-1.5 px-2 rounded-lg bg-[#0B0E14] border border-[#1E273D] hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Настройка регламентов и интервалов (все жидкости)"
            id="btn-fluid-widget-settings"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium hidden sm:inline">Регламенты</span>
          </button>
        </div>
      </div>

      {/* Fluid Items List */}
      <div className={`mt-4 grid gap-3.5 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {fluidsList.map((fluid) => {
          const isCritical = fluid.statusLevel === 'critical';
          const isReplaceDue = fluid.statusLevel === 'replace_due';
          const preset = DEFAULT_FLUID_PRESETS[fluid.fluidKey];

          return (
            <div
              key={fluid.fluidKey}
              className={`p-3 sm:p-3.5 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                isCritical
                  ? 'bg-rose-950/15 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.08)]'
                  : isReplaceDue
                  ? 'bg-amber-950/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.06)]'
                  : 'bg-[#090C12]/80 border-cyan-500/10 hover:border-cyan-500/30'
              }`}
              id={`fluid-item-${fluid.fluidKey}`}
            >
              {/* Card Top: Title, Health %, and Status Badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-[#111622] border border-[#1E273D] shrink-0">
                    {getFluidIcon(fluid.fluidKey)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-[13px] font-bold text-white truncate">
                        {fluid.nameRu}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {preset.description}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-baseline justify-end gap-1">
                    <span
                      className={`text-base sm:text-lg font-mono font-extrabold leading-none ${
                        isCritical
                          ? 'text-rose-400'
                          : isReplaceDue
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {fluid.remainingHealth}%
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">ресурс</span>
                  </div>
                </div>
              </div>

              {/* Status Badge & Wear Reason Subtext */}
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                {getStatusBadge(fluid.statusLevel, fluid.statusText)}

                {/* Explicit Reason Subtext if time aging or km exceeded */}
                {fluid.wearReasonText && (
                  <span
                    className={`text-[10px] font-mono font-medium px-1.5 py-0.2 rounded ${
                      fluid.isTimeExceeded
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : fluid.isKmExceeded
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'text-slate-400'
                    }`}
                  >
                    {fluid.wearReasonText}
                  </span>
                )}
              </div>

              {/* Visual Dual-Limit Progress Bar */}
              <div className="w-full h-2.5 sm:h-3 bg-[#0B0E14] border border-[#1E273D] rounded-full overflow-hidden p-0.5 relative mb-2.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressBarClass(
                    fluid.statusLevel
                  )}`}
                  style={{ width: `${Math.max(3, fluid.remainingHealth)}%` }}
                />
              </div>

              {/* Metrics & Limits Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 bg-[#0B0E14]/70 p-2 rounded-lg border border-[#1E273D]/60 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-3 h-3 text-cyan-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-slate-500">Пробег: </span>
                    <span className={`font-semibold ${fluid.isKmExceeded ? 'text-amber-300' : 'text-slate-200'}`}>
                      {fluid.kmPassed.toLocaleString('ru-RU')} / {fluid.maxKm.toLocaleString('ru-RU')} км
                    </span>
                    <span className="text-[9px] text-slate-500 ml-1">({Math.round(fluid.kmPercent)}%)</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-slate-500">Срок: </span>
                    <span className={`font-semibold ${fluid.isTimeExceeded ? 'text-rose-300' : 'text-slate-200'}`}>
                      {fluid.daysPassed} / {fluid.maxDays} дн.
                    </span>
                    <span className="text-[9px] text-slate-500 ml-1">({Math.round(fluid.daysPercent)}%)</span>
                  </div>
                </div>
              </div>

              {/* Bottom Footer Row: Last Service Info & Quick Actions */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-cyan-500/10 text-[10px]">
                <div className="text-slate-400 truncate">
                  {fluid.lastServicedDate ? (
                    <span>
                      Посл. замена:{' '}
                      <span className="text-slate-300 font-medium">
                        {new Date(fluid.lastServicedDate).toLocaleDateString('ru-RU')}
                      </span>{' '}
                      ({fluid.lastServicedKm.toLocaleString('ru-RU')} км)
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">Нет записей о замене</span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Записать замену */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenAddRecord) {
                        onOpenAddRecord({
                          description: `Замена: ${fluid.nameRu}`,
                          category: preset.category as any,
                          mileage: activeCar.mileage || 0,
                          date: new Date().toISOString().slice(0, 10),
                        });
                      }
                    }}
                    className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                    title="Записать замену в журнал ТО"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>Замена</span>
                  </button>

                  {/* Настроить */}
                  <button
                    type="button"
                    onClick={() => openEditModal(fluid)}
                    className="p-1 rounded bg-[#111622] hover:bg-[#151C2C] text-slate-400 hover:text-slate-200 border border-[#1E273D] transition-colors cursor-pointer"
                    title="Изменить ресурс или дату замены"
                  >
                    <Settings className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Setting Quick Link / Vasilich Advice */}
      <div className="mt-3.5 pt-3 border-t border-cyan-500/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>
            Ресурс рассчитывается по двум лимитам одновременно (срабатывает тот, что наступил раньше).
          </span>
        </div>

        {onNavigateToRagWithQuestion && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const worstFluid = [...fluidsList].sort((a, b) => a.remainingHealth - b.remainingHealth)[0];
              onNavigateToRagWithQuestion(
                `Какое масло и жидкости рекомендуются по мануалу для ${activeCar.make} ${activeCar.model} (${activeCar.engine || ''})? Что требуется для замены: ${worstFluid.nameRu}?`
              );
            }}
            className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 shrink-0 font-medium cursor-pointer"
            id="btn-fluid-ask-vasilich"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Допуски и объемы у Василича →</span>
          </button>
        )}
      </div>

      {/* EDIT MODAL FOR A SINGLE FLUID */}
      {editingKey && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-[#111622] border border-cyan-500/30 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E273D] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400">
                  {getFluidIcon(editingKey)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Ресурс: {DEFAULT_FLUID_PRESETS[editingKey].nameRu}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Индивидуальная настройка регламентов для {activeCar.make} {activeCar.model}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingKey(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Limit KM */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>Максимальный пробег (км):</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    По умолчанию: {DEFAULT_FLUID_PRESETS[editingKey].maxKm.toLocaleString('ru-RU')} км
                  </span>
                </label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={tempLimits.maxKm}
                  onChange={(e) => setTempLimits(prev => ({ ...prev, maxKm: Number(e.target.value) }))}
                  className="w-full bg-[#090C12] border border-[#1E273D] focus:border-cyan-500 rounded-xl px-3 py-2 text-white font-mono outline-none"
                />
              </div>

              {/* Limit Days */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>Максимальный срок (дней):</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    По умолчанию: {DEFAULT_FLUID_PRESETS[editingKey].maxDays} дн. ({(DEFAULT_FLUID_PRESETS[editingKey].maxDays / 365).toFixed(1)} г.)
                  </span>
                </label>
                <input
                  type="number"
                  min="30"
                  step="30"
                  value={tempLimits.maxDays}
                  onChange={(e) => setTempLimits(prev => ({ ...prev, maxDays: Number(e.target.value) }))}
                  className="w-full bg-[#090C12] border border-[#1E273D] focus:border-cyan-500 rounded-xl px-3 py-2 text-white font-mono outline-none"
                />
              </div>

              <div className="pt-2 border-t border-[#1E273D]">
                <p className="text-[11px] font-semibold text-slate-300 mb-2">
                  Ручная отметка последней замены (если нет чека в истории):
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Пробег при замене (км):</label>
                    <input
                      type="number"
                      placeholder={String(activeCar.mileage || 0)}
                      value={tempLastService.km}
                      onChange={(e) => setTempLastService(prev => ({ ...prev, km: e.target.value === '' ? '' : Number(e.target.value) }))}
                      className="w-full bg-[#090C12] border border-[#1E273D] focus:border-cyan-500 rounded-xl px-2.5 py-1.5 text-white font-mono outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Дата последней замены:</label>
                    <input
                      type="date"
                      value={tempLastService.date}
                      onChange={(e) => setTempLastService(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full bg-[#090C12] border border-[#1E273D] focus:border-cyan-500 rounded-xl px-2.5 py-1.5 text-white font-mono outline-none text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#1E273D]">
              <button
                type="button"
                onClick={() => handleResetToDefault(editingKey)}
                className="text-[11px] text-slate-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Сбросить к стандарту
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingKey(null)}
                  className="px-3 py-1.5 rounded-xl bg-[#090C12] text-slate-400 hover:text-white border border-[#1E273D] text-xs font-semibold cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSaveLimits(
                      editingKey,
                      tempLimits.maxKm,
                      tempLimits.maxDays,
                      tempLastService.km !== '' ? Number(tempLastService.km) : undefined,
                      tempLastService.date || undefined
                    )
                  }
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL REGULATIONS MODAL FOR ALL 4 FLUIDS */}
      <EditRegulationsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        activeCar={activeCar}
        customLimits={customLimits}
        onSaveLimits={handleSaveAllRegulations}
        onResetAllToDefault={handleResetAllRegulations}
      />
    </section>
  );
}
