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
    <div className="space-y-4 font-sans">
      
      {/* 1. WAREHOUSE HEADER & STATS */}
      <div className="bg-[#10151E] border border-[#1E2638] rounded-2xl p-4 sm:p-5 relative shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2638] mb-3.5">
          <div>
            <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block">Гаражный инвентарь</span>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-400" />
              <span>Склад запчастей и расходников</span>
            </h2>
          </div>

          {!showAddForm && (
            <button
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                setShowAddForm(true);
              }}
              className="btn-primary py-2 px-3.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
              id="btn-show-add-part"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить деталь</span>
            </button>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="bg-[#151B25] border border-[#1E2638] p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">Позиций в каталоге</span>
            <span className="text-sm sm:text-base font-bold font-mono text-slate-100 mt-0.5 block">{parts.length} наим.</span>
          </div>

          <div className="bg-[#151B25] border border-[#1E2638] p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">Всего единиц (шт)</span>
            <span className="text-sm sm:text-base font-bold font-mono text-cyan-300 mt-0.5 block">{totalPartsCount} шт</span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-[#151B25] border border-[#1E2638] p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">Общая стоимость склада</span>
            <span className="text-sm sm:text-base font-bold font-mono text-emerald-400 mt-0.5 block">{formatCurrency(totalStockValue)}</span>
          </div>
        </div>
      </div>

      {/* 2. ADD PART FORM / MODAL */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-[#10151E] border border-cyan-500/40 rounded-2xl p-4 sm:p-5 space-y-4 relative shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
            <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 uppercase tracking-wide">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Новая деталь на склад</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#151B25] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs text-slate-300 font-semibold mb-1.5 block">Наименование детали / расходника *</label>
              <input
                type="text"
                required
                placeholder="например, Свеча зажигания NGK BKR6E-11"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#151B25] border border-[#1E2638] focus:border-cyan-400 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                id="input-part-name"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold mb-1.5 block">Каталожный номер (OEM артикул)</label>
              <input
                type="text"
                placeholder="например, 2110-3707010"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                className="w-full bg-[#151B25] border border-[#1E2638] focus:border-cyan-400 rounded-xl p-2.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none"
                id="input-part-number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-xs text-slate-300 font-semibold mb-1.5 block">Количество (шт) *</label>
              <input
                type="number"
                required
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-[#151B25] border border-[#1E2638] focus:border-cyan-400 rounded-xl p-2.5 text-xs font-mono text-slate-100 focus:outline-none"
                id="input-part-quantity"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold mb-1.5 block">Цена за единицу ({currencySymbol}) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#151B25] border border-[#1E2638] focus:border-cyan-400 rounded-xl p-2.5 text-xs font-mono text-slate-100 focus:outline-none"
                id="input-part-price"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold mb-1.5 block">Место хранения / Полка</label>
              <input
                type="text"
                placeholder="например, Бокс B-12"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-[#151B25] border border-[#1E2638] focus:border-cyan-400 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                id="input-part-location"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#1E2638]">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn-secondary px-3.5 py-2 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn-primary px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              id="btn-submit-part"
            >
              <Check className="w-4 h-4" />
              <span>Сохранить на склад</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. PARTS LIST & SEARCH */}
      <div className="bg-[#10151E] border border-[#1E2638] rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2638]">
          <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Наличие деталей</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Поиск по названию или артикулу..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-[#151B25] border border-[#1E2638] focus:border-cyan-400 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="py-2 px-2.5 bg-[#151B25] hover:bg-[#1B2431] border border-[#1E2638] text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Parts Table / List */}
        {filteredParts.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs min-w-[560px]">
              <thead>
                <tr className="border-b border-[#1E2638] bg-[#151B25]/60 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="p-3">Наименование</th>
                  <th className="p-3">Артикул</th>
                  <th className="p-3 text-center">Остаток</th>
                  <th className="p-3 text-right">Цена</th>
                  <th className="p-3">Место</th>
                  <th className="p-3 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2638]/60 text-slate-300">
                {filteredParts.map((part) => (
                  <tr key={part.id} className="hover:bg-[#151B25] transition-colors">
                    <td className="p-3 font-semibold text-slate-100">{part.name}</td>
                    <td className="p-3 font-mono text-[11px] text-cyan-400/80">{part.partNumber || '—'}</td>
                    <td className="p-3 text-center font-mono">
                      {part.quantity > 0 ? (
                        <div className="flex flex-col items-center">
                          <span className="text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[11px]">
                            {part.quantity} шт
                          </span>
                          {part.reservedQuantity && part.reservedQuantity > 0 ? (
                            <span className="text-[10px] text-amber-400 font-mono mt-0.5">
                              (резерв: {part.reservedQuantity})
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-rose-400 font-semibold bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-500/20 text-[10px] uppercase whitespace-nowrap inline-block">
                          Закончилась
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-slate-200">{formatCurrency(part.price)}</td>
                    <td className="p-3 text-xs text-slate-400">{part.location || '—'}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onUsePart(part)}
                          disabled={part.quantity <= 0}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                            part.quantity > 0 
                              ? 'bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 cursor-pointer shadow-sm' 
                              : 'bg-[#151B25] border border-[#1E2638] text-slate-600 cursor-not-allowed'
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
          <div className="py-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#151B25] border border-[#1E2638] flex items-center justify-center mx-auto text-slate-500">
              <Package className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-400">
              {searchFilter ? `По запросу "${searchFilter}" ничего не найдено.` : 'На складе пока нет деталей.'}
            </p>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-secondary px-3.5 py-2 text-cyan-300 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
              >
                + Добавить первую деталь
              </button>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
