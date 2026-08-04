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
  Settings
} from 'lucide-react';
import { useUserSettings } from './UserSettingsContext';

interface GarageManagerProps {
  cars: Car[];
  activeCarId: string | null;
  onSelectCar: (id: string) => void;
  onAddCar: (car: Omit<Car, 'ownerId' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteCar?: (id: string) => void;
}

export function GarageManager({ cars, activeCarId, onSelectCar, onAddCar, onDeleteCar }: GarageManagerProps) {
  const { formatMileage, distanceLabel, unconvertDistance } = useUserSettings();
  const [showAddForm, setShowAddForm] = useState(false);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [vin, setVin] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [mileage, setMileage] = useState<number>(100000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!make.trim() || !model.trim()) return;

    onAddCar({
      id: Math.random().toString(36).substr(2, 9),
      make: make.trim(),
      model: model.trim(),
      year,
      vin: vin.trim() || undefined,
      licensePlate: licensePlate.trim() || undefined,
      mileage: unconvertDistance(mileage)
    });

    // Reset fields
    setMake('');
    setModel('');
    setYear(new Date().getFullYear());
    setVin('');
    setLicensePlate('');
    setMileage(100000);
    setShowAddForm(false);
  };

  const activeCar = cars.find(c => c.id === activeCarId);

  return (
    <div className="bento-card p-5 blueprint-corner relative">
      <div className="absolute top-0 right-0 p-1 bg-cyan-800/30 text-cyan-400 text-[8px] font-bold uppercase font-mono">ГАРАЖ</div>
      {/* HUD Header */}
      <div className="flex justify-between items-center border-b border-cyan-800/30 pb-3 mb-4">
        <div>
          <span className="text-[9px] text-blueprint-cyan tracking-widest font-mono block">ПАНЕЛЬ УПРАВЛЕНИЯ</span>
          <h3 className="text-md font-bold text-cyan-100 font-mono uppercase flex items-center">
            <CarIcon className="w-4 h-4 mr-2 text-blueprint-cyan animate-pulse" /> АКТИВНЫЙ ГАРАЖ
          </h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blueprint-cyan/10 hover:bg-blueprint-cyan/20 border border-blueprint-cyan/40 hover:border-blueprint-cyan text-blueprint-cyan px-3 py-1 text-[10px] font-mono flex items-center transition-all cursor-pointer"
          id="btn-toggle-add-car"
        >
          {showAddForm ? 'СВЕРНУТЬ' : 'ДОБАВИТЬ АВТО'}
          <Plus className="w-3.5 h-3.5 ml-1" />
        </button>
      </div>

      {/* 1. Add Car Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-cyan-950/20 border border-cyan-800/40 p-4 mb-4 space-y-3 blueprint-corner relative">
          <div className="absolute top-0 right-0 p-0.5 bg-cyan-800/30 text-cyan-400 text-[8px] font-bold uppercase font-mono">ДОБАВИТЬ</div>
          <div className="text-[10px] text-blueprint-cyan/60 tracking-wider font-mono uppercase mb-1">
            РЕГИСТРАЦИЯ НОВОГО АВТОМОБИЛЯ
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="text-[9px] text-blueprint-cyan font-mono uppercase mb-0.5">Марка</label>
              <input
                type="text"
                required
                placeholder="Lada, Toyota..."
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="border border-cyan-800/40 bg-blueprint-bg/60 p-1.5 text-xs text-cyan-100 font-mono focus:outline-none focus:border-blueprint-cyan"
                id="car-make"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[9px] text-blueprint-cyan font-mono uppercase mb-0.5">Модель</label>
              <input
                type="text"
                required
                placeholder="Kalina, Granta..."
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="border border-cyan-800/40 bg-blueprint-bg/60 p-1.5 text-xs text-cyan-100 font-mono focus:outline-none focus:border-blueprint-cyan"
                id="car-model"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col">
              <label className="text-[9px] text-blueprint-cyan font-mono uppercase mb-0.5">Год выпуска</label>
              <input
                type="number"
                required
                min="1900"
                max={new Date().getFullYear() + 1}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="border border-cyan-800/40 bg-blueprint-bg/60 p-1.5 text-xs text-cyan-100 font-mono focus:outline-none focus:border-blueprint-cyan"
                id="car-year"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[9px] text-blueprint-cyan font-mono uppercase mb-0.5">Пробег ({distanceLabel})</label>
              <input
                type="number"
                required
                min="0"
                value={mileage}
                onChange={(e) => setMileage(Number(e.target.value))}
                className="border border-cyan-800/40 bg-blueprint-bg/60 p-1.5 text-xs text-cyan-100 font-mono focus:outline-none focus:border-blueprint-cyan"
                id="car-mileage"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[9px] text-blueprint-cyan font-mono uppercase mb-0.5">Госномер</label>
              <input
                type="text"
                placeholder="A123BC77"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className="border border-cyan-800/40 bg-blueprint-bg/60 p-1.5 text-xs text-cyan-100 font-mono focus:outline-none focus:border-blueprint-cyan"
                id="car-plate"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-[9px] text-blueprint-cyan font-mono uppercase mb-0.5">VIN-код (17 знаков)</label>
            <input
              type="text"
              placeholder="WBAAN310XXXXXXXXX"
              maxLength={17}
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              className="border border-cyan-800/40 bg-blueprint-bg/60 p-1.5 text-xs text-cyan-100 font-mono focus:outline-none focus:border-blueprint-cyan"
              id="car-vin"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="w-full sm:w-auto justify-center flex border border-cyan-800/40 text-cyan-200/50 px-3 py-1.5 text-[10px] font-mono hover:text-cyan-100 cursor-pointer"
              id="btn-car-cancel"
            >
              ОТМЕНА
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto justify-center flex bg-blueprint-cyan text-blueprint-bg font-bold font-mono text-[10px] px-4 py-1.5 hover:bg-cyan-400 cursor-pointer"
              id="btn-car-save"
            >
              ДОБАВИТЬ АВТО
            </button>
          </div>
        </form>
      )}

      {/* 2. Active Cars List */}
      <div className="space-y-2">
        {cars.map((car) => {
          const isActive = car.id === activeCarId;
          return (
            <div
              key={car.id}
              onClick={() => onSelectCar(car.id)}
              className={`p-3 flex justify-between items-center cursor-pointer transition-all relative overflow-hidden border ${
                isActive 
                  ? 'bento-card-active border-blueprint-cyan' 
                  : 'border-cyan-800/30 hover:border-blueprint-cyan/50 bg-[#081226]/40'
              }`}
              id={`car-item-${car.id}`}
            >
              {isActive && (
                <div className="absolute top-0 right-0 p-0.5 bg-cyan-500 text-[#050a14] text-[8px] font-bold uppercase font-mono tracking-widest">
                  АКТИВЕН
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className={`p-2 border rounded-none ${isActive ? 'border-blueprint-cyan text-blueprint-cyan bg-cyan-950/20' : 'border-cyan-800/30 text-cyan-200/60'}`}>
                  <CarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-cyan-100 font-mono uppercase">
                    {car.make} {car.model}
                  </h4>
                  <div className="flex gap-2 text-[9px] text-cyan-400/50 font-mono mt-0.5">
                    <span>{car.year} г.в.</span>
                    <span>•</span>
                    <span>{formatMileage(car.mileage)}</span>
                    {car.licensePlate && (
                      <>
                        <span>•</span>
                        <span className="text-blueprint-cyan">{car.licensePlate}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-shrink-0">
                {onDeleteCar && cars.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCar(car.id);
                    }}
                    className="p-1 border border-red-500/20 hover:border-red-500/50 hover:bg-red-950/20 text-red-400/60 hover:text-red-400 cursor-pointer relative z-10 shrink-0 flex-shrink-0"
                    title="Удалить авто"
                    id={`btn-del-car-${car.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Car Static HUD Spec Sheet */}
      {activeCar && (
        <div className="mt-4 pt-3 border-t border-cyan-800/30 text-[10px] font-mono text-cyan-200/60 space-y-1.5">
          <div className="text-[9px] text-blueprint-cyan tracking-wider font-semibold uppercase mb-1">
            ТЕХНИЧЕСКИЙ ПАСПОРТ: {activeCar.make.toUpperCase()} {activeCar.model.toUpperCase()}
          </div>
          <div className="flex justify-between border-b border-cyan-800/20 pb-1">
            <span>VIN-НОМЕР:</span>
            <span className="text-cyan-100 font-semibold">{activeCar.vin || 'НЕ УКАЗАН'}</span>
          </div>
          <div className="flex justify-between border-b border-cyan-800/20 pb-1">
            <span>ГОС. НОМЕР:</span>
            <span className="text-cyan-100 font-semibold">{activeCar.licensePlate || 'НЕ УКАЗАН'}</span>
          </div>
          <div className="flex justify-between">
            <span>ТЕКУЩИЙ ПРОБЕГ:</span>
            <span className="text-cyan-100 font-semibold">{formatMileage(activeCar.mileage).toUpperCase()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
