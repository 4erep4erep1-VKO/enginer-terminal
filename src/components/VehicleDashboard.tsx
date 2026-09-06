/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Car, MaintenanceRecord, Part, VehicleTask, DiagnosticSession } from '../types';
import { useUserSettings } from './UserSettingsContext';
import { 
  Car as CarIcon, 
  Gauge, 
  Plus, 
  Wrench, 
  TrendingUp, 
  Bot, 
  ChevronRight, 
  CheckCircle2, 
  ArrowRight,
  Edit3,
  Check,
  X,
  History,
  AlertTriangle,
  FileText,
  PlusCircle,
  Mic,
  PackageCheck,
  ShieldCheck,
  HelpCircle,
  Download,
  Sparkles,
  Receipt,
  CheckSquare
} from 'lucide-react';
import { ShowMechanicModal } from './ShowMechanicModal';
import { SimpleAddRecordModal } from './SimpleAddRecordModal';
import { VehiclePhoto } from './VehiclePhoto';
import { calculateTaskUrgency } from '../lib/taskUrgency';
import { FluidHealthWidget } from './FluidHealthWidget';
import { calculateSmartCarInsights } from '../lib/calcSmartReminders';
import { OdometerPromptBanner } from './OdometerPromptModal';
import { PdfServiceReport } from './PdfServiceReport';

interface VehicleDashboardProps {
  activeCar: Car | null;
  cars: Car[];
  records: MaintenanceRecord[];
  tasks: VehicleTask[];
  parts: Part[];
  diagnosticSessions?: DiagnosticSession[];
  onOpenGarageManager: () => void;
  onOpenAddRecord: () => void;
  onOpenAddRecordWithPrefill?: (values: any) => void;
  onOpenAddRecordWithVoice?: () => void;
  onOpenAddTask: () => void;
  onOpenAddPart: () => void;
  onOpenTechSpecs: () => void;
  onNavigateTab: (tab: 'dashboard' | 'obd' | 'service' | 'rag' | 'garage', dtcCode?: string) => void;
  onNavigateToRagWithQuestion: (question: string) => void;
  onViewRecord: (record: MaintenanceRecord) => void;
  onQuickUpdateMileage: (newMileage: number) => void;
  onMarkTaskCompleted?: (taskId: string) => void;
  onCreateTaskFromDtc?: (code: string, description: string) => void;
  onStartDiagnosticSession?: (carId?: string, initialDtc?: string[]) => void;
  onOpenDiagnosticSessionModal?: (sessionId?: string) => void;
  onRecheckDiagnosticSession?: (sessionId: string) => void;
  onOpenPdfReport?: () => void;
}

export function VehicleDashboard({
  activeCar,
  cars,
  records,
  tasks,
  parts,
  onOpenGarageManager,
  onOpenAddRecord,
  onOpenAddRecordWithPrefill,
  onOpenAddRecordWithVoice,
  onOpenAddTask,
  onOpenAddPart,
  onOpenTechSpecs,
  onNavigateTab,
  onNavigateToRagWithQuestion,
  onViewRecord,
  onQuickUpdateMileage,
  onMarkTaskCompleted,
  onOpenPdfReport,
}: VehicleDashboardProps) {
  const { formatCurrency, currencySymbol, distanceLabel } = useUserSettings();

  const [isEditingMileage, setIsEditingMileage] = useState(false);
  const [tempMileage, setTempMileage] = useState<number | ''>('');
  const [isShowMechanicOpen, setIsShowMechanicOpen] = useState(false);
  const [isSimpleAddOpen, setIsSimpleAddOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [vasilichQuery, setVasilichQuery] = useState('');

  // Smart insights (Daily mileage, fluid status, task urgency, odometer recency)
  const smartCarInsights = useMemo(() => {
    return calculateSmartCarInsights(activeCar, records, tasks);
  }, [activeCar, records, tasks]);

  // Filter records for active car
  const activeCarRecords = useMemo(() => {
    if (!activeCar) return [];
    return records
      .filter(r => r.carId === activeCar.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, activeCar?.id]);

  // Filter pending tasks for active car
  const activeCarPendingTasks = useMemo(() => {
    if (!activeCar) return [];
    return tasks.filter(t => t.carId === activeCar.id && t.status === 'pending');
  }, [tasks, activeCar?.id]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. «ЧТО СЕЙЧАС ВАЖНО» (MAX 3 ITEMS BY PRIORITY)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const importantItems = useMemo(() => {
    if (!activeCar) return [];
    const items: Array<{
      id: string;
      title: string;
      description: string;
      type: 'overdue' | 'urgent' | 'reminder' | 'warning';
      actionLabel: string;
      onAction: () => void;
    }> = [];

    const currentMileage = activeCar.mileage || 0;
    const now = new Date();

    // 0. Smart Reminders & Mileage Forecasts (from Василич Dual-Limit & Average Daily Run)
    if (smartCarInsights.reminders.length > 0) {
      smartCarInsights.reminders.forEach(rem => {
        items.push({
          id: rem.id,
          title: rem.title,
          description: rem.description,
          type: rem.urgency === 'critical' ? 'overdue' : 'urgent',
          actionLabel: rem.fluidKey ? 'Записать замену' : 'План ТО',
          onAction: () => rem.fluidKey ? setIsSimpleAddOpen(true) : onNavigateTab('service')
        });
      });
    }

    // 1. Check Overdue & Warning Tasks using standardized calculation (<=7 days or <=500 km)
    activeCarPendingTasks.forEach(task => {
      const calc = calculateTaskUrgency(task, currentMileage, now);
      if (calc.urgency === 'overdue') {
        const overKm = calc.remainingKm !== undefined && calc.remainingKm < 0 ? Math.abs(calc.remainingKm) : undefined;
        items.push({
          id: `overdue-${task.id}`,
          title: `Пора выполнить: ${task.title}`,
          description: overKm !== undefined 
            ? `Просрочено на ${overKm.toLocaleString('ru-RU')} ${distanceLabel}. По плану ТО уже подошло.`
            : calc.statusText || 'Срок выполнения истек. Рекомендуется выполнить сейчас.',
          type: 'overdue',
          actionLabel: 'Выполнить',
          onAction: () => onMarkTaskCompleted ? onMarkTaskCompleted(task.id) : onNavigateTab('service')
        });
      } else if (calc.urgency === 'warning') {
        items.push({
          id: `urgent-${task.id}`,
          title: `Скоро ТО: ${task.title}`,
          description: calc.statusText 
            ? `${calc.statusText} до регламентного обслуживания.`
            : 'Подходит срок выполнения регламентной работы.',
          type: 'urgent',
          actionLabel: 'Посмотреть',
          onAction: () => onNavigateTab('service')
        });
      }
    });

    // 2. Check if service history is empty or old (> 10 000 km ago)
    if (items.length < 3) {
      const lastRecord = activeCarRecords.length > 0 ? activeCarRecords[0] : null;
      if (!lastRecord) {
        items.push({
          id: 'no-records',
          title: 'История обслуживания пока пуста',
          description: 'Запишите последнюю замену масла, чтобы Василич мог вовремя напоминать о ТО.',
          type: 'reminder',
          actionLabel: 'Записать ТО',
          onAction: () => setIsSimpleAddOpen(true)
        });
      } else if (lastRecord.mileage && (currentMileage - lastRecord.mileage) >= 9000) {
        const passed = currentMileage - lastRecord.mileage;
        items.push({
          id: 'oil-due-soon',
          title: 'Давно не меняли масло',
          description: `С последнего ТО прошло уже ${passed.toLocaleString('ru-RU')} ${distanceLabel}. Рекомендуется запланировать замену.`,
          type: 'warning',
          actionLabel: 'Спросить Василича',
          onAction: () => onNavigateToRagWithQuestion(`С прошлого ТО прошло ${passed} км. Пора ли менять масло и какие расходники нужны?`)
        });
      }
    }

    // Return max 3 prioritized items
    return items.slice(0, 3);
  }, [activeCar, activeCarPendingTasks, activeCarRecords, distanceLabel, onMarkTaskCompleted, onNavigateTab, onNavigateToRagWithQuestion]);

  // Last 2 maintenance records
  const recentRecords = useMemo(() => activeCarRecords.slice(0, 2), [activeCarRecords]);

  // Financial calculations
  const { currentMonthSpend, currentYearSpend, averageRecordCost, costPerKmFormatted } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let monthSum = 0;
    let yearSum = 0;
    let totalSum = 0;
    const mileages: number[] = [];

    activeCarRecords.forEach(r => {
      const recDate = new Date(r.date);
      const cost = (r.partsPrice || 0) + (r.laborPrice || 0);
      totalSum += cost;

      if (r.mileage && r.mileage > 0) {
        mileages.push(r.mileage);
      }

      if (recDate.getFullYear() === currentYear) {
        yearSum += cost;
        if (recDate.getMonth() === currentMonth) {
          monthSum += cost;
        }
      }
    });

    const avg = activeCarRecords.length > 0 ? totalSum / activeCarRecords.length : 0;

    let costPerKm: string = 'Недостаточно данных';
    if (activeCar && activeCar.mileage && totalSum > 0) {
      const minRecMileage = mileages.length > 0 ? Math.min(...mileages) : 0;
      const maxRecMileage = mileages.length > 0 ? Math.max(...mileages) : activeCar.mileage;
      
      let drivenSpan = 0;
      if (mileages.length >= 2) {
        drivenSpan = maxRecMileage - minRecMileage;
      } else if (activeCar.mileage > minRecMileage && minRecMileage > 0) {
        drivenSpan = activeCar.mileage - minRecMileage;
      } else {
        drivenSpan = activeCar.mileage;
      }

      if (drivenSpan >= 100 && totalSum > 0) {
        const val = totalSum / drivenSpan;
        if (isFinite(val) && !isNaN(val)) {
          costPerKm = `${val.toFixed(2)} ${currencySymbol}/${distanceLabel}`;
        }
      }
    }

    return {
      currentMonthSpend: monthSum,
      currentYearSpend: yearSum,
      averageRecordCost: avg,
      costPerKmFormatted: costPerKm,
    };
  }, [activeCarRecords, activeCar, currencySymbol, distanceLabel]);

  // Empty State Onboarding
  if (!activeCar) {
    return (
      <div className="bg-[#111622] border border-[#1E273D] p-6 sm:p-8 max-w-lg mx-auto font-sans my-8 rounded-2xl shadow-md">
        <div className="text-center space-y-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-[#06B6D4]">
            <CarIcon className="w-6 h-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Гараж пока пуст
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Добавьте ваш автомобиль, чтобы вести учет ТО, контролировать регламент и советоваться с Василичем.
          </p>
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#151C2C] border border-[#1E273D]">
            <span className="w-5 h-5 rounded-md bg-cyan-500/15 text-[#06B6D4] font-mono text-xs font-semibold flex items-center justify-center shrink-0">
              1
            </span>
            <div>
              <span className="text-xs font-semibold text-white block">Добавьте автомобиль</span>
              <span className="text-[11px] text-slate-400">Укажите марку, модель и текущий пробег.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#151C2C] border border-[#1E273D]">
            <span className="w-5 h-5 rounded-md bg-cyan-500/15 text-[#06B6D4] font-mono text-xs font-semibold flex items-center justify-center shrink-0">
              2
            </span>
            <div>
              <span className="text-xs font-semibold text-white block">Спросите Василича</span>
              <span className="text-[11px] text-slate-400">Напишите вопрос о машине обычными словами.</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if ('vibrate' in navigator) navigator.vibrate(20);
            onOpenGarageManager();
          }}
          className="btn-primary w-full text-xs font-semibold flex items-center justify-center gap-2 rounded-xl"
          id="btn-empty-add-car"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить автомобиль</span>
        </button>
      </div>
    );
  }

  const handleAddMileage = (increment: number) => {
    if ('vibrate' in navigator) navigator.vibrate(15);
    const newMileage = Math.max(0, (activeCar.mileage || 0) + increment);
    onQuickUpdateMileage(newMileage);
  };

  const handleSaveManualMileage = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempMileage !== '' && Number(tempMileage) >= 0) {
      if ('vibrate' in navigator) navigator.vibrate(15);
      onQuickUpdateMileage(Math.max(0, Number(tempMileage)));
      setIsEditingMileage(false);
    }
  };

  const handleVasilichSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (vasilichQuery.trim()) {
      onNavigateToRagWithQuestion(vasilichQuery.trim());
      setVasilichQuery('');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 font-sans select-text">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          БЛОК 1: «ПАСПОРТ & СОСТОЯНИЕ»
          (Паспорт авто + баннер одометра + Виджет Здоровье жидкостей Dual-Limit)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="space-y-3 sm:space-y-4" aria-label="Паспорт и состояние">
        {/* Баннер актуализации одометра (> 14 дней без обновлений) */}
        {smartCarInsights.odometerStatus.isStale && (
          <OdometerPromptBanner
            car={activeCar}
            status={smartCarInsights.odometerStatus}
            onUpdateMileage={onQuickUpdateMileage}
          />
        )}

        {/* Паспорт авто (Высокий контраст на темном фоне, удобные кнопки) */}
        <div className="bento-card p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-cyan-500/25 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-16 h-14 rounded-xl overflow-hidden shrink-0 border border-cyan-500/30 bg-[#090C12] shadow-inner">
                <VehiclePhoto 
                  car={activeCar} 
                  size="sm" 
                  className="w-full h-full rounded-lg object-cover"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {activeCar.make} {activeCar.model}
                  </h1>
                  {activeCar.year && (
                    <span className="text-xs text-slate-200 font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {activeCar.year} г.
                    </span>
                  )}
                  {activeCar.licensePlate && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/70 text-cyan-300 border border-cyan-500/30">
                      {activeCar.licensePlate}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Активный авто
                  </span>
                  <button
                    type="button"
                    onClick={onOpenGarageManager}
                    className="text-xs text-cyan-300 hover:text-cyan-200 underline font-semibold cursor-pointer ml-1"
                  >
                    Гараж / Сменить авто →
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Action: Сводка для мастера */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                id="btn-quick-open-mechanic"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(15);
                  setIsShowMechanicOpen(true);
                }}
                className="min-h-[44px] px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/40 text-slate-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                title="Сводка для мастера СТО"
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Для мастера СТО</span>
              </button>
            </div>
          </div>

          {/* Monospace Odometer with 48px touch zones */}
          <div className="mt-4 pt-3.5 border-t border-cyan-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Текущий одометр
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-mono font-extrabold text-white tracking-tight leading-none drop-shadow-sm">
                  {activeCar.mileage?.toLocaleString('ru-RU') || 0}
                </span>
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase bg-cyan-950/70 px-2.5 py-0.5 rounded-md border border-cyan-500/30">
                  {distanceLabel}
                </span>
              </div>
            </div>

            {/* Quick Mileage Updates with >= 48px touch zones */}
            <div className="flex items-center gap-2 shrink-0">
              {isEditingMileage ? (
                <form onSubmit={handleSaveManualMileage} className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    value={tempMileage}
                    onChange={(e) => setTempMileage(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={String(activeCar.mileage || 0)}
                    className="min-h-[48px] bg-[#090C12] border-2 border-cyan-500 text-white py-2 px-3 text-sm font-mono w-32 rounded-xl outline-none font-bold"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="min-h-[48px] px-4 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 cursor-pointer flex items-center justify-center shadow-md active:scale-95 transition-transform"
                    title="Сохранить"
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingMileage(false)}
                    className="min-h-[48px] px-3.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 cursor-pointer flex items-center justify-center"
                    title="Отмена"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </form>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleAddMileage(100)}
                    className="min-h-[48px] px-3.5 bg-slate-800 hover:bg-cyan-500/20 border border-slate-700 hover:border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm flex items-center justify-center"
                    title="Добавить 100 км к одометру"
                  >
                    +100 {distanceLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddMileage(500)}
                    className="min-h-[48px] px-3.5 bg-slate-800 hover:bg-cyan-500/20 border border-slate-700 hover:border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm flex items-center justify-center"
                    title="Добавить 500 км к одометру"
                  >
                    +500 {distanceLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempMileage(activeCar.mileage || 0);
                      setIsEditingMileage(true);
                    }}
                    className="min-h-[48px] w-12 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center active:scale-95 shadow-sm"
                    title="Изменить точный пробег"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Виджет Здоровье жидкостей (Dual-Limit Tracker) */}
        <FluidHealthWidget
          activeCar={activeCar}
          records={records}
          onOpenAddRecord={(initialData) => {
            if (onOpenAddRecordWithPrefill && initialData) {
              onOpenAddRecordWithPrefill(initialData);
            } else {
              setIsSimpleAddOpen(true);
            }
          }}
          onNavigateToRagWithQuestion={onNavigateToRagWithQuestion}
        />
      </section>


      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          БЛОК 2: «ДЕЙСТВИЯ» (GARAGE HAND ACCESSIBILITY)
          (Одна крупная главная кнопка "Рассказать Василичу", кнопка [Скачать PDF], кнопка [Записать ТО])
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="space-y-3" aria-label="Главные действия">
        {/* Главная крупная кнопка (Garage touch: height >= 58px, bold, vibrant, haptic) */}
        <button
          type="button"
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(50);
            }
            if (onOpenAddRecordWithVoice) {
              onOpenAddRecordWithVoice();
            } else {
              setIsSimpleAddOpen(true);
            }
          }}
          className="w-full min-h-[58px] sm:min-h-[64px] p-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-2xl shadow-xl shadow-amber-500/20 border-2 border-amber-300 flex items-center justify-between gap-4 cursor-pointer active:scale-[0.98] transition-all duration-200 group"
          id="btn-main-voice-service-input"
        >
          <div className="flex items-center gap-3.5 min-w-0 text-left">
            <div className="w-12 h-12 rounded-xl bg-slate-950/20 border border-slate-950/30 flex items-center justify-center text-slate-950 shrink-0 group-hover:scale-110 transition-transform">
              <Mic className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-black tracking-tight leading-tight flex items-center gap-2">
                <span>🎙️ Рассказать Василичу о ТО / проблеме</span>
                <span className="bg-slate-950/20 text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Голос
                </span>
              </div>
              <span className="text-xs sm:text-[13px] font-semibold text-slate-900/90 block truncate mt-0.5">
                Надиктуйте что заменили — Василич сам определит детали, стоимость и пробег
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-950/20 flex items-center justify-center shrink-0">
            <ArrowRight className="w-5 h-5 text-slate-950 stroke-[3]" />
          </div>
        </button>

        {/* Две второстепенные кнопки (каждая min-h-[48px]) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Кнопка [Скачать PDF] */}
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(15);
              if (onOpenPdfReport) onOpenPdfReport();
              else setIsPdfModalOpen(true);
            }}
            className="min-h-[48px] px-4 py-3 bg-[#0f172a] hover:bg-[#1e293b] border border-cyan-500/30 hover:border-cyan-400 text-white rounded-xl flex items-center justify-center gap-2.5 font-bold text-sm cursor-pointer active:scale-98 transition-all shadow-md"
            id="btn-main-download-pdf"
          >
            <Download className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-slate-100">Скачать PDF книжку с QR</span>
          </button>

          {/* Кнопка [Записать ТО] */}
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(15);
              setIsSimpleAddOpen(true);
            }}
            className="min-h-[48px] px-4 py-3 bg-[#0f172a] hover:bg-[#1e293b] border border-emerald-500/30 hover:border-emerald-400 text-white rounded-xl flex items-center justify-center gap-2.5 font-bold text-sm cursor-pointer active:scale-98 transition-all shadow-md"
            id="btn-main-manual-add-service"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-100">Записать ТО в 2 клика</span>
          </button>
        </div>
      </section>


      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          БЛОК 3: «ЧТО ГОВОРИТ ВАСИЛИЧ & ПЛАН»
          (Чат Василича + Последний статус/рекомендация + Ближайшие задачи + История ТО)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="space-y-4" aria-label="Василич и план ТО">
        {/* Интерактивная строка чата с Василичем */}
        <div className="bento-card p-4 rounded-2xl bg-[#0f172a] border border-cyan-500/25 shadow-md">
          <form onSubmit={handleVasilichSubmit} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Чат Василича
                </h3>
                <p className="text-[11px] text-slate-300">
                  Спросите совет по ремонту или регламенту
                </p>
              </div>
            </div>

            <div className="relative flex items-center flex-1 w-full bg-[#090C12] border border-cyan-500/30 focus-within:border-cyan-400 rounded-xl px-2 py-1 transition-all">
              <input
                type="text"
                value={vasilichQuery}
                onChange={(e) => setVasilichQuery(e.target.value)}
                placeholder="Спроси Василича о звуке, масле или запчастях..."
                className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none min-w-0"
              />
              <button
                type="submit"
                disabled={!vasilichQuery.trim()}
                className="min-h-[40px] px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 transition-colors ml-1"
                title="Отправить"
              >
                <span>Спросить</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </form>
        </div>

        {/* Две колонки: Рекомендация Василича и Ближайшие задачи */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Рекомендация / Статус от Василича */}
          <div className="bento-card p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-cyan-500/25 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-cyan-500/15 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Совет от Василича
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {activeCar.make} {activeCar.model}
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-center py-1">
              {importantItems.length > 0 ? (
                <div className="space-y-2">
                  {importantItems.slice(0, 2).map((item) => {
                    const isOverdue = item.type === 'overdue';
                    const isUrgent = item.type === 'urgent';
                    return (
                      <div key={item.id} className="p-3 rounded-xl bg-[#111827] border border-slate-700">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOverdue ? 'bg-rose-400 animate-ping' : isUrgent ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                          <span className="text-xs sm:text-sm font-bold text-white">{item.title}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (navigator.vibrate) navigator.vibrate(15);
                            item.onAction();
                          }}
                          className="mt-2 text-xs text-cyan-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <span>{item.actionLabel}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#111827] border border-emerald-500/30 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm font-bold text-white block">
                      Все регламенты в порядке
                    </span>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                      По одометру и датам срочных замен не требуется. Не забывайте проверять уровень масла на щупе перед дальними поездками!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ближайшие задачи */}
          <div className="bento-card p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-cyan-500/25 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-cyan-500/15 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Ближайшие задачи ({activeCarPendingTasks.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('service')}
                className="text-xs text-cyan-400 hover:text-cyan-300 underline font-semibold cursor-pointer"
              >
                Весь план ТО →
              </button>
            </div>

            <div className="flex-1 space-y-2">
              {activeCarPendingTasks.length > 0 ? (
                activeCarPendingTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="p-2.5 rounded-xl bg-[#111827] border border-slate-700/80 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm font-semibold text-white block truncate">
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-0.5">
                        {task.targetMileage && (
                          <span className="font-mono">{task.targetMileage.toLocaleString('ru-RU')} {distanceLabel}</span>
                        )}
                        {task.type && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${task.type === 'mileage' ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/40' : 'bg-slate-800 text-slate-300'}`}>
                            {task.type === 'mileage' ? 'По пробегу' : 'Планово'}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(15);
                        if (onMarkTaskCompleted) onMarkTaskCompleted(task.id);
                      }}
                      className="min-h-[40px] px-3 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold rounded-xl cursor-pointer shrink-0 transition-colors"
                      title="Отметить выполненной"
                    >
                      Выполнено
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 flex flex-col items-center justify-center h-full">
                  <CheckCircle2 className="w-6 h-6 text-slate-600 mb-1" />
                  <span>Запланированных задач нет.</span>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('service')}
                    className="mt-2 text-xs text-cyan-400 hover:underline font-semibold"
                  >
                    Добавить регламентную задачу →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* История последних работ с фотоотчетами и чеками */}
        {recentRecords.length > 0 && (
          <div className="bento-card p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-cyan-500/25 shadow-md">
            <div className="flex items-center justify-between border-b border-cyan-500/15 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Последние работы ({activeCarRecords.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('service')}
                className="text-xs text-cyan-400 hover:text-cyan-300 underline font-semibold cursor-pointer"
              >
                Вся история ТО →
              </button>
            </div>

            <div className="space-y-2.5">
              {recentRecords.map((record) => {
                const photos = Array.from(new Set([
                  ...(record.attachments || []),
                  ...(record.photoUrls || []),
                  ...(record.photoReceiptUrl ? [record.photoReceiptUrl] : [])
                ])).filter(Boolean);

                return (
                  <div
                    key={record.id}
                    onClick={() => onViewRecord(record)}
                    className="p-3 sm:p-3.5 rounded-xl bg-[#111827] border border-slate-700/80 hover:border-cyan-500/40 hover:bg-[#162032] cursor-pointer flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-white truncate">
                          {record.description}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-black/60 text-slate-300 font-mono border border-slate-700">
                          {record.date}
                        </span>
                        {photos.length > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/30 flex items-center gap-1">
                            <Receipt className="w-3 h-3" />
                            Чек ({photos.length})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-300 font-mono">
                        {record.mileage && (
                          <span>{record.mileage.toLocaleString('ru-RU')} {distanceLabel}</span>
                        )}
                        {record.category && (
                          <span className="text-slate-400">• {record.category}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm sm:text-base font-bold font-mono text-emerald-400">
                        {formatCurrency((record.partsPrice || 0) + (record.laborPrice || 0))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MODALS: ПОКАЗАТЬ МАСТЕРУ & БЫСТРОЕ ТО
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <ShowMechanicModal
        isOpen={isShowMechanicOpen}
        onClose={() => setIsShowMechanicOpen(false)}
        car={activeCar}
        records={records}
        tasks={tasks}
      />

      <SimpleAddRecordModal
        isOpen={isSimpleAddOpen}
        onClose={() => setIsSimpleAddOpen(false)}
        carId={activeCar.id}
        carName={`${activeCar.make} ${activeCar.model}`}
        currentCarMileage={activeCar.mileage || 0}
        onRecordAdded={(rec) => {
          onOpenAddRecord();
          if (rec.mileage && activeCar.mileage && rec.mileage > activeCar.mileage) {
            onQuickUpdateMileage(rec.mileage);
          }
        }}
      />

      {/* PDF СЕРВИСНАЯ КНИЖКА С QR-КОДОМ */}
      <PdfServiceReport
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        car={activeCar}
        records={records}
      />

    </div>
  );
}
