import React, { useState } from 'react';
import { 
  DiagnosticSession, 
  Car, 
  Part, 
  VehicleTask, 
  MaintenanceRecord,
  DiagnosticSessionCheckStep 
} from '../types';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  HelpCircle, 
  RotateCcw, 
  Wrench, 
  Package, 
  FileText, 
  Zap, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Check, 
  X, 
  SkipForward, 
  Gauge, 
  Thermometer, 
  Search,
  ExternalLink,
  Layers
} from 'lucide-react';

interface DiagnosticSessionCardProps {
  session: DiagnosticSession;
  car: Car | null;
  parts: Part[];
  tasks?: VehicleTask[];
  records?: MaintenanceRecord[];
  onUpdateSession: (session: DiagnosticSession) => void;
  onNavigateToRag?: (contextText?: string) => void;
  onNavigateToSchematics?: (dtcCode?: string) => void;
  onNavigateToPartsWithFilter?: (filterText: string) => void;
  onCreateTaskFromSession?: (taskData: {
    title: string;
    description: string;
    relatedDtc?: string;
    relatedPartIds?: string[];
    requiredParts?: Array<{ partId: string; quantity: number }>;
    category?: any;
  }) => void;
  onRecheckSession?: (sessionId: string) => void;
  onCloseSession?: (sessionId: string, result: 'resolved' | 'unresolved' | 'cancelled') => void;
  isCompact?: boolean;
}

export function DiagnosticSessionCard({
  session,
  car,
  parts,
  tasks = [],
  records = [],
  onUpdateSession,
  onNavigateToRag,
  onNavigateToSchematics,
  onNavigateToPartsWithFilter,
  onCreateTaskFromSession,
  onRecheckSession,
  onCloseSession,
  isCompact = false
}: DiagnosticSessionCardProps) {
  const [isChecksOpen, setIsChecksOpen] = useState(true);
  const [isFactsOpen, setIsFactsOpen] = useState(true);
  const [isLiveDataOpen, setIsLiveDataOpen] = useState(!isCompact);

  const dtcList = session.currentDtcCodes || session.initialDtcCodes || session.initialDtc || [];
  const primaryDtc = dtcList[0] || 'DTC';

  // Format time elapsed
  const startTime = new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const startDate = new Date(session.startedAt).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
  const durationMinutes = Math.max(1, Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 60000));

  // Linked tasks
  const linkedTasks = tasks.filter(t => 
    (session.relatedTaskIds && session.relatedTaskIds.includes(t.id)) ||
    (t.diagnosticSessionId === session.id) ||
    (t.carId === session.carId && dtcList.includes(t.relatedDtc || ''))
  );

  // Toggle check step status
  const handleStepStatusChange = (stepIndex: number, newStatus: 'pending' | 'passed' | 'failed' | 'skipped') => {
    const updatedChecks = (session.checks || []).map((chk, idx) => {
      if (idx === stepIndex) {
        return { ...chk, status: newStatus };
      }
      return chk;
    });

    const updatedSession: DiagnosticSession = {
      ...session,
      checks: updatedChecks,
      stepsHistory: [
        ...(session.stepsHistory || []),
        {
          step: `Шаг #${stepIndex + 1}: ${updatedChecks[stepIndex]?.title || ''}`,
          timestamp: new Date().toLocaleTimeString(),
          result: `Статус: ${newStatus}`
        }
      ],
      updatedAt: new Date().toISOString()
    };

    onUpdateSession(updatedSession);
    if (navigator.vibrate) navigator.vibrate(15);
  };

  // Status badge config
  const getStatusBadge = () => {
    switch (session.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 text-xs font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            ДИАГНОСТИКА АКТИВНА
          </span>
        );
      case 'waiting_recheck':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-400 text-xs font-mono font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            ТРЕБУЕТ ПОВТОРНОЙ ПРОВЕРКИ
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-xs font-mono font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ИСПРАВНО
          </span>
        );
      case 'unresolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/80 border border-red-500/50 text-red-400 text-xs font-mono font-bold">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            НЕ УСТРАНЕНО
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-xs font-mono">
            {session.status.toUpperCase()}
          </span>
        );
    }
  };

  const telemetry = session.finalObdSnapshot?.telemetry || session.initialObdSnapshot?.telemetry;

  return (
    <div 
      className="rounded-2xl border border-slate-800 bg-[#0c1222] p-4 sm:p-5 text-slate-100 shadow-xl space-y-4 font-sans relative overflow-hidden"
      id={`diagnostic-session-card-${session.id}`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-wider uppercase text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
              ДИАГНОСТИКА #{session.id.slice(-6).toUpperCase()}
            </span>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              {startDate} {startTime} ({durationMinutes} мин)
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-100 mt-1 flex items-center gap-2">
            {car ? `${car.make} ${car.model} (${car.year})` : 'Автомобиль'}
            <span className="text-xs font-normal text-slate-400 font-mono">
              • {session.startOdometer.toLocaleString()} км
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {getStatusBadge()}
        </div>
      </div>

      {/* DTC Codes Section */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
          <span>Диагностические коды неисправностей (DTC)</span>
          {session.finalObdSnapshot && (
            <span className="text-[10px] text-cyan-400">Сравнение Initial → Final</span>
          )}
        </div>

        {dtcList.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {dtcList.map((dtc, idx) => {
              const isResolved = session.status === 'resolved' || 
                (session.finalObdSnapshot && !session.finalObdSnapshot.dtcCodes?.some(d => d.code === dtc));

              return (
                <div 
                  key={idx}
                  className={`px-3 py-2 rounded-xl border flex items-center gap-2.5 font-mono text-xs ${
                    isResolved 
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                      : 'bg-red-950/40 border-red-500/50 text-red-300'
                  }`}
                >
                  <span className="font-bold text-sm">{dtc}</span>
                  {isResolved ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                      УСТРАНЕНО
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/60 text-red-300 border border-red-700/50">
                      АКТИВЕН
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-emerald-400 font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Коды ошибок в ЭБУ не зафиксированы (0 DTC).</span>
          </div>
        )}
      </div>

      {/* Live Data Snapshot Accordion */}
      {telemetry && (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsLiveDataOpen(!isLiveDataOpen)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-mono text-slate-300 hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 font-bold text-cyan-400">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Телеметрия Live Data (OBD2)
            </span>
            {isLiveDataOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {isLiveDataOpen && (
            <div className="p-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">ОЖ (Coolant)</span>
                <span className="text-slate-200 font-bold">{telemetry.coolantTemp}°C</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Обороты (RPM)</span>
                <span className="text-slate-200 font-bold">{telemetry.rpm} об/мин</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Напряжение</span>
                <span className="text-slate-200 font-bold">{telemetry.voltage} В</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Скорость</span>
                <span className="text-slate-200 font-bold">{telemetry.speed} км/ч</span>
              </div>
              {telemetry.fuelTrim && (
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Коррекция (Trim)</span>
                  <span className="text-slate-200 font-bold">{telemetry.fuelTrim}</span>
                </div>
              )}
              {telemetry.maf && (
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Расход воздуха</span>
                  <span className="text-slate-200 font-bold">{telemetry.maf}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Facts vs Hypotheses vs Verification Section */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Инженерный анализ ситуации
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
          {/* 1. ФАКТЫ */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
            <div className="text-[11px] font-mono font-bold uppercase text-emerald-400 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" />
              1. Факты (OBD & Данные)
            </div>
            <ul className="text-slate-300 space-y-1 text-[11px] leading-relaxed">
              <li>• Зафиксирован DTC: <span className="font-mono text-cyan-300">{primaryDtc}</span></li>
              <li>• Пробег фиксации: {session.startOdometer.toLocaleString()} км</li>
              {telemetry && (
                <li>• Напряжение: {telemetry.voltage}В, Температура: {telemetry.coolantTemp}°C</li>
              )}
            </ul>
          </div>

          {/* 2. ГИПОТЕЗЫ */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
            <div className="text-[11px] font-mono font-bold uppercase text-amber-400 flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-amber-400" />
              2. Гипотезы (Вероятные причины)
            </div>
            <ul className="text-slate-300 space-y-1 text-[11px] leading-relaxed">
              <li>• Высокая: износ свечи зажигания / пробой изолятора</li>
              <li>• Средняя: межвитковое замыкание катушки</li>
              <li>• Низкая: засор форсунки / подсос воздуха</li>
            </ul>
          </div>

          {/* 3. ТРЕБУЕТ ПРОВЕРКИ */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
            <div className="text-[11px] font-mono font-bold uppercase text-cyan-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              3. Требует проверки
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Замер компрессии и сопротивления первичной/вторичной обмотки.
              <span className="block mt-1 text-[10px] text-amber-400/90 font-mono">
                * Требуется сверка с сервисной документацией двигателя.
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Step-by-step Algorithm of Verification */}
      {session.checks && session.checks.length > 0 && (
        <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsChecksOpen(!isChecksOpen)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-900/90 hover:bg-slate-800/80 transition-colors text-xs font-mono uppercase tracking-wider text-slate-300 cursor-pointer"
          >
            <span className="flex items-center gap-2 font-bold text-emerald-400">
              <Wrench className="w-4 h-4 text-emerald-400" />
              Алгоритм пошаговой проверки ({session.checks.length})
            </span>
            {isChecksOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {isChecksOpen && (
            <div className="p-3 space-y-2 border-t border-slate-800/80">
              {session.checks.map((chk, idx) => {
                const status = chk.status || 'pending';

                return (
                  <div 
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 text-cyan-400 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                          {chk.step || idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">{chk.title}</span>
                      </div>
                      {chk.action && (
                        <p className="text-xs text-slate-400 pl-7">{chk.action}</p>
                      )}
                      {chk.expectedResult && (
                        <div className="inline-flex items-center gap-1.5 ml-7 px-2 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-[11px] text-emerald-400 font-mono">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Норма: {chk.expectedResult}</span>
                        </div>
                      )}
                    </div>

                    {/* Step Status Selector Buttons (min 44px touch) */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 pt-1 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => handleStepStatusChange(idx, 'passed')}
                        title="Проверка пройдена успешно"
                        className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                          status === 'passed' 
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-300' 
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-emerald-400'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Норма</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStepStatusChange(idx, 'failed')}
                        title="Обнаружен дефект"
                        className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                          status === 'failed' 
                            ? 'bg-red-950 border-red-500 text-red-300' 
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-red-400'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Дефект</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStepStatusChange(idx, 'skipped')}
                        title="Пропустить шаг"
                        className={`min-h-[44px] px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1 border transition-colors cursor-pointer ${
                          status === 'skipped' 
                            ? 'bg-slate-800 border-slate-600 text-slate-300' 
                            : 'bg-slate-900/80 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <SkipForward className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Linked Tasks Banner */}
      {linkedTasks.length > 0 && (
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
            <span>Связанные ремонтные задачи ({linkedTasks.length})</span>
          </div>
          <div className="space-y-1.5">
            {linkedTasks.map(t => (
              <div 
                key={t.id}
                className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-200 font-semibold">{t.title}</span>
                </div>
                {t.status === 'completed' ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
                    ВЫПОЛНЕНО
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-amber-400 text-[10px] font-mono font-bold">
                    В ПЛАНЕ
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons Bottom Bar (All min-h-[44px] touch targets) */}
      <div className="pt-2 flex flex-wrap items-center gap-2">
        {onNavigateToRag && (
          <button
            type="button"
            onClick={() => onNavigateToRag(`Диагностическая сессия #${session.id.slice(-6)}. DTC: ${primaryDtc}. Поясни алгоритм локализации и типичные неисправности.`)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-cyan-500 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer flex-1 sm:flex-initial"
            id={`btn-session-rag-${session.id}`}
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Василич 2.0</span>
          </button>
        )}

        {onRecheckSession && (
          <button
            type="button"
            onClick={() => onRecheckSession(session.id)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/50 hover:border-cyan-400 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer flex-1 sm:flex-initial"
            id={`btn-session-recheck-${session.id}`}
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>Повторное сканирование</span>
          </button>
        )}

        {onNavigateToSchematics && (
          <button
            type="button"
            onClick={() => onNavigateToSchematics(primaryDtc)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer flex-1 sm:flex-initial"
            id={`btn-session-schema-${session.id}`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Электросхема</span>
          </button>
        )}

        {onNavigateToPartsWithFilter && (
          <button
            type="button"
            onClick={() => onNavigateToPartsWithFilter(primaryDtc)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer flex-1 sm:flex-initial"
            id={`btn-session-parts-${session.id}`}
          >
            <Package className="w-4 h-4 text-emerald-400" />
            <span>Склад</span>
          </button>
        )}

        {onCreateTaskFromSession && session.status !== 'resolved' && session.status !== 'cancelled' && (
          <button
            type="button"
            onClick={() => {
              onCreateTaskFromSession({
                title: `Устранить код неисправности ${primaryDtc}`,
                description: `Диагностическая сессия #${session.id.slice(-6)}. Пробег: ${session.startOdometer} км.`,
                relatedDtc: primaryDtc,
                category: 'Engine'
              });
            }}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer flex-1 sm:flex-initial"
            id={`btn-session-task-${session.id}`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Создать задачу</span>
          </button>
        )}

        {onCloseSession && (session.status === 'active' || session.status === 'waiting_recheck') && (
          <button
            type="button"
            onClick={() => onCloseSession(session.id, 'resolved')}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-xs font-mono transition-all flex items-center justify-center gap-1.5 active:scale-95 sm:ml-auto cursor-pointer w-full sm:w-auto"
            id={`btn-session-close-${session.id}`}
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Закрыть сессию</span>
          </button>
        )}
      </div>

      {(session.status === 'resolved' || session.status === 'cancelled') && (
        <div className="mt-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-[11px] font-mono flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Сессия завершена и зафиксирована в журнале истории
          </span>
          {session.resolvedAt && (
            <span className="text-slate-500">
              {new Date(session.resolvedAt).toLocaleDateString('ru-RU')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
