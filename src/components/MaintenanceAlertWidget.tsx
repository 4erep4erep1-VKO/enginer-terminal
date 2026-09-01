/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertOctagon, AlertTriangle, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { VehicleTask } from '../types';
import { calculateTaskUrgency } from '../lib/taskUrgency';

interface MaintenanceAlertWidgetProps {
  tasks: VehicleTask[];
  currentMileage: number;
  onNavigateToPlan?: () => void;
  onQuickCompleteTask?: (taskId: string) => void;
}

export function MaintenanceAlertWidget({
  tasks,
  currentMileage,
  onNavigateToPlan,
  onQuickCompleteTask,
}: MaintenanceAlertWidgetProps) {
  const pendingTasks = tasks.filter(t => t.status === 'pending');

  const evaluated = pendingTasks
    .map(t => ({
      task: t,
      calc: calculateTaskUrgency(t, currentMileage)
    }))
    .filter(item => item.calc.urgency === 'overdue' || item.calc.urgency === 'warning')
    .sort((a, b) => {
      // Prioritize overdue over warning
      if (a.calc.urgency === 'overdue' && b.calc.urgency !== 'overdue') return -1;
      if (a.calc.urgency !== 'overdue' && b.calc.urgency === 'overdue') return 1;
      // Then by remaining km (ascending)
      const aKm = a.calc.remainingKm ?? 999999;
      const bKm = b.calc.remainingKm ?? 999999;
      return aKm - bKm;
    });

  const overdueCount = evaluated.filter(e => e.calc.urgency === 'overdue').length;
  const warningCount = evaluated.filter(e => e.calc.urgency === 'warning').length;

  if (evaluated.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#111622] border border-[#1E273D] rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {overdueCount > 0 ? (
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertOctagon className="w-3.5 h-3.5 animate-pulse" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          )}
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Требуют внимания</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-[#1E273D] text-cyan-300">
                {evaluated.length}
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">
              {overdueCount > 0 
                ? `Просрочено: ${overdueCount} ${overdueCount === 1 ? 'задача' : 'задачи'}${warningCount > 0 ? `, подходит срок: ${warningCount}` : ''}`
                : `Подходит срок ТО у ${warningCount} ${warningCount === 1 ? 'задачи' : 'задач'}`}
            </p>
          </div>
        </div>

        {onNavigateToPlan && (
          <button
            type="button"
            onClick={onNavigateToPlan}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>В план ТО</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Urgent items list (max 3 displayed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {evaluated.slice(0, 3).map(({ task, calc }) => {
          const isOverdue = calc.urgency === 'overdue';
          return (
            <div
              key={task.id}
              className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                isOverdue
                  ? 'bg-rose-950/20 border-rose-500/30 text-rose-100'
                  : 'bg-amber-950/20 border-amber-500/30 text-amber-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      isOverdue
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {isOverdue ? 'Просрочено' : 'Срочно'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {calc.statusText}
                  </span>
                </div>
                <div className="text-xs font-semibold line-clamp-1 text-white">
                  {task.title}
                </div>
              </div>

              {onQuickCompleteTask && (
                <div className="mt-2 pt-1.5 border-t border-white/5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onQuickCompleteTask(task.id)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                      isOverdue
                        ? 'bg-rose-600/80 hover:bg-rose-600 text-white'
                        : 'bg-amber-600/80 hover:bg-amber-600 text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Выполнить</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
