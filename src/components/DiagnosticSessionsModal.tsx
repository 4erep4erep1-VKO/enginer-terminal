import React, { useState } from 'react';
import { 
  DiagnosticSession, 
  Car, 
  Part, 
  VehicleTask, 
  MaintenanceRecord 
} from '../types';
import { DiagnosticSessionCard } from './DiagnosticSessionCard';
import { 
  Activity, 
  Plus, 
  X, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Search,
  Filter,
  Car as CarIcon,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface DiagnosticSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: DiagnosticSession[];
  activeCar: Car | null;
  cars: Car[];
  parts: Part[];
  tasks: VehicleTask[];
  records: MaintenanceRecord[];
  onStartSession: (carId?: string, initialDtc?: string[]) => void;
  onUpdateSession: (session: DiagnosticSession) => void;
  onRecheckSession: (sessionId: string) => void;
  onCloseSession: (sessionId: string, result: 'resolved' | 'unresolved' | 'cancelled') => void;
  onNavigateToRag?: (contextText?: string) => void;
  onNavigateToSchematics?: (dtcCode?: string) => void;
  onNavigateToPartsWithFilter?: (filterText: string) => void;
  onCreateTaskFromSession?: (taskData: any) => void;
  selectedSessionId?: string | null;
}

export function DiagnosticSessionsModal({
  isOpen,
  onClose,
  sessions,
  activeCar,
  cars,
  parts,
  tasks,
  records,
  onStartSession,
  onUpdateSession,
  onRecheckSession,
  onCloseSession,
  onNavigateToRag,
  onNavigateToSchematics,
  onNavigateToPartsWithFilter,
  onCreateTaskFromSession,
  selectedSessionId: initialSelectedSessionId
}: DiagnosticSessionsModalProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(initialSelectedSessionId || null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved' | 'unresolved'>('all');

  if (!isOpen) return null;

  // Filter sessions for the active car
  const carSessions = sessions.filter(s => !activeCar || s.carId === activeCar.id);
  const filteredSessions = carSessions.filter(s => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return s.status === 'active' || s.status === 'waiting_recheck';
    if (filterStatus === 'resolved') return s.status === 'resolved';
    if (filterStatus === 'unresolved') return s.status === 'unresolved';
    return true;
  });

  const selectedSession = sessions.find(s => s.id === selectedSessionId) || filteredSessions[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-[#080d1a] border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase block">
                ИНЖЕНЕРНЫЙ ДИАГНОСТИЧЕСКИЙ ЦЕНТР
              </span>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Диагностические сессии
                {activeCar && (
                  <span className="text-xs font-normal text-slate-400 font-mono">
                    • {activeCar.make} {activeCar.model}
                  </span>
                )}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                onStartSession(activeCar?.id);
              }}
              className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
              id="btn-modal-start-session"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">НОВАЯ СЕССИЯ</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
              id="btn-modal-close-sessions"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Sidebar: Sessions List */}
          <div className="lg:col-span-4 space-y-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${filterStatus === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Все ({carSessions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('active')}
                className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${filterStatus === 'active' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Активные
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('resolved')}
                className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${filterStatus === 'resolved' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Исправлено
              </button>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {filteredSessions.length > 0 ? (
                filteredSessions.map(s => {
                  const isSelected = selectedSession?.id === s.id;
                  const dtcs = s.currentDtcCodes || s.initialDtcCodes || s.initialDtc || [];
                  const sessionCar = cars.find(c => c.id === s.carId) || activeCar;

                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedSessionId(s.id);
                        if (navigator.vibrate) navigator.vibrate(10);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-left space-y-1.5 ${
                        isSelected 
                          ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950/50' 
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-mono font-bold text-cyan-400">
                          #{s.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(s.startedAt).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-200 truncate">
                        {sessionCar ? `${sessionCar.make} ${sessionCar.model}` : 'Автомобиль'}
                        <span className="text-slate-400 font-normal font-mono ml-1">
                          • {s.startOdometer.toLocaleString()} км
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          {dtcs.length > 0 ? (
                            dtcs.slice(0, 2).map((d, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-500/30 text-[10px] font-mono font-bold">
                                {d}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-mono">0 ошибок</span>
                          )}
                        </div>

                        {s.status === 'active' && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        )}
                        {s.status === 'resolved' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        {s.status === 'unresolved' && (
                          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center rounded-xl bg-slate-950/40 border border-slate-900 space-y-2">
                  <Activity className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">Сессий не найдено</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Main Area: Selected Session Details */}
          <div className="lg:col-span-8">
            {selectedSession ? (
              <DiagnosticSessionCard
                session={selectedSession}
                car={cars.find(c => c.id === selectedSession.carId) || activeCar}
                parts={parts}
                tasks={tasks}
                records={records}
                onUpdateSession={onUpdateSession}
                onNavigateToRag={(q) => {
                  onClose();
                  onNavigateToRag?.(q);
                }}
                onNavigateToSchematics={(code) => {
                  onClose();
                  onNavigateToSchematics?.(code);
                }}
                onNavigateToPartsWithFilter={(f) => {
                  onClose();
                  onNavigateToPartsWithFilter?.(f);
                }}
                onCreateTaskFromSession={(td) => {
                  onCreateTaskFromSession?.(td);
                }}
                onRecheckSession={onRecheckSession}
                onCloseSession={onCloseSession}
              />
            ) : (
              <div className="p-12 text-center rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <Sparkles className="w-10 h-10 text-cyan-500/40 mx-auto" />
                <h3 className="text-base font-bold text-slate-200">Выберите или начните сессию</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Диагностическая сессия отслеживает весь цикл устранения неисправности: от считывания DTC до повторной валидации.
                </p>
                <button
                  type="button"
                  onClick={() => onStartSession(activeCar?.id)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs font-mono inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>НАЧАТЬ ДИАГНОСТИКУ</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
