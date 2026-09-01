/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { VehicleTask, Car } from '../types';
import { calculateTaskUrgency, TaskUrgencyCalculation } from '../lib/taskUrgency';

export interface UrgentNotificationPayload {
  taskId: string;
  taskTitle: string;
  carId: string;
  carName: string;
  urgency: 'warning' | 'overdue';
  statusText: string;
  remainingKm?: number;
  remainingDays?: number;
  type: 'mileage' | 'simple';
}

export interface NotificationSchedulerOptions {
  enabled?: boolean;
  checkIntervalMs?: number;
  onUrgentAlert?: (payload: UrgentNotificationPayload) => void;
}

/**
 * Service Layer & Hook for scheduling and checking reminders for Vehicle Tasks.
 * 
 * Ready for native Android Push Notifications (Capacitor/Cordova/FCM/WebPush)
 * without rewriting business logic.
 */
export function useNotificationScheduler(
  cars: Car[],
  tasks: VehicleTask[],
  options: NotificationSchedulerOptions = {}
) {
  const {
    enabled = true,
    checkIntervalMs = 60000, // 1 minute periodic check
    onUrgentAlert
  } = options;

  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [urgentNotifications, setUrgentNotifications] = useState<UrgentNotificationPayload[]>([]);
  const notifiedTaskIdsRef = useRef<Set<string>>(new Set());

  // Core evaluation function that scans all vehicles and their pending tasks
  const checkPendingTaskReminders = useCallback((): UrgentNotificationPayload[] => {
    const alerts: UrgentNotificationPayload[] = [];
    const now = new Date();

    const carMap = new Map<string, Car>();
    cars.forEach(c => carMap.set(c.id, c));

    tasks.forEach(task => {
      if (task.status !== 'pending') return;

      const car = carMap.get(task.carId);
      const currentMileage = car?.mileage || 0;
      const carName = car ? `${car.make} ${car.model}` : 'Автомобиль';

      const calc: TaskUrgencyCalculation = calculateTaskUrgency(task, currentMileage, now);

      if (calc.urgency === 'overdue' || calc.urgency === 'warning') {
        const payload: UrgentNotificationPayload = {
          taskId: task.id,
          taskTitle: task.title,
          carId: task.carId,
          carName,
          urgency: calc.urgency,
          statusText: calc.statusText || '',
          remainingKm: calc.remainingKm,
          remainingDays: calc.remainingDays,
          type: task.type
        };
        alerts.push(payload);
      }
    });

    setUrgentNotifications(alerts);
    setLastCheckedAt(new Date());

    return alerts;
  }, [cars, tasks]);

  // Request browser notification permission if available
  const requestPushPermission = useCallback(async (): Promise<NotificationPermission | 'unsupported'> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return 'denied';
    }
  }, []);

  // Send local system/browser notification or bridge to mobile Push
  const triggerNativePush = useCallback((alert: UrgentNotificationPayload) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const title = alert.urgency === 'overdue' 
      ? `🚨 Просрочено ТО: ${alert.taskTitle}` 
      : `⚠️ Скоро ТО: ${alert.taskTitle}`;

    const body = `${alert.carName}: ${alert.statusText}`;

    try {
      new Notification(title, {
        body,
        icon: '/icon-192.png',
        tag: `task-${alert.taskId}-${alert.urgency}`,
        requireInteraction: alert.urgency === 'overdue'
      });
    } catch (e) {
      console.warn('Notification trigger error:', e);
    }
  }, []);

  // Periodic scheduler loop
  useEffect(() => {
    if (!enabled) return;

    const runCheck = () => {
      const alerts = checkPendingTaskReminders();
      
      // Dispatch callback and notify unnotified urgent alerts
      alerts.forEach(alert => {
        const alertKey = `${alert.taskId}-${alert.urgency}`;
        if (!notifiedTaskIdsRef.current.has(alertKey)) {
          notifiedTaskIdsRef.current.add(alertKey);
          
          if (onUrgentAlert) {
            onUrgentAlert(alert);
          }
          
          // Optionally trigger native push if permission is granted
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            triggerNativePush(alert);
          }
        }
      });
    };

    // Run initial check
    runCheck();

    // Schedule interval
    const interval = setInterval(runCheck, checkIntervalMs);
    return () => clearInterval(interval);
  }, [enabled, checkIntervalMs, checkPendingTaskReminders, onUrgentAlert, triggerNativePush]);

  return {
    urgentNotifications,
    lastCheckedAt,
    checkPendingTaskReminders,
    requestPushPermission,
    triggerNativePush,
    hasUrgentAlerts: urgentNotifications.length > 0,
    overdueCount: urgentNotifications.filter(n => n.urgency === 'overdue').length,
    warningCount: urgentNotifications.filter(n => n.urgency === 'warning').length,
  };
}
