/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useUserSettings } from './UserSettingsContext';
import { Currency, DistanceUnit, VolumeUnit, PressureUnit, AssistantTone, Car, MaintenanceRecord } from '../types';
import { generateServiceBookPdf } from '../lib/serviceBookPdf';
import { 
  DollarSign, 
  Gauge, 
  Droplet, 
  MessageSquare, 
  ShieldCheck, 
  Activity, 
  FileDown, 
  FileText,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Car as CarIcon,
  Loader2,
  Receipt
} from 'lucide-react';

interface SettingsPanelProps {
  cars?: Car[];
  activeCarId?: string | null;
  records?: MaintenanceRecord[];
}

export function SettingsPanel({
  cars: propCars,
  activeCarId: propActiveCarId,
  records: propRecords,
}: SettingsPanelProps = {}) {
  const { settings, updateSettings, currencySymbol, distanceLabel, formatCurrency, formatMileage } = useUserSettings();

  // Retrieve cars and records from props or localStorage fallback
  const getCars = (): Car[] => {
    if (propCars && propCars.length > 0) return propCars;
    try {
      return JSON.parse(localStorage.getItem('terminal_cars_v2') || '[]');
    } catch {
      return [];
    }
  };

  const getActiveCarId = (): string | null => {
    if (propActiveCarId) return propActiveCarId;
    return localStorage.getItem('terminal_active_car_id_v2') || null;
  };

  const getRecords = (): MaintenanceRecord[] => {
    if (propRecords && propRecords.length > 0) return propRecords;
    try {
      return JSON.parse(localStorage.getItem('terminal_records_v2') || '[]');
    } catch {
      return [];
    }
  };

  const cars = getCars();
  const records = getRecords();
  const activeCarId = getActiveCarId() || (cars.length > 0 ? cars[0].id : null);

  const [selectedCarIdForPdf, setSelectedCarIdForPdf] = useState<string>(activeCarId || (cars[0]?.id || ''));
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);
  const [pdfErrorMessage, setPdfErrorMessage] = useState<string | null>(null);

  const selectedCar = cars.find(c => c.id === selectedCarIdForPdf) || cars[0] || null;
  const carRecords = selectedCar ? records.filter(r => r.carId === selectedCar.id) : [];
  const carTotalSpent = carRecords.reduce((acc, r) => acc + (r.partsPrice || 0) + (r.laborPrice || 0), 0);

  const handleDownloadPdf = async () => {
    if (!selectedCar) {
      setPdfErrorMessage('Сначала добавьте автомобиль в гараж.');
      return;
    }

    if (navigator.vibrate) navigator.vibrate(20);
    setIsGeneratingPdf(true);
    setPdfSuccessMessage(null);
    setPdfErrorMessage(null);

    try {
      await generateServiceBookPdf({
        car: selectedCar,
        records: carRecords,
        currencySymbol,
        distanceLabel,
      });

      setPdfSuccessMessage(`Сервисная книжка для ${selectedCar.make} ${selectedCar.model} успешно сформирована и сохранена.`);
      setTimeout(() => setPdfSuccessMessage(null), 6000);
    } catch (err) {
      console.error('Error generating PDF service book:', err);
      setPdfErrorMessage('Не удалось сформировать PDF документ. Попробуйте еще раз.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCurrencyChange = (currency: Currency) => {
    if (navigator.vibrate) navigator.vibrate(15);
    updateSettings({ currency });
  };

  const handleDistanceChange = (distanceUnit: DistanceUnit) => {
    if (navigator.vibrate) navigator.vibrate(15);
    updateSettings({ distanceUnit });
  };

  const handleVolumeChange = (volumeUnit: VolumeUnit) => {
    if (navigator.vibrate) navigator.vibrate(15);
    updateSettings({ volumeUnit });
  };

  const handlePressureChange = (pressureUnit: PressureUnit) => {
    if (navigator.vibrate) navigator.vibrate(15);
    updateSettings({ pressureUnit });
  };

  const handleToneChange = (assistantTone: AssistantTone) => {
    if (navigator.vibrate) navigator.vibrate(15);
    updateSettings({ assistantTone });
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div className="bg-[#111622] border border-[#1E273D] rounded-2xl p-4 sm:p-5 relative shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/25 text-[#06B6D4] rounded-xl shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              Настройки приложения
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Единицы измерения, стиль консультаций ИИ-ассистента и формирование официальной сервисной книжки.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Service Book & Reports Section (NEW PDF EXPORT) */}
      <div className="bg-[#111622] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 relative space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-[#06B6D4]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-100">
                Отчеты и сервисная книжка
              </h3>
              <p className="text-[11px] text-slate-400">
                Официальный PDF-документ с историей обслуживания для продажи авто или личного архива.
              </p>
            </div>
          </div>
        </div>

        {/* Multi-car selector if user has more than 1 vehicle */}
        {cars.length > 1 && (
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-semibold text-slate-300 block">
              Выберите автомобиль для выгрузки:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {cars.map((car) => {
                const isSelected = (selectedCar?.id === car.id);
                return (
                  <button
                    key={car.id}
                    type="button"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(10);
                      setSelectedCarIdForPdf(car.id);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#151C2C] border-cyan-500/60 text-slate-100 shadow-sm'
                        : 'bg-[#0B0E14] border-[#1E273D] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CarIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#06B6D4]' : 'text-slate-500'}`} />
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-200 truncate">
                          {car.make} {car.model}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {car.year} г. • {formatMileage(car.mileage)}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[9px] font-bold bg-[#06B6D4] text-slate-950 px-2 py-0.5 rounded-md shrink-0">
                        Выбран
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Car Info & Summary Card */}
        {selectedCar ? (
          <div className="bg-[#0B0E14] border border-[#1E273D] rounded-xl p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E273D] pb-2.5">
              <div className="flex items-center gap-2">
                <CarIcon className="w-4 h-4 text-[#06B6D4]" />
                <span className="text-xs font-bold text-slate-200">
                  {selectedCar.make} {selectedCar.model} ({selectedCar.year} г.)
                </span>
                {selectedCar.vin && (
                  <span className="text-[10px] font-mono text-slate-400 bg-[#151C2C] px-2 py-0.5 rounded border border-[#1E273D]">
                    VIN: {selectedCar.vin}
                  </span>
                )}
              </div>
              <div className="text-xs font-semibold text-cyan-400">
                {formatMileage(selectedCar.mileage)}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-[#111622] p-2.5 rounded-lg border border-[#1E273D]/60">
                <div className="text-[10px] text-slate-400">Записей в истории:</div>
                <div className="text-sm font-bold text-slate-100 mt-0.5">
                  {carRecords.length} шт.
                </div>
              </div>
              <div className="bg-[#111622] p-2.5 rounded-lg border border-[#1E273D]/60">
                <div className="text-[10px] text-slate-400">Всего затрат на авто:</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">
                  {formatCurrency(carTotalSpent)}
                </div>
              </div>
              <div className="bg-[#111622] p-2.5 rounded-lg border border-[#1E273D]/60 col-span-2 sm:col-span-1">
                <div className="text-[10px] text-slate-400">Формат экспорта:</div>
                <div className="text-sm font-bold text-cyan-400 mt-0.5 flex items-center gap-1">
                  <span>PDF документ A4</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-[#0B0E14] border border-[#1E273D] text-slate-400 text-xs rounded-xl text-center">
            Автомобиль не выбран или отсутствует в гараже.
          </div>
        )}

        {/* Feedback Messages */}
        {pdfSuccessMessage && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{pdfSuccessMessage}</span>
          </div>
        )}

        {pdfErrorMessage && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{pdfErrorMessage}</span>
          </div>
        )}

        {/* Action Button: Download Service Book (PDF) */}
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf || !selectedCar}
          className="btn-primary w-full py-3 px-4 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          id="btn-download-service-book-pdf"
        >
          {isGeneratingPdf ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>Формирование сервисной книжки PDF...</span>
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4 text-slate-950" />
              <span>Скачать сервисную книжку (PDF)</span>
            </>
          )}
        </button>
      </div>

      {/* Units and Measurements Section */}
      <div className="bg-[#111622] border border-[#1E273D] rounded-2xl p-4 sm:p-5 relative space-y-4 shadow-sm">
        <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#06B6D4]" /> Единицы измерения
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Currency Unit */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#06B6D4]" /> Валюта
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['RUB', 'USD', 'EUR', 'KZT'] as Currency[]).map((c) => {
                const symbols: Record<Currency, string> = {
                  RUB: '₽',
                  USD: '$',
                  EUR: '€',
                  KZT: '₸'
                };
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleCurrencyChange(c)}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                      settings.currency === c
                        ? 'bg-[#151C2C] text-[#06B6D4] border-cyan-500/50 shadow-sm'
                        : 'bg-[#0B0E14] text-slate-400 border-[#1E273D] hover:border-slate-700'
                    }`}
                    id={`btn-currency-${c.toLowerCase()}`}
                  >
                    <span>{c}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{symbols[c]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Distance Unit */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-[#06B6D4]" /> Пробег и дистанция
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['km', 'mi'] as DistanceUnit[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDistanceChange(d)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    settings.distanceUnit === d
                      ? 'bg-[#151C2C] text-[#06B6D4] border-cyan-500/50 shadow-sm'
                      : 'bg-[#0B0E14] text-slate-400 border-[#1E273D] hover:border-slate-700'
                  }`}
                  id={`btn-distance-${d}`}
                >
                  {d === 'km' ? 'Километры (км)' : 'Мили (mi)'}
                </button>
              ))}
            </div>
          </div>

          {/* Volume Unit */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5 text-[#06B6D4]" /> Объём жидкостей
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['L', 'gal'] as VolumeUnit[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleVolumeChange(v)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    settings.volumeUnit === v
                      ? 'bg-[#151C2C] text-[#06B6D4] border-cyan-500/50 shadow-sm'
                      : 'bg-[#0B0E14] text-slate-400 border-[#1E273D] hover:border-slate-700'
                  }`}
                  id={`btn-volume-${v}`}
                >
                  {v === 'L' ? 'Литры (л)' : 'Галлоны (gal)'}
                </button>
              ))}
            </div>
          </div>

          {/* Pressure Unit */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-[#06B6D4]" /> Давление в шинах
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['bar', 'PSI', 'kPa'] as PressureUnit[]).map((p) => {
                const labels: Record<PressureUnit, string> = {
                  bar: 'Бар (bar)',
                  PSI: 'PSI',
                  kPa: 'кПа (kPa)'
                };
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePressureChange(p)}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      settings.pressureUnit === p
                        ? 'bg-[#151C2C] text-[#06B6D4] border-cyan-500/50 shadow-sm'
                        : 'bg-[#0B0E14] text-slate-400 border-[#1E273D] hover:border-slate-700'
                    }`}
                    id={`btn-pressure-${p.toLowerCase()}`}
                  >
                    {labels[p]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI Assistant Tone Settings */}
        <div className="pt-3 border-t border-[#1E273D] space-y-2.5">
          <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#06B6D4]" /> Стиль консультаций ИИ-ассистента
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Tone Option 1: Vasilich */}
            <button
              type="button"
              onClick={() => handleToneChange('vasilich')}
              className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 relative ${
                settings.assistantTone === 'vasilich'
                  ? 'bg-[#151C2C] border-cyan-500/50 text-slate-100 shadow-sm'
                  : 'border-[#1E273D] text-slate-400 hover:text-slate-200 bg-[#0B0E14]'
              }`}
              id="btn-tone-vasilich"
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-xs font-semibold text-cyan-300">
                  Опытный автомеханик
                </span>
                {settings.assistantTone === 'vasilich' && (
                  <span className="text-[9px] bg-[#06B6D4] text-slate-950 font-bold px-1.5 py-0.5 rounded">
                    Выбран
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-snug">
                Практические советы из гаражной практики, частые «болячки» моделей и надёжные решения.
              </p>
            </button>

            {/* Tone Option 2: Technical/Strict */}
            <button
              type="button"
              onClick={() => handleToneChange('strict')}
              className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 relative ${
                settings.assistantTone === 'strict'
                  ? 'bg-[#151C2C] border-cyan-500/50 text-slate-100 shadow-sm'
                  : 'border-[#1E273D] text-slate-400 hover:text-slate-200 bg-[#0B0E14]'
              }`}
              id="btn-tone-strict"
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-xs font-semibold text-cyan-300">
                  Строгий техэксперт
                </span>
                {settings.assistantTone === 'strict' && (
                  <span className="text-[9px] bg-[#06B6D4] text-slate-950 font-bold px-1.5 py-0.5 rounded">
                    Выбран
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-snug">
                Академический тон, допуски OEM/SAE/API, моменты затяжки (Н·м) и пошаговые алгоритмы.
              </p>
            </button>

            {/* Tone Option 3: Brief */}
            <button
              type="button"
              onClick={() => handleToneChange('brief')}
              className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 relative ${
                settings.assistantTone === 'brief'
                  ? 'bg-[#151C2C] border-cyan-500/50 text-slate-100 shadow-sm'
                  : 'border-[#1E273D] text-slate-400 hover:text-slate-200 bg-[#0B0E14]'
              }`}
              id="btn-tone-brief"
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-xs font-semibold text-cyan-300">
                  Кратко и по делу
                </span>
                {settings.assistantTone === 'brief' && (
                  <span className="text-[9px] bg-[#06B6D4] text-slate-950 font-bold px-1.5 py-0.5 rounded">
                    Выбран
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-snug">
                Телеграфный стиль: максимум 2-3 предложения, без приветствий, только цифры и факты.
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Security note / footer status */}
      <div className="border border-[#1E273D] bg-[#111622] rounded-2xl p-3.5 flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[#06B6D4] shrink-0" />
        <span className="text-xs text-slate-400 leading-relaxed">
          Все данные и настройки сохраняются локально в вашем браузере. Выгружайте электронную сервисную книжку в PDF для сохранения истории.
        </span>
      </div>
    </div>
  );
}
