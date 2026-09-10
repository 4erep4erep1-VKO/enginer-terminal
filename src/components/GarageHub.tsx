/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Car, Part, MaintenanceRecord } from '../types';
import { GarageManager } from './GarageManager';
import { PartsInventory } from './PartsInventory';
import { SettingsPanel } from './SettingsPanel';
import { Car as CarIcon, Package, Settings, Warehouse } from 'lucide-react';

interface GarageHubProps {
  cars: Car[];
  activeCarId: string | null;
  parts: Part[];
  records?: MaintenanceRecord[];
  onSelectCar: (id: string) => void;
  onAddCar: (car: Omit<Car, 'ownerId' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateCar?: (car: Car) => void;
  onDeleteCar?: (id: string) => void;
  onAddPart: (partData: Omit<Part, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>) => void;
  onDeletePart: (id: string) => void;
  onUsePart: (part: Part) => void;
  partsSearchFilter?: string;
  initialSubTab?: 'cars' | 'parts' | 'settings';
  onImportDemoData?: () => void;
}

export function GarageHub({
  cars,
  activeCarId,
  parts,
  records = [],
  onSelectCar,
  onAddCar,
  onUpdateCar,
  onDeleteCar,
  onAddPart,
  onDeletePart,
  onUsePart,
  partsSearchFilter = '',
  initialSubTab = 'cars',
  onImportDemoData,
}: GarageHubProps) {
  const [subTab, setSubTab] = useState<'cars' | 'parts' | 'settings'>(initialSubTab);

  return (
    <div className="space-y-3.5 font-sans pb-20">
      
      {/* Top Segmented Switch: [ АВТОПАРК ] [ СКЛАД ЗАПЧАСТЕЙ ] [ НАСТРОЙКИ ] */}
      <div className="bg-[#111622] border border-[#1E273D] p-1 rounded-xl shadow-sm">
        <div className="grid grid-cols-3 gap-1 w-full">
          {/* АВТОПАРК */}
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              setSubTab('cars');
            }}
            className={`py-2 px-2 sm:px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
              subTab === 'cars'
                ? 'bg-[#151C2C] text-[#06B6D4] border border-[#06B6D4]/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#151C2C]/50 border border-transparent'
            }`}
            id="subtab-garage-cars"
          >
            <CarIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Гараж ({cars.length})</span>
          </button>

          {/* СКЛАД */}
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              setSubTab('parts');
            }}
            className={`py-2 px-2 sm:px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
              subTab === 'parts'
                ? 'bg-[#151C2C] text-[#06B6D4] border border-[#06B6D4]/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#151C2C]/50 border border-transparent'
            }`}
            id="subtab-garage-parts"
          >
            <Package className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Склад ({parts.length})</span>
          </button>

          {/* НАСТРОЙКИ */}
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              setSubTab('settings');
            }}
            className={`py-2 px-2 sm:px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
              subTab === 'settings'
                ? 'bg-[#151C2C] text-[#06B6D4] border border-[#06B6D4]/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#151C2C]/50 border border-transparent'
            }`}
            id="subtab-garage-settings"
          >
            <Settings className="w-3.5 h-3.5 shrink-0" />
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
        <SettingsPanel 
          cars={cars} 
          activeCarId={activeCarId} 
          records={records} 
          onImportDemoData={onImportDemoData}
        />
      )}

    </div>
  );
}
