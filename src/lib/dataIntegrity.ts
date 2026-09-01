/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Car, MaintenanceRecord, Part, VehicleTask, DiagnosticSession } from '../types';

/**
 * Validates and clamps a number to non-negative, fallback to defaultValue
 */
export function sanitizeNumber(val: any, defaultValue: number = 0, min: number = 0): number {
  if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
    return Math.max(min, val);
  }
  if (typeof val === 'string') {
    const parsed = parseFloat(val.replace(/[^\d.-]/g, ''));
    if (!isNaN(parsed) && isFinite(parsed)) {
      return Math.max(min, parsed);
    }
  }
  return defaultValue;
}

/**
 * Validates and sanitizes a string, fallback to defaultValue
 */
export function sanitizeString(val: any, defaultValue: string = ''): string {
  if (typeof val === 'string') {
    return val.trim();
  }
  if (val !== null && val !== undefined) {
    return String(val).trim();
  }
  return defaultValue;
}

/**
 * Validates an ISO date string or YYYY-MM-DD
 */
export function sanitizeDate(val: any, fallbackToNow: boolean = true): string {
  if (typeof val === 'string' && val.trim().length >= 4) {
    const timestamp = Date.parse(val);
    if (!isNaN(timestamp)) {
      return val.trim();
    }
  }
  return fallbackToNow ? new Date().toISOString() : '';
}

/**
 * Validates and sanitizes a single Car record
 */
export function validateCar(raw: any): Car | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = sanitizeString(raw.id, `car-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
  const make = sanitizeString(raw.make, 'LADA');
  const model = sanitizeString(raw.model, 'Granta');
  const year = sanitizeNumber(raw.year, new Date().getFullYear(), 1950);
  const mileage = sanitizeNumber(raw.mileage, 0, 0);

  return {
    id,
    make,
    model,
    year,
    mileage,
    engine: sanitizeString(raw.engine, '1.6л'),
    vin: raw.vin ? sanitizeString(raw.vin) : undefined,
    licensePlate: raw.licensePlate ? sanitizeString(raw.licensePlate) : undefined,
    ownerId: sanitizeString(raw.ownerId, 'local-owner'),
    createdAt: sanitizeDate(raw.createdAt),
    updatedAt: sanitizeDate(raw.updatedAt)
  };
}

/**
 * Validates and sanitizes a single MaintenanceRecord
 */
export function validateRecord(raw: any, availableCarIds: string[] = []): MaintenanceRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = sanitizeString(raw.id, `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
  let carId = sanitizeString(raw.carId);
  if (!carId && availableCarIds.length > 0) {
    carId = availableCarIds[0];
  }
  if (!carId) return null; // Orphan record without car association

  const date = sanitizeDate(raw.date, true).split('T')[0];
  const mileage = sanitizeNumber(raw.mileage, 0, 0);
  const description = sanitizeString(raw.description, 'Техническое обслуживание');
  const partsPrice = sanitizeNumber(raw.partsPrice, 0, 0);
  const laborPrice = sanitizeNumber(raw.laborPrice, 0, 0);

  let partsUsed: string[] = [];
  if (Array.isArray(raw.partsUsed)) {
    partsUsed = raw.partsUsed.map(p => sanitizeString(p)).filter(Boolean);
  }

  return {
    id,
    carId,
    date,
    mileage,
    category: raw.category || 'Other',
    description,
    partsPrice,
    laborPrice,
    partsUsed,
    relatedDtc: raw.relatedDtc ? sanitizeString(raw.relatedDtc) : undefined,
    source: raw.source || 'manual',
    createdAt: sanitizeDate(raw.createdAt),
    updatedAt: sanitizeDate(raw.updatedAt)
  };
}

/**
 * Validates and sanitizes a single Part item with strict inventory constraints:
 * - quantity >= 0
 * - reservedQuantity >= 0
 * - reservedQuantity <= quantity
 */
export function validatePart(raw: any): Part | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = sanitizeString(raw.id, `part-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
  const name = sanitizeString(raw.name, 'Запасная часть');
  const quantity = sanitizeNumber(raw.quantity, 0, 0);
  let reservedQuantity = sanitizeNumber(raw.reservedQuantity, 0, 0);
  if (reservedQuantity > quantity) {
    reservedQuantity = quantity; // Clamp reserved quantity to stock
  }
  const price = sanitizeNumber(raw.price, 0, 0);

  return {
    id,
    name,
    quantity,
    reservedQuantity,
    price,
    partNumber: raw.partNumber ? sanitizeString(raw.partNumber) : undefined,
    supplier: raw.supplier ? sanitizeString(raw.supplier) : undefined,
    location: raw.location ? sanitizeString(raw.location) : undefined,
    ownerId: raw.ownerId ? sanitizeString(raw.ownerId) : undefined,
    createdAt: sanitizeDate(raw.createdAt),
    updatedAt: sanitizeDate(raw.updatedAt)
  };
}

/**
 * Validates and sanitizes a single VehicleTask
 */
export function validateTask(raw: any, availableCarIds: string[] = []): VehicleTask | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = sanitizeString(raw.id, `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
  let carId = sanitizeString(raw.carId);
  if (!carId && availableCarIds.length > 0) {
    carId = availableCarIds[0];
  }
  if (!carId) return null;

  const title = sanitizeString(raw.title, 'Плановая работа');
  const status = raw.status === 'completed' ? 'completed' : 'pending';
  const type = raw.type === 'mileage' ? 'mileage' : 'simple';

  return {
    id,
    carId,
    title,
    type,
    status,
    category: raw.category || 'Engine',
    targetMileage: raw.targetMileage !== undefined ? sanitizeNumber(raw.targetMileage, 0, 0) : undefined,
    targetDate: raw.targetDate ? sanitizeDate(raw.targetDate, false).split('T')[0] : undefined,
    relatedDtc: raw.relatedDtc ? sanitizeString(raw.relatedDtc) : undefined,
    relatedPartIds: Array.isArray(raw.relatedPartIds) ? raw.relatedPartIds.map(p => sanitizeString(p)).filter(Boolean) : undefined,
    requiredParts: Array.isArray(raw.requiredParts) ? raw.requiredParts : undefined,
    diagnosticSessionId: raw.diagnosticSessionId ? sanitizeString(raw.diagnosticSessionId) : undefined,
    createdAt: sanitizeDate(raw.createdAt),
    updatedAt: sanitizeDate(raw.updatedAt)
  };
}

/**
 * Validates and sanitizes a DiagnosticSession
 */
export function validateDiagnosticSession(raw: any, availableCarIds: string[] = []): DiagnosticSession | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = sanitizeString(raw.id, `session-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
  let carId = sanitizeString(raw.carId);
  if (!carId && availableCarIds.length > 0) {
    carId = availableCarIds[0];
  }
  if (!carId) return null;

  const validStatuses = ['active', 'waiting_recheck', 'resolved', 'unresolved', 'cancelled'];
  const status = validStatuses.includes(raw.status) ? raw.status : 'active';

  const initialDtcCodes: string[] = Array.isArray(raw.initialDtcCodes) 
    ? raw.initialDtcCodes.map(d => sanitizeString(d)).filter(Boolean)
    : (Array.isArray(raw.initialDtc) ? raw.initialDtc.map(d => sanitizeString(d)).filter(Boolean) : []);

  const currentDtcCodes: string[] = Array.isArray(raw.currentDtcCodes)
    ? raw.currentDtcCodes.map(d => sanitizeString(d)).filter(Boolean)
    : [...initialDtcCodes];

  const checks = Array.isArray(raw.checks)
    ? raw.checks.map((chk: any, idx: number) => ({
        id: sanitizeString(chk?.id, `chk-${idx}`),
        title: sanitizeString(chk?.title, 'Проверка цепи'),
        status: ['pending', 'passed', 'failed', 'skipped'].includes(chk?.status) ? chk.status : 'pending',
        targetComponent: sanitizeString(chk?.targetComponent, ''),
        procedure: sanitizeString(chk?.procedure, ''),
        measuredValue: chk?.measuredValue ? sanitizeString(chk?.measuredValue) : undefined,
        referenceValue: chk?.referenceValue ? sanitizeString(chk?.referenceValue) : undefined
      }))
    : [];

  const stepsHistory = Array.isArray(raw.stepsHistory)
    ? raw.stepsHistory.map((s: any) => ({
        timestamp: sanitizeDate(s?.timestamp),
        step: sanitizeString(s?.step, 'step'),
        title: sanitizeString(s?.title, ''),
        notes: sanitizeString(s?.notes, ''),
        result: s?.result ? sanitizeString(s?.result) : undefined
      }))
    : [];

  return {
    id,
    carId,
    status,
    startedAt: sanitizeDate(raw.startedAt),
    resolvedAt: raw.resolvedAt ? sanitizeDate(raw.resolvedAt) : undefined,
    startOdometer: sanitizeNumber(raw.startOdometer, 0, 0),
    currentOdometer: sanitizeNumber(raw.currentOdometer, 0, 0),
    initialDtcCodes,
    currentDtcCodes,
    finalDtcCodes: Array.isArray(raw.finalDtcCodes) ? raw.finalDtcCodes.map(d => sanitizeString(d)) : undefined,
    initialDtc: initialDtcCodes,
    checks,
    stepsHistory,
    linkedTaskIds: Array.isArray(raw.linkedTaskIds) ? raw.linkedTaskIds.map(t => sanitizeString(t)) : [],
    linkedRecordIds: Array.isArray(raw.linkedRecordIds) ? raw.linkedRecordIds.map(r => sanitizeString(r)) : []
  };
}

/**
 * Master migration function that safely inspects old and new localStorage keys,
 * extracts valid data, sanitizes schemas, and writes back cleanly to V2 keys.
 */
export function migrateAndSanitizeLocalStorage(): {
  cars: Car[];
  activeCarId: string | null;
  records: MaintenanceRecord[];
  parts: Part[];
  tasks: VehicleTask[];
  diagnosticSessions: DiagnosticSession[];
} {
  try {
    // 1. CARS MIGRATION
    let rawCars: any[] = [];
    const savedCarsV2 = localStorage.getItem('terminal_cars_v2');
    const legacyGuestCars = localStorage.getItem('blueprint_cars_guest');
    const legacyCars = localStorage.getItem('blueprint_cars');

    if (savedCarsV2) {
      try { rawCars = JSON.parse(savedCarsV2); } catch (e) {}
    } else if (legacyGuestCars) {
      try { rawCars = JSON.parse(legacyGuestCars); } catch (e) {}
    } else if (legacyCars) {
      try { rawCars = JSON.parse(legacyCars); } catch (e) {}
    }

    let cars: Car[] = Array.isArray(rawCars)
      ? rawCars.map(validateCar).filter((c): c is Car => c !== null)
      : [];

    // Filter out old demo placeholder if any
    cars = cars.filter(c => c.id !== 'lada-kalina');

    if (cars.length === 0) {
      const defaultCar: Car = {
        id: 'demo-car-granta',
        make: 'LADA',
        model: 'Granta FL',
        year: 2021,
        engine: '1.6л 16V (106 л.с.)',
        mileage: 48500,
        vin: 'XTA219020M1234567',
        licensePlate: '01 777 AAA',
        ownerId: 'local-owner',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      cars = [defaultCar];
    }

    const validCarIds = cars.map(c => c.id);

    // 2. ACTIVE CAR ID
    const savedActiveId = localStorage.getItem('terminal_active_car_id_v2') ||
                          localStorage.getItem('blueprint_active_car_guest') ||
                          localStorage.getItem('blueprint_active_car_id');

    let activeCarId: string | null = validCarIds.includes(savedActiveId || '') ? savedActiveId! : cars[0]?.id || null;

    // 3. RECORDS MIGRATION
    let rawRecords: any[] = [];
    const savedRecordsV2 = localStorage.getItem('terminal_records_v2');
    const legacyGuestRecords = localStorage.getItem('blueprint_records_guest');
    
    if (savedRecordsV2) {
      try { rawRecords = JSON.parse(savedRecordsV2); } catch (e) {}
    } else if (legacyGuestRecords) {
      try { rawRecords = JSON.parse(legacyGuestRecords); } catch (e) {}
    } else {
      // Check for vehicle-specific legacy keys (blueprint_records_*)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('blueprint_records_')) {
          try {
            const list = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(list)) rawRecords.push(...list);
          } catch (e) {}
        }
      }
    }

    let records: MaintenanceRecord[] = Array.isArray(rawRecords)
      ? rawRecords.map(r => validateRecord(r, validCarIds)).filter((r): r is MaintenanceRecord => r !== null)
      : [];

    if (records.length === 0 && cars.length > 0) {
      records = [
        {
          id: 'rec-init-1',
          carId: cars[0].id,
          date: '2024-03-15',
          mileage: 45000,
          category: 'Engine',
          description: 'Замена масла ДВС (Synthetic 5W-40) и масляного фильтра MANN W914/2',
          partsPrice: 18500,
          laborPrice: 3500,
          partsUsed: ['Масло 4л', 'Масляный фильтр W914/2'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'rec-init-2',
          carId: cars[0].id,
          date: '2023-10-10',
          mileage: 38000,
          category: 'Brakes',
          description: 'Замена передних тормозных колодок Bosch и ревизия суппортов',
          partsPrice: 12000,
          laborPrice: 4000,
          partsUsed: ['Колодки передние Bosch'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }

    // 4. PARTS MIGRATION
    let rawParts: any[] = [];
    const savedPartsV2 = localStorage.getItem('terminal_parts_v2');
    const legacyGuestParts = localStorage.getItem('blueprint_parts_guest');
    const legacyParts = localStorage.getItem('blueprint_parts');

    if (savedPartsV2) {
      try { rawParts = JSON.parse(savedPartsV2); } catch (e) {}
    } else if (legacyGuestParts) {
      try { rawParts = JSON.parse(legacyGuestParts); } catch (e) {}
    } else if (legacyParts) {
      try { rawParts = JSON.parse(legacyParts); } catch (e) {}
    }

    let parts: Part[] = Array.isArray(rawParts)
      ? rawParts.map(validatePart).filter((p): p is Part => p !== null)
      : [];

    // 5. TASKS MIGRATION
    let rawTasks: any[] = [];
    const savedTasksV2 = localStorage.getItem('terminal_tasks_v2');
    const legacyGuestTasks = localStorage.getItem('blueprint_tasks_guest');

    if (savedTasksV2) {
      try { rawTasks = JSON.parse(savedTasksV2); } catch (e) {}
    } else if (legacyGuestTasks) {
      try { rawTasks = JSON.parse(legacyGuestTasks); } catch (e) {}
    } else {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('blueprint_tasks_')) {
          try {
            const list = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(list)) rawTasks.push(...list);
          } catch (e) {}
        }
      }
    }

    let tasks: VehicleTask[] = Array.isArray(rawTasks)
      ? rawTasks.map(t => validateTask(t, validCarIds)).filter((t): t is VehicleTask => t !== null)
      : [];

    // 6. DIAGNOSTIC SESSIONS MIGRATION
    let rawSessions: any[] = [];
    const savedSessionsV2 = localStorage.getItem('terminal_diagnostic_sessions_v2');
    if (savedSessionsV2) {
      try { rawSessions = JSON.parse(savedSessionsV2); } catch (e) {}
    } else {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('diagnostic_session_')) {
          try {
            const sess = JSON.parse(localStorage.getItem(key) || '{}');
            if (sess && sess.id) rawSessions.push(sess);
          } catch (e) {}
        }
      }
    }

    let diagnosticSessions: DiagnosticSession[] = Array.isArray(rawSessions)
      ? rawSessions.map(s => validateDiagnosticSession(s, validCarIds)).filter((s): s is DiagnosticSession => s !== null)
      : [];

    // Persist cleanly to V2 keys
    localStorage.setItem('terminal_cars_v2', JSON.stringify(cars));
    if (activeCarId) {
      localStorage.setItem('terminal_active_car_id_v2', activeCarId);
    }
    localStorage.setItem('terminal_records_v2', JSON.stringify(records));
    localStorage.setItem('terminal_parts_v2', JSON.stringify(parts));
    localStorage.setItem('terminal_tasks_v2', JSON.stringify(tasks));
    localStorage.setItem('terminal_diagnostic_sessions_v2', JSON.stringify(diagnosticSessions));

    return {
      cars,
      activeCarId,
      records,
      parts,
      tasks,
      diagnosticSessions
    };
  } catch (err) {
    console.error('Migration error occurred:', err);
    return {
      cars: [],
      activeCarId: null,
      records: [],
      parts: [],
      tasks: [],
      diagnosticSessions: []
    };
  }
}
