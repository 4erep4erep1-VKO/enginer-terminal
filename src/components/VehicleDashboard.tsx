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
  HelpCircle
} from 'lucide-react';
import { ShowMechanicModal } from './ShowMechanicModal';
import { SimpleAddRecordModal } from './SimpleAddRecordModal';
import { VehiclePhoto } from './VehiclePhoto';
import { calculateTaskUrgency } from '../lib/taskUrgency';

interface VehicleDashboardProps {
  activeCar: Car | null;
  cars: Car[];
  records: MaintenanceRecord[];
  tasks: VehicleTask[];
  parts: Part[];
  diagnosticSessions?: DiagnosticSession[];
  onOpenGarageManager: () => void;
  onOpenAddRecord: () => void;
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
}

export function VehicleDashboard({
  activeCar,
  cars,
  records,
  tasks,
  parts,
  onOpenGarageManager,
  onOpenAddRecord,
  onOpenAddRecordWithVoice,
  onOpenAddTask,
  onOpenAddPart,
  onOpenTechSpecs,
  onNavigateTab,
  onNavigateToRagWithQuestion,
  onViewRecord,
  onQuickUpdateMileage,
  onMarkTaskCompleted,
}: VehicleDashboardProps) {
  const { formatCurrency, currencySymbol, distanceLabel } = useUserSettings();

  const [isEditingMileage, setIsEditingMileage] = useState(false);
  const [tempMileage, setTempMileage] = useState<number | ''>('');
  const [isShowMechanicOpen, setIsShowMechanicOpen] = useState(false);
  const [isSimpleAddOpen, setIsSimpleAddOpen] = useState(false);
  const [vasilichQuery, setVasilichQuery] = useState('');

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
    if (vasilichQuery.trim()) {
      onNavigateToRagWithQuestion(vasilichQuery.trim());
      setVasilichQuery('');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-24 font-sans select-text">
      
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. МОЙ АВТОМОБИЛЬ (HERO STATUS - col-span-2)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="md:col-span-2">
        <section className="bento-card p-4 sm:p-5 h-full flex flex-col justify-between min-h-[145px]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-16 h-12 rounded-xl overflow-hidden shrink-0 border border-cyan-500/20 bg-[#090C12]">
                <VehiclePhoto 
                  car={activeCar} 
                  size="sm" 
                  className="w-full h-full rounded-lg"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {activeCar.make} {activeCar.model}
                  </h1>
                  {activeCar.year && (
                    <span className="text-xs text-slate-400 font-mono">
                      {activeCar.year} г.в.
                    </span>
                  )}
                  {activeCar.licensePlate && (
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#10151E] text-slate-300 border border-[#1E273D]">
                      {activeCar.licensePlate}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Активный автомобиль в гараже
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenGarageManager}
              className="text-xs text-[#06B6D4] hover:underline font-medium shrink-0 cursor-pointer self-end sm:self-auto"
            >
              Гараж & фото →
            </button>
          </div>

          {/* Monospace Odometer Widget */}
          <div className="mt-4 pt-3.5 border-t border-cyan-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-mono font-extrabold text-cyan-400 tracking-tight leading-none">
                {activeCar.mileage?.toLocaleString('ru-RU') || 0}
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                {distanceLabel}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isEditingMileage ? (
                <form onSubmit={handleSaveManualMileage} className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    value={tempMileage}
                    onChange={(e) => setTempMileage(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={String(activeCar.mileage || 0)}
                    className="bg-[#090C12] border border-cyan-500 text-white py-0.5 px-2 text-xs font-mono w-24 rounded-lg outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="p-1 bg-[#06B6D4] text-slate-950 rounded-md hover:bg-cyan-400 cursor-pointer"
                    title="Сохранить"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingMileage(false)}
                    className="p-1 bg-[#10151E] text-slate-400 rounded-md hover:bg-slate-800 cursor-pointer"
                    title="Отмена"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </form>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleAddMileage(100)}
                    className="h-7 px-2 bg-[#10151E]/90 hover:bg-cyan-500/10 border border-cyan-500/15 text-[#06B6D4] text-[11px] font-mono font-semibold rounded-lg transition-colors cursor-pointer"
                    title="Добавить 100 км"
                  >
                    +100
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddMileage(500)}
                    className="h-7 px-2 bg-[#10151E]/90 hover:bg-cyan-500/10 border border-cyan-500/15 text-[#06B6D4] text-[11px] font-mono font-semibold rounded-lg transition-colors cursor-pointer"
                    title="Добавить 500 км"
                  >
                    +500
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempMileage(activeCar.mileage || 0);
                      setIsEditingMileage(true);
                    }}
                    className="h-7 w-7 bg-[#10151E]/90 hover:bg-cyan-500/10 border border-cyan-500/15 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                    title="Изменить пробег"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. БЛОК «ЧТО СЕЙЧАС ВАЖНО» (col-span-1)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="md:col-span-1">
        <section className="bento-card p-4 sm:p-5 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Важное
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('service')}
              className="text-[10px] text-[#06B6D4] hover:underline font-semibold cursor-pointer"
            >
              План ТО
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center py-1">
            {importantItems.length > 0 ? (
              <div className="space-y-1.5">
                {importantItems.slice(0, 1).map(item => {
                  const isOverdue = item.type === 'overdue';
                  const isUrgent = item.type === 'urgent';
                  return (
                    <div key={item.id} className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOverdue ? 'bg-rose-400' : isUrgent ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                        <span className="font-semibold text-slate-100 line-clamp-1">{item.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
                      <button
                        type="button"
                        onClick={item.onAction}
                        className="mt-2 text-[10px] text-cyan-400 font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        <span>{item.actionLabel}</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs flex items-center gap-2.5 py-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-semibold text-white block text-[11px]">Все спокойно</span>
                  <p className="text-[10px] text-slate-400">Срочных работ не требуется</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. ИНТЕРАКТИВНЫЙ БЛОК ВАСИЛИЧА (col-span-3)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="md:col-span-3">
        <section className="bento-card p-4 sm:p-5">
          <form onSubmit={handleVasilichSubmit} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[#06B6D4]">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Спросить Василича
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Умный чат-наставник по обслуживанию автомобиля
                </p>
              </div>
            </div>

            {/* Input Row with Gradient borders and clean styling */}
            <div className="relative flex items-center flex-1 w-full bg-[#090C12]/60 border border-cyan-500/15 focus-within:border-cyan-500/50 rounded-xl px-2 py-1 transition-all">
              <input
                type="text"
                value={vasilichQuery}
                onChange={(e) => setVasilichQuery(e.target.value)}
                placeholder="Спроси Василича о машине (например: когда менять масло?)..."
                className="flex-1 bg-transparent px-2.5 py-1.5 text-xs sm:text-[13px] text-slate-100 placeholder-slate-500 focus:outline-none min-w-0"
              />
              
              <button
                type="submit"
                disabled={!vasilichQuery.trim()}
                className="w-8 h-8 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-slate-950 flex items-center justify-center font-bold cursor-pointer shrink-0 transition-colors ml-1"
                title="Отправить"
              >
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. БЫСТРЫЕ ДЕЙСТВИЯ (col-span-3 Bento Grid)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="md:col-span-3">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Действие 1: Показать мастеру на СТО */}
          <button
            type="button"
            onClick={() => {
              if ('vibrate' in navigator) navigator.vibrate(15);
              setIsShowMechanicOpen(true);
            }}
            className="p-3.5 rounded-xl bg-[#10151E]/80 backdrop-blur-md border border-cyan-500/15 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] text-left transition-all duration-300 flex items-center gap-3 cursor-pointer active:scale-98"
            id="btn-show-mechanic"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[#06B6D4] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-white truncate">
                Для СТО
              </span>
              <span className="block text-[10px] text-slate-400 truncate">
                Сводка мастеру
              </span>
            </div>
          </button>

          {/* Действие 2: Записать ТО */}
          <button
            type="button"
            onClick={() => {
              if ('vibrate' in navigator) navigator.vibrate(15);
              setIsSimpleAddOpen(true);
            }}
            className="p-3.5 rounded-xl bg-[#10151E]/80 backdrop-blur-md border border-cyan-500/15 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] text-left transition-all duration-300 flex items-center gap-3 cursor-pointer active:scale-98"
            id="btn-simple-add-record"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-white truncate">
                Записать ТО
              </span>
              <span className="block text-[10px] text-slate-400 truncate">
                В 2 клика
              </span>
            </div>
          </button>

          {/* Действие 3: Сказать голосом */}
          <button
            type="button"
            onClick={() => {
              if ('vibrate' in navigator) navigator.vibrate(15);
              if (onOpenAddRecordWithVoice) {
                onOpenAddRecordWithVoice();
              } else {
                setIsSimpleAddOpen(true);
              }
            }}
            className="p-3.5 rounded-xl bg-[#10151E]/80 backdrop-blur-md border border-cyan-500/15 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] text-left transition-all duration-300 flex items-center gap-3 cursor-pointer active:scale-98"
            id="btn-voice-add-record"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Mic className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-white truncate">
                Голосом
              </span>
              <span className="block text-[10px] text-slate-400 truncate">
                Диктовка ТО
              </span>
            </div>
          </button>

          {/* Действие 4: Склад запчастей */}
          <button
            type="button"
            onClick={() => {
              if ('vibrate' in navigator) navigator.vibrate(15);
              onNavigateTab('garage');
            }}
            className="p-3.5 rounded-xl bg-[#10151E]/80 backdrop-blur-md border border-cyan-500/15 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] text-left transition-all duration-300 flex items-center gap-3 cursor-pointer active:scale-98"
            id="btn-garage-parts"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-white truncate">
                Гараж
              </span>
              <span className="block text-[10px] text-slate-400 truncate">
                {parts.length} деталей
              </span>
            </div>
          </button>

        </section>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          5. ЧТО ДЕЛАЛИ НЕДАВНО (col-span-2)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {recentRecords.length > 0 && (
        <div className="md:col-span-2">
          <section className="bento-card p-4 sm:p-5 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-[#06B6D4]" />
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Последние работы
                </h3>
              </div>
              
              <button
                type="button"
                onClick={() => onNavigateTab('service')}
                className="text-[11px] text-[#06B6D4] hover:underline font-semibold cursor-pointer"
              >
                Все записи ({activeCarRecords.length})
              </button>
            </div>

            <div className="space-y-2 flex-1 flex flex-col justify-center">
              {recentRecords.map((record) => (
                <div 
                  key={record.id}
                  onClick={() => onViewRecord(record)}
                  className="p-3 rounded-xl bg-[#090C12]/50 border border-cyan-500/10 hover:border-cyan-500/30 hover:bg-[#10151E]/60 cursor-pointer flex items-center justify-between gap-3 transition-all duration-200"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate">
                        {record.description}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#10151E] text-slate-400 font-mono border border-cyan-500/10">
                        {record.date}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                      {record.mileage && (
                        <span>{record.mileage.toLocaleString('ru-RU')} {distanceLabel}</span>
                      )}
                      {record.category && (
                        <span>• {record.category}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono text-white">
                      {formatCurrency((record.partsPrice || 0) + (record.laborPrice || 0))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          6. РАСХОДЫ НА МАШИНУ (col-span-1)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="md:col-span-1">
        <section className="bento-card p-4 sm:p-5 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#06B6D4]" />
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Расходы
              </h3>
            </div>
            
            <button
              type="button"
              onClick={() => onNavigateTab('service')}
              className="text-[10px] text-[#06B6D4] hover:underline font-semibold cursor-pointer"
            >
              Детали
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 flex-1 py-1">
            <div className="p-2 rounded-xl bg-[#090C12]/50 border border-cyan-500/10">
              <span className="text-[9px] text-slate-400 block leading-tight">
                Месяц
              </span>
              <span className="text-xs font-bold font-mono text-white mt-1 block truncate">
                {formatCurrency(currentMonthSpend)}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-[#090C12]/50 border border-cyan-500/10">
              <span className="text-[9px] text-slate-400 block leading-tight">
                Год
              </span>
              <span className="text-xs font-bold font-mono text-[#06B6D4] mt-1 block truncate">
                {formatCurrency(currentYearSpend)}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-[#090C12]/50 border border-cyan-500/10">
              <span className="text-[9px] text-slate-400 block leading-tight">
                Средний чек
              </span>
              <span className="text-xs font-bold font-mono text-slate-200 mt-1 block truncate">
                {formatCurrency(averageRecordCost)}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-[#090C12]/50 border border-cyan-500/10">
              <span className="text-[9px] text-slate-400 block leading-tight">
                1 {distanceLabel}
              </span>
              <span className="text-[10px] font-bold font-mono text-emerald-400 mt-1 block truncate">
                {costPerKmFormatted}
              </span>
            </div>
          </div>
        </section>
      </div>

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

    </div>
  );
}
