/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Gauge, Check, Edit3, X, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { Car } from '../types';
import { OdometerStaleStatus, markOdometerConfirmedToday } from '../lib/calcSmartReminders';

interface OdometerPromptBannerProps {
  car: Car;
  status: OdometerStaleStatus;
  onUpdateMileage: (newMileage: number) => void;
  onDismiss?: () => void;
}

export function OdometerPromptBanner({
  car,
  status,
  onUpdateMileage,
  onDismiss,
}: OdometerPromptBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customMileage, setCustomMileage] = useState<string>(String(car.mileage || ''));
  const [errorText, setErrorText] = useState<string | null>(null);

  const currentKm = car.mileage || 0;

  const handleQuickAdd = (delta: number) => {
    if (navigator.vibrate) navigator.vibrate(15);
    const newKm = currentKm + delta;
    markOdometerConfirmedToday(car.id);
    onUpdateMileage(newKm);
    if (onDismiss) onDismiss();
  };

  const handleConfirmCurrent = () => {
    if (navigator.vibrate) navigator.vibrate(15);
    markOdometerConfirmedToday(car.id);
    onUpdateMileage(currentKm);
    if (onDismiss) onDismiss();
  };

  const handleSaveCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseInt(customMileage.replace(/\D/g, ''), 10);
    if (isNaN(val) || val <= 0) {
      setErrorText('Пожалуйста, введите корректный пробег');
      return;
    }
    if (navigator.vibrate) navigator.vibrate(20);
    markOdometerConfirmedToday(car.id);
    onUpdateMileage(val);
    setIsModalOpen(false);
    if (onDismiss) onDismiss();
  };

  return (
    <>
      {/* Non-intrusive Ambient Banner on Dashboard */}
      <div 
        id="banner-odometer-stale-prompt"
        className="w-full mb-4 bg-gradient-to-r from-[#121927] via-[#152033] to-[#101726] border border-cyan-500/30 rounded-xl p-3.5 sm:p-4 shadow-lg shadow-cyan-950/20 relative overflow-hidden"
      >
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5 text-cyan-400">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Василич уточняет пробег
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {status.daysSinceUpdate} дн. без обновления
                </span>
              </div>
              <p className="text-sm text-slate-200 mt-0.5 font-medium">
                Сейчас всё ещё <span className="text-white font-mono font-bold">{currentKm.toLocaleString('ru-RU')} км</span>?
              </p>
            </div>
          </div>

          {/* Quick 1-Click Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap sm:shrink-0">
            <button
              type="button"
              id="btn-odometer-confirm-current"
              onClick={handleConfirmCurrent}
              className="h-8 px-2.5 bg-[#1C2638] hover:bg-[#233149] text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1 active:scale-95"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Да, всё верно</span>
            </button>

            <button
              type="button"
              id="btn-odometer-add-100"
              onClick={() => handleQuickAdd(100)}
              className="h-8 px-2.5 bg-[#172235] hover:bg-[#1E2D47] text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-mono font-medium cursor-pointer transition-all active:scale-95"
            >
              +100 км
            </button>

            <button
              type="button"
              id="btn-odometer-add-500"
              onClick={() => handleQuickAdd(500)}
              className="h-8 px-2.5 bg-[#172235] hover:bg-[#1E2D47] text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-mono font-medium cursor-pointer transition-all active:scale-95"
            >
              +500 км
            </button>

            <button
              type="button"
              id="btn-odometer-open-custom-edit"
              onClick={() => {
                setCustomMileage(String(currentKm));
                setErrorText(null);
                setIsModalOpen(true);
              }}
              className="h-8 px-2.5 bg-[#151D2A] hover:bg-[#1D293B] text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1 active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
              <span>Изменить</span>
            </button>
          </div>
        </div>
      </div>

      {/* Full Modal for Exact Custom Mileage Editing */}
      {isModalOpen && (
        <div 
          id="modal-odometer-update"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-sm bg-[#101725] border border-cyan-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Актуализация одометра</h3>
                  <p className="text-xs text-slate-400">{car.make} {car.model}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustom} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Текущий пробег на приборной панели (км):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    autoFocus
                    value={customMileage}
                    onChange={(e) => {
                      setCustomMileage(e.target.value);
                      setErrorText(null);
                    }}
                    placeholder="Например, 65400"
                    className="w-full bg-[#0A0E17] border border-cyan-500/40 rounded-xl px-4 py-3 text-lg font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-mono">
                    км
                  </span>
                </div>
                {errorText && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errorText}
                  </p>
                )}
              </div>

              {/* Quick Increments */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomMileage(String((parseInt(customMileage || '0', 10) || currentKm) + 100))}
                  className="flex-1 py-1.5 bg-[#151F30] hover:bg-[#1B2940] text-cyan-300 border border-cyan-500/25 rounded-lg text-xs font-mono transition-colors"
                >
                  +100
                </button>
                <button
                  type="button"
                  onClick={() => setCustomMileage(String((parseInt(customMileage || '0', 10) || currentKm) + 500))}
                  className="flex-1 py-1.5 bg-[#151F30] hover:bg-[#1B2940] text-cyan-300 border border-cyan-500/25 rounded-lg text-xs font-mono transition-colors"
                >
                  +500
                </button>
                <button
                  type="button"
                  onClick={() => setCustomMileage(String((parseInt(customMileage || '0', 10) || currentKm) + 1000))}
                  className="flex-1 py-1.5 bg-[#151F30] hover:bg-[#1B2940] text-cyan-300 border border-cyan-500/25 rounded-lg text-xs font-mono transition-colors"
                >
                  +1 000
                </button>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-[#151C28] hover:bg-[#1C2536] text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Сохранить</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
