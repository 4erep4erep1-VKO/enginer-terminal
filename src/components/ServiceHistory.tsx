/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { MaintenanceRecord, Car, RecordCategory } from '../types';
import { ServiceRecordCard } from './ServiceRecordCard';
import { RecordDetailModal } from './RecordDetailModal';
import { AddRecordForm, CATEGORY_NAMES } from './AddRecordForm';
import { useUserSettings } from './UserSettingsContext';
import { 
  Plus, 
  Wrench, 
  TrendingUp, 
  ChevronDown, 
  Search, 
  Filter, 
  SlidersHorizontal,
  DollarSign,
  Layers,
  CheckCircle2,
  Calendar,
  X
} from 'lucide-react';

interface ServiceHistoryProps {
  activeCar: Car | null;
  records: MaintenanceRecord[];
  onAddRecord: (record: Omit<MaintenanceRecord, 'createdAt' | 'updatedAt'>) => void;
  onUpdateRecord: (record: MaintenanceRecord) => void;
  onDeleteRecord: (id: string) => void;
  showAddForm: boolean;
  onOpenAddForm: () => void;
  onCloseAddForm: () => void;
  initialRecordValues?: {
    id?: string;
    description?: string;
    mileage?: number;
    partsPrice?: number;
    laborPrice?: number;
    date?: string;
    category?: RecordCategory;
    partsUsed?: string[];
    photoUrls?: string[];
    voiceTranscript?: string;
    relatedDtc?: string;
    relatedPartIds?: string[];
    source?: 'manual' | 'task' | 'obd' | 'voice';
    obdSnapshotId?: string;
  };
  onClearInitialValues?: () => void;
}

export function ServiceHistory({
  activeCar,
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  showAddForm,
  onOpenAddForm,
  onCloseAddForm,
  initialRecordValues,
  onClearInitialValues,
}: ServiceHistoryProps) {
  const { formatCurrency, formatMileage } = useUserSettings();

  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [isFinanceWidgetOpen, setIsFinanceWidgetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Filter records for active vehicle
  const carRecords = useMemo(() => {
    if (!activeCar) return [];
    return records
      .filter((r) => r.carId === activeCar.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, activeCar]);

  // Filter by search and category
  const filteredRecords = useMemo(() => {
    return carRecords.filter((r) => {
      const matchesSearch =
        !searchQuery.trim() ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.partsUsed && r.partsUsed.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        r.mileage.toString().includes(searchQuery) ||
        r.date.includes(searchQuery);

      const matchesCategory = selectedCategory === 'ALL' || r.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [carRecords, searchQuery, selectedCategory]);

  // Financial totals
  const totalSpend = useMemo(() => {
    return carRecords.reduce((sum, r) => sum + r.partsPrice + r.laborPrice, 0);
  }, [carRecords]);

  const totalPartsSpend = useMemo(() => {
    return carRecords.reduce((sum, r) => sum + r.partsPrice, 0);
  }, [carRecords]);

  const totalLaborSpend = useMemo(() => {
    return carRecords.reduce((sum, r) => sum + r.laborPrice, 0);
  }, [carRecords]);

  const handleStartEdit = (record: MaintenanceRecord) => {
    setEditingRecord(record);
    if (selectedRecord) {
      setSelectedRecord(null);
    }
  };

  const handleSaveForm = (recordData: Omit<MaintenanceRecord, 'createdAt' | 'updatedAt'>) => {
    if (editingRecord || recordData.id) {
      const existing = records.find((r) => r.id === recordData.id);
      if (existing) {
        onUpdateRecord({
          ...existing,
          ...recordData,
          updatedAt: new Date().toISOString(),
        });
      } else {
        onAddRecord(recordData);
      }
    } else {
      onAddRecord(recordData);
    }

    setEditingRecord(null);
    onCloseAddForm();
    if (onClearInitialValues) onClearInitialValues();
  };

  return (
    <div className="space-y-4 pb-28 font-sans">
      {/* 1. Header Card HUD */}
      <div className="bg-[#10151E] border border-[#1E2638] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 shadow-sm">
        <div>
          <span className="text-[10px] text-cyan-400 font-mono tracking-wider uppercase block mb-0.5">
            ИСТОРИЯ РЕМОНТА И ТО
          </span>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>Журнал технического обслуживания</span>
            {activeCar && (
              <span className="text-xs font-mono text-slate-400 font-normal">
                ({carRecords.length} записей)
              </span>
            )}
          </h2>
        </div>

        {activeCar && !showAddForm && !editingRecord && (
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(15);
              onOpenAddForm();
            }}
            className="w-full sm:w-auto btn-primary text-xs flex items-center justify-center gap-1.5 rounded-xl shadow-sm"
            id="btn-show-add-record"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить запись</span>
          </button>
        )}
      </div>

      {/* 2. Financial Summary Widget */}
      {activeCar && carRecords.length > 0 && (
        <div className="bg-[#10151E] border border-[#1E2638] rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
          <div
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              setIsFinanceWidgetOpen((prev) => !prev);
            }}
          >
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-xs sm:text-sm font-semibold text-slate-200">
                Финансовый учет •{' '}
                <span className="font-mono text-cyan-300 font-bold">
                  {formatCurrency(totalSpend)}
                </span>
              </span>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
            >
              <span>{isFinanceWidgetOpen ? 'Свернуть' : 'Подробнее'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${isFinanceWidgetOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {isFinanceWidgetOpen && (
            <div className="pt-3 border-t border-[#1E2638] grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-[#151B25] p-3.5 rounded-xl border border-[#1E2638]">
                <span className="block text-[11px] text-slate-400 mb-1">Выполнено работ</span>
                <span className="text-sm font-bold text-slate-100 font-mono">
                  {carRecords.length} шт
                </span>
              </div>
              <div className="bg-[#151B25] p-3.5 rounded-xl border border-[#1E2638]">
                <span className="block text-[11px] text-slate-400 mb-1">Запчасти & Расходники</span>
                <span className="text-sm font-bold text-cyan-200 font-mono">
                  {formatCurrency(totalPartsSpend)}
                </span>
              </div>
              <div className="bg-[#151B25] p-3.5 rounded-xl border border-[#1E2638]">
                <span className="block text-[11px] text-slate-400 mb-1">Стоимость работ</span>
                <span className="text-sm font-bold text-slate-200 font-mono">
                  {formatCurrency(totalLaborSpend)}
                </span>
              </div>
              <div className="bg-[#151B25] p-3.5 rounded-xl border border-cyan-500/30">
                <span className="block text-[11px] text-cyan-400 mb-1">Общие расходы (ИТОГО)</span>
                <span className="text-sm font-bold text-cyan-300 font-mono">
                  {formatCurrency(totalSpend)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Search and Category Filter Bar */}
      {carRecords.length > 0 && (
        <div className="bg-[#10151E] border border-[#1E2638] rounded-2xl p-3.5 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center shadow-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по работам, запчастям, пробегу или дате..."
              className="w-full bg-[#151B25] border border-[#1E2638] focus:border-cyan-400 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#151B25] border border-[#1E2638] text-slate-200 text-xs rounded-xl px-3 py-2 focus:border-cyan-400 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Все категории узлов</option>
              {Object.entries(CATEGORY_NAMES).map(([catKey, catName]) => (
                <option key={catKey} value={catKey}>
                  {catName}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 4. Add or Edit Record Modal Form */}
      {(showAddForm || editingRecord) && activeCar && (
        <AddRecordForm
          carId={activeCar.id}
          currentCarMileage={activeCar.mileage}
          onRecordAdded={handleSaveForm}
          onCancel={() => {
            setEditingRecord(null);
            onCloseAddForm();
            if (onClearInitialValues) onClearInitialValues();
          }}
          initialValues={
            editingRecord
              ? {
                  id: editingRecord.id,
                  description: editingRecord.description,
                  mileage: editingRecord.mileage,
                  partsPrice: editingRecord.partsPrice,
                  laborPrice: editingRecord.laborPrice,
                  date: editingRecord.date,
                  category: editingRecord.category,
                  partsUsed: editingRecord.partsUsed,
                  photoUrls: editingRecord.photoUrls,
                  voiceTranscript: editingRecord.voiceTranscript,
                }
              : initialRecordValues
          }
        />
      )}

      {/* 5. Detailed Record Modal */}
      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          isOpen={Boolean(selectedRecord)}
          onClose={() => setSelectedRecord(null)}
          onEdit={(rec) => {
            setSelectedRecord(null);
            handleStartEdit(rec);
          }}
          onDelete={(id) => {
            setSelectedRecord(null);
            onDeleteRecord(id);
          }}
        />
      )}

      {/* 6. List of Service Record Cards */}
      <div className="space-y-3">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <ServiceRecordCard
              key={record.id}
              record={record}
              onSelect={(rec) => {
                if (navigator.vibrate) navigator.vibrate(10);
                setSelectedRecord(rec);
              }}
              onEdit={handleStartEdit}
              onDelete={onDeleteRecord}
            />
          ))
        ) : carRecords.length > 0 ? (
          <div className="bg-[#10151E] border border-dashed border-[#1E2638] rounded-2xl p-8 text-center text-slate-400 text-xs">
            Записи по фильтру "{searchQuery || selectedCategory}" не найдены.
          </div>
        ) : (
          <div className="bg-[#10151E] border border-dashed border-[#1E2638] rounded-2xl p-10 text-center">
            <Wrench className="w-10 h-10 text-cyan-400/40 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-200 mb-1">
              Журнал записей пуст
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Для выбранного автомобиля пока нет зарегистрированных записей о ремонте и замене расходников.
            </p>
            {activeCar && !showAddForm && (
              <button
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(15);
                  onOpenAddForm();
                }}
                className="btn-primary text-xs rounded-xl"
                id="btn-empty-add"
              >
                <Plus className="w-4 h-4 mr-1" />
                Добавить первую запись
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
