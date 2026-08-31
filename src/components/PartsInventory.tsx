/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Part } from '../types';
import { useUserSettings } from './UserSettingsContext';
import { 
  Package, 
  Plus, 
  Search, 
  Trash2, 
  Wrench, 
  Check, 
  X, 
  AlertCircle,
  Layers,
  MapPin,
  Tag
} from 'lucide-react';

interface PartsInventoryProps {
  parts: Part[];
  onAddPart: (partData: Omit<Part, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>) => void;
  onDeletePart: (id: string) => void;
  onUsePart: (part: Part) => void;
  initialFilter?: string;
}

export function PartsInventory({
  parts,
  onAddPart,
  onDeletePart,
  onUsePart,
  initialFilter = ''
}: PartsInventoryProps) {
  const { formatCurrency, currencySymbol } = useUserSettings();

  const [showAddForm, setShowAddForm] = useState(false);
  const [searchFilter, setSearchFilter] = useState(initialFilter);

  // Form fields
  const [name, setName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState<number | ''>(0);
  const [location, setLocation] = useState('');
  const [supplier, setSupplier] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddPart({
      name: name.trim(),
      partNumber: partNumber.trim() || undefined,
      quantity: Number(quantity) || 1,
      price: price === '' ? 0 : Number(price),
      location: location.trim() || undefined,
      supplier: supplier.trim() || undefined,
    });

    // Reset Form
    setName('');
    setPartNumber('');
    setQuantity(1);
    setPrice(0);
    setLocation('');
    setSupplier('');
    setShowAddForm(false);
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const filteredParts = parts.filter(p => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.partNumber && p.partNumber.toLowerCase().includes(q)) ||
      (p.location && p.location.toLowerCase().includes(q)) ||
      (p.supplier && p.supplier.toLowerCase().includes(q))
    );
  });

  const totalPartsCount = parts.reduce((sum, p) => sum + p.quantity, 0);
  const totalStockValue = parts.reduce((sum, p) => sum + p.quantity * p.price, 0);

  return (
    <div className="space-y-3.5 font-sans">
      
      {/* 1. WAREHOUSE HEADER & STATS */}
      <div className="bg-[#111622] border border-[#1E273D] rounded-2xl p-4 sm:p-5 relative shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E273D] mb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-[#06B6D4]" />
              <span>Склад запчастей</span>
            </h2>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Учет купленных запчастей, расходников и масел
            </span>
          </div>

          {!showAddForm && (
            <button
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                setShowAddForm(true);
              }}
              className="btn-primary py-2 px-3.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
              id="btn-show-add-part"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить деталь</span>
            </button>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="bg-[#151C2C] border border-[#1E273D] p-2.5 sm:p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 block">Позиций</span>
            <span className="text-xs sm:text-sm font-semibold font-mono text-slate-100 mt-0.5 block">{parts.length} наим.</span>
          </div>

          <div className="bg-[#151C2C] border border-[#1E273D] p-2.5 sm:p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 block">Всего единиц</span>
            <span className="text-xs sm:text-sm font-semibold font-mono text-cyan-300 mt-0.5 block">{totalPartsCount} шт</span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-[#151C2C] border border-[#1E273D] p-2.5 sm:p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 block">Оценка склада</span>
            <span className="text-xs sm:text-sm font-bold font-mono text-emerald-400 mt-0.5 block">{formatCurrency(totalStockValue)}</span>
          </div>
        </div>
      </div>

      {/* 2. ADD PART FORM / MODAL */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-[#111622] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 space-y-3 relative shadow-lg">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#1E273D]">
            <div className="text-xs font-semibold text-[#06B6D4] flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Новая деталь на склад</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#151C2C] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] text-slate-300 font-medium mb-1 block">Наименование детали / расходника *</label>
              <input
                type="text"
                required
                placeholder="Свечи зажигания NGK, фильтр масляный..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#1E273D] focus:border-cyan-400 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                id="input-part-name"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300 font-medium mb-1 block">Каталожный номер (OEM артикул)</label>
              <input
                type="text"
                placeholder="2110-3707010..."
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#1E273D] focus:border-cyan-400 rounded-lg p-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none"
                id="input-part-number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="text-[11px] text-slate-300 font-medium mb-1 block">Количество (шт) *</label>
              <input
                type="number"
                required
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-[#0B0E14] border border-[#1E273D] focus:border-cyan-400 rounded-lg p-2 text-xs font-mono text-slate-100 focus:outline-none"
                id="input-part-quantity"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300 font-medium mb-1 block">Цена за единицу ({currencySymbol}) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#0B0E14] border border-[#1E273D] focus:border-cyan-400 rounded-lg p-2 text-xs font-mono text-slate-100 focus:outline-none"
                id="input-part-price"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300 font-medium mb-1 block">Место хранения / Полка</label>
              <input
                type="text"
                placeholder="Бокс 3, полка B..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#1E273D] focus:border-cyan-400 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                id="input-part-location"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-[#1E273D]">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn-secondary px-3 py-1.5 text-xs font-medium rounded-xl cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn-primary px-4 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
              id="btn-submit-part"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Сохранить на склад</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. PARTS LIST & SEARCH */}
      <div className="bg-[#111622] border border-[#1E273D] rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-sm">
        
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-[#1E273D]">
          <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Наличие деталей</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <input
                type="text"
                placeholder="Поиск по названию или артикулу..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-[#151C2C] border border-[#1E273D] focus:border-cyan-400 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="py-1 px-2 bg-[#151C2C] hover:bg-[#1C253B] border border-[#1E273D] text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Parts Table / List */}
        {filteredParts.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs min-w-[520px]">
              <thead>
                <tr className="border-b border-[#1E273D] bg-[#151C2C]/50 text-slate-400 text-[11px]">
                  <th className="p-2.5">Наименование</th>
                  <th className="p-2.5">Артикул</th>
                  <th className="p-2.5 text-center">Остаток</th>
                  <th className="p-2.5 text-right">Цена</th>
                  <th className="p-2.5">Место</th>
                  <th className="p-2.5 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E273D]/60 text-slate-300">
                {filteredParts.map((part) => (
                  <tr key={part.id} className="hover:bg-[#151C2C]/50 transition-colors">
                    <td className="p-2.5 font-medium text-slate-100">{part.name}</td>
                    <td className="p-2.5 font-mono text-[11px] text-cyan-400/80">{part.partNumber || '—'}</td>
                    <td className="p-2.5 text-center font-mono">
                      {part.quantity > 0 ? (
                        <div className="flex flex-col items-center">
                          <span className="text-emerald-400 font-medium bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[11px]">
                            {part.quantity} шт
                          </span>
                          {part.reservedQuantity && part.reservedQuantity > 0 ? (
                            <span className="text-[10px] text-amber-400 font-mono mt-0.5">
                              (резерв: {part.reservedQuantity})
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-rose-400 font-medium bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-500/20 text-[10px] whitespace-nowrap inline-block">
                          Закончилась
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-right font-mono font-medium text-slate-200">{formatCurrency(part.price)}</td>
                    <td className="p-2.5 text-[11px] text-slate-400">{part.location || '—'}</td>
                    <td className="p-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onUsePart(part)}
                          disabled={part.quantity <= 0}
                          className={`px-2 py-0.5 text-[11px] font-medium rounded-lg transition-colors ${
                            part.quantity > 0 
                              ? 'bg-[#151C2C] border border-cyan-500/30 text-[#06B6D4] hover:bg-[#06B6D4] hover:text-slate-950 cursor-pointer' 
                              : 'bg-[#151C2C] border border-[#1E273D] text-slate-600 cursor-not-allowed'
                          }`}
                          title="Списать в ТО"
                        >
                          В ТО
                        </button>
                        <button
                          onClick={() => onDeletePart(part.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Удалить деталь"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#151C2C] border border-[#1E273D] flex items-center justify-center mx-auto text-slate-500">
              <Package className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-400">
              {searchFilter ? `По запросу "${searchFilter}" ничего не найдено.` : 'На складе пока нет деталей.'}
            </p>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-secondary px-3 py-1.5 text-[#06B6D4] text-xs font-medium rounded-xl cursor-pointer"
              >
                + Добавить деталь
              </button>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
