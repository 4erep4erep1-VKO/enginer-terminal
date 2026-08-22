/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Car } from '../types';
import { 
  Car as CarIcon, 
  Plus, 
  Gauge, 
  Binary, 
  Calendar, 
  Check, 
  Trash2,
  Settings,
  Pencil
} from 'lucide-react';
import { useUserSettings } from './UserSettingsContext';

interface GarageManagerProps {
  cars: Car[];
  activeCarId: string | null;
  onSelectCar: (id: string) => void;
  onAddCar: (car: Omit<Car, 'ownerId' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateCar?: (car: Car) => void;
  onDeleteCar?: (id: string) => void;
  onOpenSettings?: () => void;
}

export function GarageManager({ cars, activeCarId, onSelectCar, onAddCar, onUpdateCar, onDeleteCar, onOpenSettings }: GarageManagerProps) {
  const { formatMileage, distanceLabel, unconvertDistance } = useUserSettings();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCarId, setEditingCarId] = useState<string | null>(null);

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [engine, setEngine] = useState('');
  const [vin, setVin] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [mileage, setMileage] = useState<number>(100000);

  const resetForm = () => {
    setEditingCarId(null);
    setMake('');
    setModel('');
    setYear(new Date().getFullYear());
    setEngine('');
    setVin('');
    setLicensePlate('');
    setMileage(100000);
    setShowAddForm(false);
  };

  const handleStartAdd = () => {
    setEditingCarId(null);
    setMake('');
    setModel('');
    setYear(new Date().getFullYear());
    setEngine('');
    setVin('');
    setLicensePlate('');
    setMileage(100000);
    setShowAddForm(true);
  };

  const handleStartEdit = (car: Car) => {
    setEditingCarId(car.id);
    setMake(car.make);
    setModel(car.model);
    setYear(car.year);
    setEngine(car.engine || '');
    setVin(car.vin || '');
    setLicensePlate(car.licensePlate || '');
    setMileage(car.mileage);
    setShowAddForm(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!onDeleteCar) return;

    if (cars.length <= 1) {
      alert('Нельзя удалить единственный автомобиль из гаража');
      return;
    }

    if (window.confirm('Вы действительно хотите удалить этот автомобиль из гаража?')) {
      onDeleteCar(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!make.trim() || !model.trim()) return;

    if (editingCarId && onUpdateCar) {
      const existingCar = cars.find(c => c.id === editingCarId);
      if (existingCar) {
        onUpdateCar({
          ...existingCar,
          make: make.trim(),
          model: model.trim(),
          year,
          engine: engine.trim() || undefined,
          vin: vin.trim() || undefined,
          licensePlate: licensePlate.trim() || undefined,
          mileage: unconvertDistance(mileage),
          updatedAt: new Date().toISOString()
        });
      }
    } else {
      onAddCar({
        id: Math.random().toString(36).substr(2, 9),
        make: make.trim(),
        model: model.trim(),
        year,
        engine: engine.trim() || undefined,
        vin: vin.trim() || undefined,
        licensePlate: licensePlate.trim() || undefined,
        mileage: unconvertDistance(mileage)
      });
    }

    resetForm();
  };

  const activeCar = cars.find(c => c.id === activeCarId);

  return (
    <div className="bg-[#10151E] border border-[#1E2638] rounded-2xl p-4 sm:p-6 relative font-sans overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#1E2638] pb-3 mb-4 gap-2.5">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] text-cyan-400 font-semibold tracking-wider block uppercase">Панель управления</span>
          <h3 className="text-base font-bold text-white uppercase flex items-center gap-2">
            <CarIcon className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">Гараж автомобилей</span>
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end shrink-0 w-full sm:w-auto">
          {onOpenSettings && (
            <button
              type="button"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                onOpenSettings();
              }}
              className="text-xs font-semibold text-slate-300 hover:text-white bg-[#151B25] hover:bg-[#1B2431] border border-[#1E2638] px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Открыть настройки приложения"
              id="btn-garage-settings-shortcut"
            >
              <Settings className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="hidden sm:inline">Настройки</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (showAddForm && !editingCarId) {
                setShowAddForm(false);
              } else {
                handleStartAdd();
              }
            }}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all flex items-center gap-1 cursor-pointer shrink-0"
            id="btn-toggle-add-car"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>{showAddForm ? 'Скрыть' : 'Добавить авто'}</span>
          </button>
        </div>
      </div>

      {/* 1. Add / Edit Car Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-[#151B25] border border-[#1E2638] p-4 sm:p-5 rounded-2xl mb-4 space-y-3.5 relative shadow-lg">
          <div className="text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-2">
            {editingCarId ? 'Редактирование автомобиля' : 'Регистрация нового автомобиля'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-slate-300 font-medium mb-1">Марка *</label>
              <input
                type="text"
                required
                placeholder="Lada, Toyota..."
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="border border-[#1E2638] bg-[#10151E] p-2.5 rounded-xl text-xs text-slate-100 font-sans focus:outline-none focus:border-cyan-400"
                id="car-make"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-300 font-medium mb-1">Модель *</label>
              <input
                type="text"
                required
                placeholder="Kalina, Granta..."
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="border border-[#1E2638] bg-[#10151E] p-2.5 rounded-xl text-xs text-slate-100 font-sans focus:outline-none focus:border-cyan-400"
                id="car-model"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-slate-300 font-medium mb-1">Год выпуска</label>
              <input
                type="number"
                required
                min="1900"
                max={new Date().getFullYear() + 1}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="border border-[#1E2638] bg-[#10151E] p-2.5 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                id="car-year"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-300 font-medium mb-1">Пробег ({distanceLabel})</label>
              <input
                type="number"
                required
                min="0"
                value={mileage}
                onChange={(e) => setMileage(Number(e.target.value))}
                className="border border-[#1E2638] bg-[#10151E] p-2.5 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                id="car-mileage"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-300 font-medium mb-1">Госномер</label>
              <input
                type="text"
                placeholder="A123BC77"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className="border border-[#1E2638] bg-[#10151E] p-2.5 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                id="car-plate"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-slate-300 font-medium mb-1">Двигатель / Мотор</label>
              <input
                type="text"
                placeholder="1.6L 16V, 2.0 TSI..."
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                className="border border-[#1E2638] bg-[#10151E] p-2.5 rounded-xl text-xs text-slate-100 font-sans focus:outline-none focus:border-cyan-400"
                id="car-engine"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-300 font-medium mb-1">VIN-код (17 знаков)</label>
              <input
                type="text"
                placeholder="WBAAN310XXXXXXXXX"
                maxLength={17}
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                className="border border-[#1E2638] bg-[#10151E] p-2.5 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                id="car-vin"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="btn-secondary min-h-[40px] px-4 text-xs font-semibold rounded-xl cursor-pointer"
              id="btn-car-cancel"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn-primary min-h-[40px] px-5 text-xs font-bold rounded-xl cursor-pointer"
              id="btn-car-save"
            >
              {editingCarId ? 'Сохранить изменения' : 'Добавить авто'}
            </button>
          </div>
        </form>
      )}

      {/* 2. Active Cars List */}
      <div className="space-y-2.5">
        {cars.length === 0 ? (
          <div className="p-6 bg-[#151B25] border border-dashed border-[#1E2638] rounded-2xl text-center space-y-3">
            <p className="text-xs text-slate-400 font-sans">
              В вашем гараже еще нет добавленных автомобилей.
            </p>
            <button
              onClick={handleStartAdd}
              className="btn-primary min-h-[44px] px-4 text-xs font-bold rounded-xl inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить первый автомобиль</span>
            </button>
          </div>
        ) : (
          cars.map((car) => {
            const isActive = car.id === activeCarId;
            return (
              <div
                key={car.id}
                onClick={() => onSelectCar(car.id)}
                className={`p-3.5 rounded-xl flex justify-between items-center cursor-pointer transition-all relative overflow-hidden border ${
                  isActive 
                    ? 'bg-[#1B2431] border-cyan-500 shadow-sm' 
                    : 'bg-[#151B25] border-[#1E2638] hover:border-[#273248] hover:bg-[#1B2431]'
                }`}
                id={`car-item-${car.id}`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-cyan-500 text-slate-950 text-[9px] font-bold uppercase rounded-bl-lg">
                    Активен
                  </div>
                )}
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className={`p-2.5 rounded-xl shrink-0 ${isActive ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-[#10151E] text-slate-400 border border-[#1E2638]'}`}>
                    <CarIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 truncate">
                    <h4 className="text-sm font-bold text-white font-sans truncate">
                      {car.make} {car.model}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-sans mt-0.5">
                      <span className="font-mono text-slate-300">{car.year} г.в.</span>
                      <span>•</span>
                      <span className="font-mono text-cyan-400 font-medium">{formatMileage(car.mileage)}</span>
                      {car.licensePlate && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-slate-200">{car.licensePlate}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(car);
                    }}
                    className="p-2 bg-[#10151E] hover:bg-[#1B2431] border border-[#1E2638] text-cyan-300 rounded-xl cursor-pointer transition-all"
                    title="Редактировать параметры авто"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, car.id)}
                    className="p-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 rounded-xl cursor-pointer transition-all"
                    title="Удалить авто из гаража"
                    id={`btn-del-car-${car.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Active Car Static HUD Spec Sheet */}
      {activeCar && (
        <div className="mt-4 pt-3 border-t border-[#1E2638] text-xs font-sans text-slate-300 space-y-2">
          <div className="text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-1">
            Технический паспорт: {activeCar.make} {activeCar.model}
          </div>
          <div className="flex justify-between border-b border-[#1E2638]/80 pb-1.5">
            <span className="text-slate-400">VIN-номер:</span>
            <span className="text-slate-100 font-mono font-medium">{activeCar.vin || 'Не указан'}</span>
          </div>
          <div className="flex justify-between border-b border-[#1E2638]/80 pb-1.5">
            <span className="text-slate-400">Гос. номер:</span>
            <span className="text-slate-100 font-mono font-medium">{activeCar.licensePlate || 'Не указан'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Текущий пробег:</span>
            <span className="text-cyan-400 font-mono font-bold">{formatMileage(activeCar.mileage)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

