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
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm transition-all duration-300 ease-out font-sans">
      <div 
        className="w-full md:max-w-2xl bg-[#111622] border-t md:border border-[#1E273D] rounded-t-2xl md:rounded-2xl shadow-2xl p-4 sm:p-5 pb-28 md:pb-5 relative space-y-4 max-h-[calc(100vh-60px)] md:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E273D] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/25 rounded-xl text-[#06B6D4]">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[#06B6D4] font-semibold uppercase block">Редактирование</span>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Карточка задачи
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-[#151C2C] rounded-lg transition-colors cursor-pointer"
            title="Закрыть"
            id="btn-close-edit-task-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Status selector toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Статус выполнения
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setStatus('pending');
                  if (navigator.vibrate) navigator.vibrate(10);
                }}
                className={`py-2 px-3 text-xs rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer font-medium ${
                  status === 'pending'
                    ? 'bg-[#151C2C] border-amber-500/50 text-amber-300'
                    : 'border-[#1E273D] bg-[#0B0E14] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>В работе / Активна</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus('completed');
                  if (navigator.vibrate) navigator.vibrate(10);
                }}
                className={`py-2 px-3 text-xs rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer font-medium ${
                  status === 'completed'
                    ? 'bg-[#151C2C] border-emerald-500/50 text-emerald-300'
                    : 'border-[#1E273D] bg-[#0B0E14] text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Выполнена</span>
              </button>
            </div>
          </div>

          {/* Title input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Название работы / Содержание ТО *
            </label>
            <textarea
              required
              rows={2}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Опишите планируемую работу или ТО..."
              className="w-full border border-[#1E273D] bg-[#0B0E14] p-2.5 text-xs sm:text-sm text-slate-100 rounded-xl focus:outline-none focus:border-cyan-400 resize-none"
            />
          </div>

          {/* Type selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Тип контроля
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setType('simple');
                    if (navigator.vibrate) navigator.vibrate(10);
                  }}
                  className={`py-2 px-2 text-xs rounded-xl border transition-all cursor-pointer font-medium ${
                    type === 'simple'
                      ? 'bg-[#151C2C] border-cyan-500/40 text-[#06B6D4]'
                      : 'border-[#1E273D] bg-[#0B0E14] text-slate-400 hover:text-slate-200'
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
                  className={`py-2 px-2 text-xs rounded-xl border transition-all cursor-pointer font-medium ${
                    type === 'mileage'
                      ? 'bg-[#151C2C] border-cyan-500/40 text-[#06B6D4]'
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
                  <Calendar className="w-3.5 h-3.5 text-[#06B6D4]" /> Срок выполнения
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full border border-[#1E273D] bg-[#0B0E14] p-2 text-xs text-slate-100 rounded-xl focus:outline-none focus:border-cyan-400"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-[#06B6D4]" /> Целевой пробег (км)
                </label>
                <input
                  type="number"
                  required
                  value={targetMileage}
                  onChange={(e) => setTargetMileage(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={`Текущий: ${activeCarMileage} км`}
                  className="w-full border border-[#1E273D] bg-[#0B0E14] p-2 text-xs font-mono text-slate-100 rounded-xl focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}
          </div>

          {/* Section: Photo Report / Repair Gallery */}
          <div className="pt-2.5 border-t border-[#1E273D] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-200">
                <Camera className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>Фотографии ({photos.length})</span>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary py-1 px-2.5 text-[11px] font-medium rounded-lg flex items-center gap-1 cursor-pointer"
                id="btn-upload-task-photos"
              >
                <Plus className="w-3 h-3 text-[#06B6D4]" />
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
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 bg-[#0B0E14] border border-[#1E273D] rounded-xl">
                {photos.map((url, idx) => (
                  <div 
                    key={idx} 
                    className="group relative aspect-square bg-[#111622] border border-[#1E273D] overflow-hidden rounded-lg hover:border-cyan-400 transition-all"
                  >
                    <img
                      src={url}
                      alt={`Фото ремонта ${idx + 1}`}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => setActivePhotoIndex(idx)}
                    />
                    
                    {/* Overlay controls */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity p-1">
                      <button
                        type="button"
                        onClick={() => setActivePhotoIndex(idx)}
                        className="p-1 bg-[#151C2C] border border-cyan-400 text-[#06B6D4] rounded-lg cursor-pointer"
                        title="Увеличить фото"
                      >
                        <ZoomIn className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(idx)}
                        className="p-1 bg-rose-950 border border-rose-500 text-rose-400 rounded-lg cursor-pointer"
                        title="Удалить фото"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-[#1E273D] p-3 text-center rounded-xl bg-[#0B0E14] hover:bg-[#151C2C] transition-all cursor-pointer group"
              >
                <ImageIcon className="w-6 h-6 text-slate-600 group-hover:text-[#06B6D4] mx-auto mb-1 transition-colors" />
                <p className="text-[11px] text-slate-400 group-hover:text-slate-200">
                  Нажмите, чтобы прикрепить фотографии деталей или ремонта.
                </p>
              </div>
            )}
          </div>

          {/* Buttons Footer */}
          <div className="pt-2 border-t border-[#1E273D] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary py-2 px-3 text-xs font-medium rounded-xl cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn-primary py-2 px-4 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Сохранить</span>
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
