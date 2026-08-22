/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Car, Part } from '../types';
import { GarageManager } from './GarageManager';
import { PartsInventory } from './PartsInventory';
import { SettingsPanel } from './SettingsPanel';
import { Car as CarIcon, Package, Settings, Warehouse } from 'lucide-react';

interface GarageHubProps {
  cars: Car[];
  activeCarId: string | null;
  parts: Part[];
  onSelectCar: (id: string) => void;
  onAddCar: (car: Omit<Car, 'ownerId' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateCar?: (car: Car) => void;
  onDeleteCar?: (id: string) => void;
  onAddPart: (partData: Omit<Part, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>) => void;
  onDeletePart: (id: string) => void;
  onUsePart: (part: Part) => void;
  partsSearchFilter?: string;
  initialSubTab?: 'cars' | 'parts' | 'settings';
}

export function GarageHub({
  cars,
  activeCarId,
  parts,
  onSelectCar,
  onAddCar,
  onUpdateCar,
  onDeleteCar,
  onAddPart,
  onDeletePart,
  onUsePart,
  partsSearchFilter = '',
  initialSubTab = 'cars',
}: GarageHubProps) {
  const [subTab, setSubTab] = useState<'cars' | 'parts' | 'settings'>(initialSubTab);

  return (
    <div className="space-y-4 font-sans">
      
      {/* Top Segmented Switch: [ АВТОПАРК ] [ СКЛАД ЗАПЧАСТЕЙ ] [ НАСТРОЙКИ ] */}
      <div className="bg-[#10151E] border border-[#1E2638] p-1.5 rounded-2xl shadow-sm">
        <div className="grid grid-cols-3 gap-1.5 w-full">
          {/* АВТОПАРК */}
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              setSubTab('cars');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
              subTab === 'cars'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#151B25]'
            }`}
            id="subtab-garage-cars"
          >
            <CarIcon className="w-4 h-4 shrink-0" />
            <span className="truncate">Автопарк ({cars.length})</span>
          </button>

          {/* СКЛАД */}
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              setSubTab('parts');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
              subTab === 'parts'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#151B25]'
            }`}
            id="subtab-garage-parts"
          >
            <Package className="w-4 h-4 shrink-0" />
            <span className="truncate">Склад ({parts.length})</span>
          </button>

          {/* НАСТРОЙКИ */}
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              setSubTab('settings');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
              subTab === 'settings'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#151B25]'
            }`}
            id="subtab-garage-settings"
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span className="truncate">Настройки</span>
          </button>
        </div>
      </div>

      {/* Sub-view rendering */}
      {subTab === 'cars' && (
        <GarageManager
          cars={cars}
          activeCarId={activeCarId}
          onSelectCar={onSelectCar}
          onAddCar={onAddCar}
          onUpdateCar={onUpdateCar}
          onDeleteCar={onDeleteCar}
          onOpenSettings={() => setSubTab('settings')}
        />
      )}

      {subTab === 'parts' && (
        <PartsInventory
          parts={parts}
          onAddPart={onAddPart}
          onDeletePart={onDeletePart}
          onUsePart={onUsePart}
          initialFilter={partsSearchFilter}
        />
      )}

      {subTab === 'settings' && (
        <SettingsPanel />
      )}

    </div>
  );
}
