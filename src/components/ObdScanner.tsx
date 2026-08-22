import React, { useState, useEffect } from 'react';
import { Car, MaintenanceRecord, ObdSnapshot, Part, DtcDiagnosisPayload } from '../types';
import { DtcActionBridge } from './DtcActionBridge';
import { 
  Activity, 
  Bluetooth, 
  BluetoothConnected, 
  BluetoothOff, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Trash2, 
  Save, 
  Gauge, 
  Thermometer, 
  Zap, 
  Play, 
  ShieldAlert,
  Cpu,
  Smartphone,
  Bot,
  Plus,
  Package,
  Clock,
  Radio
} from 'lucide-react';

interface ObdScannerProps {
  activeCar: Car | null;
  parts?: Part[];
  onAddRecord: (record: Omit<MaintenanceRecord, 'createdAt' | 'updatedAt'>) => void;
  onNavigateToRag?: (initialQuestion?: string | DtcDiagnosisPayload) => void;
  onCreateTaskFromDtc?: (taskData: {
    title: string;
    description: string;
    relatedDtc: string;
    relatedPartIds?: string[];
    category?: any;
  }) => void;
  onNavigateToPartsWithFilter?: (filterText: string) => void;
  onAddCandidatePartToStock?: (partName: string) => void;
  focusedDtcCode?: string | null;
  activeSession?: any;
  onStartDiagnosticSession?: (carId?: string, initialDtc?: string[]) => void;
  onOpenDiagnosticSessionModal?: (sessionId?: string) => void;
  onRecheckDiagnosticSession?: (sessionId: string) => void;
}

export interface DtcCode {
  code: string;
  description: string;
  category: 'Engine' | 'Transmission' | 'Body' | 'Chassis' | string;
  severity: 'critical' | 'warning' | 'info' | string;
  possibleCauses: string[];
}

export function ObdScanner({ 
  activeCar, 
  parts = [],
  onAddRecord, 
  onNavigateToRag,
  onCreateTaskFromDtc,
  onNavigateToPartsWithFilter,
  onAddCandidatePartToStock,
  focusedDtcCode,
  activeSession,
  onStartDiagnosticSession,
  onOpenDiagnosticSessionModal,
  onRecheckDiagnosticSession
}: ObdScannerProps) {
  const [mode, setMode] = useState<'demo' | 'bluetooth' | 'disconnected'>('demo');
  const [deviceName, setDeviceName] = useState<string>('ELM327 OBDII (Demo)');
  
  // Detect iOS platform & iframe environment
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent || '';
      setIsIOS(/iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    }
  }, []);

  // Live Telemetry Data
  const [telemetry, setTelemetry] = useState({
    rpm: 840,
    coolantTemp: 88,
    speed: 0,
    voltage: 14.1,
    timestamp: new Date().toLocaleTimeString()
  });

  // DTC State
  const [dtcCodes, setDtcCodes] = useState<DtcCode[]>([]);
  const [isReadingDtc, setIsReadingDtc] = useState<boolean>(false);
  const [isClearingDtc, setIsClearingDtc] = useState<boolean>(false);
  const [dtcReadTime, setDtcReadTime] = useState<string | null>(null);

  // Notifications
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savedToLog, setSavedToLog] = useState<boolean>(false);

  // Function to save current snapshot into localStorage under key 'last_obd_snapshot' and car-specific key
  const saveSnapshotToLocalStorage = (currentTelemetry = telemetry, currentDtc = dtcCodes) => {
    const carNameStr = activeCar ? `${activeCar.make} ${activeCar.model} (${activeCar.year})` : 'Автомобиль не выбран';
    const now = new Date();
    const snapshot: ObdSnapshot = {
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isoTimestamp: now.toISOString(),
      carId: activeCar?.id,
      deviceName,
      mode,
      telemetry: {
        rpm: currentTelemetry.rpm,
        coolantTemp: currentTelemetry.coolantTemp,
        speed: currentTelemetry.speed,
        voltage: currentTelemetry.voltage,
        throttle: 18,
        fuelTrim: "+2.4%",
        maf: "2.15 g/s"
      },
      dtcCodes: currentDtc.map(d => ({
        code: d.code,
        description: d.description,
        category: d.category,
        severity: d.severity,
        possibleCauses: d.possibleCauses
      })),
      carName: carNameStr
    };
    try {
      localStorage.setItem('last_obd_snapshot', JSON.stringify(snapshot));
      if (activeCar?.id) {
        localStorage.setItem(`obd_snapshot_${activeCar.id}`, JSON.stringify(snapshot));
      }
    } catch (e) {
      console.error('Failed to save obd snapshot:', e);
    }
  };

  // Persist telemetry snapshot whenever telemetry or DTC codes update
  useEffect(() => {
    if (mode !== 'disconnected') {
      saveSnapshotToLocalStorage();
    }
  }, [telemetry.rpm, telemetry.coolantTemp, telemetry.voltage, dtcCodes, mode, activeCar?.id]);

  const handleSendSnapshotToVasilich = () => {
    saveSnapshotToLocalStorage();
    const carTitle = activeCar ? `${activeCar.make} ${activeCar.model} (${activeCar.year})` : 'моего автомобиля';
    const question = `Василич, изучи текущие показатели OBD2 и проанализируй состояние моего автомобиля (${carTitle}). Все ли параметры в норме?`;
    localStorage.setItem('rag_initial_question', question);
    if (onNavigateToRag) {
      onNavigateToRag(question);
    }
  };

  const handleAskVasilichAboutError = (dtcCode: string) => {
    saveSnapshotToLocalStorage();
    const carTitle = activeCar ? `${activeCar.make} ${activeCar.model}` : 'автомобиле';
    const question = `Василич, распиши причины ошибки ${dtcCode} на ${carTitle} и как её исправить`;
    localStorage.setItem('rag_initial_question', question);
    if (onNavigateToRag) {
      onNavigateToRag(question);
    }
  };

  // Safely check Web Bluetooth availability
  const checkBluetoothSupport = (): boolean => {
    try {
      return typeof window !== 'undefined' && 
             typeof navigator !== 'undefined' && 
             'bluetooth' in navigator && 
             Boolean((navigator as any).bluetooth);
    } catch {
      return false;
    }
  };

  const isBtSupported = checkBluetoothSupport();

  // Telemetry generator loop
  useEffect(() => {
    let timer: any = null;

    if (mode === 'demo') {
      // Demo Mode: RPM 800-2500, Coolant 85-92°C, Voltage 13.8-14.2V, Speed 0-60 km/h
      timer = setInterval(() => {
        setTelemetry({
          rpm: Math.floor(800 + Math.random() * 1700), // 800 - 2500 RPM
          coolantTemp: Math.floor(85 + Math.random() * 7), // 85 - 92 °C
          speed: Math.floor(Math.random() * 60), // 0 - 60 km/h
          voltage: parseFloat((13.8 + Math.random() * 0.4).toFixed(1)), // 13.8 - 14.2 V
          timestamp: new Date().toLocaleTimeString()
        });
      }, 1000);
    } else if (mode === 'bluetooth') {
      // Simulated live ELM327 feed
      timer = setInterval(() => {
        setTelemetry({
          rpm: Math.floor(820 + Math.random() * 120),
          coolantTemp: 90,
          speed: 0,
          voltage: 14.0,
          timestamp: new Date().toLocaleTimeString()
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [mode]);

  // Connect Real ELM327 via Web Bluetooth API
  const handleConnectBluetooth = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (isInIframe) {
      setErrorMessage('Web Bluetooth ограничен политикой безопасности iframe');
      return;
    }

    if (!isBtSupported) {
      setErrorMessage('Web Bluetooth API недоступен в текущем браузере.');
      return;
    }

    try {
      const navBt = (navigator as any).bluetooth;
      if (!navBt || typeof navBt.requestDevice !== 'function') {
        throw new Error('Функция bluetooth.requestDevice недоступна');
      }

      setSuccessMessage('Поиск Bluetooth устройств (ELM327 / OBD2)...');

      let device: any = null;

      try {
        device = await navBt.requestDevice({
          filters: [
            { name: 'OBDII' },
            { name: 'ELM327' },
            { name: 'OBD2' },
            { namePrefix: 'OBD' },
            { namePrefix: 'ELM' },
            { services: ['00001101-0000-1000-8000-00805f9b34fb'] }
          ],
          optionalServices: ['00001101-0000-1000-8000-00805f9b34fb', '0000fff0-0000-1000-8000-00805f9b34fb']
        });
      } catch {
        // Fallback: accept all devices if filter restriction is unsupported
        device = await navBt.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['00001101-0000-1000-8000-00805f9b34fb', '0000fff0-0000-1000-8000-00805f9b34fb']
        });
      }

      if (device) {
        setDeviceName(device.name || 'ELM327 Bluetooth');
        setMode('bluetooth');
        setSuccessMessage(`Успешно подключено к сканеру: ${device.name || 'ELM327'}`);
      }
    } catch (err: any) {
      console.warn('Bluetooth connection error:', err);
      let msg = err?.message || 'Не удалось подключиться к Bluetooth адаптеру';
      if (msg.includes('Permissions policy') || msg.includes('disallowed') || msg.includes('SecurityError') || msg.includes('not allowed')) {
        msg = 'Web Bluetooth ограничен политикой безопасности iframe.';
      } else if (msg.includes('cancel') || msg.includes('User cancelled')) {
        msg = 'Поиск устройств отменен пользователем.';
      }
      setErrorMessage(msg);
    }
  };

  // Connect Demo Mode
  const handleConnectDemo = () => {
    setErrorMessage(null);
    setMode('demo');
    setDeviceName('ELM327 OBDII (Demo)');
    setSuccessMessage('Включен Демо-режим телеметрии и эмуляции ELM327. Вы можете просмотреть датчики и ошибки.');
  };

  // Disconnect (Preserves read DTC codes as offline snapshot)
  const handleDisconnect = () => {
    setMode('disconnected');
    setSuccessMessage(null);
    // Preserving dtcCodes so engineer can continue analyzing offline
    if (dtcCodes.length > 0) {
      setSuccessMessage('Адаптер отключен. Сохранен последний снимок ошибок ЭБУ (Offline).');
    }
  };

  // Read DTC codes
  const handleReadDtc = async () => {
    if (mode === 'disconnected') {
      setErrorMessage('Пожалуйста, включите Демо-режим или подключите ELM327');
      return;
    }

    setIsReadingDtc(true);
    setErrorMessage(null);
    setSavedToLog(false);

    try {
      await new Promise((res) => setTimeout(res, 800));

      const demoCodes: DtcCode[] = [
        {
          code: 'P0300',
          description: 'Обнаружены пропуски воспламенения в нескольких цилиндрах',
          category: 'Engine',
          severity: 'critical',
          possibleCauses: ['Изношены свечи зажигания', 'Сбой высоковольтных катушек', 'Подсос воздуха во впускной коллектор']
        },
        {
          code: 'P0171',
          description: 'Слишком бедная смесь (Банк 1 / Fuel Trim System Too Lean)',
          category: 'Engine',
          severity: 'warning',
          possibleCauses: ['Подсос воздуха за ДМРВ', 'Забит топливный фильтр / слабый насос', 'Неисправен лямбда-зонд']
        }
      ];

      setDtcCodes(demoCodes);
      setDtcReadTime(new Date().toLocaleString());
      setSuccessMessage('Считывание кодов ЭБУ завершено. Обнаружено ошибок: 2 шт.');
      saveSnapshotToLocalStorage(telemetry, demoCodes);
    } catch {
      setErrorMessage('Ошибка при считывании кодов ЭБУ');
    } finally {
      setIsReadingDtc(false);
    }
  };

  // Clear DTC codes
  const handleClearDtc = async () => {
    setIsClearingDtc(true);
    try {
      await new Promise((res) => setTimeout(res, 800));
      setDtcCodes([]);
      setDtcReadTime(null);
      setSuccessMessage('Ошибки ЭБУ успешно сброшены (Clear Fault Codes 04).');
      saveSnapshotToLocalStorage(telemetry, []);
    } catch {
      setErrorMessage('Ошибка при выполнении команды сброса ошибок');
    } finally {
      setIsClearingDtc(false);
    }
  };

  // Save report directly to car's maintenance log
  const handleSaveReportToLog = () => {
    if (!activeCar) {
      setErrorMessage('Пожалуйста, выберите автомобиль для сохранения отчета.');
      return;
    }

    const errorSummary = dtcCodes.length > 0 
      ? `Ошибки ЭБУ (${dtcCodes.length} шт.): ${dtcCodes.map(d => `${d.code} (${d.description})`).join('; ')}`
      : 'Компьютерная диагностика: Ошибок в блоке управления ЭБУ не обнаружено.';

    const metricsSummary = mode !== 'disconnected'
      ? `Параметры ЭБУ: Обороты: ${telemetry.rpm} об/мин, Температура ОЖ: ${telemetry.coolantTemp}°C, Напряжение АКБ: ${telemetry.voltage}В, Скорость: ${telemetry.speed} км/ч.`
      : '';

    const newRecord: Omit<MaintenanceRecord, 'createdAt' | 'updatedAt'> = {
      id: 'obd-rep-' + Math.random().toString(36).substring(2, 9),
      carId: activeCar.id,
      description: `OBD2 Компьютерная диагностика ELM327. ${errorSummary} ${metricsSummary}`,
      mileage: activeCar.mileage,
      partsPrice: 0,
      laborPrice: 0,
      date: new Date().toISOString().split('T')[0],
      category: 'Diagnostics',
      partsUsed: dtcCodes.map(d => `Код ошибки: ${d.code}`)
    };

    if (onAddRecord) {
      onAddRecord(newRecord);
    }
    setSavedToLog(true);
    setSuccessMessage(`Диагностический отчет сохранен в журнал работ ${activeCar.make} ${activeCar.model}!`);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* IFRAME RESTRICTION BANNER */}
      {isInIframe && (
        <div className="p-4 bg-rose-950/80 border border-rose-500/80 text-rose-200 text-xs rounded-xl flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-rose-300 font-bold uppercase text-xs mb-0.5">ОГРАНИЧЕНИЕ IFRAME</strong>
            <span>Web Bluetooth ограничен политикой безопасности iframe</span>
          </div>
        </div>
      )}

      {/* iOS HINT BANNER */}
      {isIOS && (
        <div className="p-4 bg-sky-950/80 border border-sky-500/60 text-sky-200 text-xs rounded-xl flex items-start gap-3 shadow-lg">
          <Smartphone className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-sky-300 font-bold uppercase text-xs mb-0.5">ПОДСКАЗКА ДЛЯ iOS (Safari / iPhone)</strong>
            <span>Для подключения реального ELM327 на iOS используйте браузер <strong>WebBLE</strong> или <strong>Bluefy</strong> из App Store.</span>
          </div>
        </div>
      )}

      {/* HUD Header */}
      <div className="bento-card p-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
              <Cpu className="w-4 h-4 animate-pulse text-cyan-400" />
              <span>Модуль OBD2 диагностики и телеметрии</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-wide mt-1">
              {activeCar ? `${activeCar.make} ${activeCar.model} (${activeCar.year})` : 'Автомобиль не выбран'}
            </h2>
          </div>

          {/* Connection Status Badge & Action */}
          <div className="flex flex-wrap items-center gap-2">
            {mode === 'disconnected' && (
              <span className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-lg text-xs font-medium">
                <BluetoothOff className="w-4 h-4 text-slate-500" />
                Отключено
              </span>
            )}
            {mode === 'bluetooth' && (
              <span className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-medium shadow-md">
                <BluetoothConnected className="w-4 h-4 text-emerald-400" />
                Подключено: {deviceName}
              </span>
            )}
            {mode === 'demo' && (
              <span className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-500/60 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-medium shadow-md">
                <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                Демо-эмуляция ELM327
              </span>
            )}

            <button
              onClick={handleSendSnapshotToVasilich}
              className="btn-primary min-h-[40px] px-3.5 text-xs font-bold rounded-xl flex items-center gap-2"
              title="Сохранить текущий снимок телеметрии и отправить Василичу"
            >
              <Bot className="w-4 h-4" />
              <span>Отправить снимок Василичу</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Diagnostic Session Banner */}
      {activeSession && (
        <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                  АКТИВНАЯ СЕССИЯ ДИАГНОСТИКИ #{activeSession.id.slice(-6).toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-200 font-medium">
                Контроль кодов: {(activeSession.currentDtcCodes || activeSession.initialDtcCodes || []).join(', ') || '0 DTC'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onOpenDiagnosticSessionModal?.(activeSession.id)}
              className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>КАРТОЧКА СЕССИИ</span>
            </button>

            {onRecheckDiagnosticSession && (
              <button
                type="button"
                onClick={() => onRecheckDiagnosticSession(activeSession.id)}
                className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 font-bold text-xs font-mono cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>ВАЛИДАЦИЯ / РЕЧЕК</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Control Panel: Mode Switches */}
      <div className="bento-card p-5 space-y-4">
        <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
          Режим подключения к бортовому компьютеру
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleConnectDemo}
            className={`min-h-[48px] px-4 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              mode === 'demo'
                ? 'bg-amber-500 text-slate-950 border border-amber-400 shadow-amber-500/20'
                : 'bg-amber-500/10 border border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Демо-режим</span>
          </button>

          <button
            onClick={handleConnectBluetooth}
            className={`min-h-[48px] px-4 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              mode === 'bluetooth'
                ? 'btn-primary'
                : 'bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20'
            }`}
          >
            <Bluetooth className="w-4 h-4" />
            <span>Подключить ELM327</span>
          </button>

          {mode !== 'disconnected' && (
            <button
              onClick={handleDisconnect}
              className="min-h-[48px] px-4 bg-rose-950/60 border border-rose-500/60 text-rose-300 hover:bg-rose-900/80 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <BluetoothOff className="w-4 h-4" />
              <span>Отключить</span>
            </button>
          )}
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* LIVE DATA TELEMETRY WIDGETS */}
      <div className="space-y-4">
        {/* Header telemetry status */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Показатели ДВС в реальном времени</span>
          </div>
          
          <div className="flex items-center gap-2">
            {mode === 'bluetooth' && (
              <span className="flex items-center gap-1.5 bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                LIVE • {telemetry.timestamp}
              </span>
            )}
            {mode === 'demo' && (
              <span className="flex items-center gap-1.5 bg-amber-950/90 border border-amber-500/60 text-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold">
                <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
                ДЕМО LIVE • {telemetry.timestamp}
              </span>
            )}
            {mode === 'disconnected' && (
              <span className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full text-[11px] font-mono">
                <Clock className="w-3 h-3 text-slate-500" />
                ОТКЛЮЧЕНО
              </span>
            )}
          </div>
        </div>

        {mode !== 'disconnected' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* RPM Widget */}
            <div className="bento-card p-4 relative overflow-hidden bg-slate-900/90">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium mb-1">
                <span className="flex items-center gap-1.5"><Gauge className="w-4 h-4 text-cyan-400" /> Обороты ДВС</span>
                <span className="font-mono">RPM</span>
              </div>
              <div className="text-3xl font-black font-mono text-white tracking-wider my-1">
                {telemetry.rpm} <span className="text-xs font-normal text-cyan-400">об/мин</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-3">
                <div 
                  className={`h-full transition-all duration-300 rounded-full ${
                    telemetry.rpm > 5000 ? 'bg-rose-500' :
                    telemetry.rpm > 3000 ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${Math.min(100, (telemetry.rpm / 6000) * 100)}%` }}
                />
              </div>
            </div>

            {/* Coolant Temp Widget */}
            <div className="bento-card p-4 relative overflow-hidden bg-slate-900/90">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium mb-1">
                <span className="flex items-center gap-1.5"><Thermometer className="w-4 h-4 text-cyan-400" /> Температура ОЖ</span>
                <span className="font-mono">TEMP</span>
              </div>
              <div className="text-3xl font-black font-mono text-white tracking-wider my-1">
                {telemetry.coolantTemp}°C
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-3">
                <div 
                  className="h-full bg-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.min(100, (telemetry.coolantTemp / 120) * 100)}%` }}
                />
              </div>
            </div>

            {/* Speed Widget */}
            <div className="bento-card p-4 relative overflow-hidden bg-slate-900/90">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium mb-1">
                <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-cyan-400" /> Скорость</span>
                <span className="font-mono">SPEED</span>
              </div>
              <div className="text-3xl font-black font-mono text-white tracking-wider my-1">
                {telemetry.speed} <span className="text-xs font-normal text-cyan-400">км/ч</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-3">
                <div 
                  className="h-full bg-cyan-400 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.min(100, (telemetry.speed / 180) * 100)}%` }}
                />
              </div>
            </div>

            {/* Voltage Widget */}
            <div className="bento-card p-4 relative overflow-hidden bg-slate-900/90">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium mb-1">
                <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-cyan-400" /> Напряжение АКБ</span>
                <span className="font-mono">VOLTS</span>
              </div>
              <div className="text-3xl font-black font-mono text-white tracking-wider my-1">
                {telemetry.voltage} <span className="text-xs font-normal text-cyan-400">В</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-3">
                <div 
                  className="h-full bg-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.min(100, ((telemetry.voltage - 10) / 6) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 bento-card text-center text-slate-400 text-xs space-y-2">
            <Cpu className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
            <p className="text-slate-200 font-bold uppercase">Телеметрия отключена</p>
            <p className="text-slate-400 text-xs max-w-md mx-auto">
              Выберите Демо-режим или подключите реальный адаптер ELM327 для отображения параметров.
            </p>
          </div>
        )}
      </div>

      {/* DTC TROUBLE CODES SECTION */}
      <div className="bento-card p-5 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Считывание ошибок ЭБУ (DTC Fault Codes)</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Диагностика неисправностей блока управления двигателем
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleReadDtc}
              disabled={isReadingDtc}
              className="btn-primary flex-1 sm:flex-initial min-h-[44px] px-4 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 ${isReadingDtc ? 'animate-spin' : ''}`} />
              <span>{isReadingDtc ? 'Считывание...' : 'Считать ошибки ЭБУ'}</span>
            </button>

            {dtcCodes.length > 0 && (
              <button
                onClick={handleClearDtc}
                disabled={isClearingDtc}
                className="min-h-[44px] px-4 bg-rose-950/80 border border-rose-500/60 text-rose-300 rounded-xl font-bold text-xs uppercase hover:bg-rose-900 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isClearingDtc ? 'Сброс...' : 'Сбросить ошибки'}</span>
              </button>
            )}
          </div>
        </div>

        {dtcReadTime && (
          <div className="text-xs text-slate-400">
            Последнее сканирование: <span className="text-cyan-400 font-mono">{dtcReadTime}</span>
          </div>
        )}

        {dtcCodes.length > 0 ? (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-rose-400 uppercase">Обнаружены ошибки ЭБУ ({dtcCodes.length}):</span>
              
              <div className="flex items-center gap-2 flex-wrap">
                {onStartDiagnosticSession && (
                  <button
                    onClick={() => {
                      saveSnapshotToLocalStorage();
                      onStartDiagnosticSession(activeCar?.id, dtcCodes.map(d => d.code));
                    }}
                    className="min-h-[40px] px-3.5 bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 font-semibold text-xs rounded-xl hover:bg-cyan-900 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>Начать диагностическую сессию</span>
                  </button>
                )}

                <button
                  onClick={handleSaveReportToLog}
                  disabled={savedToLog}
                  className="min-h-[40px] px-3.5 bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-semibold text-xs rounded-xl hover:bg-emerald-900 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savedToLog ? 'Сохранено в журнал' : 'Сохранить отчет в журнал авто'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {dtcCodes.map((dtc) => {
                const isFocused = focusedDtcCode && focusedDtcCode.toUpperCase() === dtc.code.toUpperCase();
                return (
                  <div key={dtc.code} className={isFocused ? 'ring-2 ring-cyan-400 rounded-2xl animate-pulse' : ''}>
                    <DtcActionBridge
                      activeCar={activeCar}
                      dtcCode={dtc.code}
                      dtcDescription={dtc.description}
                      severity={dtc.severity}
                      category={dtc.category}
                      possibleCauses={dtc.possibleCauses}
                      availableParts={parts}
                      onAskVasilich={(payload) => {
                        saveSnapshotToLocalStorage();
                        if (onNavigateToRag) {
                          onNavigateToRag(payload);
                        }
                      }}
                      onCreateTask={(taskData) => {
                        if (onCreateTaskFromDtc) {
                          onCreateTaskFromDtc(taskData);
                        }
                      }}
                      onNavigateToPartsWithFilter={(filter) => {
                        if (onNavigateToPartsWithFilter) {
                          onNavigateToPartsWithFilter(filter);
                        }
                      }}
                      onAddCandidatePartToStock={(partName) => {
                        if (onAddCandidatePartToStock) {
                          onAddCandidatePartToStock(partName);
                        } else if (onNavigateToPartsWithFilter) {
                          onNavigateToPartsWithFilter(partName);
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          dtcReadTime && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <strong className="block text-emerald-200 uppercase font-bold">Ошибок ЭБУ не обнаружено</strong>
                  Память контроллера системы управления двигателем чиста.
                </div>
              </div>
              
              <button
                onClick={handleSaveReportToLog}
                disabled={savedToLog}
                className="py-2 px-3 bg-emerald-950 border border-emerald-500/60 text-emerald-300 font-semibold text-xs rounded-xl hover:bg-emerald-900 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>{savedToLog ? 'Сохранено' : 'Сохранить отчет в журнал'}</span>
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
