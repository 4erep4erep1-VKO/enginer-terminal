/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { VehicleTask, MaintenanceRecord } from '../types';
import { 
  AlertTriangle, 
  CheckCircle2,
  ArrowRight,
  Bot
} from 'lucide-react';

export type HealthState = 'CRITICAL' | 'WARNING' | 'NORMAL';

interface HealthStatusBannerProps {
  obdSnapshot?: any;
  tasks: VehicleTask[];
  records?: MaintenanceRecord[];
  currentMileage: number;
  onNavigateToObd?: (dtcCode?: string) => void;
  onNavigateToRagWithQuestion: (questionOrPayload: string | any) => void;
  onNavigateToTasks: () => void;
}

export function HealthStatusBanner({
  tasks,
  records = [],
  currentMileage,
  onNavigateToRagWithQuestion,
  onNavigateToTasks,
}: HealthStatusBannerProps) {
  // 1. Evaluate Overdue Tasks
  const overdueTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.status !== 'pending') return false;
      if (t.type === 'mileage' && t.targetMileage && currentMileage >= t.targetMileage) return true;
      if (t.targetDate && new Date(t.targetDate).getTime() < Date.now()) return true;
      return false;
    });
  }, [tasks, currentMileage]);

  // 2. Evaluate Urgent Tasks (due soon)
  const urgentTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.status !== 'pending') return false;
      if (t.type === 'mileage' && t.targetMileage) {
        const diff = t.targetMileage - currentMileage;
        return diff > 0 && diff <= 1000;
      }
      if (t.targetDate) {
        const diffDays = Math.ceil((new Date(t.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 14;
      }
      return false;
    });
  }, [tasks, currentMileage]);

  // 3. Evaluate Recent Maintenance
  const lastRecord = records.length > 0 ? records[0] : null;
  const kmSinceLastService = lastRecord && lastRecord.mileage ? Math.max(0, currentMileage - lastRecord.mileage) : null;

  // 4. Determine Health State
  let status: HealthState = 'NORMAL';
  let primaryReason = 'Автомобиль обслужен и готов к поездкам';
  let subReason = 'Просроченных регламентных работ в плане обслуживания нет';

  if (overdueTasks.length > 0) {
    const topOverdue = overdueTasks[0];
    const isCriticalOverdue = topOverdue.type === 'mileage' && topOverdue.targetMileage 
      ? (currentMileage - topOverdue.targetMileage) > 2000
      : false;

    status = isCriticalOverdue ? 'CRITICAL' : 'WARNING';
    const overdueBy = topOverdue.type === 'mileage' && topOverdue.targetMileage 
      ? `${(currentMileage - topOverdue.targetMileage).toLocaleString('ru-RU')} км назад` 
      : 'срок истек';
    primaryReason = `Просрочено ТО: ${topOverdue.title}`;
    subReason = `Превышение регламента: ${overdueBy} (${overdueTasks.length} ${overdueTasks.length === 1 ? 'задача требует внимания' : 'задач требуют внимания'})`;
  } else if (urgentTasks.length > 0) {
    status = 'WARNING';
    const topUrgent = urgentTasks[0];
    const leftStr = topUrgent.type === 'mileage' && topUrgent.targetMileage
      ? `осталось ${(topUrgent.targetMileage - currentMileage).toLocaleString('ru-RU')} км`
      : 'срок в ближайшие дни';
    primaryReason = `Приближается обслуживание: ${topUrgent.title}`;
    subReason = `Регламентное ТО (${leftStr})`;
  } else if (kmSinceLastService !== null && kmSinceLastService > 10000) {
    status = 'WARNING';
    primaryReason = `С последнего ТО прошло ${kmSinceLastService.toLocaleString('ru-RU')} км`;
    subReason = 'Рекомендуется проверить уровень масла и запланировать замену расходников';
  }

  const handleCtaClick = () => {
    if ('vibrate' in navigator) navigator.vibrate(15);
    onNavigateToTasks();
  };

  return (
    <section 
      className={`rounded-lg p-3 sm:p-3.5 border transition-colors font-sans relative overflow-hidden ${
        status === 'CRITICAL'
          ? 'bg-[#1C1217] border-[#EF4444]/60 text-slate-100'
          : status === 'WARNING'
          ? 'bg-[#1D170E] border-[#F59E0B]/60 text-slate-100'
          : 'bg-[#0E1B19] border-[#10B981]/50 text-slate-100'
      }`}
      aria-label="Состояние автомобиля"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        
        {/* Left icon and text */}
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
            status === 'CRITICAL'
              ? 'bg-[#EF4444]/20 border-[#EF4444]/50 text-[#EF4444]'
              : status === 'WARNING'
              ? 'bg-[#F59E0B]/20 border-[#F59E0B]/50 text-[#F59E0B]'
              : 'bg-[#10B981]/20 border-[#10B981]/50 text-[#10B981]'
          }`}>
            {status === 'CRITICAL' ? (
              <AlertTriangle className="w-4 h-4 text-[#EF4444] animate-pulse" />
            ) : status === 'WARNING' ? (
              <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border ${
                status === 'CRITICAL'
                  ? 'bg-[#EF4444]/20 border-[#EF4444]/40 text-[#EF4444]'
                  : status === 'WARNING'
                  ? 'bg-[#F59E0B]/20 border-[#F59E0B]/40 text-[#F59E0B]'
                  : 'bg-[#10B981]/20 border-[#10B981]/40 text-[#10B981]'
              }`}>
                {status === 'CRITICAL' ? 'ТРЕБУЕТСЯ ТО' : status === 'WARNING' ? 'ТРЕБУЕТ ВНИМАНИЯ' : 'МАШИНА В ПОРЯДКЕ'}
              </span>
            </div>

            <h3 className="text-xs sm:text-sm font-bold text-white mt-1 leading-snug truncate">
              {primaryReason}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
              {subReason}
            </p>
          </div>
        </div>

        {/* Right CTA Buttons */}
        <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if ('vibrate' in navigator) navigator.vibrate(15);
              onNavigateToRagWithQuestion('Что мне сейчас делать с машиной? Оцени текущий статус и дай совет.');
            }}
            className="h-9 px-3 bg-[#131D33] hover:bg-[#1E293B] border border-[#1E293B] text-[#06B6D4] text-xs font-semibold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5 shrink-0"
            id="btn-health-ask-vasilich"
          >
            <Bot className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Спросить Василича</span>
          </button>

          <button
            type="button"
            onClick={handleCtaClick}
            className={`w-full sm:w-auto h-9 px-3.5 rounded-lg text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              status === 'CRITICAL'
                ? 'bg-[#EF4444] hover:bg-[#DC2626] text-white'
                : status === 'WARNING'
                ? 'bg-[#F59E0B] hover:bg-[#D97706] text-[#080B11]'
                : 'bg-[#10B981] hover:bg-[#059669] text-[#080B11]'
            }`}
            id="btn-health-open-tasks"
          >
            <span>{overdueTasks.length > 0 || urgentTasks.length > 0 ? 'ПЛАН ТО' : 'ЖУРНАЛ ТО'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </section>
  );
}
