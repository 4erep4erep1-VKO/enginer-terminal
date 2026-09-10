/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { CarProfile, ServiceRecord, ServiceCategory, ServicePartUsed } from '../types/car';
import { Car, MaintenanceRecord, RecordCategory } from '../types';

interface CarStoreState {
  cars: CarProfile[];
  activeCarId: string | null;
  records: ServiceRecord[];
  isLoaded: boolean;

  // Computed getters
  getActiveCar: () => CarProfile | null;
  getRecordsForActiveCar: () => ServiceRecord[];

  // Actions
  setActiveCarId: (id: string) => void;
  setCars: (cars: CarProfile[]) => void;
  setRecords: (records: ServiceRecord[]) => void;
  addCar: (car: CarProfile) => void;
  updateCar: (id: string, updates: Partial<CarProfile>) => void;
  deleteCar: (id: string) => void;
  updateOdometer: (carId: string, newOdometer: number) => void;
  addServiceRecord: (record: Omit<ServiceRecord, 'id'> & { id?: string }) => ServiceRecord;
  updateServiceRecord: (id: string, updates: Partial<ServiceRecord>) => void;
  deleteServiceRecord: (id: string) => void;
  syncFromLocalStorage: () => void;
}

const STORAGE_CARS_KEY = 'terminal_cars_v2';
const STORAGE_ACTIVE_CAR_KEY = 'terminal_active_car_id_v2';
const STORAGE_RECORDS_KEY = 'terminal_records_v2';

export const DEFAULT_FALLBACK_CAR: CarProfile = {
  id: 'demo-car-granta',
  brand: 'LADA',
  make: 'LADA',
  model: 'Granta FL',
  year: 2021,
  engine: { volume: '1.6л', type: 'Бензин', power: '106 л.с.', code: '21127' },
  transmission: 'МКПП',
  driveType: 'Передний',
  vin: 'XTA219020M1234567',
  licensePlate: '01 777 AAA',
  currentOdometer: 48500,
  mileage: 48500,
  notes: 'Семейный автомобиль',
  ownerId: 'local-owner',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Helper to safely convert legacy or incomplete Car to validated CarProfile
export function normalizeCarToProfile(car: any): CarProfile {
  if (!car || typeof car !== 'object') {
    return { ...DEFAULT_FALLBACK_CAR, id: `car-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` };
  }

  const brand = String(car.brand || car.make || DEFAULT_FALLBACK_CAR.brand).trim() || DEFAULT_FALLBACK_CAR.brand;
  const model = String(car.model || DEFAULT_FALLBACK_CAR.model).trim() || DEFAULT_FALLBACK_CAR.model;
  const currentOdometer = Math.max(0, Number(car.currentOdometer ?? car.mileage ?? car.odometer ?? DEFAULT_FALLBACK_CAR.currentOdometer) || 0);
  const parsedYear = Number(car.year);
  const year = parsedYear > 1950 && parsedYear < 2100 ? parsedYear : DEFAULT_FALLBACK_CAR.year;

  let engine: any = DEFAULT_FALLBACK_CAR.engine;
  if (typeof car.engine === 'object' && car.engine !== null) {
    engine = {
      volume: String(car.engine.volume || '1.6л'),
      type: String(car.engine.type || 'Бензин'),
      power: car.engine.power ? String(car.engine.power) : undefined,
      code: car.engine.code ? String(car.engine.code) : undefined,
    };
  } else if (typeof car.engine === 'string' && car.engine.trim()) {
    engine = {
      volume: car.engine.split(' ')[0] || '1.6л',
      type: 'Бензин',
      power: car.engine.includes('л.с.') ? car.engine : undefined,
    };
  }

  const id = String(car.id || `car-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);

  return {
    id,
    brand,
    model,
    generation: car.generation ? String(car.generation) : undefined,
    year,
    engine,
    transmission: String(car.transmission || 'МКПП'),
    driveType: String(car.driveType || 'Передний'),
    vin: car.vin ? String(car.vin) : undefined,
    licensePlate: car.licensePlate ? String(car.licensePlate) : undefined,
    currentOdometer,
    photoUrl: car.photoUrl || car.imageUrl || undefined,
    notes: car.notes ? String(car.notes) : undefined,
    // Aliases for backward compatibility
    make: brand,
    mileage: currentOdometer,
    imageUrl: car.photoUrl || car.imageUrl || undefined,
    ownerId: String(car.ownerId || 'local-owner'),
    createdAt: car.createdAt || new Date().toISOString(),
    updatedAt: car.updatedAt || new Date().toISOString(),
  };
}

// Category mapper from legacy to new and vice versa
export function mapLegacyCategoryToService(cat?: RecordCategory | string): ServiceCategory {
  const c = String(cat || '').toLowerCase();
  if (c.includes('oil') || c.includes('fluid') || c.includes('масл') || c.includes('жидкост')) return 'maintenance';
  if (c.includes('engine') || c.includes('свеч') || c.includes('то') || c.includes('фильтр')) return 'maintenance';
  if (c.includes('brake') || c.includes('suspension') || c.includes('колодк') || c.includes('стойк')) return 'repair';
  if (c.includes('tuning') || c.includes('тюнинг')) return 'tuning';
  if (c.includes('symptom') || c.includes('стук') || c.includes('шум') || c.includes('диагност')) return 'symptom';
  return 'maintenance';
}

export function mapServiceCategoryToLegacy(cat: ServiceCategory): RecordCategory {
  switch (cat) {
    case 'maintenance': return 'Oil & Fluids';
    case 'repair': return 'Engine';
    case 'tuning': return 'Other';
    case 'symptom': return 'Diagnostics';
    default: return 'Other';
  }
}

// Helper to convert legacy MaintenanceRecord to ServiceRecord
export function normalizeRecordToService(r: any): ServiceRecord {
  if (!r || typeof r !== 'object') {
    return {
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      carId: '',
      date: new Date().toISOString().split('T')[0],
      odometer: 0,
      title: 'Обслуживание',
      category: 'maintenance',
      worksDone: ['Обслуживание'],
      partsUsed: [],
      costWork: 0,
      costParts: 0,
      totalCost: 0,
      source: 'manual',
      description: 'Обслуживание',
      mileage: 0,
      partsPrice: 0,
      laborPrice: 0,
      attachments: [],
      photoUrls: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const title = String(r.title || r.description || 'Обслуживание');
  const odometer = Math.max(0, Number(r.odometer ?? r.mileage ?? 0) || 0);
  const costParts = Math.max(0, Number(r.costParts ?? r.partsPrice ?? 0) || 0);
  const costWork = Math.max(0, Number(r.costWork ?? r.laborPrice ?? 0) || 0);
  const totalCost = Math.max(0, Number(r.totalCost ?? (costParts + costWork)) || 0);

  let partsUsed: ServicePartUsed[] = [];
  if (Array.isArray(r.partsUsed)) {
    partsUsed = r.partsUsed.map((p: any) => {
      if (typeof p === 'string') return { name: p };
      if (typeof p === 'object' && p !== null) return { name: p.name || 'Запчасть', price: p.price, partNumber: p.partNumber };
      return { name: String(p) };
    });
  }

  let worksDone: string[] = [];
  if (Array.isArray(r.worksDone) && r.worksDone.length > 0) {
    worksDone = r.worksDone;
  } else if (title) {
    worksDone = [title];
  }

  const category = (r.category && ['maintenance', 'repair', 'symptom', 'tuning'].includes(r.category))
    ? (r.category as ServiceCategory)
    : mapLegacyCategoryToService(r.category);

  const photos: string[] = Array.from(new Set([
    ...(Array.isArray(r.attachments) ? r.attachments : []),
    ...(Array.isArray(r.photoUrls) ? r.photoUrls : []),
    ...(r.photoReceiptUrl ? [r.photoReceiptUrl] : [])
  ])).filter(Boolean);

  return {
    id: String(r.id || `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`),
    carId: String(r.carId || ''),
    date: r.date ? String(r.date).split('T')[0] : new Date().toISOString().split('T')[0],
    odometer,
    title,
    category,
    worksDone,
    partsUsed,
    costWork,
    costParts,
    totalCost,
    comment: r.comment ? String(r.comment) : undefined,
    source: r.source || 'manual',
    attachments: photos,
    photoUrls: photos,
    // Aliases
    description: title,
    mileage: odometer,
    partsPrice: costParts,
    laborPrice: costWork,
    createdAt: r.createdAt || new Date().toISOString(),
    updatedAt: r.updatedAt || new Date().toISOString(),
  };
}

export const useCarStore = create<CarStoreState>((set, get) => ({
  cars: [],
  activeCarId: null,
  records: [],
  isLoaded: false,

  getActiveCar: () => {
    const { cars, activeCarId } = get();
    if (!Array.isArray(cars) || cars.length === 0) return DEFAULT_FALLBACK_CAR;
    const found = activeCarId ? cars.find(c => c && c.id === activeCarId) : null;
    return found || cars[0] || DEFAULT_FALLBACK_CAR;
  },

  getRecordsForActiveCar: () => {
    const { records, activeCarId } = get();
    if (!Array.isArray(records)) return [];
    if (!activeCarId) return records;
    return records.filter(r => r && r.carId === activeCarId);
  },

  setActiveCarId: (id: string) => {
    set({ activeCarId: id });
    try {
      localStorage.setItem(STORAGE_ACTIVE_CAR_KEY, id);
    } catch (e) {
      console.warn('Failed to save active car id to localStorage', e);
    }
  },

  setCars: (cars: CarProfile[]) => {
    set({ cars });
    try {
      localStorage.setItem(STORAGE_CARS_KEY, JSON.stringify(cars));
    } catch (e) {
      console.warn('Failed to save cars to localStorage', e);
    }
  },

  setRecords: (records: ServiceRecord[]) => {
    set({ records });
    try {
      localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('Failed to save records to localStorage', e);
    }
  },

  addCar: (car: CarProfile) => {
    const normalized = normalizeCarToProfile(car);
    set((state) => {
      const updatedCars = [...state.cars, normalized];
      try {
        localStorage.setItem(STORAGE_CARS_KEY, JSON.stringify(updatedCars));
      } catch (e) {}
      return {
        cars: updatedCars,
        activeCarId: state.activeCarId || normalized.id,
      };
    });
  },

  updateCar: (id: string, updates: Partial<CarProfile>) => {
    set((state) => {
      const updatedCars = state.cars.map((c) => {
        if (c.id !== id) return c;
        const brand = updates.brand || updates.make || c.brand;
        const currentOdometer = updates.currentOdometer ?? updates.mileage ?? c.currentOdometer;
        const photoUrl = updates.photoUrl || updates.imageUrl || c.photoUrl;

        return {
          ...c,
          ...updates,
          brand,
          make: brand,
          currentOdometer,
          mileage: currentOdometer,
          photoUrl,
          imageUrl: photoUrl,
          updatedAt: new Date().toISOString(),
        };
      });

      try {
        localStorage.setItem(STORAGE_CARS_KEY, JSON.stringify(updatedCars));
      } catch (e) {}

      return { cars: updatedCars };
    });
  },

  deleteCar: (id: string) => {
    set((state) => {
      const updatedCars = state.cars.filter(c => c.id !== id);
      const nextActiveId = state.activeCarId === id ? (updatedCars[0]?.id || null) : state.activeCarId;
      try {
        localStorage.setItem(STORAGE_CARS_KEY, JSON.stringify(updatedCars));
        if (nextActiveId) localStorage.setItem(STORAGE_ACTIVE_CAR_KEY, nextActiveId);
        else localStorage.removeItem(STORAGE_ACTIVE_CAR_KEY);
      } catch (e) {}

      return {
        cars: updatedCars,
        activeCarId: nextActiveId,
      };
    });
  },

  updateOdometer: (carId: string, newOdometer: number) => {
    const cleanOdometer = Math.max(0, Math.round(newOdometer));
    get().updateCar(carId, {
      currentOdometer: cleanOdometer,
      mileage: cleanOdometer,
    });
  },

  addServiceRecord: (recordData) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newRecord: ServiceRecord = normalizeRecordToService({
      ...recordData,
      id: recordData.id || `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      date: recordData.date || todayStr,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    set((state) => {
      const updatedRecords = [newRecord, ...state.records];
      try {
        localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(updatedRecords));
      } catch (e) {}

      // Check if this record has a higher odometer than current car's odometer
      const car = state.cars.find(c => c.id === newRecord.carId);
      let updatedCars = state.cars;
      if (car && newRecord.odometer > (car.currentOdometer || car.mileage || 0)) {
        updatedCars = state.cars.map(c => {
          if (c.id === car.id) {
            return {
              ...c,
              currentOdometer: newRecord.odometer,
              mileage: newRecord.odometer,
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        });
        try {
          localStorage.setItem(STORAGE_CARS_KEY, JSON.stringify(updatedCars));
        } catch (e) {}
      }

      return {
        records: updatedRecords,
        cars: updatedCars,
      };
    });

    return newRecord;
  },

  updateServiceRecord: (id: string, updates: Partial<ServiceRecord>) => {
    set((state) => {
      const updatedRecords = state.records.map((r) => {
        if (r.id !== id) return r;
        return normalizeRecordToService({
          ...r,
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      });

      try {
        localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(updatedRecords));
      } catch (e) {}

      return { records: updatedRecords };
    });
  },

  deleteServiceRecord: (id: string) => {
    set((state) => {
      const updatedRecords = state.records.filter(r => r.id !== id);
      try {
        localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(updatedRecords));
      } catch (e) {}

      return { records: updatedRecords };
    });
  },

  syncFromLocalStorage: () => {
    try {
      // 1. Cars (check current storage key, then legacy keys for seamless migration)
      let rawCarsStr = localStorage.getItem(STORAGE_CARS_KEY);
      if (!rawCarsStr) {
        const legacyKeys = ['cars', 'terminal_cars', 'garage_cars', 'cars_v1'];
        for (const k of legacyKeys) {
          const val = localStorage.getItem(k);
          if (val) {
            rawCarsStr = val;
            break;
          }
        }
      }

      let loadedCars: CarProfile[] = [];
      if (rawCarsStr) {
        try {
          const parsed = JSON.parse(rawCarsStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedCars = parsed
              .filter(c => c && typeof c === 'object')
              .map(normalizeCarToProfile);
          }
        } catch (e) {
          console.warn('Corrupted cars in localStorage, fallback to default:', e);
        }
      }

      // Default fallback car if empty or missing required fields
      if (loadedCars.length === 0) {
        loadedCars = [{ ...DEFAULT_FALLBACK_CAR }];
        try {
          localStorage.setItem(STORAGE_CARS_KEY, JSON.stringify(loadedCars));
        } catch (e) {}
      }

      // 2. Active Car ID validation
      const savedActiveId = localStorage.getItem(STORAGE_ACTIVE_CAR_KEY);
      const activeCarId = loadedCars.some(c => c && c.id === savedActiveId)
        ? savedActiveId!
        : loadedCars[0].id;

      // 3. Records (check current and legacy keys)
      let rawRecordsStr = localStorage.getItem(STORAGE_RECORDS_KEY);
      if (!rawRecordsStr) {
        const legacyRecordKeys = ['records', 'terminal_records', 'maintenance_records'];
        for (const k of legacyRecordKeys) {
          const val = localStorage.getItem(k);
          if (val) {
            rawRecordsStr = val;
            break;
          }
        }
      }

      let loadedRecords: ServiceRecord[] = [];
      if (rawRecordsStr) {
        try {
          const parsed = JSON.parse(rawRecordsStr);
          if (Array.isArray(parsed)) {
            loadedRecords = parsed
              .filter(r => r && typeof r === 'object')
              .map(normalizeRecordToService);
          }
        } catch (e) {
          console.warn('Corrupted records in localStorage:', e);
        }
      }

      set({
        cars: loadedCars,
        activeCarId,
        records: loadedRecords,
        isLoaded: true,
      });
    } catch (err) {
      console.error('Error syncing CarStore from LocalStorage:', err);
      set({
        cars: [{ ...DEFAULT_FALLBACK_CAR }],
        activeCarId: DEFAULT_FALLBACK_CAR.id,
        records: [],
        isLoaded: true,
      });
    }
  },
}));

// Initialize store immediately on module load if in browser
if (typeof window !== 'undefined') {
  useCarStore.getState().syncFromLocalStorage();
}
