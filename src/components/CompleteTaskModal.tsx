/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { VehicleTask, MaintenanceRecord, RecordCategory } from '../types';
import { useUserSettings } from './UserSettingsContext';
import { 
  CheckSquare, 
  X, 
  Check, 
  DollarSign, 
  Gauge, 
  Calendar, 
  Wrench, 
  Layers,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { CATEGORY_NAMES } from './AddRecordForm';

interface CompleteTaskModalProps {
  isOpen: boolean;
  task: VehicleTask | null;
  currentCarMileage: number;
  onClose: () => void;
  onConfirmComplete: (params: {
    taskId: string;
    partsPrice: number;
    laborPrice: number;
    partsUsed: string[];
    mileage: number;
    date: string;
    category: RecordCategory;
    description: string;
  }) => void;
}

const CATEGORIES: RecordCategory[] = [
  'Engine', 'Suspension', 'Brakes', 'Transmission', 'Electrical', 'Body', 'Oil & Fluids', 'Diagnostics', 'Other'
];

export function CompleteTaskModal({
  isOpen,
  task,
  currentCarMileage,
  onClose,
  onConfirmComplete
}: CompleteTaskModalProps) {
  const { currencySymbol, distanceLabel } = useUserSettings();

  const [description, setDescription] = useState('');
  const [partsPrice, setPartsPrice] = useState<number | ''>('');
  const [laborPrice, setLaborPrice] = useState<number | ''>('');
  const [partsUsedInput, setPartsUsedInput] = useState('');
  const [partsUsed, setPartsUsed] = useState<string[]>([]);
  const [mileage, setMileage] = useState<number>(currentCarMileage);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<RecordCategory>('Engine');

  useEffect(() => {
    if (isOpen && task) {
      setDescription(task.title || '');
      setCategory(task.category || (task.relatedDtc ? 'Engine' : 'Other'));
      
      // Auto pre-populate mileage from task targetMileage or current mileage
      if (task.type === 'mileage' && task.targetMileage && task.targetMileage >= currentCarMileage) {
        setMileage(task.targetMileage);
      } else {
        setMileage(currentCarMileage);
      }

      setDate(new Date().toISOString().split('T')[0]);
      setPartsPrice('');
      setLaborPrice('');
      setPartsUsed([]);
      setPartsUsedInput('');
    }
  }, [isOpen, task, currentCarMileage]);

  if (!isOpen || !task) return null;

  const handleAddPartUsed = () => {
    if (!partsUsedInput.trim()) return;
    setPartsUsed(prev => [...prev, partsUsedInput.trim()]);
    setPartsUsedInput('');
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleRemovePartUsed = (idx: number) => {
    setPartsUsed(prev => prev.filter((_, i) => i !== idx));
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    if (navigator.vibrate) navigator.vibrate(20);

    onConfirmComplete({
      taskId: task.id,
      partsPrice: partsPrice === '' ? 0 : Number(partsPrice),
      laborPrice: laborPrice === '' ? 0 : Number(laborPrice),
      partsUsed,
      mileage: Number(mileage) || currentCarMileage,
      date,
      category,
      description: description.trim() || task.title
    });
  };

  const isMileageHigher = Number(mileage) > currentCarMileage;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-950/80 backdrop-blur-sm transition-all animate-in fade-in">
      <form 
        onSubmit={handleSubmit}
        className="w-full md:max-w-lg bg-[#111622] border-t md:border border-[#1E273D] rounded-t-2xl md:rounded-2xl shadow-2xl p-4 sm:p-5 pb-24 md:pb-5 relative space-y-4 max-h-[calc(100vh-60px)] md:max-h-[90vh] overflow-y-auto"
      >
        <div className="w-10 h-1 bg-[#1E273D] rounded-full mx-auto mb-2 md:hidden" />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(10);
            onClose();
          }}
          className="absolute top-3 right-3 md:top-4 md:right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#151C2C] transition-colors cursor-pointer z-20"
          title="Закрыть"
          id="btn-close-complete-task"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="border-b border-[#1E273D] pb-3">
          <div className="flex items-center gap-2 text-xs text-[#06B6D4] font-medium mb-0.5">
            <CheckSquare className="w-4 h-4" />
            <span>Завершение работы и перенос в Историю ТО</span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
            {task.title}
          </h3>
        </div>

        <div className="space-y-3.5 text-xs">
          
          {/* Work Description / Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Наименование выполненной работы *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Например: Замена моторного масла и фильтра"
              className="w-full border border-[#1E273D] bg-[#151C2C] p-2.5 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              id="input-complete-task-desc"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#06B6D4]" /> Категория узла
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as RecordCategory)}
              className="w-full border border-[#1E273D] bg-[#151C2C] p-2.5 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400 cursor-pointer"
              id="select-complete-task-category"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_NAMES[cat] || cat}
                </option>
              ))}
            </select>
          </div>

          {/* Mileage and Date (Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-[#06B6D4]" /> Пробег выполнения ({distanceLabel}) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={mileage}
                onChange={(e) => setMileage(Number(e.target.value))}
                className="w-full border border-[#1E273D] bg-[#151C2C] p-2.5 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
                id="input-complete-task-mileage"
              />
              {isMileageHigher && (
                <div className="mt-1 text-[11px] text-cyan-400 flex items-center gap-1 font-sans">
                  <TrendingUp className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>Пробег авто автоматически обновится до {Number(mileage).toLocaleString()} км</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#06B6D4]" /> Дата выполнения *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-[#1E273D] bg-[#151C2C] p-2.5 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                id="input-complete-task-date"
              />
            </div>
          </div>

          {/* Financials: Parts & Labor Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-[#06B6D4]" /> Стоимость запчастей ({currencySymbol})
              </label>
              <input
                type="number"
                min={0}
                value={partsPrice}
                onChange={(e) => setPartsPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full border border-[#1E273D] bg-[#151C2C] p-2.5 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
                id="input-complete-task-parts-price"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-[#06B6D4]" /> Стоимость работы ({currencySymbol})
              </label>
              <input
                type="number"
                min={0}
                value={laborPrice}
                onChange={(e) => setLaborPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full border border-[#1E273D] bg-[#151C2C] p-2.5 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
                id="input-complete-task-labor-price"
              />
            </div>
          </div>

          {/* Parts / Items Used and Part Numbers */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Артикулы, запчасти или расходники
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={partsUsedInput}
                onChange={(e) => setPartsUsedInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPartUsed();
                  }
                }}
                placeholder="Например: Масло Lukoil Genesis 5W-40, фильтр MANN W914/2"
                className="flex-1 border border-[#1E273D] bg-[#151C2C] p-2.5 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                id="input-complete-task-parts-used"
              />
              <button
                type="button"
                onClick={handleAddPartUsed}
                className="btn-secondary text-xs px-3 py-2 rounded-xl shrink-0 cursor-pointer"
              >
                Добавить
              </button>
            </div>

            {partsUsed.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {partsUsed.map((p, idx) => (
                  <span
                    key={idx}
                    className="bg-[#151C2C] border border-[#1E273D] text-slate-200 text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                  >
                    <span>{p}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePartUsed(idx)}
                      className="text-slate-400 hover:text-rose-400 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer Buttons */}
        <div className="sticky bottom-0 bg-[#111622] pt-3 pb-2 md:pb-0 -mx-4 sm:-mx-5 px-4 sm:px-5 border-t border-[#1E273D] flex flex-col sm:flex-row justify-end gap-2 z-10">
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              onClose();
            }}
            className="btn-secondary text-xs rounded-xl cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="btn-primary text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
            id="btn-confirm-save-complete-task"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Сохранить в Историю ТО</span>
          </button>
        </div>
      </form>
    </div>
  );
}
