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
  ZoomIn
} from 'lucide-react';
import { VehicleTask, TaskType, TaskStatus } from '../types';
import { EditTaskModal } from './EditTaskModal';

interface VehicleTasksProps {
  activeCarId: string;
  activeCarMileage: number;
  tasks: VehicleTask[];
  onAddTask: (newTaskData: { title: string; type: TaskType; targetMileage?: number; targetDate?: string }) => void;
  onUpdateTask?: (task: VehicleTask) => void;
  onMarkTaskCompleted: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export function VehicleTasks({
  activeCarId,
  activeCarMileage,
  tasks,
  onAddTask,
  onUpdateTask,
  onMarkTaskCompleted,
  onDeleteTask,
}: VehicleTasksProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'completed' | 'all'>('pending');
  const [editingTask, setEditingTask] = useState<VehicleTask | null>(null);
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
    <div className="space-y-4 font-sans">
      {/* 1. HEADER & CONTROLS */}
      <div className="bg-[#10151E] border border-[#1E2638] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 shadow-sm">
        <div>
          <span className="text-[10px] text-cyan-400 font-mono tracking-wider uppercase block mb-0.5">
            ПЛАНИРОВАНИЕ ТО
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-cyan-400" />
            <span>План обслуживания и задачи</span>
          </h2>
        </div>

        {!showAddForm && (
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(15);
              setShowAddForm(true);
            }}
            className="btn-primary min-h-[40px] px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto shadow-sm"
            id="btn-show-add-task"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить задачу</span>
          </button>
        )}
      </div>

      {/* 2. ADD TASK MODAL/FORM */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300 ease-out">
          <form 
            onSubmit={handleSubmit} 
            className="w-full md:max-w-xl bg-[#10151E] border-t md:border border-[#1E2638] rounded-t-2xl md:rounded-2xl shadow-2xl p-4 sm:p-6 pb-28 md:pb-6 relative space-y-4 max-h-[calc(100vh-70px)] md:max-h-[90vh] overflow-y-auto"
          >
            <div className="w-12 h-1 bg-[#1E2638] rounded-full mx-auto mb-4 md:hidden" />

            <button
              type="button"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                setShowAddForm(false);
              }}
              className="absolute top-3 right-3 md:top-4 md:right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-[#151B25] transition-colors cursor-pointer z-20"
              title="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#1E2638] pb-3">
              <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider block">Планирование</span>
              <h3 className="text-lg font-bold text-white">Новая сервисная задача</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Название задачи / Вид ТО *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Замена масла, купить колодки, проверить ГРМ..."
                  className="w-full border border-[#1E2638] bg-[#151B25] p-3 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  id="task-title-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Тип контроля выполнения
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(15);
                      setType('simple');
                    }}
                    className={`py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      type === 'simple'
                        ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                        : 'border-[#1E2638] bg-[#151B25] text-slate-400 hover:text-slate-200'
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
                    className={`py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      type === 'mileage'
                        ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                        : 'border-[#1E2638] bg-[#151B25] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    По пробегу (ТО)
                  </button>
                </div>
              </div>

              {type === 'simple' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-cyan-400" /> Срок выполнения (необязательно)
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full border border-[#1E2638] bg-[#151B25] p-3 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                    <Gauge className="w-4 h-4 text-cyan-400" /> Целевой пробег автомобиля (км) *
                  </label>
                  <input
                    type="number"
                    required
                    min={activeCarMileage}
                    value={targetMileage}
                    onChange={(e) => setTargetMileage(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={`Например: ${activeCarMileage + 10000}`}
                    className="w-full border border-[#1E2638] bg-[#151B25] p-3 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                    Текущий пробег автомобиля: {activeCarMileage.toLocaleString()} км
                  </span>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-[#10151E] pt-3 pb-3 md:pb-0 -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-[#1E2638] flex flex-col sm:flex-row justify-end gap-3 z-10">
              <button
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(15);
                  setShowAddForm(false);
                }}
                className="btn-secondary min-h-[42px] px-4 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(15);
                }}
                className="btn-primary min-h-[42px] px-6 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Сохранить задачу
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. TASK FILTER TABS */}
      <div className="flex border-b border-[#1E2638] text-xs gap-6 pb-2">
        <button
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(15);
            setFilter('pending');
          }}
          className={`pb-2 px-1 relative transition-all cursor-pointer font-semibold ${
            filter === 'pending' ? 'text-cyan-300' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Активные ({activeCarTasks.filter(t => t.status === 'pending').length})
          {filter === 'pending' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full"></span>}
        </button>
        <button
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(15);
            setFilter('completed');
          }}
          className={`pb-2 px-1 relative transition-all cursor-pointer font-semibold ${
            filter === 'completed' ? 'text-cyan-300' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Выполненные ({activeCarTasks.filter(t => t.status === 'completed').length})
          {filter === 'completed' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full"></span>}
        </button>
        <button
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(15);
            setFilter('all');
          }}
          className={`pb-2 px-1 relative transition-all cursor-pointer font-semibold ${
            filter === 'all' ? 'text-cyan-300' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Все ({activeCarTasks.length})
          {filter === 'all' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full"></span>}
        </button>
      </div>

      {/* 4. TASKS LIST */}
      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const isOverdue = 
              task.status === 'pending' && 
              task.type === 'mileage' && 
              task.targetMileage !== undefined && 
              activeCarMileage >= task.targetMileage;

            const hasPhotos = task.photos && task.photos.length > 0;

            return (
              <div 
                key={task.id}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(15);
                  setEditingTask(task);
                }}
                className={`bg-[#10151E] border p-4 sm:p-5 relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all cursor-pointer group rounded-2xl ${
                  isOverdue 
                    ? 'border-rose-500/60 bg-rose-950/20' 
                    : task.status === 'completed'
                    ? 'border-[#1E2638] bg-[#10151E]/60 opacity-75 hover:opacity-100'
                    : 'border-[#1E2638] hover:border-cyan-500/50 hover:bg-[#151B25]'
                }`}
              >
                {/* Left side: details */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {task.type === 'mileage' ? (
                      <span className="text-[10px] font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-2.5 py-0.5 rounded-lg tracking-wide">
                        По пробегу (ТО)
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold bg-[#151B25] border border-[#1E2638] text-slate-300 px-2.5 py-0.5 rounded-lg">
                        Обычная
                      </span>
                    )}

                    {task.relatedDtc && (
                      <span className="text-[10px] font-mono font-bold bg-rose-950/90 border border-rose-500/50 text-rose-300 px-2 py-0.5 rounded-lg">
                        DTC: {task.relatedDtc}
                      </span>
                    )}

                    {task.relatedPartIds && task.relatedPartIds.length > 0 && (
                      <span className="text-[10px] font-semibold bg-amber-950/80 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-lg">
                        Резерв деталей: {task.relatedPartIds.length} шт
                      </span>
                    )}

                    {isOverdue && (
                      <span className="text-[10px] font-bold bg-rose-950 border border-rose-500/50 text-rose-300 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                        Требуется обслуживание!
                      </span>
                    )}

                    {task.status === 'completed' && (
                      <span className="text-[10px] font-bold bg-emerald-950 border border-emerald-500/50 text-emerald-300 px-2.5 py-0.5 rounded-lg">
                        Выполнено
                      </span>
                    )}

                    {/* Camera / Photo badge indicator */}
                    {hasPhotos && (
                      <span className="text-[10px] font-medium bg-[#151B25] text-cyan-300 px-2 py-0.5 rounded-lg flex items-center gap-1 border border-[#1E2638]">
                        <Camera className="w-3 h-3 text-cyan-400" />
                        {task.photos!.length} фото
                      </span>
                    )}
                  </div>

                  <h3 className={`text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
                    {task.title}
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                    {task.type === 'mileage' && task.targetMileage !== undefined && (
                      <span className="flex items-center gap-1 font-mono">
                        <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                        Цель: {task.targetMileage.toLocaleString()} км 
                        <span className="text-slate-500">
                          (осталось: {(task.targetMileage - activeCarMileage).toLocaleString()} км)
                        </span>
                      </span>
                    )}
                    {task.type === 'simple' && task.targetDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        Срок: {new Date(task.targetDate).toLocaleDateString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                      <Clock className="w-3 h-3" />
                      Создана: {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Photo Thumbnails strip on card */}
                  {hasPhotos && (
                    <div className="flex items-center gap-2 pt-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                      {task.photos!.slice(0, 4).map((photo, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (navigator.vibrate) navigator.vibrate(10);
                            setSelectedPhotoUrl(photo);
                          }}
                          className="w-10 h-10 border border-[#1E2638] hover:border-cyan-400 rounded-lg overflow-hidden bg-[#151B25] cursor-pointer relative group/thumb transition-all"
                          title="Нажмите для полноэкранного просмотра фото"
                        >
                          <img src={photo} alt={`Миниатюра ${pIdx + 1}`} className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                            <ZoomIn className="w-3.5 h-3.5 text-cyan-200" />
                          </div>
                        </div>
                      ))}
                      {task.photos!.length > 4 && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTask(task);
                          }}
                          className="w-10 h-10 border border-[#1E2638] bg-[#151B25] rounded-lg flex items-center justify-center text-xs text-cyan-300 font-bold cursor-pointer hover:border-cyan-400"
                        >
                          +{task.photos!.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right side: Actions */}
                <div 
                  className="flex items-center gap-2 self-stretch md:self-auto justify-end border-t md:border-t-0 border-[#1E2638] pt-3 md:pt-0 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (navigator.vibrate) navigator.vibrate(15);
                      setEditingTask(task);
                    }}
                    className="p-2 border border-[#1E2638] hover:border-cyan-400 bg-[#151B25] hover:bg-[#1B2431] text-slate-300 hover:text-white rounded-xl cursor-pointer shrink-0 transition-all flex items-center gap-1 text-xs font-semibold"
                    title="Редактировать задачу и прикрепить фото"
                    id={`btn-edit-task-${task.id}`}
                  >
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">Редактировать</span>
                  </button>

                  {task.status === 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (navigator.vibrate) navigator.vibrate(15);
                        onMarkTaskCompleted(task.id);
                      }}
                      className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                        isOverdue
                          ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-md shadow-rose-600/30'
                          : 'btn-primary'
                      }`}
                      id={`btn-complete-task-${task.id}`}
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      Отметить выполненной
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (navigator.vibrate) navigator.vibrate(15);
                      onDeleteTask(task.id);
                    }}
                    className="p-2 border border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-950/30 text-rose-400 rounded-xl cursor-pointer shrink-0 transition-colors"
                    title="Удалить задачу"
                    id={`btn-del-task-${task.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-[#10151E] border border-dashed border-[#1E2638] p-12 text-center rounded-2xl">
            <CheckSquare className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-300 mb-1">
              {filter === 'pending' ? 'Нет активных задач' : filter === 'completed' ? 'Нет выполненных задач' : 'Список задач пуст'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {filter === 'pending' 
                ? 'Все задачи выполнены! Вы можете запланировать новое техобслуживание или замену деталей.'
                : 'Пока нет записей в этом фильтре.'}
            </p>
          </div>
        )}
      </div>

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
          className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedPhotoUrl(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs text-cyan-300 font-semibold flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                Просмотр фотоотчета ремонта
              </span>
              <button
                type="button"
                onClick={() => setSelectedPhotoUrl(null)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <img
              src={selectedPhotoUrl}
              alt="Просмотр фотоотчета"
              className="max-h-[75vh] w-auto max-w-full object-contain mx-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
