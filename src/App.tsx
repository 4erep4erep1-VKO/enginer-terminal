/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Car, MaintenanceRecord, Part, VehicleTask } from './types';
import { RecordCard } from './components/RecordCard';
import { AddRecordForm } from './components/AddRecordForm';
import { GarageManager } from './components/GarageManager';
import { RagAssistant } from './components/RagAssistant';
import { ConfirmModal } from './components/ConfirmModal';
import { VehicleTasks } from './components/VehicleTasks';
import { SettingsPanel } from './components/SettingsPanel';
import { useUserSettings } from './components/UserSettingsContext';
import { 
  Wrench, 
  Settings, 
  Plus, 
  Info,
  Clock,
  Download,
  Smartphone,
  Wifi,
  WifiOff,
  CheckCircle2
} from 'lucide-react';

// PRE-POPULATED LOCAL DATA FOR INSTANT OUT-OF-THE-BOX WORKING INTERFACE
const DEFAULT_CARS: Car[] = [
  {
    id: 'lada-kalina',
    make: 'Lada',
    model: 'Kalina',
    year: 2010,
    vin: 'XTA111830A0123456',
    licensePlate: 'А123ВВ163',
    mileage: 229000,
    ownerId: 'local-owner',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_RECORDS: MaintenanceRecord[] = [
  {
    id: 'rec-1',
    carId: 'lada-kalina',
    description: 'Замена моторного масла и масляного фильтра Роснефть Max',
    category: 'Oil & Fluids',
    mileage: 225000,
    partsPrice: 3200.00,
    laborPrice: 1000.00,
    date: '2026-04-12',
    partsUsed: ['Роснефть Maximum 10W-40 (4L)', 'Фильтр масляный Салют GB-102'],
    photoUrls: [
      'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=200'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rec-2',
    carId: 'lada-kalina',
    description: 'Замена комплекта ГРМ и регулировка тепловых зазоров клапанов',
    category: 'Engine',
    mileage: 228000,
    partsPrice: 4800.00,
    laborPrice: 3000.00,
    date: '2026-05-20',
    partsUsed: ['Ремень ГРМ Gates с роликом PowerGrip', 'Прокладка клапанной крышки БРТ'],
    voiceTranscript: 'Поменял ремень ГРМ гейтс вместе с натяжным роликом и отрегулировал зазоры клапанов на пробеге двести двадцать восемь тысяч',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_PARTS: Part[] = [
  {
    id: 'part-1',
    name: 'Ремень генератора БРТ 6PK882',
    partNumber: '1118-1041150',
    quantity: 1,
    price: 650.00,
    supplier: 'Exist.ru',
    location: 'Стеллаж А-3',
    ownerId: 'local-owner',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'part-2',
    name: 'Тормозные колодки передние ТИИР-299',
    partNumber: '2110-3501080',
    quantity: 2,
    price: 1100.00,
    supplier: 'Autodoc.ru',
    location: 'Шкаф Б-1',
    ownerId: 'local-owner',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_TASKS: VehicleTask[] = [
  {
    id: 'task-1',
    carId: 'lada-kalina',
    title: 'Замена моторного масла и фильтра',
    type: 'mileage',
    targetMileage: 230000,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task-2',
    carId: 'lada-kalina',
    title: 'Купить новые щетки стеклоочистителя',
    type: 'simple',
    targetDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export default function App() {
  const { formatCurrency } = useUserSettings();

  // Pure Local State - Initialize from LocalStorage or defaults
  const [cars, setCars] = useState<Car[]>([]);
  const [activeCarId, setActiveCarId] = useState<string | null>(null);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [tasks, setTasks] = useState<VehicleTask[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // PWA Install & Offline State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // 1. Initial LocalStorage Load
  useEffect(() => {
    try {
      // Cars
      const savedCarsStr = localStorage.getItem('terminal_cars_v2') || localStorage.getItem('blueprint_cars_guest');
      let loadedCars: Car[] = savedCarsStr ? JSON.parse(savedCarsStr) : [];
      if (!loadedCars || loadedCars.length === 0) {
        loadedCars = DEFAULT_CARS;
        localStorage.setItem('terminal_cars_v2', JSON.stringify(DEFAULT_CARS));
      }
      setCars(loadedCars);

      // Active Car
      const savedActiveCarId = localStorage.getItem('terminal_active_car_id_v2') || localStorage.getItem('blueprint_active_car_guest');
      const validActiveId = loadedCars.find(c => c.id === savedActiveCarId) ? savedActiveCarId : loadedCars[0]?.id || null;
      setActiveCarId(validActiveId);

      // Records
      const savedRecordsStr = localStorage.getItem('terminal_records_v2') || localStorage.getItem('blueprint_records_guest');
      let loadedRecords: MaintenanceRecord[] = savedRecordsStr ? JSON.parse(savedRecordsStr) : [];
      if (!loadedRecords || loadedRecords.length === 0) {
        loadedRecords = DEFAULT_RECORDS;
        localStorage.setItem('terminal_records_v2', JSON.stringify(DEFAULT_RECORDS));
      }
      setRecords(loadedRecords);

      // Parts
      const savedPartsStr = localStorage.getItem('terminal_parts_v2') || localStorage.getItem('blueprint_parts_guest');
      let loadedParts: Part[] = savedPartsStr ? JSON.parse(savedPartsStr) : [];
      if (!loadedParts || loadedParts.length === 0) {
        loadedParts = DEFAULT_PARTS;
        localStorage.setItem('terminal_parts_v2', JSON.stringify(DEFAULT_PARTS));
      }
      setParts(loadedParts);

      // Tasks
      const savedTasksStr = localStorage.getItem('terminal_tasks_v2') || localStorage.getItem('blueprint_tasks_guest');
      let loadedTasks: VehicleTask[] = savedTasksStr ? JSON.parse(savedTasksStr) : [];
      if (!loadedTasks || loadedTasks.length === 0) {
        loadedTasks = DEFAULT_TASKS;
        localStorage.setItem('terminal_tasks_v2', JSON.stringify(DEFAULT_TASKS));
      }
      setTasks(loadedTasks);
    } catch (e) {
      console.error('Error reading localStorage:', e);
      setCars(DEFAULT_CARS);
      setActiveCarId(DEFAULT_CARS[0].id);
      setRecords(DEFAULT_RECORDS);
      setParts(DEFAULT_PARTS);
      setTasks(DEFAULT_TASKS);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 2. Persist to LocalStorage on state changes
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('terminal_cars_v2', JSON.stringify(cars));
  }, [cars, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (activeCarId) {
      localStorage.setItem('terminal_active_car_id_v2', activeCarId);
    }
  }, [activeCarId, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('terminal_records_v2', JSON.stringify(records));
  }, [records, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('terminal_parts_v2', JSON.stringify(parts));
  }, [parts, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('terminal_tasks_v2', JSON.stringify(tasks));
  }, [tasks, isLoaded]);

  // 3. PWA Event Listeners & Online/Offline status
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  // Panel state / navigation
  const [activeTab, setActiveTab] = useState<'records' | 'rag' | 'parts' | 'tasks' | 'settings'>('records');
  const [showAddForm, setShowAddForm] = useState(false);
  const [timeStr, setTimeStr] = useState('');

  // Pre-filled record values state for when using a part or completing task
  const [initialRecordValues, setInitialRecordValues] = useState<{
    description?: string;
    partsPrice?: number;
    partsUsed?: string[];
  } | undefined>(undefined);

  // Confirmation Modal State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Parts Inventory add modal state
  const [newPartName, setNewPartName] = useState('');
  const [newPartNum, setNewPartNum] = useState('');
  const [newPartQty, setNewPartQty] = useState(1);
  const [newPartPrice, setNewPartPrice] = useState(0);
  const [newPartLoc, setNewPartLoc] = useState('');

  // Update clock/telemetry
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      const offsetMinutes = now.getTimezoneOffset();
      const offsetSign = offsetMinutes <= 0 ? '+' : '-';
      const absOffsetMinutes = Math.abs(offsetMinutes);
      const offsetHours = String(Math.floor(absOffsetMinutes / 60)).padStart(2, '0');
      const offsetMins = String(absOffsetMinutes % 60).padStart(2, '0');
      const offsetStr = `GMT${offsetSign}${offsetHours}:${offsetMins}`;

      setTimeStr(`${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${offsetStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Header Scroll and Auto-Hide Logic
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  useEffect(() => {
    let lastScrollYVal = window.scrollY;
    let timer: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (timer) {
        clearTimeout(timer);
      }

      if (currentScrollY <= 0) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollYVal) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
        timer = setTimeout(() => {
          if (window.scrollY > 0) {
            setIsHeaderVisible(false);
          }
        }, 1800);
      }

      lastScrollYVal = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  // Active Car details
  const activeCar = cars.find(c => c.id === activeCarId) || null;

  // Active Car's maintenance records
  const activeCarRecords = records
    .filter(r => r.carId === activeCarId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculation of garage stats
  const totalSpendOnActiveCar = activeCarRecords.reduce((sum, r) => sum + r.partsPrice + r.laborPrice, 0);

  const handleAddCar = (newCarData: Omit<Car, 'ownerId' | 'createdAt' | 'updatedAt'>) => {
    const fullCar: Car = {
      ...newCarData,
      ownerId: 'local-owner',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setCars(prev => [...prev, fullCar]);
    setActiveCarId(fullCar.id);
  };

  const handleDeleteCar = (id: string) => {
    const car = cars.find(c => c.id === id);
    const carName = car ? `${car.make} ${car.model}` : '';
    setConfirmState({
      isOpen: true,
      title: 'ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ',
      message: `Вы уверены, что хотите удалить автомобиль ${carName}? Это действие сотрет историю его ремонта и запчастей из локальной памяти.`,
      confirmText: 'УДАЛИТЬ',
      cancelText: 'ОТМЕНА',
      onConfirm: () => {
        setCars(prev => prev.filter(c => c.id !== id));
        if (activeCarId === id) {
          const remaining = cars.filter(c => c.id !== id);
          setActiveCarId(remaining[0]?.id || null);
        }
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAddRecord = (newRecData: Omit<MaintenanceRecord, 'createdAt' | 'updatedAt'>) => {
    const fullRecord: MaintenanceRecord = {
      ...newRecData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setRecords(prev => [fullRecord, ...prev]);
    setShowAddForm(false);

    // Automatically update car's active mileage if record mileage is higher
    if (activeCar && newRecData.mileage > activeCar.mileage) {
      const updatedCar = { ...activeCar, mileage: newRecData.mileage };
      setCars(prev => prev.map(c => c.id === activeCar.id ? updatedCar : c));
    }
  };

  const handleDeleteRecord = (id: string) => {
    const record = records.find(r => r.id === id);
    setConfirmState({
      isOpen: true,
      title: 'ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ',
      message: `Вы уверены, что хотите удалить запись "${record?.description || ''}"? Действие нельзя отменить.`,
      confirmText: 'УДАЛИТЬ',
      cancelText: 'ОТМЕНА',
      onConfirm: () => {
        setRecords(prev => prev.filter(r => r.id !== id));
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim()) return;

    const fullPart: Part = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPartName.trim(),
      partNumber: newPartNum.trim() || undefined,
      quantity: newPartQty,
      price: newPartPrice,
      location: newPartLoc.trim() || undefined,
      ownerId: 'local-owner',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setParts(prev => [...prev, fullPart]);
    setNewPartName('');
    setNewPartNum('');
    setNewPartQty(1);
    setNewPartPrice(0);
    setNewPartLoc('');
  };

  const handleDeletePart = (id: string) => {
    const part = parts.find(p => p.id === id);
    setConfirmState({
      isOpen: true,
      title: 'ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ',
      message: `Вы уверены, что хотите удалить деталь "${part?.name || ''}" со склада? Действие нельзя отменить.`,
      confirmText: 'УДАЛИТЬ',
      cancelText: 'ОТМЕНА',
      onConfirm: () => {
        setParts(prev => prev.filter(p => p.id !== id));
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleUsePart = (part: Part) => {
    if (navigator.vibrate) navigator.vibrate(15);
    if (part.quantity <= 0) return;

    const newQty = part.quantity - 1;
    const updatedPart = { ...part, quantity: newQty };
    
    setParts(prev => prev.map(p => p.id === part.id ? updatedPart : p));

    setInitialRecordValues({
      description: `Установка детали: ${part.name}`,
      partsPrice: part.price,
      partsUsed: [part.name],
    });
    setActiveTab('records');
    setShowAddForm(true);

    if (newQty === 0) {
      setConfirmState({
        isOpen: true,
        title: 'ДЕТАЛЬ ЗАКОНЧИЛАСЬ',
        message: `Количество детали "${part.name}" на складе стало 0. Удалить её со склада или оставить в списке с пометкой "Нет в наличии"?`,
        confirmText: 'УДАЛИТЬ',
        cancelText: 'ОТМЕНА',
        onConfirm: () => {
          setParts(prev => prev.filter(p => p.id !== part.id));
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        },
      });
    }
  };

  const handleAddTask = (newTaskData: { title: string; type: any; targetMileage?: number; targetDate?: string }) => {
    if (!activeCarId) return;
    const newTask: VehicleTask = {
      id: Math.random().toString(36).substr(2, 9),
      carId: activeCarId,
      title: newTaskData.title,
      type: newTaskData.type,
      targetMileage: newTaskData.targetMileage,
      targetDate: newTaskData.targetDate,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const handleDeleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    setConfirmState({
      isOpen: true,
      title: 'ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ',
      message: `Вы уверены, что хотите удалить задачу "${task?.title || ''}"?`,
      confirmText: 'УДАЛИТЬ',
      cancelText: 'ОТМЕНА',
      onConfirm: () => {
        setTasks(prev => prev.filter(t => t.id !== id));
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleMarkTaskCompleted = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'completed', updatedAt: new Date().toISOString() } : t));

    setInitialRecordValues({
      description: task.title,
      partsPrice: 0,
      partsUsed: []
    });
    setActiveTab('records');
    setShowAddForm(true);
  };

  return (
    <div className="min-h-screen bg-blueprint-bg blueprint-grid pb-12 flex flex-col justify-between">

      {/* 1. TOP MAIN HUD BAR */}
      <header className={`border-b-2 border-blueprint-cyan bg-black/85 px-4 sm:px-6 py-4 sticky top-0 z-50 backdrop-blur-md shadow-[0_0_15px_rgba(0,255,204,0.15)] transition-transform duration-300 ease-in-out ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo Title & PWA Status */}
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-[44px] h-[44px] sm:w-[50px] sm:h-[50px] border-3 border-blueprint-cyan flex items-center justify-center -skew-x-15 bg-black/90 text-blueprint-cyan shadow-[-5px_0_0_#ff0055,5px_0_20px_rgba(0,255,204,0.3)] shrink-0">
                <Wrench className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse skew-x-15" />
              </div>
              <div>
                <div className="font-mono text-[9px] sm:text-[10px] tracking-[0.3em] text-blueprint-cyan flex items-center gap-2">
                  <span>TERMINAL_PWA v2.5</span>
                  <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.2 border border-emerald-500/30 text-[8px] uppercase">
                    LOCAL
                  </span>
                </div>
                <h1 className="font-syne text-xl sm:text-2xl md:text-3.5xl font-black italic uppercase leading-none text-white tracking-tighter" style={{ textShadow: '2px 2px 0 #ff0055' }}>
                  ИНЖЕНЕРНЫЙ ТЕРМИНАЛ
                </h1>
              </div>
            </div>

            {/* PWA INSTALL BUTTON OR INSTALLED BADGE */}
            <div className="flex items-center gap-2">
              {deferredPrompt && !isInstalled && (
                <button
                  onClick={handleInstallClick}
                  className="bg-blueprint-cyan text-blueprint-bg hover:bg-cyan-300 font-mono font-black text-[11px] sm:text-xs px-3 py-1.5 transition-all shadow-[0_0_15px_rgba(0,255,204,0.4)] flex items-center gap-1.5 cursor-pointer animate-pulse shrink-0 uppercase"
                  title="Установить PWA на устройство"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span className="hidden xs:inline">[ УСТАНОВИТЬ ПРИЛОЖЕНИЕ ]</span>
                  <span className="xs:hidden">УСТАНОВИТЬ</span>
                </button>
              )}

              {isInstalled && (
                <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-blueprint-cyan/40 px-2 py-1 text-[10px] font-mono text-blueprint-cyan">
                  <Smartphone className="w-3.5 h-3.5 text-blueprint-cyan" />
                  <span>PWA УСТАНОВЛЕНО</span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation controls */}
          <nav className="overflow-x-auto whitespace-nowrap scrollbar-none w-full md:w-auto flex items-center gap-1 p-1 -skew-x-15">
            <button
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                setActiveTab('records'); 
                setShowAddForm(false); 
              }}
              className={`text-xs px-2.5 py-1.5 md:text-sm md:px-4 md:py-2 flex-shrink-0 font-mono font-bold uppercase transition-all border cursor-pointer ${
                activeTab === 'records'
                  ? 'bg-blueprint-cyan text-blueprint-bg border-blueprint-cyan shadow-[0_0_20px_rgba(0,255,204,0.3)]'
                  : 'bg-transparent text-blueprint-ink border-blueprint-line hover:border-blueprint-cyan hover:text-blueprint-cyan'
              }`}
              id="nav-records"
            >
              <span className="inline-block skew-x-15">ЖУРНАЛ<span className="hidden sm:inline"> РАБОТ</span></span>
            </button>
            <button
              onClick={() => { 
                if (navigator.vibrate) navigator.vibrate(15);
                setActiveTab('rag'); 
              }}
              className={`text-xs px-2.5 py-1.5 md:text-sm md:px-4 md:py-2 flex-shrink-0 font-mono font-bold uppercase transition-all border cursor-pointer ${
                activeTab === 'rag'
                  ? 'bg-blueprint-cyan text-blueprint-bg border-blueprint-cyan shadow-[0_0_20px_rgba(0,255,204,0.3)]'
                  : 'bg-transparent text-blueprint-ink border-blueprint-line hover:border-blueprint-cyan hover:text-blueprint-cyan'
              }`}
              id="nav-rag"
            >
              <span className="inline-block skew-x-15">
                <span className="hidden md:inline">СОВЕТ ВАСИЛИЧА</span>
                <span className="inline md:hidden">ВАСИЛИЧ</span>
              </span>
            </button>
            <button
              onClick={() => { 
                if (navigator.vibrate) navigator.vibrate(15);
                setActiveTab('parts'); 
              }}
              className={`text-xs px-2.5 py-1.5 md:text-sm md:px-4 md:py-2 flex-shrink-0 font-mono font-bold uppercase transition-all border cursor-pointer ${
                activeTab === 'parts'
                  ? 'bg-blueprint-cyan text-blueprint-bg border-blueprint-cyan shadow-[0_0_20px_rgba(0,255,204,0.3)]'
                  : 'bg-transparent text-blueprint-ink border-blueprint-line hover:border-blueprint-cyan hover:text-blueprint-cyan'
              }`}
              id="nav-parts"
            >
              <span className="inline-block skew-x-15">ЗАПЧАСТИ<span className="hidden md:inline"> В НАЛИЧИИ</span></span>
            </button>
            <button
              onClick={() => { 
                if (navigator.vibrate) navigator.vibrate(15);
                setActiveTab('tasks'); 
              }}
              className={`text-xs px-2.5 py-1.5 md:text-sm md:px-4 md:py-2 flex-shrink-0 font-mono font-bold uppercase transition-all border cursor-pointer ${
                activeTab === 'tasks'
                  ? 'bg-blueprint-cyan text-blueprint-bg border-blueprint-cyan shadow-[0_0_20px_rgba(0,255,204,0.3)]'
                  : 'bg-transparent text-blueprint-ink border-blueprint-line hover:border-blueprint-cyan hover:text-blueprint-cyan'
              }`}
              id="nav-tasks"
            >
              <span className="inline-block skew-x-15">ЗАДАЧИ<span className="hidden md:inline"> И ТО</span></span>
            </button>
            <button
              onClick={() => { 
                if (navigator.vibrate) navigator.vibrate(15);
                setActiveTab('settings'); 
              }}
              className={`text-xs px-2.5 py-1.5 md:text-sm md:px-4 md:py-2 flex-shrink-0 font-mono font-bold uppercase transition-all border cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-blueprint-cyan text-blueprint-bg border-blueprint-cyan shadow-[0_0_20px_rgba(0,255,204,0.3)]'
                  : 'bg-transparent text-blueprint-ink border-blueprint-line hover:border-blueprint-cyan hover:text-blueprint-cyan'
              }`}
              id="nav-settings"
            >
              <span className="inline-block skew-x-15">НАСТРОЙКИ</span>
            </button>
          </nav>

          {/* Telemetry Metrics & Offline Indicator */}
          <div className="hidden lg:flex items-center gap-6 text-right font-mono text-[10px] text-cyan-400/60 pb-1">
            <div>
              <span className="block text-blueprint-cyan text-[9px] tracking-wider uppercase">SYS_TIME</span>
              <span className="text-cyan-200 font-semibold flex items-center justify-end gap-1">
                <Clock className="w-3 h-3 text-blueprint-cyan" /> {timeStr || '---'}
              </span>
            </div>
            <div className="border-l border-blueprint-line/40 pl-4">
              <span className="block text-blueprint-cyan text-[9px] tracking-wider uppercase">STATUS</span>
              {isOnline ? (
                <span className="text-green-400 font-bold flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> ONLINE
                </span>
              ) : (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <WifiOff className="w-3 h-3" /> OFFLINE (LOCAL)
                </span>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* 2. MAIN LAYOUT GRID */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SIDEBAR: GARAGE & VEHICLE GENERAL METRICS (Occupies 4 cols on large screens) */}
          <section className="lg:col-span-4 space-y-6">
            <GarageManager
              cars={cars}
              activeCarId={activeCarId}
              onSelectCar={(id) => { setActiveCarId(id); setShowAddForm(false); }}
              onAddCar={handleAddCar}
              onDeleteCar={handleDeleteCar}
            />

            {/* General financial stats card */}
            {activeCar && (
              <div className="bento-card blueprint-corner p-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:12px_12px] opacity-5"></div>
                <div className="absolute top-0 right-0 p-1 bg-cyan-500 text-[#050a14] text-[8px] font-bold uppercase font-mono">ИТОГО СУММА</div>
                <h4 className="text-xs font-bold text-blueprint-cyan font-mono tracking-wider uppercase mb-3 border-b border-cyan-800/30 pb-1.5">
                  ФИНАНСОВЫЙ УЧЕТ (LOCAL)
                </h4>
                <div className="space-y-2.5 font-mono text-xs text-cyan-200/70">
                  <div className="flex justify-between border-b border-dashed border-cyan-800/20 pb-1.5">
                    <span>Выполненные работы:</span>
                    <span className="font-semibold text-cyan-100">{activeCarRecords.length} шт</span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-cyan-800/20 pb-1.5">
                    <span>Общие расходы:</span>
                    <span className="font-semibold text-cyan-400 text-sm font-bold">{formatCurrency(totalSpendOnActiveCar)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Средняя стоимость ремонта:</span>
                    <span className="font-semibold text-cyan-100">
                      {activeCarRecords.length > 0 ? formatCurrency(totalSpendOnActiveCar / activeCarRecords.length) : formatCurrency(0)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Offline PWA Info Box */}
            <div className="bento-card blueprint-corner p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-1 bg-cyan-800/30 text-cyan-400 text-[8px] font-bold uppercase font-mono">PWA_OFFLINE</div>
              <span className="text-[10px] text-blueprint-cyan font-mono font-bold tracking-widest uppercase block mb-1.5 flex items-center">
                <Info className="w-3.5 h-3.5 mr-1.5 text-blueprint-cyan shrink-0 animate-pulse" />
                АВТОНОМНЫЙ ГАРАЖНЫЙ РЕЖИМ
              </span>
              <p className="text-[11px] text-cyan-300/70 font-mono leading-relaxed">
                Приложение работает полностью в вашем устройстве через <strong className="text-blueprint-cyan">localStorage</strong>. Вы можете использовать его в смотровой яме или гараже даже при полном отсутствии мобильной связи.
              </p>
            </div>
          </section>

          {/* RIGHT VIEW: DYNAMIC VIEWPORTS (Occupies 8 cols on large screens) */}
          <section className="lg:col-span-8 space-y-6">
            
            {/* TAB 1: MAINTENANCE RECORDS AND WORKS */}
            {activeTab === 'records' && (
              <div className="space-y-6">
                
                {/* View header HUD controls */}
                <div className="bento-card p-5 blueprint-corner flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="absolute top-0 right-0 p-1 bg-cyan-800/30 text-cyan-400 text-[8px] font-bold uppercase font-mono">ИСТОРИЯ РЕМОНТА</div>
                  <div>
                    <span className="text-[9px] text-blueprint-cyan tracking-widest font-mono uppercase block">ИСТОРИЯ РЕМОНТА</span>
                    <h2 className="text-md font-extrabold text-cyan-100 font-mono uppercase">
                      Журнал технического обслуживания автомобиля
                    </h2>
                  </div>
                  
                  {activeCarId && !showAddForm && (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="w-full sm:w-auto justify-center bg-blueprint-cyan text-blueprint-bg font-extrabold font-mono text-xs px-5 py-2 hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center cursor-pointer"
                      id="btn-show-add-record"
                    >
                      <Plus className="w-4 h-4 mr-1.5 animate-pulse" />
                      ДОБАВИТЬ ЗАПИСЬ
                    </button>
                  )}
                </div>

                {/* Show dynamic AI Form */}
                {showAddForm && activeCar && (
                  <AddRecordForm
                    carId={activeCar.id}
                    currentCarMileage={activeCar.mileage}
                    onRecordAdded={(record) => {
                      handleAddRecord(record);
                      setInitialRecordValues(undefined);
                    }}
                    onCancel={() => {
                      setShowAddForm(false);
                      setInitialRecordValues(undefined);
                    }}
                    initialValues={initialRecordValues}
                  />
                )}

                {/* List of active records or empty state */}
                <div className="space-y-4">
                  {activeCarRecords.length > 0 ? (
                    activeCarRecords.map((record) => (
                      <RecordCard
                        key={record.id}
                        record={record}
                        onDelete={handleDeleteRecord}
                      />
                    ))
                  ) : (
                    <div className="bento-card border-dashed border-cyan-800/40 p-12 text-center blueprint-corner">
                      <Wrench className="w-12 h-12 text-blueprint-cyan/30 mx-auto mb-3 animate-bounce" />
                      <h4 className="text-xs font-bold text-cyan-200/80 font-mono uppercase mb-1">
                        Журнал спецификаций пуст
                      </h4>
                      <p className="text-[11px] text-cyan-400/40 font-mono max-w-sm mx-auto mb-4">
                        Для выбранного автомобиля нет зарегистрированных записей о ремонте и замене расходников.
                      </p>
                      {activeCar && !showAddForm && (
                        <button
                          onClick={() => setShowAddForm(true)}
                          className="border border-blueprint-cyan text-blueprint-cyan hover:bg-blueprint-cyan/10 px-4 py-1.5 text-xs font-mono cursor-pointer transition-all"
                          id="btn-empty-add"
                        >
                          ЗАРЕГИСТРИРОВАТЬ ПЕРВУЮ СПЕЦИФИКАЦИЮ
                        </button>
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 2: AI CONSULTANT WITH INTEGRATED RAG SEARCH */}
            {activeTab === 'rag' && (
              <RagAssistant activeCar={activeCar} records={activeCarRecords} parts={parts} tasks={tasks} />
            )}

            {/* TAB 4: VEHICLE MAINTENANCE TASKS & PLAN */}
            {activeTab === 'tasks' && activeCar && (
              <VehicleTasks
                activeCarId={activeCar.id}
                activeCarMileage={activeCar.mileage}
                tasks={tasks}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
                onMarkTaskCompleted={handleMarkTaskCompleted}
              />
            )}

            {/* TAB 5: SYSTEM SETTINGS */}
            {activeTab === 'settings' && (
              <SettingsPanel />
            )}

            {/* TAB 3: BILL OF MATERIALS (BOM) PARTS WAREHOUSE STOCK */}
            {activeTab === 'parts' && (
              <div className="space-y-6">
                
                {/* Warehouse HUD Header */}
                <div className="bento-card p-5 blueprint-corner relative">
                  <div className="absolute top-0 right-0 p-1 bg-cyan-800/30 text-cyan-400 text-[8px] font-bold uppercase font-mono">ЗАПЧАСТИ В НАЛИЧИИ</div>
                  <span className="text-[9px] text-blueprint-cyan tracking-widest font-mono uppercase block">ЗАПЧАСТИ В НАЛИЧИИ</span>
                  <h2 className="text-md font-extrabold text-cyan-100 font-mono uppercase">
                    Склад деталей и расходных материалов (Гаражный инвентарь)
                  </h2>
                </div>

                {/* Add new part form */}
                <form onSubmit={handleAddPart} className="bento-card p-5 blueprint-corner space-y-3.5 relative">
                  <div className="absolute top-0 right-0 p-1 bg-cyan-800/20 text-cyan-400 text-[8px] font-bold uppercase font-mono">ДОБАВЛЕНИЕ ДЕТАЛИ</div>
                  <div className="text-[10px] text-blueprint-cyan/60 tracking-wider font-mono uppercase">
                    Добавление новой детали на склад
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col">
                      <label className="text-[9px] text-blueprint-cyan font-mono uppercase mb-0.5">Наименование детали *</label>
                      <input
                        type="text"
                        required
                        placeholder="например, Свеча зажигания NGK Laser Iridium"
                        value={newPartName}
                        onChange={(e) => setNewPartName(e.target.value)}
                        className="border border-cyan-800/40 bg-blueprint-bg/60 p-2 text-xs text-cyan-100 font-mono focus:outline-none focus:border-blueprint-cyan"
                        id="part-name"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[9px] text-blueprint-cyan font-mono uppercase mb-0.5">Каталожный номер (артикул)</label>
                      <input
                        type="text"
                        placeholder="например, 12120037581"
                        value={newPartNum}
                        onChange={(e) => setNewPartNum(e.target.value)}
                        className="border border-cyan-800/40 bg-blueprint-bg/60 p-2 text-xs text-cyan-100 font-mono focus:outline-none focus:border-blueprint-cyan"
                        id="part-number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex flex-col">
                      <label className="text-[9px] text-blueprint-cyan font-mono uppercase mb-0.5">Количество (шт) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={newPartQty}
                        onChange={(e) => setNewPartQty(Number(e.target.value))}
                        className="border border-cyan-800/40 bg-blueprint-bg/60 p-2 text-xs text-cyan-100 font-mono focus:outline-none"
                        id="part-qty"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[9px] text-blueprint-cyan font-mono uppercase mb-0.5">Стоимость за ед. (₽) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={newPartPrice}
                        onChange={(e) => setNewPartPrice(Number(e.target.value))}
                        className="border border-cyan-800/40 bg-blueprint-bg/60 p-2 text-xs text-cyan-100 font-mono focus:outline-none"
                        id="part-price"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[9px] text-blueprint-cyan font-mono uppercase mb-0.5">Место хранения</label>
                      <input
                        type="text"
                        placeholder="например, Полка А-2"
                        value={newPartLoc}
                        onChange={(e) => setNewPartLoc(e.target.value)}
                        className="border border-cyan-800/40 bg-blueprint-bg/60 p-2 text-xs text-cyan-100 font-mono focus:outline-none"
                        id="part-location"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="w-full md:w-auto justify-center flex bg-blueprint-cyan text-blueprint-bg font-bold font-mono text-xs px-5 py-2 hover:bg-cyan-400 transition-colors cursor-pointer"
                      id="btn-save-part"
                    >
                      ДОБАВИТЬ НА СКЛАД
                    </button>
                  </div>
                </form>

                {/* Parts list table */}
                <div className="bento-card blueprint-corner overflow-hidden">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse font-mono text-xs min-w-[600px]">
                      <thead>
                        <tr className="border-b border-cyan-800/40 bg-cyan-950/20 text-blueprint-cyan font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-3">Наименование</th>
                          <th className="p-3">Артикул</th>
                          <th className="p-3 text-center">Кол-во</th>
                          <th className="p-3 text-right">Цена (₽)</th>
                          <th className="p-3">Место</th>
                          <th className="p-3 text-right">Управление</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyan-800/20 text-cyan-200/80">
                        {parts.length > 0 ? (
                          parts.map((part) => (
                            <tr key={part.id} className="hover:bg-blue-950/10">
                              <td className="p-3 font-semibold text-cyan-100">{part.name}</td>
                              <td className="p-3 text-[10px] text-cyan-400/50">{part.partNumber || '---'}</td>
                              <td className="p-3 text-center font-mono">
                                {part.quantity > 0 ? (
                                  <span className="text-cyan-200">{part.quantity} шт</span>
                                ) : (
                                  <span className="text-red-400 font-bold bg-red-950/40 px-1.5 py-0.5 border border-red-500/20 uppercase text-[9px] whitespace-nowrap inline-block">Нет в наличии</span>
                                )}
                              </td>
                              <td className="p-3 text-right">{part.price.toFixed(2)} ₽</td>
                              <td className="p-3 text-[10px] text-blueprint-cyan">{part.location || '---'}</td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleUsePart(part)}
                                    disabled={part.quantity <= 0}
                                    className={`px-2.5 py-1 text-[10px] font-bold border uppercase transition-colors ${
                                      part.quantity > 0 
                                        ? 'border-blueprint-cyan text-blueprint-cyan hover:bg-blueprint-cyan hover:text-blueprint-bg cursor-pointer' 
                                        : 'border-cyan-900 text-cyan-800 cursor-not-allowed'
                                    }`}
                                  >
                                    ИСПОЛЬЗОВАТЬ
                                  </button>
                                  <button
                                    onClick={() => handleDeletePart(part.id)}
                                    className="p-1 text-red-400/60 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                                    title="Удалить со склада"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-cyan-400/40 font-mono text-xs">
                              Склад деталями пока не укомплектован
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

          </section>

        </div>
      </main>

      {/* 3. CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />

      {/* 4. FOOTER HUD */}
      <footer className="max-w-7xl mx-auto px-4 mt-12 text-center text-[10px] font-mono text-cyan-400/40 space-y-1">
        <p>ИНЖЕНЕРНЫЙ ТЕРМИНАЛ • АВТОНОМНЫЙ ПОРТАТИВНЫЙ ГАРАЖНЫЙ КОМПЛЕКС • PWA STANDALONE</p>
        <p>ВСЕ ДАННЫЕ ХРАНЯТСЯ ЛОКАЛЬНО В ПАМЯТИ ВАШЕГО УСТРОЙСТВА (LOCALSTORAGE)</p>
      </footer>
    </div>
  );
}
