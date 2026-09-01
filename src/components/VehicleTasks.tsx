/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  Gauge, 
  Clock, 
  AlertOctagon, 
  Trash2, 
  Check, 
  X,
  Edit3,
  Camera,
  ZoomIn,
  AlertTriangle
} from 'lucide-react';
import { VehicleTask, TaskType, TaskStatus } from '../types';
import { calculateTaskUrgency } from '../lib/taskUrgency';
import { EditTaskModal } from './EditTaskModal';
import { CompleteTaskModal } from './CompleteTaskModal';

interface VehicleTasksProps {
  activeCarId: string;
  activeCarMileage: number;
  tasks: VehicleTask[];
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
}

export function VehicleTasks({
  activeCarId,
  activeCarMileage,
  tasks,
  onAddTask,
  onUpdateTask,
  onMarkTaskCompleted,
  onCompleteTaskWithDetails,
  onDeleteTask,
}: VehicleTasksProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'completed' | 'all'>('pending');
  const [editingTask, setEditingTask] = useState<VehicleTask | null>(null);
  const [completingTask, setCompletingTask] = useState<VehicleTask | null>(null);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TaskType>('simple');
  const [targetMileage, setTargetMileage] = useState<number | ''>('');
  const [targetDate, setTargetDate] = useState('');

  const activeCarTasks = tasks.filter(t => t.carId === activeCarId);

  const filteredTasks = activeCarTasks.filter(t => {
    if (filter === 'pending') return t.status === 'pending';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      type,
      targetMileage: type === 'mileage' && targetMileage !== '' ? Number(targetMileage) : undefined,
      targetDate: type === 'simple' && targetDate ? targetDate : undefined,
    });

    // Reset Form
    setTitle('');
    setType('simple');
    setTargetMileage('');
    setTargetDate('');
    setShowAddForm(false);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  return (
    <div className="space-y-3.5 font-sans">
      {/* 1. HEADER & CONTROLS */}
      <div className="bg-[#111622] border border-[#1E273D] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-[#06B6D4]" />
            <span>План обслуживания</span>
          </h2>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Запланированные работы, регламентные ТО и замена расходников
          </span>
        </div>

        {!showAddForm && (
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(15);
              setShowAddForm(true);
            }}
            className="btn-primary text-xs flex items-center justify-center gap-1.5 rounded-xl w-full sm:w-auto shadow-sm"
            id="btn-show-add-task"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить задачу</span>
          </button>
        )}
      </div>

      {/* 2. ADD TASK MODAL/FORM */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-950/80 backdrop-blur-sm transition-all">
          <form 
            onSubmit={handleSubmit} 
            className="w-full md:max-w-lg bg-[#111622] border-t md:border border-[#1E273D] rounded-t-2xl md:rounded-2xl shadow-2xl p-4 sm:p-5 pb-24 md:pb-5 relative space-y-3.5 max-h-[calc(100vh-70px)] md:max-h-[90vh] overflow-y-auto"
          >
            <div className="w-10 h-1 bg-[#1E273D] rounded-full mx-auto mb-3 md:hidden" />

            <button
              type="button"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                setShowAddForm(false);
              }}
              className="absolute top-3 right-3 md:top-4 md:right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#151C2C] transition-colors cursor-pointer z-20"
              title="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-[#1E273D] pb-2.5">
              <h3 className="text-sm sm:text-base font-bold text-white">Новая задача ТО</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Название задачи / Вид ТО *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Замена масла, купить колодки, проверить ремень..."
                  className="w-full border border-[#1E273D] bg-[#151C2C] p-2.5 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  id="task-title-input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Условие напоминания
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(15);
                      setType('simple');
                    }}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                      type === 'simple'
                        ? 'bg-[#151C2C] border-cyan-500/50 text-[#06B6D4]'
                        : 'border-[#1E273D] bg-[#0B0E14] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Обычная задача
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(15);
                      setType('mileage');
                    }}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                      type === 'mileage'
                        ? 'bg-[#151C2C] border-cyan-500/50 text-[#06B6D4]'
                        : 'border-[#1E273D] bg-[#0B0E14] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    По пробегу (ТО)
                  </button>
                </div>
              </div>

              {type === 'simple' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#06B6D4]" /> Срок выполнения (необязательно)
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full border border-[#1E273D] bg-[#151C2C] p-2.5 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-[#06B6D4]" /> Целевой пробег автомобиля (км) *
                  </label>
                  <input
                    type="number"
                    required
                    min={activeCarMileage}
                    value={targetMileage}
                    onChange={(e) => setTargetMileage(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={`Например: ${activeCarMileage + 10000}`}
                    className="w-full border border-[#1E273D] bg-[#151C2C] p-2.5 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                    Текущий пробег: {activeCarMileage.toLocaleString()} км
                  </span>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-[#111622] pt-3 pb-2 md:pb-0 -mx-4 sm:-mx-5 px-4 sm:px-5 border-t border-[#1E273D] flex flex-col sm:flex-row justify-end gap-2 z-10">
              <button
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(15);
                  setShowAddForm(false);
                }}
                className="btn-secondary text-xs rounded-xl cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(15);
                }}
                className="btn-primary text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Сохранить
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. TASK FILTER TABS */}
      <div className="flex border-b border-[#1E273D] text-xs gap-4 pb-1">
        <button
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(15);
            setFilter('pending');
          }}
          className={`pb-2 px-1 relative transition-all cursor-pointer font-medium ${
            filter === 'pending' ? 'text-[#06B6D4]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Активные ({activeCarTasks.filter(t => t.status === 'pending').length})
          {filter === 'pending' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#06B6D4] rounded-full"></span>}
        </button>
        <button
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(15);
            setFilter('completed');
          }}
          className={`pb-2 px-1 relative transition-all cursor-pointer font-medium ${
            filter === 'completed' ? 'text-[#06B6D4]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Выполненные ({activeCarTasks.filter(t => t.status === 'completed').length})
          {filter === 'completed' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#06B6D4] rounded-full"></span>}
        </button>
        <button
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(15);
            setFilter('all');
          }}
          className={`pb-2 px-1 relative transition-all cursor-pointer font-medium ${
            filter === 'all' ? 'text-[#06B6D4]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Все ({activeCarTasks.length})
          {filter === 'all' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#06B6D4] rounded-full"></span>}
        </button>
      </div>

      {/* 4. TASKS LIST */}
      <div className="space-y-2.5">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const urgencyCalc = calculateTaskUrgency(task, activeCarMileage);
            const isOverdue = urgencyCalc.isOverdue;
            const isWarning = urgencyCalc.isWarning;
            const hasPhotos = task.photos && task.photos.length > 0;

            return (
              <div 
                key={task.id}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(15);
                  setEditingTask(task);
                }}
                className={`bg-[#111622] border p-3.5 sm:p-4 relative flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-all cursor-pointer group rounded-2xl ${
                  isOverdue 
                    ? 'border-rose-500/50 bg-rose-950/20 shadow-sm shadow-rose-950/40' 
                    : isWarning
                    ? 'border-amber-500/50 bg-amber-950/15 shadow-sm shadow-amber-950/30'
                    : task.status === 'completed'
                    ? 'border-[#1E273D] opacity-60 hover:opacity-90'
                    : 'border-[#1E273D] hover:border-cyan-500/30 hover:bg-[#151C2C]'
                }`}
              >
                {/* Left side: details */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {task.type === 'mileage' ? (
                      <span className="text-[10px] bg-cyan-500/10 border border-cyan-500/25 text-[#06B6D4] px-2 py-0.5 rounded-md">
                        По пробегу
                      </span>
                    ) : (
                      <span className="text-[10px] bg-[#151C2C] border border-[#1E273D] text-slate-300 px-2 py-0.5 rounded-md">
                        Обычная
                      </span>
                    )}

                    {task.relatedDtc && (
                      <span className="text-[10px] font-mono bg-rose-950/80 border border-rose-500/40 text-rose-300 px-1.5 py-0.5 rounded-md">
                        DTC: {task.relatedDtc}
                      </span>
                    )}

                    {task.relatedPartIds && task.relatedPartIds.length > 0 && (
                      <span className="text-[10px] bg-amber-950/80 border border-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded-md">
                        Запчасти: {task.relatedPartIds.length}
                      </span>
                    )}

                    {isOverdue && (
                      <span className="text-[10px] font-semibold bg-rose-950/90 border border-rose-500/50 text-rose-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3 text-rose-400" />
                        {urgencyCalc.statusText || 'Просрочено'}
                      </span>
                    )}

                    {isWarning && (
                      <span className="text-[10px] font-semibold bg-amber-950/90 border border-amber-500/50 text-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        {urgencyCalc.statusText || 'Подходит срок'}
                      </span>
                    )}

                    {task.status === 'completed' && (
                      <span className="text-[10px] font-semibold bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-md">
                        Выполнено
                      </span>
                    )}

                    {hasPhotos && (
                      <span className="text-[10px] bg-[#151C2C] text-[#06B6D4] px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-[#1E273D]">
                        <Camera className="w-3 h-3" />
                        {task.photos!.length} фото
                      </span>
                    )}
                  </div>

                  <h3 className={`text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
                    {task.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    {task.type === 'mileage' && task.targetMileage !== undefined && (
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Gauge className="w-3 h-3 text-[#06B6D4]" />
                        Цель: {task.targetMileage.toLocaleString()} км 
                        <span className={isOverdue ? 'text-rose-400 font-semibold' : isWarning ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                          {task.targetMileage - activeCarMileage <= 0 
                            ? `(просрочено на ${(activeCarMileage - task.targetMileage).toLocaleString()} км)`
                            : `(осталось ${(task.targetMileage - activeCarMileage).toLocaleString()} км)`}
                        </span>
                      </span>
                    )}
                    {task.type === 'simple' && task.targetDate && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-[#06B6D4]" />
                        Срок: {new Date(task.targetDate).toLocaleDateString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-slate-500 text-[10px]">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Photo Thumbnails strip on card */}
                  {hasPhotos && (
                    <div className="flex items-center gap-1.5 pt-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
                      {task.photos!.slice(0, 4).map((photo, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (navigator.vibrate) navigator.vibrate(10);
                            setSelectedPhotoUrl(photo);
                          }}
                          className="w-8 h-8 border border-[#1E273D] hover:border-cyan-400 rounded-lg overflow-hidden bg-[#0B0E14] cursor-pointer relative group/thumb transition-all"
                          title="Нажмите для просмотра"
                        >
                          <img src={photo} alt={`Миниатюра ${pIdx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {task.photos!.length > 4 && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTask(task);
                          }}
                          className="w-8 h-8 border border-[#1E273D] bg-[#151C2C] rounded-lg flex items-center justify-center text-[10px] text-cyan-300 font-bold cursor-pointer"
                        >
                          +{task.photos!.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right side: Actions */}
                <div 
                  className="flex items-center gap-1.5 self-stretch md:self-auto justify-end border-t md:border-t-0 border-[#1E273D] pt-2 md:pt-0 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (navigator.vibrate) navigator.vibrate(15);
                      setEditingTask(task);
                    }}
                    className="p-1.5 border border-[#1E273D] hover:border-cyan-400 bg-[#151C2C] text-slate-300 hover:text-white rounded-lg cursor-pointer shrink-0 transition-colors flex items-center gap-1 text-xs"
                    title="Редактировать"
                    id={`btn-edit-task-${task.id}`}
                  >
                    <Edit3 className="w-3 h-3 text-[#06B6D4]" />
                    <span className="hidden sm:inline">Ред.</span>
                  </button>

                  {task.status === 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (navigator.vibrate) navigator.vibrate(15);
                        setCompletingTask(task);
                      }}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                        isOverdue
                          ? 'bg-rose-600 text-white hover:bg-rose-500'
                          : 'btn-primary text-xs'
                      }`}
                      id={`btn-complete-task-${task.id}`}
                    >
                      <CheckSquare className="w-3 h-3" />
                      <span>Выполнено</span>
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (navigator.vibrate) navigator.vibrate(15);
                      onDeleteTask(task.id);
                    }}
                    className="p-1.5 border border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-950/30 text-rose-400 rounded-lg cursor-pointer shrink-0 transition-colors"
                    title="Удалить задачу"
                    id={`btn-del-task-${task.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-[#111622] border border-dashed border-[#1E273D] p-8 text-center rounded-2xl">
            <CheckSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h4 className="text-xs sm:text-sm font-semibold text-slate-300 mb-0.5">
              {filter === 'pending' ? 'Нет активных задач' : filter === 'completed' ? 'Нет выполненных задач' : 'Список задач пуст'}
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {filter === 'pending' 
                ? 'Все запланированные работы выполнены.'
                : 'Задачи в данном разделе отсутствуют.'}
            </p>
          </div>
        )}
      </div>

      {/* Complete Task & Save to History Modal */}
      <CompleteTaskModal
        isOpen={!!completingTask}
        task={completingTask}
        currentCarMileage={activeCarMileage}
        onClose={() => setCompletingTask(null)}
        onConfirmComplete={(params) => {
          if (onCompleteTaskWithDetails) {
            onCompleteTaskWithDetails(params);
          } else {
            onMarkTaskCompleted(params.taskId);
          }
          setCompletingTask(null);
        }}
      />

      {/* Edit Task & Photo Upload Modal */}
      <EditTaskModal
        isOpen={!!editingTask}
        task={editingTask}
        activeCarMileage={activeCarMileage}
        onClose={() => setEditingTask(null)}
        onSave={(updated) => {
          if (onUpdateTask) {
            onUpdateTask(updated);
          }
          setEditingTask(null);
        }}
      />

      {/* Fullscreen Photo Lightbox from Card Click */}
      {selectedPhotoUrl && (
        <div 
          className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhotoUrl(null)}
        >
          <div 
            className="relative max-w-3xl max-h-[90vh] bg-[#111622] border border-[#1E273D] rounded-2xl p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#1E273D] mb-2">
              <span className="text-xs text-[#06B6D4] font-medium flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                Фотоотчет
              </span>
              <button
                type="button"
                onClick={() => setSelectedPhotoUrl(null)}
                className="p-1 text-slate-400 hover:text-white bg-[#151C2C] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <img
              src={selectedPhotoUrl}
              alt="Просмотр фото"
              className="max-h-[70vh] w-auto max-w-full object-contain mx-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
