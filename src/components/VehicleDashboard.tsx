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
    const now = Date.now();

    // 1. Check Overdue Tasks
    activeCarPendingTasks.forEach(task => {
      if (task.type === 'mileage' && task.targetMileage !== undefined && currentMileage >= task.targetMileage) {
        const overKm = currentMileage - task.targetMileage;
        items.push({
          id: `overdue-${task.id}`,
          title: `Пора выполнить: ${task.title}`,
          description: `Просрочено на ${overKm > 0 ? overKm.toLocaleString('ru-RU') : 0} ${distanceLabel}. По плану ТО уже подошло.`,
          type: 'overdue',
          actionLabel: 'Выполнить',
          onAction: () => onMarkTaskCompleted ? onMarkTaskCompleted(task.id) : onNavigateTab('service')
        });
      } else if (task.targetDate) {
        const diffDays = Math.ceil((new Date(task.targetDate).getTime() - now) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) {
          items.push({
            id: `overdue-date-${task.id}`,
            title: `Срок подошел: ${task.title}`,
            description: `Срок выполнения истек ${Math.abs(diffDays)} дн. назад.`,
            type: 'overdue',
            actionLabel: 'Выполнить',
            onAction: () => onMarkTaskCompleted ? onMarkTaskCompleted(task.id) : onNavigateTab('service')
          });
        }
      }
    });

    // 2. Check Urgent Tasks (due soon: <= 1000 km or <= 14 days)
    if (items.length < 3) {
      activeCarPendingTasks.forEach(task => {
        if (task.type === 'mileage' && task.targetMileage !== undefined) {
          const diff = task.targetMileage - currentMileage;
          if (diff > 0 && diff <= 1000) {
            items.push({
              id: `urgent-${task.id}`,
              title: `Скоро ТО: ${task.title}`,
              description: `Осталось примерно ${diff.toLocaleString('ru-RU')} ${distanceLabel} до регламентной замены.`,
              type: 'urgent',
              actionLabel: 'Посмотреть',
              onAction: () => onNavigateTab('service')
            });
          }
        } else if (task.targetDate) {
          const diffDays = Math.ceil((new Date(task.targetDate).getTime() - now) / (1000 * 60 * 60 * 24));
          if (diffDays > 0 && diffDays <= 14) {
            items.push({
              id: `urgent-date-${task.id}`,
              title: `Скоро: ${task.title}`,
              description: `Регламент запланирован через ${diffDays} дн.`,
              type: 'urgent',
              actionLabel: 'Посмотреть',
              onAction: () => onNavigateTab('service')
            });
          }
        }
      });
    }

    // 3. Check if service history is empty or old (> 10 000 km ago)
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
      <div className="bg-[#10151E] border border-[#1E2638] p-6 sm:p-8 max-w-xl mx-auto font-sans my-6 shadow-xl rounded-2xl">
        <div className="text-center space-y-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#06B6D4]/10 border border-[#06B6D4]/25 flex items-center justify-center mx-auto text-[#06B6D4] shadow-sm">
            <CarIcon className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Ваш гараж пока пуст
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Добавьте автомобиль, чтобы контролировать замены масла, вести историю и советоваться с мастером Василичем простыми словами.
          </p>
        </div>

        <div className="space-y-2.5 mb-6">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#151B25] border border-[#1E2638]">
            <span className="w-6 h-6 rounded-lg bg-[#06B6D4]/15 text-[#06B6D4] font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-[#06B6D4]/30">
              1
            </span>
            <div>
              <span className="text-xs font-bold text-white block">Добавьте свой автомобиль</span>
              <span className="text-[11px] text-slate-400">Укажите марку, модель и примерный пробег.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#151B25] border border-[#1E2638]">
            <span className="w-6 h-6 rounded-lg bg-[#06B6D4]/15 text-[#06B6D4] font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-[#06B6D4]/30">
              2
            </span>
            <div>
              <span className="text-xs font-bold text-white block">Спросите Василича</span>
              <span className="text-[11px] text-slate-400">Напишите: «Что делать с машиной?» или «Когда менять масло?».</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if ('vibrate' in navigator) navigator.vibrate(20);
            onOpenGarageManager();
          }}
          className="btn-primary w-full min-h-[46px] text-xs font-bold flex items-center justify-center gap-2 rounded-xl"
          id="btn-empty-add-car"
        >
          <Plus className="w-4 h-4" />
          <span>ДОБАВИТЬ АВТОМОБИЛЬ</span>
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

  return (
    <div className="space-y-4 font-sans pb-24">
      
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. МОЯ МАШИНА (ЧИСТЫЙ ВЕРХНИЙ БЛОК БЕЗ МУСОРА)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-[#10151E] border border-[#1E2638] p-4 sm:p-5 rounded-2xl relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          
          {/* Car Info Left */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/25 flex items-center justify-center text-[#06B6D4] shrink-0">
              <CarIcon className="w-5 h-5" />
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block leading-tight">
                МОЯ МАШИНА
              </span>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {activeCar.make} {activeCar.model}
                </h1>
                {activeCar.year && (
                  <span className="text-xs text-slate-400 font-mono">
                    ({activeCar.year})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Odometer & Quick Step Buttons Right */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 bg-[#151B25] border border-[#1E2638] p-2 sm:px-3 sm:py-2 rounded-xl">
            <div className="flex items-center gap-2.5">
              <Gauge className="w-4 h-4 text-[#06B6D4] shrink-0" />
              <div>
                <span className="text-[9px] font-mono text-slate-400 uppercase block leading-none">
                  ПРОБЕГ
                </span>
                
                {isEditingMileage ? (
                  <form onSubmit={handleSaveManualMileage} className="flex items-center gap-1.5 mt-1">
                    <input
                      type="number"
                      min="0"
                      value={tempMileage}
                      onChange={(e) => setTempMileage(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={String(activeCar.mileage || 0)}
                      className="bg-[#10151E] border border-[#06B6D4] text-white py-0.5 px-2 text-xs font-mono w-24 rounded-lg outline-none"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="p-1 bg-[#06B6D4] text-slate-950 rounded-md hover:bg-cyan-400 cursor-pointer"
                      title="Сохранить"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingMileage(false)}
                      className="p-1 bg-[#1E2638] text-slate-400 rounded-md hover:bg-slate-700 cursor-pointer"
                      title="Отмена"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <span className="text-sm sm:text-base font-mono font-bold text-white tracking-wider">
                    {activeCar.mileage?.toLocaleString('ru-RU') || 0} {distanceLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Step Buttons */}
            {!isEditingMileage && (
              <div className="flex items-center gap-1.5 pl-2.5 border-l border-[#1E2638]">
                <button
                  type="button"
                  onClick={() => handleAddMileage(100)}
                  className="h-7 px-2.5 bg-[#10151E] hover:bg-[#1B2431] border border-[#1E2638] hover:border-[#06B6D4]/40 text-[#06B6D4] text-xs font-mono font-semibold rounded-lg transition-colors cursor-pointer"
                  title="Добавить 100 км"
                >
                  +100
                </button>
                <button
                  type="button"
                  onClick={() => handleAddMileage(500)}
                  className="h-7 px-2.5 bg-[#10151E] hover:bg-[#1B2431] border border-[#1E2638] hover:border-[#06B6D4]/40 text-[#06B6D4] text-xs font-mono font-semibold rounded-lg transition-colors cursor-pointer"
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
                  className="h-7 w-7 p-1 bg-[#10151E] hover:bg-[#1B2431] border border-[#1E2638] text-slate-300 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                  title="Изменить точный пробег"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. БЛОК «ЧТО СЕЙЧАС ВАЖНО» (ГЛАВНЫЙ ФОКУС)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-[#10151E] border border-[#1E2638] p-4 sm:p-5 rounded-2xl relative overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-[#1E2638] pb-2.5 mb-3.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase font-mono">
              Что сейчас важно
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('service')}
            className="text-[11px] text-[#06B6D4] hover:underline font-mono font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>ПЛАН ТО</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {importantItems.length > 0 ? (
          <div className="space-y-2.5">
            {importantItems.map(item => {
              const isOverdue = item.type === 'overdue';
              const isUrgent = item.type === 'urgent';

              return (
                <div 
                  key={item.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isOverdue 
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-100'
                      : isUrgent
                      ? 'bg-amber-950/20 border-amber-500/30 text-amber-100'
                      : 'bg-[#151B25] border-[#1E2638] text-slate-200'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        isOverdue ? 'bg-rose-400 animate-pulse' : isUrgent ? 'bg-amber-400' : 'bg-[#06B6D4]'
                      }`} />
                      <span className="text-xs sm:text-sm font-bold text-white truncate">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed pl-4">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-4 sm:pl-0">
                    <button
                      type="button"
                      onClick={item.onAction}
                      className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                        isOverdue
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                          : isUrgent
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          : 'bg-[#151B25] hover:bg-[#1B2431] text-white border border-[#1E2638]'
                      }`}
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Когда всё спокойно */
          <div className="p-4 rounded-xl bg-emerald-950/15 border border-emerald-500/25 flex items-center justify-between gap-3 text-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-white block">
                  Сейчас всё спокойно
                </span>
                <span className="text-xs text-slate-400">
                  Машина в порядке, ближайшее обслуживание пока не требуется.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('service')}
              className="text-xs font-mono text-[#06B6D4] hover:underline shrink-0 font-semibold cursor-pointer"
            >
              План ТО
            </button>
          </div>
        )}
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. ГЛАВНОЕ ДЕЙСТВИЕ — СПРОСИТЬ ВАСИЛИЧА
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-[#10151E] border border-[#06B6D4]/25 p-4 sm:p-5 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#06B6D4]/15 border border-[#06B6D4]/30 flex items-center justify-center text-[#06B6D4] shrink-0">
              <Bot className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Спросить Василича
                </h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-[#151B25] text-[#06B6D4] border border-[#1E2638] font-semibold">
                  ПАМЯТЬ МАШИНЫ
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Расскажи, что происходит с машиной — разберёмся простыми словами.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if ('vibrate' in navigator) navigator.vibrate(15);
                onNavigateToRagWithQuestion('Я вообще не знаю, что с машиной делать. Посмотри историю и подскажи, с чего начать.');
              }}
              className="min-h-[42px] px-3.5 bg-[#151B25] hover:bg-[#1B2431] border border-[#1E2638] text-slate-300 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
            >
              С чего начать?
            </button>

            <button
              type="button"
              onClick={() => {
                if ('vibrate' in navigator) navigator.vibrate(15);
                onNavigateTab('rag');
              }}
              className="btn-primary min-h-[42px] px-4 text-xs font-bold flex items-center justify-center gap-2 rounded-xl"
              id="btn-ask-vasilich-main"
            >
              <Bot className="w-4 h-4" />
              <span>СПРОСИТЬ ВАСИЛИЧА</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. БЫСТРЫЕ ДЕЙСТВИЯ ДЛЯ ВОДИТЕЛЯ (1-ТАП)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Действие 1: Показать мастеру на СТО */}
        <button
          type="button"
          onClick={() => {
            if ('vibrate' in navigator) navigator.vibrate(15);
            setIsShowMechanicOpen(true);
          }}
          className="p-3.5 rounded-2xl bg-[#10151E] hover:bg-[#151B25] border border-[#1E2638] hover:border-[#06B6D4]/40 text-left transition-all cursor-pointer flex items-center gap-3 active:scale-98 shadow-sm"
          id="btn-show-mechanic"
        >
          <div className="w-9 h-9 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/25 text-[#06B6D4] flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-white truncate">
              Показать мастеру
            </span>
            <span className="block text-[10px] text-slate-400 truncate mt-0.5">
              Сводка для СТО
            </span>
          </div>
        </button>

        {/* Действие 2: Записать обслуживание (Простое) */}
        <button
          type="button"
          onClick={() => {
            if ('vibrate' in navigator) navigator.vibrate(15);
            setIsSimpleAddOpen(true);
          }}
          className="p-3.5 rounded-2xl bg-[#10151E] hover:bg-[#151B25] border border-[#1E2638] hover:border-[#10B981]/40 text-left transition-all cursor-pointer flex items-center gap-3 active:scale-98 shadow-sm"
          id="btn-simple-add-record"
        >
          <div className="w-9 h-9 rounded-xl bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981] flex items-center justify-center shrink-0">
            <PlusCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-white truncate">
              Записать ТО
            </span>
            <span className="block text-[10px] text-slate-400 truncate mt-0.5">
              В 2 клика
            </span>
          </div>
        </button>

        {/* Действие 3: Сказать голосом */}
        <button
          type="button"
          onClick={() => {
            if ('vibrate' in navigator) navigator.vibrate(15);
            setIsSimpleAddOpen(true);
          }}
          className="p-3.5 rounded-2xl bg-[#10151E] hover:bg-[#151B25] border border-[#1E2638] hover:border-[#F59E0B]/40 text-left transition-all cursor-pointer flex items-center gap-3 active:scale-98 shadow-sm"
          id="btn-voice-add-record"
        >
          <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/25 text-[#F59E0B] flex items-center justify-center shrink-0">
            <Mic className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-white truncate">
              Сказать голосом
            </span>
            <span className="block text-[10px] text-slate-400 truncate mt-0.5">
              «Поменял масло»
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
          className="p-3.5 rounded-2xl bg-[#10151E] hover:bg-[#151B25] border border-[#1E2638] hover:border-[#8B5CF6]/40 text-left transition-all cursor-pointer flex items-center gap-3 active:scale-98 shadow-sm"
          id="btn-garage-parts"
        >
          <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/25 text-[#8B5CF6] flex items-center justify-center shrink-0">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-white truncate">
              Мой гараж
            </span>
            <span className="block text-[10px] text-slate-400 truncate mt-0.5">
              {parts.length} деталей
            </span>
          </div>
        </button>

      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          5. ЧТО ДЕЛАЛИ НЕДАВНО (ПОСЛЕДНИЕ 2 РАБОТЫ)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {recentRecords.length > 0 && (
        <section className="bg-[#10151E] border border-[#1E2638] p-4 sm:p-5 rounded-2xl relative overflow-hidden font-sans shadow-sm">
          <div className="flex items-center justify-between border-b border-[#1E2638] pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#06B6D4]" />
              <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono">
                Что делали недавно
              </h3>
            </div>
            
            <button
              type="button"
              onClick={() => onNavigateTab('service')}
              className="text-[11px] text-[#06B6D4] hover:underline font-mono font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>ВСЯ ИСТОРИЯ ({activeCarRecords.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {recentRecords.map((record) => (
              <div 
                key={record.id}
                onClick={() => onViewRecord(record)}
                className="p-3 rounded-xl bg-[#151B25] border border-[#1E2638] hover:border-[#273248] hover:bg-[#1B2431] cursor-pointer flex items-center justify-between gap-3 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-white truncate">
                      {record.description}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#10151E] text-slate-300 font-mono border border-[#1E2638]">
                      {record.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-mono">
                    {record.mileage && (
                      <span>{record.mileage.toLocaleString('ru-RU')} {distanceLabel}</span>
                    )}
                    {record.category && (
                      <span>• {record.category}</span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs sm:text-sm font-bold font-mono text-white">
                    {formatCurrency((record.partsPrice || 0) + (record.laborPrice || 0))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          6. РАСХОДЫ НА МАШИНУ (КРАТКИЙ ПУЛЬС)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-[#10151E] border border-[#1E2638] p-4 sm:p-5 rounded-2xl relative overflow-hidden font-sans shadow-sm">
        <div className="flex items-center justify-between border-b border-[#1E2638] pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#06B6D4]" />
            <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono">
              Расходы на машину
            </h3>
          </div>
          
          <button
            type="button"
            onClick={() => onNavigateTab('service')}
            className="text-[11px] text-[#06B6D4] hover:underline font-mono font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>АНАЛИТИКА</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-[#151B25] border border-[#1E2638]">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">
              ТЕКУЩИЙ МЕСЯЦ
            </span>
            <span className="text-xs sm:text-sm font-bold font-mono text-white mt-1 block">
              {formatCurrency(currentMonthSpend)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#151B25] border border-[#1E2638]">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">
              ТЕКУЩИЙ ГОД
            </span>
            <span className="text-xs sm:text-sm font-bold font-mono text-[#06B6D4] mt-1 block">
              {formatCurrency(currentYearSpend)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#151B25] border border-[#1E2638]">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">
              СРЕДНИЙ ЧЕК
            </span>
            <span className="text-xs sm:text-sm font-bold font-mono text-slate-200 mt-1 block">
              {formatCurrency(averageRecordCost)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#151B25] border border-[#1E2638]">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">
              СТОИМОСТЬ 1 КМ
            </span>
            <span className="text-[11px] sm:text-xs font-bold font-mono text-emerald-400 mt-1 block truncate">
              {costPerKmFormatted}
            </span>
          </div>
        </div>
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
          // We can also trigger onQuickUpdateMileage if mileage is greater
          if (rec.mileage && activeCar.mileage && rec.mileage > activeCar.mileage) {
            onQuickUpdateMileage(rec.mileage);
          }
        }}
      />

    </div>
  );
}
