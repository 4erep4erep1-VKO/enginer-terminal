/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Car, MaintenanceRecord, VehicleTask, TaskType } from '../types';
import { ServiceHistory } from './ServiceHistory';
import { VehicleTasks } from './VehicleTasks';
import { ClipboardList, CheckSquare, History, Plus } from 'lucide-react';

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
  onDeleteTask: (taskId: string) => void;
  initialSubTab?: 'plan' | 'history';
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
  onDeleteTask,
  initialSubTab = 'history',
}: ServiceHubProps) {
  const [subTab, setSubTab] = useState<'plan' | 'history'>(initialSubTab);

  const activeCarTasks = tasks.filter(t => t.carId === activeCar?.id && t.status === 'pending');
  const activeCarRecords = records.filter(r => r.carId === activeCar?.id);

  return (
    <div className="space-y-4 font-sans">
      
      {/* Top Segmented Switch: [ ПЛАН ] [ ИСТОРИЯ ] */}
      <div className="flex items-center justify-between bg-[#10151E] border border-[#1E2638] p-1.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-1.5 w-full">
          {/* ПЛАН */}
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              setSubTab('plan');
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              subTab === 'plan'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#151B25]'
            }`}
            id="subtab-service-plan"
          >
            <CheckSquare className="w-4 h-4" />
            <span>План обслуживания</span>
            {activeCarTasks.length > 0 && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                subTab === 'plan' ? 'bg-slate-950 text-cyan-300' : 'bg-[#151B25] text-cyan-400 border border-[#1E2638]'
              }`}>
                {activeCarTasks.length}
              </span>
            )}
          </button>

          {/* ИСТОРИЯ */}
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              setSubTab('history');
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              subTab === 'history'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#151B25]'
            }`}
            id="subtab-service-history"
          >
            <History className="w-4 h-4" />
            <span>История ТО</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
              subTab === 'history' ? 'bg-slate-950 text-cyan-300' : 'bg-[#151B25] text-slate-300 border border-[#1E2638]'
            }`}>
              {activeCarRecords.length}
            </span>
          </button>
        </div>
      </div>

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
          />
        ) : (
          <div className="bento-card p-6 text-center text-slate-400 text-xs">
            Выберите автомобиль для просмотра задач ТО.
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
