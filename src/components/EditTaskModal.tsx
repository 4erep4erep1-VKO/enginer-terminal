/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Check, 
  Camera, 
  Image as ImageIcon, 
  Trash2, 
  ZoomIn, 
  Calendar, 
  Gauge, 
  Edit3, 
  CheckSquare, 
  Clock,
  Plus
} from 'lucide-react';
import { VehicleTask, TaskType, TaskStatus } from '../types';

interface EditTaskModalProps {
  isOpen: boolean;
  task: VehicleTask | null;
  activeCarMileage?: number;
  onClose: () => void;
  onSave: (updatedTask: VehicleTask) => void;
}

export function EditTaskModal({
  isOpen,
  task,
  activeCarMileage = 0,
  onClose,
  onSave,
}: EditTaskModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TaskType>('simple');
  const [targetMileage, setTargetMileage] = useState<number | ''>('');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [photos, setPhotos] = useState<string[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && task) {
      setTitle(task.title || '');
      setType(task.type || 'simple');
      setTargetMileage(task.targetMileage !== undefined ? task.targetMileage : '');
      setTargetDate(task.targetDate || '');
      setStatus(task.status || 'pending');
      setPhotos(task.photos || []);
      setActivePhotoIndex(null);
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setPhotos((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleDeletePhoto = (indexToRemove: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (activePhotoIndex === indexToRemove) {
      setActivePhotoIndex(null);
    } else if (activePhotoIndex !== null && activePhotoIndex > indexToRemove) {
      setActivePhotoIndex(activePhotoIndex - 1);
    }
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updated: VehicleTask = {
      ...task,
      title: title.trim(),
      type,
      targetMileage: type === 'mileage' && targetMileage !== '' ? Number(targetMileage) : undefined,
      targetDate: type === 'simple' && targetDate ? targetDate : undefined,
      status,
      photos,
      updatedAt: new Date().toISOString(),
    };

    onSave(updated);
    onClose();
    if (navigator.vibrate) navigator.vibrate(20);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300 ease-out font-sans">
      <div 
        className="w-full md:max-w-2xl bg-[#10151E] border-t md:border border-[#1E2638] rounded-t-2xl md:rounded-2xl shadow-2xl p-4 sm:p-6 pb-28 md:pb-6 relative space-y-5 max-h-[calc(100vh-60px)] md:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E2638] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase block">Редактирование</span>
              <h3 className="text-base font-bold text-white">
                Карточка задачи и фотоотчет
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-[#151B25] rounded-xl transition-colors cursor-pointer"
            title="Закрыть"
            id="btn-close-edit-task-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status selector toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Статус выполнения задачи
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setStatus('pending');
                  if (navigator.vibrate) navigator.vibrate(10);
                }}
                className={`py-2.5 px-3 text-xs rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer font-semibold ${
                  status === 'pending'
                    ? 'bg-amber-500/15 border-amber-400 text-amber-300'
                    : 'border-[#1E2638] bg-[#151B25] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>В работе / Активна</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus('completed');
                  if (navigator.vibrate) navigator.vibrate(10);
                }}
                className={`py-2.5 px-3 text-xs rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer font-semibold ${
                  status === 'completed'
                    ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
                    : 'border-[#1E2638] bg-[#151B25] text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>Выполнена</span>
              </button>
            </div>
          </div>

          {/* Title input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Название работы / Содержание ТО *
            </label>
            <textarea
              required
              rows={2}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Опишите планируемую работу или ТО..."
              className="w-full border border-[#1E2638] bg-[#151B25] p-3 text-xs text-slate-100 rounded-xl focus:outline-none focus:border-cyan-400 resize-none"
            />
          </div>

          {/* Type selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Тип контроля
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setType('simple');
                    if (navigator.vibrate) navigator.vibrate(10);
                  }}
                  className={`py-2.5 px-2 text-xs rounded-xl border transition-all cursor-pointer font-semibold ${
                    type === 'simple'
                      ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                      : 'border-[#1E2638] bg-[#151B25] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Обычная
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('mileage');
                    if (navigator.vibrate) navigator.vibrate(10);
                  }}
                  className={`py-2.5 px-2 text-xs rounded-xl border transition-all cursor-pointer font-semibold ${
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
                  <Calendar className="w-4 h-4 text-cyan-400" /> Срок выполнения
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full border border-[#1E2638] bg-[#151B25] p-2.5 text-xs text-slate-100 rounded-xl focus:outline-none focus:border-cyan-400"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Gauge className="w-4 h-4 text-cyan-400" /> Целевой пробег (км)
                </label>
                <input
                  type="number"
                  required
                  value={targetMileage}
                  onChange={(e) => setTargetMileage(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={`Текущий: ${activeCarMileage} км`}
                  className="w-full border border-[#1E2638] bg-[#151B25] p-2.5 text-xs font-mono text-slate-100 rounded-xl focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}
          </div>

          {/* Section: Photo Report / Repair Gallery */}
          <div className="pt-3 border-t border-[#1E2638] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Фотоотчет / Галерея ремонта ({photos.length})</span>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary min-h-[36px] px-3 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                id="btn-upload-task-photos"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Прикрепить фото</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            {/* Photos preview grid */}
            {photos.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-2 bg-[#151B25] border border-[#1E2638] rounded-xl">
                {photos.map((url, idx) => (
                  <div 
                    key={idx} 
                    className="group relative aspect-square bg-[#10151E] border border-[#1E2638] overflow-hidden rounded-lg hover:border-cyan-400 transition-all"
                  >
                    <img
                      src={url}
                      alt={`Фото ремонта ${idx + 1}`}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => setActivePhotoIndex(idx)}
                    />
                    
                    {/* Overlay controls */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity p-1">
                      <button
                        type="button"
                        onClick={() => setActivePhotoIndex(idx)}
                        className="p-1.5 bg-[#151B25] border border-cyan-400 text-cyan-300 rounded-lg cursor-pointer"
                        title="Увеличить фото"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(idx)}
                        className="p-1.5 bg-rose-950 border border-rose-500 text-rose-400 rounded-lg cursor-pointer"
                        title="Удалить фото"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="absolute bottom-1 left-1 text-[9px] bg-black/80 text-cyan-300 px-1.5 py-0.5 rounded font-mono pointer-events-none">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-[#1E2638] p-4 text-center rounded-xl bg-[#151B25]/40 hover:bg-[#151B25] transition-all cursor-pointer group"
              >
                <ImageIcon className="w-8 h-8 text-slate-600 group-hover:text-cyan-400 mx-auto mb-1 transition-colors" />
                <p className="text-xs text-slate-400 group-hover:text-slate-200">
                  Нет прикрепленных фотографий. Нажмите, чтобы добавить снимки ремонта или запчастей.
                </p>
              </div>
            )}
          </div>

          {/* Buttons Footer */}
          <div className="pt-3 border-t border-[#1E2638] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary min-h-[42px] px-4 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn-primary min-h-[42px] px-5 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Сохранить изменения</span>
            </button>
          </div>
        </form>
      </div>

      {/* Lightbox for viewing photo in full view */}
      {activePhotoIndex !== null && photos[activePhotoIndex] && (
        <div 
          className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActivePhotoIndex(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-[#10151E] border border-[#1E2638] rounded-2xl p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2638] mb-3">
              <span className="text-xs text-cyan-300 font-mono">
                Фото {activePhotoIndex + 1} из {photos.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(activePhotoIndex)}
                  className="px-2.5 py-1 bg-rose-950 border border-rose-500/50 text-rose-300 text-xs rounded-lg flex items-center gap-1 hover:bg-rose-900 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Удалить
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoIndex(null)}
                  className="p-1 text-slate-400 hover:text-white bg-[#151B25] rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <img
              src={photos[activePhotoIndex]}
              alt={`Просмотр фото ${activePhotoIndex + 1}`}
              className="max-h-[75vh] w-auto max-w-full object-contain mx-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
