/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VehicleTask } from '../types';

export type TaskUrgencyStatus = 'ok' | 'warning' | 'overdue';

export interface TaskUrgencyCalculation {
  urgency: TaskUrgencyStatus;
  isOverdue: boolean;
  isWarning: boolean;
  isOk: boolean;
  remainingKm?: number;
  remainingDays?: number;
  badgeLabel?: string;
  badgeColorClass?: string;
  statusText?: string;
}

/**
 * Calculates dynamic urgency status for a vehicle task based on:
 * • 'ok' — time or mileage have not yet arrived.
 * • 'warning' — remaining <= 7 days OR <= 500 km until target.
 * • 'overdue' — target date in past OR current mileage exceeds target mileage.
 */
export function calculateTaskUrgency(
  task: VehicleTask,
  currentMileage: number = 0,
  referenceDate: Date = new Date()
): TaskUrgencyCalculation {
  if (task.status === 'completed') {
    return {
      urgency: 'ok',
      isOverdue: false,
      isWarning: false,
      isOk: true,
      statusText: 'Выполнено'
    };
  }

  const nowTime = referenceDate.getTime();
  let urgency: TaskUrgencyStatus = 'ok';
  let remainingKm: number | undefined = undefined;
  let remainingDays: number | undefined = undefined;
  let statusText = 'В графике';

  // 1. Mileage check
  if (task.type === 'mileage' && task.targetMileage !== undefined && task.targetMileage !== null) {
    remainingKm = task.targetMileage - currentMileage;

    if (remainingKm <= 0) {
      urgency = 'overdue';
      const over = Math.abs(remainingKm);
      statusText = over > 0 ? `Просрочено на ${over.toLocaleString('ru-RU')} км` : 'Пора выполнить (пробег достигнут)';
    } else if (remainingKm <= 500) {
      urgency = 'warning';
      statusText = `Осталось ${remainingKm.toLocaleString('ru-RU')} км`;
    }
  }

  // 2. Date check (can also apply to simple tasks or any task with targetDate)
  if (task.targetDate) {
    const targetTime = new Date(task.targetDate).getTime();
    if (!isNaN(targetTime)) {
      // difference in full days
      const diffMs = targetTime - nowTime;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      remainingDays = diffDays;

      if (diffDays < 0) {
        urgency = 'overdue';
        const pastDays = Math.abs(diffDays);
        statusText = `Просрочено на ${pastDays} ${pluralizeDays(pastDays)}`;
      } else if (diffDays <= 7) {
        // If not already overdue by mileage, mark as warning
        if (urgency !== 'overdue') {
          urgency = 'warning';
          statusText = diffDays === 0 ? 'Срок сегодня!' : `Осталось ${diffDays} ${pluralizeDays(diffDays)}`;
        }
      }
    }
  }

  const isOverdue = urgency === 'overdue';
  const isWarning = urgency === 'warning';
  const isOk = urgency === 'ok';

  let badgeLabel: string | undefined = undefined;
  let badgeColorClass = 'text-slate-400 bg-slate-800/40 border-slate-700/50';

  if (isOverdue) {
    badgeLabel = 'Просрочено';
    badgeColorClass = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  } else if (isWarning) {
    badgeLabel = 'Подходит срок';
    badgeColorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  }

  return {
    urgency,
    isOverdue,
    isWarning,
    isOk,
    remainingKm,
    remainingDays,
    badgeLabel,
    badgeColorClass,
    statusText
  };
}

export function pluralizeDays(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) {
    return 'дней';
  }
  if (mod10 === 1) {
    return 'день';
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return 'дня';
  }
  return 'дней';
}

/**
 * Aggregates task stats across pending tasks
 */
export function getCarTaskUrgencySummary(tasks: VehicleTask[], currentMileage: number = 0) {
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  let overdueCount = 0;
  let warningCount = 0;
  let okCount = 0;

  const analyzedTasks = pendingTasks.map(task => {
    const calc = calculateTaskUrgency(task, currentMileage);
    if (calc.urgency === 'overdue') overdueCount++;
    else if (calc.urgency === 'warning') warningCount++;
    else okCount++;
    return { task, calc };
  });

  return {
    totalPending: pendingTasks.length,
    overdueCount,
    warningCount,
    okCount,
    attentionCount: overdueCount + warningCount,
    analyzedTasks
  };
}
