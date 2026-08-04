/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Calendar, 
  Gauge, 
  Plus, 
  Trash2, 
  AlertOctagon, 
  Clock, 
  Check, 
  Compass,
  Play,
  X
} from 'lucide-react';
import { VehicleTask, TaskType } from '../types';

interface VehicleTasksProps {
  activeCarId: string | null;
  activeCarMileage: number;
  tasks: VehicleTask[];
  onAddTask: (task: { title: string; type: TaskType; targetMileage?: number; targetDate?: string }) => void;
  onDeleteTask: (id: string) => void;
  onMarkTaskCompleted: (id: string) => void;
}

export function VehicleTasks({
  activeCarId,
  activeCarMileage,
  tasks,
  onAddTask,
  onDeleteTask,
  onMarkTaskCompleted,
}: VehicleTasksProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TaskType>('simple');
  const [targetMileage, setTargetMileage] = useState<number | ''>('');
  const [targetDate, setTargetDate] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

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
      targetMileage: type === 'mileage' && targetMileage ? Number(targetMileage) : undefined,
      targetDate: type === 'simple' && targetDate ? targetDate : undefined,
    });

    setTitle('');
    setTargetMileage('');
    setTargetDate('');
    setShowAddForm(false);
  };

  if (!activeCarId) {
    return (
      <div className="bento-card border-dashed border-cyan-800/40 p-12 text-center blueprint-corner">
        <Compass className="w-12 h-12 text-blueprint-cyan/30 mx-auto mb-3 animate-pulse" />
        <h4 className="text-xs font-bold text-cyan-200/80 font-mono uppercase mb-1">
          АВТОМОБИЛЬ НЕ ВЫБРАН
        </h4>
        <p className="text-[11px] text-cyan-400/40 font-mono max-w-sm mx-auto">
          Пожалуйста, выберите или добавьте автомобиль в левой панели гаража для просмотра планируемых работ и ТО.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. HUD HEADER */}
      <div className="bento-card p-5 blueprint-corner flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-1 bg-cyan-800/30 text-cyan-400 text-[8px] font-bold uppercase font-mono">ПЛАНИРОВАНИЕ ТО</div>
        <div>
          <span className="text-[9px] text-blueprint-cyan tracking-widest font-mono uppercase block">ЗАДАЧИ И ТЕХОБСЛУЖИВАНИЕ</span>
          <h2 className="text-md font-extrabold text-cyan-100 font-mono uppercase">
            Планируемые работы и напоминания
          </h2>
        </div>
        
        {!showAddForm && (
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(15);
              setShowAddForm(true);
            }}
            className="w-full sm:w-auto justify-center bg-blueprint-cyan text-blueprint-bg font-extrabold font-mono text-xs px-5 py-2 hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center cursor-pointer uppercase"
            id="btn-show-add-task"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            ДОБАВИТЬ ЗАДАЧУ
          </button>
        )}
      </div>

      {/* 2. ADD TASK FORM */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm transition-all duration-300 ease-out">
          <form 
            onSubmit={handleSubmit} 
            className="w-full md:max-w-xl bg-[#050b18] border-t-2 md:border-2 border-blueprint-cyan rounded-t-2xl md:rounded-none shadow-[0_-10px_25px_rgba(0,255,204,0.15)] md:shadow-[0_0_30px_rgba(0,255,204,0.25)] p-6 relative space-y-4 font-mono max-h-[90vh] overflow-y-auto"
          >
            {/* Drag handle for iOS style bottom sheet */}
            <div className="w-12 h-1 bg-cyan-800/40 rounded-full mx-auto mb-4 md:hidden" />

            <button
              type="button"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                setShowAddForm(false);
              }}
              className="absolute top-3 right-3 md:top-4 md:right-4 text-blueprint-cyan hover:text-cyan-400 p-1.5 hover:bg-cyan-950/40 transition-colors cursor-pointer z-20"
              title="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="absolute top-0 right-0 p-1 bg-blueprint-cyan text-[#050a14] text-[8px] font-bold uppercase font-mono hidden md:block">НОВАЯ ЗАДАЧА</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-blueprint-cyan font-mono uppercase mb-1.5">
                  Название задачи / Вид ТО *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Замена масла, купить колодки, проверить ГРМ..."
                  className="w-full border border-cyan-800/40 bg-blueprint-bg/60 p-2.5 text-xs text-cyan-100 font-mono focus:outline-none focus:border-blueprint-cyan focus:shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  id="task-title-input"
                />
              </div>

              <div>
                <label className="block text-[10px] text-blueprint-cyan font-mono uppercase mb-1.5">
                  Тип контроля выполнения
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(15);
                      setType('simple');
                    }}
                    className={`py-2 px-3 text-xs font-mono border transition-all cursor-pointer ${
                      type === 'simple'
                        ? 'bg-blueprint-cyan/15 border-blueprint-cyan text-blueprint-cyan'
                        : 'border-cyan-800/40 text-cyan-200/50 hover:text-cyan-100'
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
                    className={`py-2 px-3 text-xs font-mono border transition-all cursor-pointer ${
                      type === 'mileage'
                        ? 'bg-blueprint-cyan/15 border-blueprint-cyan text-blueprint-cyan'
                        : 'border-cyan-800/40 text-cyan-200/50 hover:text-cyan-100'
                    }`}
                  >
                    По пробегу (ТО)
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {type === 'simple' ? (
                <div>
                  <label className="block text-[10px] text-blueprint-cyan font-mono uppercase mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Срок выполнения (необязательно)
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full border border-cyan-800/40 bg-blueprint-bg/60 p-2 text-xs text-cyan-100 font-mono focus:outline-none focus:border-blueprint-cyan focus:shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] text-blueprint-cyan font-mono uppercase mb-1.5 flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5" /> Целевой пробег автомобиля (км) *
                  </label>
                  <input
                    type="number"
                    required
                    min={activeCarMileage}
                    value={targetMileage}
                    onChange={(e) => setTargetMileage(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={`Например: ${activeCarMileage + 10000}`}
                    className="w-full border border-cyan-800/40 bg-blueprint-bg/60 p-2 text-xs text-cyan-100 font-mono focus:outline-none focus:border-blueprint-cyan focus:shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  />
                  <span className="text-[9px] text-cyan-400/40 font-mono mt-1 block">
                    Текущий пробег автомобиля: {activeCarMileage.toLocaleString()} км
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-cyan-800/20">
              <button
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(15);
                  setShowAddForm(false);
                }}
                className="w-full sm:w-auto justify-center flex border border-cyan-800/40 text-cyan-200/60 hover:text-cyan-100 hover:bg-cyan-950/20 px-5 py-2.5 md:py-2 text-xs font-mono transition-colors cursor-pointer"
              >
                ОТМЕНА
              </button>
              <button
                type="submit"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(15);
                }}
                className="w-full sm:w-auto justify-center flex bg-blueprint-cyan text-blueprint-bg font-bold font-mono tracking-wider text-xs px-6 py-2.5 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all items-center cursor-pointer uppercase"
              >
                <Check className="w-4 h-4 mr-1.5" />
                СОХРАНИТЬ ЗАДАЧУ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. TASK FILTER TABS */}
      <div className="flex border-b border-cyan-800/20 font-mono text-xs gap-4 pb-2">
        <button
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(15);
            setFilter('pending');
          }}
          className={`pb-1 px-1 relative transition-all cursor-pointer ${
            filter === 'pending' ? 'text-blueprint-cyan font-bold' : 'text-cyan-200/40 hover:text-cyan-100'
          }`}
        >
          АКТИВНЫЕ ({activeCarTasks.filter(t => t.status === 'pending').length})
          {filter === 'pending' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blueprint-cyan"></span>}
        </button>
        <button
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(15);
            setFilter('completed');
          }}
          className={`pb-1 px-1 relative transition-all cursor-pointer ${
            filter === 'completed' ? 'text-blueprint-cyan font-bold' : 'text-cyan-200/40 hover:text-cyan-100'
          }`}
        >
          ВЫПОЛНЕННЫЕ ({activeCarTasks.filter(t => t.status === 'completed').length})
          {filter === 'completed' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blueprint-cyan"></span>}
        </button>
        <button
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(15);
            setFilter('all');
          }}
          className={`pb-1 px-1 relative transition-all cursor-pointer ${
            filter === 'all' ? 'text-blueprint-cyan font-bold' : 'text-cyan-200/40 hover:text-cyan-100'
          }`}
        >
          ВСЕ ({activeCarTasks.length})
          {filter === 'all' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blueprint-cyan"></span>}
        </button>
      </div>

      {/* 4. TASKS LIST */}
      <div className="space-y-3.5">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const isOverdue = 
              task.status === 'pending' && 
              task.type === 'mileage' && 
              task.targetMileage !== undefined && 
              activeCarMileage >= task.targetMileage;

            return (
              <div 
                key={task.id} 
                className={`bento-card p-4 blueprint-corner relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
                  isOverdue 
                    ? 'border-red-500 bg-red-950/10 shadow-[0_0_15px_rgba(239,68,68,0.15)]' 
                    : task.status === 'completed'
                    ? 'border-cyan-800/20 bg-cyan-950/5 opacity-60'
                    : 'border-cyan-800/40 bg-[#081226]/40 hover:border-blueprint-cyan hover:shadow-[0_0_15px_rgba(6,182,212,0.05)]'
                }`}
              >
                {/* Visual side accent border */}
                {isOverdue && (
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-red-500 animate-pulse"></div>
                )}
                {task.status === 'completed' && (
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-green-500"></div>
                )}

                {/* Left side: details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {task.type === 'mileage' ? (
                      <span className="text-[9px] font-mono font-bold bg-blueprint-cyan/10 border border-blueprint-cyan/20 text-blueprint-cyan px-2 py-0.5 uppercase tracking-wider">
                        ПО ПРОБЕГУ (ТО)
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono font-bold bg-cyan-800/10 border border-cyan-800/20 text-cyan-300 px-2 py-0.5 uppercase tracking-wider">
                        ОБЫЧНАЯ
                      </span>
                    )}

                    {isOverdue && (
                      <span className="text-[9px] font-mono font-extrabold bg-red-600/20 border border-red-500 text-red-400 px-2 py-0.5 uppercase tracking-wider flex items-center gap-1 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse">
                        <AlertOctagon className="w-3 h-3 text-red-400" />
                        ТРЕБУЕТСЯ ОБСЛУЖИВАНИЕ!
                      </span>
                    )}

                    {task.status === 'completed' && (
                      <span className="text-[9px] font-mono font-bold bg-green-950 border border-green-500/50 text-green-400 px-2 py-0.5 uppercase tracking-wider">
                        ВЫПОЛНЕНО
                      </span>
                    )}
                  </div>

                  <h3 className={`text-xs font-mono font-semibold text-cyan-100 uppercase tracking-wide ${task.status === 'completed' ? 'line-through text-cyan-200/40' : ''}`}>
                    {task.title}
                  </h3>

                  <div className="flex items-center gap-4 text-[10px] font-mono text-cyan-300/60">
                    {task.type === 'mileage' && task.targetMileage !== undefined && (
                      <span className="flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-blueprint-cyan" />
                        Цель: {task.targetMileage.toLocaleString()} км 
                        <span className="text-cyan-400/40">
                          (осталось: {(task.targetMileage - activeCarMileage).toLocaleString()} км)
                        </span>
                      </span>
                    )}
                    {task.type === 'simple' && task.targetDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blueprint-cyan" />
                        Срок: {new Date(task.targetDate).toLocaleDateString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[9px] text-cyan-400/30">
                      <Clock className="w-3 h-3" />
                      Создана: {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Right side: Actions */}
                <div className="flex items-center gap-2 self-stretch md:self-auto justify-end border-t md:border-t-0 border-cyan-800/10 pt-2.5 md:pt-0 shrink-0">
                  {task.status === 'pending' && (
                    <button
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(15);
                        onMarkTaskCompleted(task.id);
                      }}
                      className={`text-[10px] font-mono font-bold px-3 py-1.5 transition-all cursor-pointer whitespace-nowrap tracking-wide flex items-center gap-1.5 uppercase ${
                        isOverdue
                          ? 'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                          : 'bg-blueprint-cyan text-blueprint-bg hover:bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      }`}
                      id={`btn-complete-task-${task.id}`}
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      ОТМЕТИТЬ ВЫПОЛНЕННОЙ
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(15);
                      onDeleteTask(task.id);
                    }}
                    className="p-2 border border-red-500/20 hover:border-red-500/50 hover:bg-red-950/20 text-red-400/60 hover:text-red-400 cursor-pointer shrink-0 transition-colors"
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
          <div className="bento-card border-dashed border-cyan-800/40 p-12 text-center blueprint-corner">
            <CheckSquare className="w-12 h-12 text-blueprint-cyan/20 mx-auto mb-3 animate-pulse" />
            <h4 className="text-xs font-bold text-cyan-200/80 font-mono uppercase mb-1">
              {filter === 'pending' ? 'Нет активных задач' : filter === 'completed' ? 'Нет выполненных задач' : 'Список задач пуст'}
            </h4>
            <p className="text-[11px] text-cyan-400/40 font-mono max-w-sm mx-auto">
              {filter === 'pending' 
                ? 'Все дела сделаны! Можете запланировать новое техобслуживание или замену деталей.'
                : 'Пока нет записей в этом фильтре.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
