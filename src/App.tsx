/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Car, MaintenanceRecord, Part, VehicleTask, DiagnosticSession, RecordCategory } from './types';
import { migrateAndSanitizeLocalStorage } from './lib/dataIntegrity';
import { ServiceHub } from './components/ServiceHub';
import { GarageHub } from './components/GarageHub';
import { RagAssistant } from './components/RagAssistant';
import { ConfirmModal } from './components/ConfirmModal';
import { ObdScanner } from './components/ObdScanner';
import { TechSpecsModal } from './components/TechSpecsModal';
import { DiagnosticSessionsModal } from './components/DiagnosticSessionsModal';
import { Header, MainNavTab } from './components/Header';
import { InstallPromptBanner } from './components/InstallPromptBanner';
import { VehicleDashboard } from './components/VehicleDashboard';
import { RecordDetailModal } from './components/RecordDetailModal';
import { useUserSettings } from './components/UserSettingsContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useNotificationScheduler } from './hooks/useNotificationScheduler';
import { calculateTaskUrgency } from './lib/taskUrgency';
import { calculateSmartCarInsights } from './lib/calcSmartReminders';
import { VoiceRecordModal } from './components/VoiceRecordModal';
import { ConfirmServiceEntryModal } from './components/ConfirmServiceEntryModal';
import { PdfServiceReport } from './components/PdfServiceReport';
import { ParsedServiceEntry } from './types/car';
import { useCarStore } from './store/useCarStore';
import { 
  Car as CarIcon,
  Cpu, 
  ClipboardList, 
  Bot, 
  Warehouse, 
  Plus, 
  Check, 
  Trash2, 
  X, 
  Settings, 
  BookOpen,
  Activity
} from 'lucide-react';

export default function App() {
  const { formatCurrency, currencySymbol } = useUserSettings();

  // Pure Local State - Initialize from LocalStorage or defaults
  const [cars, setCars] = useState<Car[]>([]);
  const [activeCarId, setActiveCarId] = useState<string | null>(null);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [tasks, setTasks] = useState<VehicleTask[]>([]);
  const [diagnosticSessions, setDiagnosticSessions] = useState<DiagnosticSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [ragInitialQuestion, setRagInitialQuestion] = useState<string | null>(null);
  const [showTechSpecs, setShowTechSpecs] = useState(false);
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
  const [selectedDiagnosticSessionId, setSelectedDiagnosticSessionId] = useState<string | null>(null);

  // PWA Install & Offline State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Main Navigation State
  const [activeTab, setActiveTab] = useState<MainNavTab>('dashboard');
  const [serviceSubTab, setServiceSubTab] = useState<'plan' | 'history'>('history');
  const [garageSubTab, setGarageSubTab] = useState<'cars' | 'parts' | 'settings'>('cars');
  const [showAddForm, setShowAddForm] = useState(false);
  const [partsSearchFilter, setPartsSearchFilter] = useState('');
  const [isCarSelectorOpen, setIsCarSelectorOpen] = useState(false);
  const [isGarageModalOpen, setIsGarageModalOpen] = useState(false);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<MaintenanceRecord | null>(null);
  const [focusedDtcCode, setFocusedDtcCode] = useState<string | null>(null);

  // Pre-filled record values state for when using a part or completing task
  const [initialRecordValues, setInitialRecordValues] = useState<{
    description?: string;
    partsPrice?: number;
    partsUsed?: string[];
    category?: any;
    relatedDtc?: string;
    source?: 'task' | 'obd' | 'manual';
  } | undefined>(undefined);

  // Voice / Text Service Record Flow
  const [isVoiceRecordModalOpen, setIsVoiceRecordModalOpen] = useState(false);
  const [isConfirmServiceModalOpen, setIsConfirmServiceModalOpen] = useState(false);
  const [parsedServiceEntry, setParsedServiceEntry] = useState<ParsedServiceEntry | null>(null);
  const [showPdfReportModal, setShowPdfReportModal] = useState(false);

  // Header Scroll and Auto-Hide State
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

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

  // Notification scheduler hook for reminders & maintenance status
  const { urgentNotifications, overdueCount, warningCount } = useNotificationScheduler(
    cars,
    tasks,
    { enabled: isLoaded }
  );

  // 1. Initial LocalStorage Load with Automated Migration and Strict Schema Sanitization
  useEffect(() => {
    try {
      const migrated = migrateAndSanitizeLocalStorage();
      setCars(migrated.cars);
      setActiveCarId(migrated.activeCarId);
      setRecords(migrated.records);
      setParts(migrated.parts);
      setTasks(migrated.tasks);
      setDiagnosticSessions(migrated.diagnosticSessions);
    } catch (e) {
      console.error('Critical error initializing and migrating store:', e);
      setCars([]);
      setActiveCarId(null);
      setRecords([]);
      setParts([]);
      setTasks([]);
      setDiagnosticSessions([]);
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

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('terminal_diagnostic_sessions_v2', JSON.stringify(diagnosticSessions));
  }, [diagnosticSessions, isLoaded]);

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

  // Smart car insights (fluids with critical wear < 10%, overdue tasks, average daily mileage)
  const smartCarInsights = React.useMemo(() => {
    return calculateSmartCarInsights(activeCar, records, tasks);
  }, [activeCar, records, tasks]);

  // Active car urgent maintenance count (total issues: critical/urgent fluids + overdue tasks)
  const activeCarUrgentCount = smartCarInsights.totalIssueCount;
  const hasCriticalUrgent = smartCarInsights.hasCriticalIssues;

  // Quick Mileage Update Handler
  const handleQuickUpdateMileage = (newMileage: number) => {
    if (!activeCar) return;
    handleUpdateCar({
      ...activeCar,
      mileage: newMileage,
      updatedAt: new Date().toISOString(),
    });
    if (navigator.vibrate) navigator.vibrate(20);
  };

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

  const handleUpdateCar = (updatedCar: Car) => {
    setCars(prev => prev.map(c => c.id === updatedCar.id ? updatedCar : c));
  };

  const handleDeleteCar = (id: string) => {
    const car = cars.find(c => c.id === id);
    const carName = car ? `${car.make} ${car.model}` : '';

    if (cars.length <= 1) {
      setConfirmState({
        isOpen: true,
        title: 'ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ',
        message: `Вы намерены удалить единственный автомобиль ${carName}. В вашем гараже не останется активных машин. Продолжить?`,
        confirmText: 'УДАЛИТЬ',
        cancelText: 'ОТМЕНА',
        onConfirm: () => {
          setCars([]);
          setActiveCarId(null);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      });
      return;
    }

    setConfirmState({
      isOpen: true,
      title: 'ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ',
      message: `Вы уверены, что хотите удалить автомобиль ${carName}? Это действие сотрет его параметры из гаража.`,
      confirmText: 'УДАЛИТЬ',
      cancelText: 'ОТМЕНА',
      onConfirm: () => {
        const remaining = cars.filter(c => c.id !== id);
        setCars(remaining);
        if (activeCarId === id) {
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

    if (activeCar && newRecData.mileage >= activeCar.mileage) {
      const updatedCar = { 
        ...activeCar, 
        mileage: newRecData.mileage,
        currentOdometer: newRecData.mileage,
        updatedAt: new Date().toISOString()
      };
      setCars(prev => prev.map(c => c.id === activeCar.id ? updatedCar : c));
    }
  };

  const handleOpenVoiceRecord = () => {
    setIsVoiceRecordModalOpen(true);
  };

  const handleParsedServiceReady = (parsed: ParsedServiceEntry) => {
    setParsedServiceEntry(parsed);
    setIsConfirmServiceModalOpen(true);
  };

  const handleConfirmSaveService = (finalEntry: ParsedServiceEntry) => {
    if (!activeCarId) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const newRecordId = `rec-${Date.now()}`;

    // Map category to Legacy RecordCategory
    let legacyCat: RecordCategory = 'Oil & Fluids';
    if (finalEntry.category === 'maintenance') legacyCat = 'Oil & Fluids';
    else if (finalEntry.category === 'repair') legacyCat = 'Engine';
    else if (finalEntry.category === 'tuning') legacyCat = 'Other';
    else if (finalEntry.category === 'symptom') legacyCat = 'Diagnostics';

    const newRecord: MaintenanceRecord = {
      id: newRecordId,
      carId: activeCarId,
      date: todayStr,
      description: finalEntry.title,
      category: legacyCat,
      mileage: finalEntry.odometer,
      partsPrice: finalEntry.costParts,
      laborPrice: finalEntry.costWork,
      totalCost: finalEntry.totalCost,
      partsUsed: finalEntry.partsUsed?.map(p => p.name) || [],
      photoUrls: finalEntry.photoUrls || finalEntry.attachments || [],
      attachments: finalEntry.attachments || finalEntry.photoUrls || [],
      comment: finalEntry.comment,
      source: 'voice',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to records in App.tsx (which updates car mileage too)
    handleAddRecord(newRecord);

    // Also sync to useCarStore for unified domain model
    useCarStore.getState().addServiceRecord({
      id: newRecordId,
      carId: activeCarId,
      date: todayStr,
      odometer: finalEntry.odometer,
      title: finalEntry.title,
      category: finalEntry.category,
      worksDone: finalEntry.worksDone,
      partsUsed: finalEntry.partsUsed,
      costParts: finalEntry.costParts,
      costWork: finalEntry.costWork,
      totalCost: finalEntry.totalCost,
      photoUrls: finalEntry.photoUrls || finalEntry.attachments || [],
      attachments: finalEntry.attachments || finalEntry.photoUrls || [],
      comment: finalEntry.comment,
      source: 'voice',
    });

    setIsConfirmServiceModalOpen(false);
  };

  const handleEditServiceRequest = (entry: ParsedServiceEntry) => {
    setParsedServiceEntry(entry);
    setIsConfirmServiceModalOpen(false);
    setIsVoiceRecordModalOpen(true);
  };

  const handleUpdateRecord = (updatedRecord: MaintenanceRecord) => {
    setRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    
    if (activeCar && updatedRecord.mileage > activeCar.mileage) {
      const updatedCar = { ...activeCar, mileage: updatedRecord.mileage };
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
    setActiveTab('service');
    setServiceSubTab('history');
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

  const handleAddTask = (newTaskData: { 
    title: string; 
    type: any; 
    targetMileage?: number; 
    targetDate?: string;
    category?: RecordCategory;
    description?: string;
    relatedDtc?: string;
    source?: any;
  }) => {
    if (!activeCarId) return;
    const newTask: VehicleTask = {
      id: Math.random().toString(36).substr(2, 9),
      carId: activeCarId,
      title: newTaskData.title || 'Новая задача',
      type: newTaskData.type || (newTaskData.targetMileage ? 'mileage' : 'simple'),
      targetMileage: newTaskData.targetMileage ? Number(newTaskData.targetMileage) : undefined,
      targetDate: newTaskData.targetDate,
      category: newTaskData.category,
      description: newTaskData.description,
      relatedDtc: newTaskData.relatedDtc,
      source: newTaskData.source || 'manual',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const handleUpdateTask = (updatedTask: VehicleTask) => {
    const oldTask = tasks.find(t => t.id === updatedTask.id);
    
    // If status transitioned from pending to completed via modal
    if (oldTask && oldTask.status === 'pending' && updatedTask.status === 'completed') {
      if (updatedTask.relatedPartIds && updatedTask.relatedPartIds.length > 0) {
        setParts(prevParts => prevParts.map(p => {
          if (updatedTask.relatedPartIds!.includes(p.id)) {
            return {
              ...p,
              quantity: Math.max(0, p.quantity - 1),
              reservedQuantity: Math.max(0, (p.reservedQuantity || 0) - 1),
              updatedAt: new Date().toISOString()
            };
          }
          return p;
        }));
      }
    } else if (oldTask && oldTask.status === 'completed' && updatedTask.status === 'pending') {
      // If task is re-opened from completed to pending, restore consumed part quantity and re-reserve
      if (updatedTask.relatedPartIds && updatedTask.relatedPartIds.length > 0) {
        setParts(prevParts => prevParts.map(p => {
          if (updatedTask.relatedPartIds!.includes(p.id)) {
            return {
              ...p,
              quantity: p.quantity + 1,
              reservedQuantity: (p.reservedQuantity || 0) + 1,
              updatedAt: new Date().toISOString()
            };
          }
          return p;
        }));
      }
    }

    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleDeleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    setConfirmState({
      isOpen: true,
      title: 'ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ',
      message: `Вы уверены, что хотите удалить задачу "${task.title || ''}"?`,
      confirmText: 'УДАЛИТЬ',
      cancelText: 'ОТМЕНА',
      onConfirm: () => {
        // If task was pending and had reserved parts, release the reservation
        if (task.status === 'pending' && task.relatedPartIds && task.relatedPartIds.length > 0) {
          setParts(prevParts => prevParts.map(p => {
            if (task.relatedPartIds!.includes(p.id)) {
              return {
                ...p,
                reservedQuantity: Math.max(0, (p.reservedQuantity || 0) - 1),
                updatedAt: new Date().toISOString()
              };
            }
            return p;
          }));
        }
        setTasks(prev => prev.filter(t => t.id !== id));
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleCompleteTaskWithDetails = (params: {
    taskId: string;
    partsPrice: number;
    laborPrice: number;
    partsUsed: string[];
    mileage: number;
    date: string;
    category: any;
    description: string;
  }) => {
    const task = tasks.find(t => t.id === params.taskId);
    if (!task || !activeCarId) return;

    // 1. Mark task as completed or remove it
    setTasks(prev => prev.map(t => t.id === params.taskId ? { ...t, status: 'completed', updatedAt: new Date().toISOString() } : t));

    // 2. Consume any reserved parts if attached to this task
    if (task.relatedPartIds && task.relatedPartIds.length > 0) {
      setParts(prevParts => prevParts.map(p => {
        if (task.relatedPartIds!.includes(p.id)) {
          return {
            ...p,
            quantity: Math.max(0, p.quantity - 1),
            reservedQuantity: Math.max(0, (p.reservedQuantity || 0) - 1),
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      }));
    }

    // 3. Create new Maintenance Record in Service History
    const newRecord: MaintenanceRecord = {
      id: `rec-${Date.now()}`,
      carId: activeCarId,
      description: params.description || task.title,
      mileage: params.mileage,
      partsPrice: params.partsPrice,
      laborPrice: params.laborPrice,
      date: params.date,
      category: params.category || task.category || (task.relatedDtc ? 'Engine' : 'Other'),
      partsUsed: params.partsUsed,
      photoUrls: task.photos || [],
      relatedTaskId: task.id,
      relatedDtc: task.relatedDtc,
      source: 'task',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setRecords(prev => [newRecord, ...prev]);

    // 4. Global Mileage Sync: If entered mileage is higher than activeCar.mileage, update car globally
    if (activeCar && params.mileage > activeCar.mileage) {
      const updatedCar: Car = {
        ...activeCar,
        mileage: params.mileage,
        updatedAt: new Date().toISOString()
      };
      setCars(prev => prev.map(c => c.id === activeCar.id ? updatedCar : c));
    }

    // Switch to history tab to show the recorded service
    setActiveTab('service');
    setServiceSubTab('history');

    if (navigator.vibrate) navigator.vibrate(25);
  };

  const handleMarkTaskCompleted = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Avoid double completion and duplicate parts deduction
    if (task.status === 'completed') return;

    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'completed', updatedAt: new Date().toISOString() } : t));

    // Consume reserved parts and calculate prices
    let consumedPartsPrice = 0;
    const consumedPartsNames: string[] = [];

    if (task.relatedPartIds && task.relatedPartIds.length > 0) {
      setParts(prevParts => prevParts.map(p => {
        if (task.relatedPartIds!.includes(p.id)) {
          consumedPartsPrice += p.price || 0;
          consumedPartsNames.push(p.name);
          return {
            ...p,
            quantity: Math.max(0, p.quantity - 1),
            reservedQuantity: Math.max(0, (p.reservedQuantity || 0) - 1),
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      }));
    }

    setInitialRecordValues({
      description: task.title,
      partsPrice: consumedPartsPrice,
      partsUsed: consumedPartsNames,
      category: task.category || (task.relatedDtc ? 'Engine' : 'Other'),
      relatedDtc: task.relatedDtc,
      source: 'task'
    });
    setActiveTab('service');
    setServiceSubTab('history');
    setShowAddForm(true);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleCreateTaskFromDtc = (
    taskParam: string | {
      title: string;
      description?: string;
      relatedDtc: string;
      relatedPartIds?: string[];
      category?: any;
    },
    descParam?: string
  ) => {
    if (!activeCarId) return;

    let title = '';
    let relatedDtc: string | undefined;
    let relatedPartIds: string[] | undefined;
    let category: any = 'Engine';

    if (typeof taskParam === 'string') {
      title = `${taskParam}: ${descParam || ''}`;
      relatedDtc = taskParam;
    } else {
      title = taskParam.title;
      relatedDtc = taskParam.relatedDtc;
      relatedPartIds = taskParam.relatedPartIds;
      category = taskParam.category || 'Engine';
    }

    // Protection against duplicate pending tasks for the same DTC on this car
    const existingPendingTask = tasks.find(t => 
      t.carId === activeCarId && 
      t.status === 'pending' && 
      t.relatedDtc === relatedDtc &&
      (t.title === title || (relatedDtc && t.relatedDtc === relatedDtc))
    );

    if (existingPendingTask) {
      // Prevent duplicate task and duplicate reservation; navigate to plan
      setActiveTab('service');
      setServiceSubTab('plan');
      return;
    }

    const newTask: VehicleTask = {
      id: `task-dtc-${Date.now()}`,
      carId: activeCarId,
      title,
      type: 'simple',
      targetDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      relatedDtc,
      relatedPartIds,
      category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Reserve selected parts in inventory (clamped to available quantity)
    if (relatedPartIds && relatedPartIds.length > 0) {
      setParts(prevParts => prevParts.map(p => {
        if (relatedPartIds!.includes(p.id)) {
          const currentRes = p.reservedQuantity || 0;
          const newRes = Math.min(p.quantity, currentRes + 1);
          return {
            ...p,
            reservedQuantity: newRes,
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      }));
    }

    setTasks(prev => [newTask, ...prev]);
    setActiveTab('service');
    setServiceSubTab('plan');
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleAddCandidatePartToStock = (partName: string) => {
    const newPart: Part = {
      id: `part-${Date.now()}`,
      name: partName,
      quantity: 1,
      price: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setParts(prev => [newPart, ...prev]);
    setPartsSearchFilter(partName);
    setActiveTab('garage');
    setGarageSubTab('parts');
  };

  const handleNavigateToPartsWithFilter = (filterText: string) => {
    setPartsSearchFilter(filterText);
    setActiveTab('garage');
    setGarageSubTab('parts');
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. DIAGNOSTIC SESSION LIFECYCLE (ЭТАП 5 & 6)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleStartDiagnosticSession = (carId?: string, initialDtc?: string[]) => {
    const targetCarId = carId || activeCarId;
    if (!targetCarId) return;

    const targetCar = cars.find(c => c.id === targetCarId) || activeCar;
    const currentOdo = targetCar?.mileage || 0;
    const dtcList = initialDtc || [];

    // Check if an active session already exists for this car
    const existingActive = diagnosticSessions.find(
      s => s.carId === targetCarId && (s.status === 'active' || s.status === 'waiting_recheck')
    );

    if (existingActive) {
      // If same or overlapping DTCs, switch to existing session to prevent duplicate fragmentation
      setSelectedDiagnosticSessionId(existingActive.id);
      setIsDiagnosticModalOpen(true);
      if (navigator.vibrate) navigator.vibrate(15);
      return;
    }

    const newSessionId = `session-${Date.now()}`;
    const newSession: DiagnosticSession = {
      id: newSessionId,
      carId: targetCarId,
      status: 'active',
      startedAt: new Date().toISOString(),
      startOdometer: currentOdo,
      currentOdometer: currentOdo,
      initialDtcCodes: dtcList,
      currentDtcCodes: dtcList,
      initialDtc: dtcList,
      checks: dtcList.map((dtc, idx) => ({
        id: `chk-${Date.now()}-${idx}`,
        title: `Проверка узла и цепи для ${dtc}`,
        status: 'pending',
        targetComponent: dtc,
        procedure: `Визуальный осмотр проводки, проверка мультиметром/осциллографом опорного напряжения и сопротивления датчика.`
      })),
      stepsHistory: [
        {
          timestamp: new Date().toISOString(),
          step: 'scan',
          title: 'Инициализация диагностической сессии',
          notes: dtcList.length > 0 
            ? `Обнаружены коды ошибок: ${dtcList.join(', ')}. Зафиксирован одометр ${currentOdo.toLocaleString()} км.`
            : `Сессия запущена в режиме комплексной проверки ЭБУ. Одометр: ${currentOdo.toLocaleString()} км.`
        }
      ],
      linkedTaskIds: [],
      linkedRecordIds: []
    };

    setDiagnosticSessions(prev => [newSession, ...prev]);
    setSelectedDiagnosticSessionId(newSessionId);
    setIsDiagnosticModalOpen(true);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleUpdateDiagnosticSession = (updatedSession: DiagnosticSession) => {
    // Prevent modifying completed/cancelled sessions accidentally
    const existing = diagnosticSessions.find(s => s.id === updatedSession.id);
    if (existing && (existing.status === 'resolved' || existing.status === 'cancelled') && updatedSession.status === existing.status) {
      // Allow metadata updates if necessary, but keep integrity
    }
    setDiagnosticSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
  };

  const handleRecheckDiagnosticSession = (sessionId: string) => {
    const session = diagnosticSessions.find(s => s.id === sessionId);
    if (!session) return;

    // Check if there are any remaining DTCs in car-specific or global obd snapshot
    const carSnapshotStr = localStorage.getItem(`obd_snapshot_${session.carId}`) || localStorage.getItem('terminal_obd_snapshot');
    let remainingDtc: string[] = [];
    let snapshotAgeMinutes = 999;
    let hasSnapshot = false;

    if (carSnapshotStr) {
      try {
        const snap = JSON.parse(carSnapshotStr);
        remainingDtc = Array.isArray(snap.dtcCodes) ? snap.dtcCodes : [];
        if (snap.timestamp) {
          snapshotAgeMinutes = (Date.now() - new Date(snap.timestamp).getTime()) / 60000;
          hasSnapshot = true;
        }
      } catch (e) {
        remainingDtc = [];
      }
    }

    const now = new Date().toISOString();

    // If no recent snapshot (adapter offline or not scanned recently)
    if (!hasSnapshot || snapshotAgeMinutes > 10) {
      const updatedSession: DiagnosticSession = {
        ...session,
        status: 'waiting_recheck',
        stepsHistory: [
          ...(session.stepsHistory || []),
          {
            timestamp: now,
            step: 'recheck',
            title: 'Повторное сканирование (Recheck): OBD не подключен',
            notes: 'Результат диагностики не подтвержден: сканер OBD-II отключен или данные устарели. Подключите ELM327 во вкладке «Диагностика» для подтверждения отсутствия ошибок.'
          }
        ]
      };
      handleUpdateDiagnosticSession(updatedSession);
      setSelectedDiagnosticSessionId(sessionId);
      setIsDiagnosticModalOpen(true);
      return;
    }

    const isResolved = remainingDtc.length === 0;

    // Check if new DTCs appeared
    const initialSet = new Set(session.initialDtcCodes || []);
    const newCodes = remainingDtc.filter(c => !initialSet.has(c));

    let noteText = '';
    if (isResolved) {
      noteText = 'Контроллер ЭБУ не вернул активных ошибок. Все DTC устранены, проблема решена!';
    } else if (newCodes.length > 0) {
      noteText = `Обнаружены новые коды ошибок: ${newCodes.join(', ')}. Остаточные: ${remainingDtc.join(', ')}.`;
    } else {
      noteText = `Коды ошибок сохраняются в памяти ЭБУ: ${remainingDtc.join(', ')}. Требуется дополнительная проверка узла.`;
    }

    const updatedSession: DiagnosticSession = {
      ...session,
      status: isResolved ? 'resolved' : 'waiting_recheck',
      currentDtcCodes: remainingDtc,
      finalDtcCodes: remainingDtc,
      resolvedAt: isResolved ? now : session.resolvedAt,
      stepsHistory: [
        ...(session.stepsHistory || []),
        {
          timestamp: now,
          step: 'recheck',
          title: `Контрольное сканирование: ${isResolved ? 'Ошибок нет' : `${remainingDtc.length} DTC`}`,
          notes: noteText
        }
      ]
    };

    handleUpdateDiagnosticSession(updatedSession);
    setSelectedDiagnosticSessionId(sessionId);
    setIsDiagnosticModalOpen(true);
  };

  const handleCloseDiagnosticSession = (sessionId: string, result: 'resolved' | 'unresolved' | 'cancelled') => {
    const session = diagnosticSessions.find(s => s.id === sessionId);
    if (!session) return;

    const now = new Date().toISOString();
    const updatedSession: DiagnosticSession = {
      ...session,
      status: result,
      resolvedAt: now,
      stepsHistory: [
        ...(session.stepsHistory || []),
        {
          timestamp: now,
          step: 'recheck',
          title: `Сессия завершена со статусом: ${result === 'resolved' ? 'Исправлено' : result === 'unresolved' ? 'Не решено' : 'Отменено'}`,
          notes: `Сессия закрыта инженером. Дата: ${new Date().toLocaleDateString('ru-RU')}`
        }
      ]
    };

    handleUpdateDiagnosticSession(updatedSession);
  };

  const handleOpenDiagnosticSessionModal = (sessionId?: string) => {
    if (sessionId) {
      setSelectedDiagnosticSessionId(sessionId);
    } else {
      const activeSession = diagnosticSessions.find(s => s.carId === activeCarId && (s.status === 'active' || s.status === 'waiting_recheck'));
      setSelectedDiagnosticSessionId(activeSession ? activeSession.id : null);
    }
    setIsDiagnosticModalOpen(true);
  };

  return (
    <div className={
      activeTab === 'rag'
        ? "h-[100dvh] bg-[#080B11] text-slate-100 flex flex-col overflow-hidden select-text"
        : "min-h-screen bg-blueprint-bg text-slate-100 pb-12 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200"
    }>

      {/* 1. TOP MAIN HUD BAR */}
      <Header
        isHeaderVisible={isHeaderVisible}
        activeCar={activeCar}
        onOpenCarSelector={() => setIsCarSelectorOpen(true)}
        deferredPrompt={deferredPrompt}
        isInstalled={isInstalled}
        onInstallClick={handleInstallClick}
        isOnline={isOnline}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'service') {
            setShowAddForm(false);
          }
        }}
        onOpenVoiceRecord={handleOpenVoiceRecord}
        onOpenTechSpecs={() => setShowTechSpecs(true)}
        urgentMaintenanceCount={activeCarUrgentCount}
        hasCriticalIssues={hasCriticalUrgent}
      />

      {/* PWA INSTALL PROMPT BANNER */}
      <InstallPromptBanner
        deferredPrompt={deferredPrompt}
        isInstalled={isInstalled}
        onInstall={handleInstallClick}
      />

      {/* CAR SELECTOR MODAL OVERLAY */}
      {isCarSelectorOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#10151E]/95 backdrop-blur-md border border-cyan-500/20 p-5 rounded-2xl shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-cyan-500/10 pb-3">
              <div className="text-cyan-300 font-bold text-sm flex items-center gap-2 truncate pr-2">
                <CarIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate">Выбор автомобиля ({cars.length})</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsCarSelectorOpen(false);
                    setActiveTab('garage');
                    setGarageSubTab('cars');
                  }}
                  className="text-xs font-semibold text-cyan-300 hover:text-cyan-100 flex items-center gap-1 cursor-pointer py-1 px-2.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all"
                  title="Добавить новый автомобиль"
                  id="btn-add-car-modal-header"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Добавить</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCarSelectorOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 py-1">
              {cars.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  Нет добавленных автомобилей
                </div>
              ) : (
                cars.map((car) => {
                  const isSelected = car.id === activeCarId;
                  return (
                    <div
                      key={car.id}
                      onClick={() => {
                        setActiveCarId(car.id);
                        setIsCarSelectorOpen(false);
                        if (navigator.vibrate) navigator.vibrate(15);
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between border cursor-pointer ${
                        isSelected 
                          ? 'bg-cyan-500/10 border-cyan-500/35 text-cyan-200 font-semibold shadow-[0_0_14px_rgba(6,182,212,0.15)]'
                          : 'bg-[#090C12]/60 border-cyan-500/10 text-slate-300 hover:border-cyan-500/30 hover:bg-[#10151E]'
                      }`}
                    >
                      <div className="truncate pr-2 min-w-0 flex-1">
                        <div className="font-bold text-sm text-slate-100 truncate">{car.make} {car.model}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                          {car.year} г. • {car.mileage.toLocaleString('ru-RU')} км {car.licensePlate ? `• ${car.licensePlate}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCar(car.id);
                          }}
                          className="p-1.5 rounded-lg border border-red-500/20 hover:border-red-500/60 bg-red-950/20 hover:bg-red-900/40 text-red-400/80 hover:text-red-300 cursor-pointer transition-all"
                          title="Удалить авто"
                          id={`btn-del-car-modal-${car.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-cyan-500/10 flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsCarSelectorOpen(false);
                  setActiveTab('garage');
                  setGarageSubTab('cars');
                }}
                className="flex-1 py-2.5 px-3 bg-[#10151E] hover:bg-[#151C2C] border border-cyan-500/15 rounded-xl text-slate-200 text-xs font-semibold text-center cursor-pointer transition-all flex items-center justify-center gap-1.5"
                id="btn-open-garage-settings"
              >
                <Warehouse className="w-4 h-4 text-cyan-400" />
                <span>Управление гаражом</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsCarSelectorOpen(false);
                  setShowTechSpecs(true);
                }}
                className="py-2.5 px-3.5 bg-cyan-500/10 border border-cyan-500/25 hover:bg-cyan-500/20 text-cyan-300 rounded-xl text-xs font-semibold text-center cursor-pointer transition-all flex items-center justify-center gap-1.5"
                title="Справочник механика"
              >
                <BookOpen className="w-4 h-4" />
                <span>Справочник</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN LAYOUT CONTAINER */}
      <main className={
        activeTab === 'rag'
          ? "w-full flex-1 flex flex-col min-h-0 overflow-hidden p-0 pb-16 md:pb-0"
          : "max-w-7xl mx-auto px-3 md:px-6 pt-4 md:pt-6 pb-24 md:pb-8 flex-1 w-full"
      }>
        
        {/* 1. ГЛАВНАЯ (DASHBOARD) */}
        {activeTab === 'dashboard' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <ErrorBoundary>
              <VehicleDashboard
                activeCar={activeCar}
                cars={cars}
                records={records}
                tasks={tasks}
                parts={parts}
                diagnosticSessions={diagnosticSessions}
                onOpenGarageManager={() => {
                  setActiveTab('garage');
                  setGarageSubTab('cars');
                }}
                onOpenAddRecord={() => {
                  setShowAddForm(true);
                  setActiveTab('service');
                  setServiceSubTab('history');
                }}
                onOpenAddRecordWithVoice={handleOpenVoiceRecord}
                onOpenAddRecordWithPrefill={(prefill) => {
                  setInitialRecordValues(prefill);
                  setShowAddForm(true);
                  setActiveTab('service');
                  setServiceSubTab('history');
                }}
                onOpenAddTask={() => {
                  setActiveTab('service');
                  setServiceSubTab('plan');
                }}
                onOpenAddPart={() => {
                  setActiveTab('garage');
                  setGarageSubTab('parts');
                }}
                onOpenTechSpecs={() => setShowTechSpecs(true)}
                onNavigateTab={(tab, dtcCode) => {
                  if (dtcCode) setFocusedDtcCode(dtcCode);
                  setActiveTab(tab);
                  setShowAddForm(false);
                }}
                onNavigateToRagWithQuestion={(question) => {
                  setRagInitialQuestion(question);
                  setActiveTab('rag');
                }}
                onViewRecord={(rec) => setSelectedRecordForDetail(rec)}
                onQuickUpdateMileage={handleQuickUpdateMileage}
                onMarkTaskCompleted={handleMarkTaskCompleted}
                onCreateTaskFromDtc={handleCreateTaskFromDtc}
                onStartDiagnosticSession={handleStartDiagnosticSession}
                onOpenDiagnosticSessionModal={handleOpenDiagnosticSessionModal}
                onRecheckDiagnosticSession={handleRecheckDiagnosticSession}
                onOpenPdfReport={() => setShowPdfReportModal(true)}
              />
            </ErrorBoundary>
          </div>
        )}

        {/* 2. ДИАГНОСТИКА (OBD2, DTC, LIVE DATA, OEM) */}
        {activeTab === 'obd' && (
          <div className="max-w-5xl mx-auto">
            <ErrorBoundary>
              <ObdScanner 
                activeCar={activeCar} 
                parts={parts}
                focusedDtcCode={focusedDtcCode}
                activeSession={diagnosticSessions.find(s => s.carId === activeCar?.id && (s.status === 'active' || s.status === 'waiting_recheck'))}
                onAddRecord={handleAddRecord}
                onNavigateToRag={(questionOrPayload?: any) => {
                  if (questionOrPayload) {
                    if (typeof questionOrPayload === 'string') {
                      setRagInitialQuestion(questionOrPayload);
                    } else if (questionOrPayload.prompt) {
                      setRagInitialQuestion(questionOrPayload.prompt);
                    }
                  }
                  setActiveTab('rag');
                }}
                onCreateTaskFromDtc={handleCreateTaskFromDtc}
                onNavigateToPartsWithFilter={handleNavigateToPartsWithFilter}
                onAddCandidatePartToStock={handleAddCandidatePartToStock}
                onStartDiagnosticSession={handleStartDiagnosticSession}
                onOpenDiagnosticSessionModal={handleOpenDiagnosticSessionModal}
                onRecheckDiagnosticSession={handleRecheckDiagnosticSession}
              />
            </ErrorBoundary>
          </div>
        )}

        {/* 3. ТО (ПЛАН И ИСТОРИЯ) */}
        {activeTab === 'service' && (
          <div className="max-w-5xl mx-auto">
            <ErrorBoundary>
              <ServiceHub
                activeCar={activeCar}
                records={records}
                tasks={tasks}
                onAddRecord={handleAddRecord}
                onUpdateRecord={handleUpdateRecord}
                onDeleteRecord={handleDeleteRecord}
                showAddForm={showAddForm}
                onOpenAddForm={() => setShowAddForm(true)}
                onCloseAddForm={() => {
                  setShowAddForm(false);
                  setInitialRecordValues(undefined);
                }}
                initialRecordValues={initialRecordValues}
                onClearInitialValues={() => setInitialRecordValues(undefined)}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onMarkTaskCompleted={handleMarkTaskCompleted}
                onCompleteTaskWithDetails={handleCompleteTaskWithDetails}
                onDeleteTask={handleDeleteTask}
                initialSubTab={serviceSubTab}
                onNavigateToRagWithQuestion={(question) => {
                  setRagInitialQuestion(question);
                  setActiveTab('rag');
                }}
                onSetInitialRecordValues={(values) => setInitialRecordValues(values)}
              />
            </ErrorBoundary>
          </div>
        )}

        {/* 4. ВАСИЛИЧ (AI RAG CONSULTANT) */}
        {activeTab === 'rag' && (
          <div className="w-full h-full flex-1 flex flex-col min-h-0">
            <ErrorBoundary>
              <RagAssistant 
                activeCar={activeCar} 
                records={activeCarRecords} 
                parts={parts} 
                tasks={tasks}
                diagnosticSessions={diagnosticSessions}
                initialQuestion={ragInitialQuestion}
                onClearInitialQuestion={() => setRagInitialQuestion(null)}
                onAddTask={handleAddTask}
                onCreateTaskFromDtc={handleCreateTaskFromDtc}
                onAddRecord={handleAddRecord}
                onUpdateRecord={handleUpdateRecord}
                onDeleteRecord={(id) => {
                  setRecords(prev => prev.filter(r => r.id !== id));
                }}
                onUpdateCar={handleUpdateCar}
                onNavigateTab={(tab, dtc) => {
                  if (dtc) {
                    setFocusedDtcCode(dtc);
                  }
                  setActiveTab(tab as any);
                }}
              />
            </ErrorBoundary>
          </div>
        )}

        {/* 5. ГАРАЖ (АВТОПАРК, СКЛАД, НАСТРОЙКИ) */}
        {activeTab === 'garage' && (
          <div className="max-w-5xl mx-auto">
            <ErrorBoundary>
              <GarageHub
                cars={cars}
                activeCarId={activeCarId}
                parts={parts}
                records={records}
                onSelectCar={(id) => {
                  setActiveCarId(id);
                  setShowAddForm(false);
                }}
                onAddCar={handleAddCar}
                onUpdateCar={handleUpdateCar}
                onDeleteCar={handleDeleteCar}
                onAddPart={(partData) => {
                  const newPart: Part = {
                    ...partData,
                    id: `part-${Date.now()}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
                  setParts(prev => [newPart, ...prev]);
                }}
                onDeletePart={handleDeletePart}
                onUsePart={handleUsePart}
                partsSearchFilter={partsSearchFilter}
                initialSubTab={garageSubTab}
              />
            </ErrorBoundary>
          </div>
        )}

      </main>

      {/* RECORD DETAIL MODAL */}
      {selectedRecordForDetail && (
        <RecordDetailModal
          record={selectedRecordForDetail}
          isOpen={true}
          onClose={() => setSelectedRecordForDetail(null)}
          onEdit={(rec) => {
            setSelectedRecordForDetail(null);
            handleUpdateRecord(rec);
          }}
          onDelete={(id) => {
            setSelectedRecordForDetail(null);
            handleDeleteRecord(id);
          }}
        />
      )}

      {/* CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />

      {/* TECH SPECS MECHANIC MODAL */}
      {showTechSpecs && (
        <TechSpecsModal
          activeCar={activeCar}
          onClose={() => setShowTechSpecs(false)}
          onAskVasilich={(question) => {
            setRagInitialQuestion(question);
            setActiveTab('rag');
          }}
        />
      )}

      {/* DIAGNOSTIC SESSIONS MODAL (ЭТАП 5) */}
      <DiagnosticSessionsModal
        isOpen={isDiagnosticModalOpen}
        onClose={() => setIsDiagnosticModalOpen(false)}
        sessions={diagnosticSessions}
        activeCar={activeCar}
        cars={cars}
        parts={parts}
        tasks={tasks}
        records={records}
        onStartSession={handleStartDiagnosticSession}
        onUpdateSession={handleUpdateDiagnosticSession}
        onRecheckSession={handleRecheckDiagnosticSession}
        onCloseSession={handleCloseDiagnosticSession}
        onNavigateToRag={(query) => {
          if (query) setRagInitialQuestion(query);
          setActiveTab('rag');
        }}
        onNavigateToSchematics={(dtc) => {
          if (dtc) setFocusedDtcCode(dtc);
          setActiveTab('obd');
        }}
        onNavigateToPartsWithFilter={handleNavigateToPartsWithFilter}
        onCreateTaskFromSession={(taskData) => {
          handleCreateTaskFromDtc(taskData);
        }}
        selectedSessionId={selectedDiagnosticSessionId}
      />

      {/* VOICE / TEXT SERVICE RECORD MODAL («Рассказать Василичу») */}
      <VoiceRecordModal
        isOpen={isVoiceRecordModalOpen}
        onClose={() => setIsVoiceRecordModalOpen(false)}
        carName={activeCar ? `${activeCar.make} ${activeCar.model}` : 'Автомобиль'}
        currentOdometer={activeCar?.mileage || 0}
        initialText={parsedServiceEntry?.rawTranscript || ''}
        onParsedReady={handleParsedServiceReady}
      />

      {/* CONFIRMATION SERVICE ENTRY MODAL (CRITICAL: Safe verification before saving) */}
      <ConfirmServiceEntryModal
        isOpen={isConfirmServiceModalOpen}
        onClose={() => setIsConfirmServiceModalOpen(false)}
        parsedEntry={parsedServiceEntry}
        carName={activeCar ? `${activeCar.make} ${activeCar.model}` : 'Автомобиль'}
        currentCarOdometer={activeCar?.mileage || 0}
        onConfirmSave={handleConfirmSaveService}
        onEditRequest={handleEditServiceRequest}
      />

      {/* PDF СЕРВИСНАЯ КНИЖКА С QR-КОДОМ */}
      <PdfServiceReport
        isOpen={showPdfReportModal}
        onClose={() => setShowPdfReportModal(false)}
        car={activeCar}
        records={records}
      />

      {/* FOOTER HUD - Only shown when NOT on Vasilich screen */}
      {activeTab !== 'rag' && (
        <footer className="max-w-7xl mx-auto px-4 mt-8 pb-20 md:pb-8 text-center text-xs text-slate-500 space-y-1 font-sans">
          <p className="font-medium text-slate-400">Инженерный Терминал • Автономный центр управления автомобилем</p>
          <p className="text-[11px] font-mono text-slate-600">Все данные хранятся локально в памяти устройства (localStorage)</p>
        </footer>
      )}

      {/* MOBILE FIXED FLOATING BOTTOM NAVIGATION BAR (4 CORE SECTIONS) */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-[#10151E]/90 backdrop-blur-lg border border-white/10 rounded-full py-2 px-3 shadow-2xl z-50 flex items-center justify-around font-sans">
        
        {/* 1. ГЛАВНАЯ */}
        <button
          type="button"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(15);
            setActiveTab('dashboard');
            setShowAddForm(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-full transition-all cursor-pointer relative ${
            activeTab === 'dashboard'
              ? 'text-cyan-400 bg-cyan-500/20 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          id="mob-tab-dashboard"
        >
          <div className="relative">
            <CarIcon className="w-4 h-4 mb-0.5" />
            {activeCarUrgentCount > 0 && (
              <span className={`absolute -top-1 -right-2 min-w-[14px] h-[14px] px-0.5 ${
                hasCriticalUrgent
                  ? 'bg-rose-500 animate-pulse text-white'
                  : 'bg-amber-500 text-slate-950'
              } text-[9px] font-mono font-bold rounded-full flex items-center justify-center`}>
                {activeCarUrgentCount}
              </span>
            )}
          </div>
          <span className="text-[9px] font-medium tracking-tight">Главная</span>
        </button>

        {/* 2. ТО */}
        <button
          type="button"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(15);
            setActiveTab('service');
            setShowAddForm(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-full transition-all cursor-pointer relative ${
            activeTab === 'service'
              ? 'text-cyan-400 bg-cyan-500/20 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          id="mob-tab-service"
        >
          <div className="relative">
            <ClipboardList className="w-4 h-4 mb-0.5" />
            {activeCarUrgentCount > 0 && (
              <span className={`absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-0.5 ${
                hasCriticalUrgent
                  ? 'bg-rose-500 animate-pulse text-white'
                  : 'bg-amber-500 text-slate-950'
              } text-[9px] font-mono font-bold rounded-full flex items-center justify-center`}>
                {activeCarUrgentCount}
              </span>
            )}
          </div>
          <span className="text-[9px] font-medium tracking-tight">ТО</span>
        </button>

        {/* 3. ВАСИЛИЧ */}
        <button
          type="button"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(15);
            setActiveTab('rag');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-full transition-all cursor-pointer ${
            activeTab === 'rag'
              ? 'text-cyan-400 bg-cyan-500/20 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          id="mob-tab-rag"
        >
          <Bot className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-medium tracking-tight">Василич</span>
        </button>

        {/* 4. ГАРАЖ */}
        <button
          type="button"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(15);
            setActiveTab('garage');
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-full transition-all cursor-pointer ${
            activeTab === 'garage'
              ? 'text-cyan-400 bg-cyan-500/20 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          id="mob-tab-garage"
        >
          <Warehouse className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-medium tracking-tight">Гараж</span>
        </button>

      </nav>
    </div>
  );
}
