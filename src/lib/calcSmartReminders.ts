/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Car, MaintenanceRecord, VehicleTask } from '../types';
import { calculateAllFluidsHealth, FluidHealthCalculation, FluidKey } from './calcFluidHealth';

export interface SmartReminder {
  id: string;
  title: string;
  description: string; // e.g.: "До замены масла осталось ~800 км (примерно 22 дня при твоем среднем пробеге 36 км/день)."
  remainingKm?: number;
  estimatedDays?: number;
  urgency: 'critical' | 'warning' | 'info';
  fluidKey?: FluidKey;
  isOverdue?: boolean;
}

export interface OdometerStaleStatus {
  isStale: boolean;
  daysSinceUpdate: number;
  currentOdometer: number;
  lastUpdatedDate: string | null;
}

export interface SmartCarInsights {
  avgDailyKm: number;
  hasCalculatedMileage: boolean;
  reminders: SmartReminder[];
  odometerStatus: OdometerStaleStatus;
  criticalFluidsCount: number;
  overdueTasksCount: number;
  totalIssueCount: number;
  hasCriticalIssues: boolean;
  fluidsHealth: Record<FluidKey, FluidHealthCalculation>;
}

const DEFAULT_AVG_DAILY_KM = 35; // Default average daily mileage (km/day) in Russia/CIS

/**
 * Calculates average daily mileage based on the two most recent service records with distinct dates.
 * Falls back to DEFAULT_AVG_DAILY_KM (35 km/day) if records are insufficient or invalid.
 */
export function calculateAverageDailyMileage(records: MaintenanceRecord[]): {
  avgDailyKm: number;
  hasCalculatedMileage: boolean;
} {
  if (!records || records.length < 2) {
    return { avgDailyKm: DEFAULT_AVG_DAILY_KM, hasCalculatedMileage: false };
  }

  // Sort chronologically descending
  const sorted = [...records]
    .filter(r => r.mileage && r.mileage > 0 && r.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sorted.length < 2) {
    return { avgDailyKm: DEFAULT_AVG_DAILY_KM, hasCalculatedMileage: false };
  }

  // Find two records with different dates and non-zero mileage difference
  for (let i = 0; i < sorted.length - 1; i++) {
    const recNewer = sorted[i];
    const recOlder = sorted[i + 1];

    const dNewer = new Date(recNewer.date).getTime();
    const dOlder = new Date(recOlder.date).getTime();
    const diffDays = Math.round(Math.abs(dNewer - dOlder) / (1000 * 60 * 60 * 24));
    const diffKm = Math.abs((recNewer.mileage || 0) - (recOlder.mileage || 0));

    // Validate sane boundaries (at least 3 days apart and 20 km)
    if (diffDays >= 3 && diffKm >= 20) {
      const rawAvg = Math.round(diffKm / diffDays);
      // Realistic automotive range: 5..250 km/day
      const boundedAvg = Math.max(5, Math.min(250, rawAvg));
      return { avgDailyKm: boundedAvg, hasCalculatedMileage: true };
    }
  }

  return { avgDailyKm: DEFAULT_AVG_DAILY_KM, hasCalculatedMileage: false };
}

/**
 * Checks whether the car odometer hasn't been updated for 14+ days.
 */
export function checkOdometerRecency(car: Car | null, records: MaintenanceRecord[]): OdometerStaleStatus {
  if (!car) {
    return { isStale: false, daysSinceUpdate: 0, currentOdometer: 0, lastUpdatedDate: null };
  }

  const currentOdometer = car.mileage || 0;
  const now = new Date();

  // Check stored confirmation timestamp from localStorage if available
  let lastConfirmedTimestamp = 0;
  try {
    const stored = localStorage.getItem(`odometer_confirmed_${car.id}`);
    if (stored) {
      lastConfirmedTimestamp = new Date(stored).getTime();
    }
  } catch (e) {}

  // Check car updatedAt
  const carUpdatedTimestamp = car.updatedAt ? new Date(car.updatedAt).getTime() : 0;

  // Check newest service record date
  let latestRecordTimestamp = 0;
  if (records && records.length > 0) {
    const activeRecords = records.filter(r => r.carId === car.id);
    for (const r of activeRecords) {
      const t = new Date(r.date).getTime();
      if (!isNaN(t) && t > latestRecordTimestamp) {
        latestRecordTimestamp = t;
      }
    }
  }

  // The most recent evidence of odometer activity
  const mostRecentTimestamp = Math.max(lastConfirmedTimestamp, carUpdatedTimestamp, latestRecordTimestamp);

  if (mostRecentTimestamp === 0) {
    // No timestamp available, check createdAt
    const carCreatedTimestamp = car.createdAt ? new Date(car.createdAt).getTime() : 0;
    if (carCreatedTimestamp > 0) {
      const diffDays = Math.floor((now.getTime() - carCreatedTimestamp) / (1000 * 60 * 60 * 24));
      return {
        isStale: diffDays >= 14,
        daysSinceUpdate: Math.max(0, diffDays),
        currentOdometer,
        lastUpdatedDate: car.createdAt || null,
      };
    }
    return { isStale: false, daysSinceUpdate: 0, currentOdometer, lastUpdatedDate: null };
  }

  const daysSinceUpdate = Math.floor((now.getTime() - mostRecentTimestamp) / (1000 * 60 * 60 * 24));
  const isStale = daysSinceUpdate >= 14;

  return {
    isStale,
    daysSinceUpdate: Math.max(0, daysSinceUpdate),
    currentOdometer,
    lastUpdatedDate: new Date(mostRecentTimestamp).toISOString().split('T')[0],
  };
}

/**
 * Marks the car odometer as confirmed today in localStorage.
 */
export function markOdometerConfirmedToday(carId: string): void {
  try {
    localStorage.setItem(`odometer_confirmed_${carId}`, new Date().toISOString());
  } catch (e) {
    console.warn('Failed to store odometer confirmation in localStorage', e);
  }
}

/**
 * Calculates comprehensive smart reminders, issue badges, and predictions for a car.
 */
export function calculateSmartCarInsights(
  car: Car | null,
  records: MaintenanceRecord[],
  tasks: VehicleTask[] = []
): SmartCarInsights {
  if (!car) {
    return {
      avgDailyKm: DEFAULT_AVG_DAILY_KM,
      hasCalculatedMileage: false,
      reminders: [],
      odometerStatus: { isStale: false, daysSinceUpdate: 0, currentOdometer: 0, lastUpdatedDate: null },
      criticalFluidsCount: 0,
      overdueTasksCount: 0,
      totalIssueCount: 0,
      hasCriticalIssues: false,
      fluidsHealth: {} as any,
    };
  }

  const currentMileage = car.mileage || 0;
  const carRecords = records.filter(r => r.carId === car.id);
  const carTasks = tasks.filter(t => t.carId === car.id && t.status === 'pending');

  // 1. Calculate average daily mileage
  const { avgDailyKm, hasCalculatedMileage } = calculateAverageDailyMileage(carRecords);

  // 2. Calculate Dual-Limit fluid health
  const fluidsHealth = calculateAllFluidsHealth({
    carId: car.id,
    currentMileage,
    records: carRecords,
  });

  // 3. Check odometer recency
  const odometerStatus = checkOdometerRecency(car, carRecords);

  const reminders: SmartReminder[] = [];
  let criticalFluidsCount = 0;
  let hasZeroHealthFluid = false;

  // Check each fluid
  (Object.keys(fluidsHealth) as FluidKey[]).forEach((key) => {
    const calc = fluidsHealth[key];

    // Count critical fluids (< 10% health)
    if (calc.remainingHealth < 10) {
      criticalFluidsCount++;
    }
    if (calc.remainingHealth <= 0) {
      hasZeroHealthFluid = true;
    }

    // Remaining km calculation based on maxKm
    const remainingKm = Math.max(0, calc.maxKm - calc.kmPassed);
    const estimatedDays = Math.max(1, Math.round(remainingKm / avgDailyKm));

    if (calc.statusLevel === 'critical' || calc.remainingHealth <= 15) {
      reminders.push({
        id: `fluid-crit-${key}`,
        title: `Критический износ: ${calc.nameRu}`,
        description: calc.isTimeExceeded
          ? `${calc.nameRu} требует срочной замены (превышен срок: ${calc.daysPassed} из ${calc.maxDays} дн.).`
          : `Остаток ресурса ${calc.remainingHealth}%. Превышен лимит пробега на ${Math.max(0, calc.kmPassed - calc.maxKm)} км!`,
        remainingKm: 0,
        estimatedDays: 0,
        urgency: 'critical',
        fluidKey: key,
        isOverdue: true,
      });
    } else if (calc.statusLevel === 'replace_due' || calc.remainingHealth <= 30) {
      reminders.push({
        id: `fluid-warn-${key}`,
        title: `Скоро замена: ${calc.nameRu}`,
        description: `До замены ${calc.shortName.toLowerCase()} осталось ~${remainingKm.toLocaleString('ru-RU')} км (примерно ${estimatedDays} дн. при среднем пробеге ${avgDailyKm} км/день).`,
        remainingKm,
        estimatedDays,
        urgency: 'warning',
        fluidKey: key,
      });
    }
  });

  // 4. Check overdue and pending tasks
  let overdueTasksCount = 0;
  let hasCriticalOverdueTask = false;
  const now = new Date();

  carTasks.forEach((t) => {
    const isKmOverdue = t.targetMileage ? currentMileage >= t.targetMileage : false;
    const isDateOverdue = t.targetDate ? new Date(t.targetDate).getTime() < now.getTime() : false;
    const isOverdue = isKmOverdue || isDateOverdue;

    if (isOverdue) {
      overdueTasksCount++;
      if (t.source === 'dtc' || Boolean(t.relatedDtc)) {
        hasCriticalOverdueTask = true;
      }

      reminders.push({
        id: `task-overdue-${t.id}`,
        title: `Просрочено: ${t.title}`,
        description: isKmOverdue && t.targetMileage
          ? `Пробег ТО превышен на ${(currentMileage - t.targetMileage).toLocaleString('ru-RU')} км.`
          : `Срок регламентной задачи истёк ${t.targetDate}.`,
        urgency: 'critical',
        isOverdue: true,
      });
    } else if (t.targetMileage && t.targetMileage - currentMileage <= 1000) {
      const remainingKm = Math.max(0, t.targetMileage - currentMileage);
      const estimatedDays = Math.max(1, Math.round(remainingKm / avgDailyKm));
      reminders.push({
        id: `task-soon-${t.id}`,
        title: `Плановое ТО: ${t.title}`,
        description: `Осталось ~${remainingKm.toLocaleString('ru-RU')} км (примерно ${estimatedDays} дн. при среднем пробеге ${avgDailyKm} км/день).`,
        remainingKm,
        estimatedDays,
        urgency: 'warning',
      });
    }
  });

  const totalIssueCount = criticalFluidsCount + overdueTasksCount;
  const hasCriticalIssues = hasZeroHealthFluid || hasCriticalOverdueTask || criticalFluidsCount > 0;

  return {
    avgDailyKm,
    hasCalculatedMileage,
    reminders,
    odometerStatus,
    criticalFluidsCount,
    overdueTasksCount,
    totalIssueCount,
    hasCriticalIssues,
    fluidsHealth,
  };
}
