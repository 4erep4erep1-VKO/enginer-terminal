/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Car, MaintenanceRecord, VehicleTask, TaskType } from '../types';
import { ServiceHistory } from './ServiceHistory';
import { VehicleTasks } from './VehicleTasks';
import { MaintenanceAlertWidget } from './MaintenanceAlertWidget';
import { calculateTaskUrgency } from '../lib/taskUrgency';
import { FluidHealthWidget } from './FluidHealthWidget';
import { ClipboardList, CheckSquare, History, Plus, AlertTriangle } from 'lucide-react';

interface ServiceHubProps {
  activeCar: Car | null;
  records: MaintenanceRecord[];
  tasks: VehicleTask[];
  onAddRecord: (record: Omit<MaintenanceRecord, 'createdAt' | 'updatedAt'>) => void;
  onUpdateRecord: (record: MaintenanceRecord) => void;
  onDeleteRecord: (id: string) => void;
  showAddForm: boolean;
  onOpenAddForm: () => void;
  onCloseAddForm: () => void;
  initialRecordValues?: any;
  onClearInitialValues?: () => void;
  onAddTask: (newTaskData: { title: string; type: TaskType; targetMileage?: number; targetDate?: string }) => void;
  onUpdateTask?: (task: VehicleTask) => void;
  onMarkTaskCompleted: (taskId: string) => void;
  onCompleteTaskWithDetails?: (params: {
    taskId: string;
    partsPrice: number;
    laborPrice: number;
    partsUsed: string[];
    mileage: number;
    date: string;
    category: any;
    description: string;
  }) => void;
  onDeleteTask: (taskId: string) => void;
  initialSubTab?: 'plan' | 'history';
  onNavigateToRagWithQuestion?: (question: string) => void;
  onSetInitialRecordValues?: (values: any) => void;
}

export function ServiceHub({
  activeCar,
  records,
  tasks,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  showAddForm,
  onOpenAddForm,
  onCloseAddForm,
  initialRecordValues,
  onClearInitialValues,
  onAddTask,
  onUpdateTask,
  onMarkTaskCompleted,
  onCompleteTaskWithDetails,
  onDeleteTask,
  initialSubTab = 'history',
  onNavigateToRagWithQuestion,
  onSetInitialRecordValues,
}: ServiceHubProps) {
  const [subTab, setSubTab] = useState<'plan' | 'history'>(initialSubTab);

  const activeCarTasks = tasks.filter(t => t.carId === activeCar?.id && t.status === 'pending');
  const activeCarRecords = records.filter(r => r.carId === activeCar?.id);

  // Check urgent tasks count
  const urgentTasksCount = activeCarTasks.filter(t => {
    const calc = calculateTaskUrgency(t, activeCar?.mileage || 0);
    return calc.urgency === 'overdue' || calc.urgency === 'warning';
  }).length;

  return (
    <div className="space-y-3.5 font-sans pb-20">
      
      {/* Top Segmented Switch: [ ПЛАН ] [ ИСТОРИЯ ] */}
      <div className="flex items-center justify-between bg-[#111622] border border-[#1E273D] p-1 rounded-xl shadow-sm">
        <div className="flex items-center gap-1 w-full">
          {/* ПЛАН */}
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              setSubTab('plan');
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              subTab === 'plan'
                ? 'bg-[#151C2C] text-[#06B6D4] border border-[#06B6D4]/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#151C2C]/50 border border-transparent'
            }`}
            id="subtab-service-plan"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>План ТО</span>
            {urgentTasksCount > 0 ? (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                {urgentTasksCount}
              </span>
            ) : activeCarTasks.length > 0 ? (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-medium bg-[#0B0E14] text-[#06B6D4] border border-[#1E273D]">
                {activeCarTasks.length}
              </span>
            ) : null}
          </button>

          {/* ИСТОРИЯ */}
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              setSubTab('history');
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              subTab === 'history'
                ? 'bg-[#151C2C] text-[#06B6D4] border border-[#06B6D4]/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#151C2C]/50 border border-transparent'
            }`}
            id="subtab-service-history"
          >
            <History className="w-3.5 h-3.5" />
            <span>История ТО</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-medium bg-[#0B0E14] text-slate-300 border border-[#1E273D]">
              {activeCarRecords.length}
            </span>
          </button>
        </div>
      </div>

      {/* Maintenance Alerts Widget for current vehicle if any urgent/warning tasks exist */}
      {activeCar && activeCarTasks.length > 0 && (
        <MaintenanceAlertWidget
          tasks={activeCarTasks}
          currentMileage={activeCar.mileage || 0}
          onNavigateToPlan={() => setSubTab('plan')}
          onQuickCompleteTask={(taskId) => {
            if (onMarkTaskCompleted) onMarkTaskCompleted(taskId);
          }}
        />
      )}

      {/* Dual-Limit Fluid Health Tracker */}
      {activeCar && (
        <FluidHealthWidget
          activeCar={activeCar}
          records={records}
          onOpenAddRecord={(initialData) => {
            if (onSetInitialRecordValues && initialData) {
              onSetInitialRecordValues(initialData);
            }
            onOpenAddForm();
          }}
          onNavigateToRagWithQuestion={onNavigateToRagWithQuestion}
        />
      )}

      {/* Sub-view rendering */}
      {subTab === 'plan' ? (
        activeCar ? (
          <VehicleTasks
            activeCarId={activeCar.id}
            activeCarMileage={activeCar.mileage}
            tasks={tasks}
            onAddTask={onAddTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            onMarkTaskCompleted={onMarkTaskCompleted}
            onCompleteTaskWithDetails={onCompleteTaskWithDetails}
          />
        ) : (
          <div className="bg-[#111622] border border-[#1E273D] rounded-2xl p-6 text-center text-slate-400 text-xs">
            Выберите автомобиль для просмотра плана ТО.
          </div>
        )
      ) : (
        <ServiceHistory
          activeCar={activeCar}
          records={records}
          onAddRecord={onAddRecord}
          onUpdateRecord={onUpdateRecord}
          onDeleteRecord={onDeleteRecord}
          showAddForm={showAddForm}
          onOpenAddForm={onOpenAddForm}
          onCloseAddForm={onCloseAddForm}
          initialRecordValues={initialRecordValues}
          onClearInitialValues={onClearInitialValues}
        />
      )}

    </div>
  );
}
