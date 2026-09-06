/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  X, 
  QrCode, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Gauge, 
  Loader2,
  Sparkles,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import QRCode from 'qrcode';
import { Car, MaintenanceRecord } from '../types';
import { useUserSettings } from './UserSettingsContext';
import { CATEGORY_NAMES } from './AddRecordForm';
import { calculateAllFluidsHealth, FluidKey } from '../lib/calcFluidHealth';
import { generateServiceBookPdf } from '../lib/serviceBookPdf';

interface PdfServiceReportProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car | null;
  records: MaintenanceRecord[];
}

export function PdfServiceReport({
  isOpen,
  onClose,
  car,
  records,
}: PdfServiceReportProps) {
  const { currencySymbol, distanceLabel } = useUserSettings();
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const carRecords = React.useMemo(() => {
    if (!car) return [];
    return records
      .filter(r => r.carId === car.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [car, records]);

  const fluidsHealth = React.useMemo(() => {
    if (!car) return null;
    return calculateAllFluidsHealth({
      carId: car.id,
      currentMileage: car.mileage || 0,
      records: carRecords,
    });
  }, [car, carRecords]);

  const totalPartsCost = React.useMemo(() => {
    return carRecords.reduce((acc, r) => acc + (r.partsPrice || 0), 0);
  }, [carRecords]);

  const totalLaborCost = React.useMemo(() => {
    return carRecords.reduce((acc, r) => acc + (r.laborPrice || 0), 0);
  }, [carRecords]);

  const grandTotalCost = totalPartsCost + totalLaborCost;

  // Generate QR code for preview
  useEffect(() => {
    if (!car) return;
    const url = typeof window !== 'undefined' ? `${window.location.origin}/#car-${car.id}` : 'https://terminal.car';
    QRCode.toDataURL(url, {
      width: 120,
      margin: 1,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.warn('QR preview error', err));
  }, [car]);

  if (!isOpen || !car) return null;

  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true);
      if (navigator.vibrate) navigator.vibrate(20);
      await generateServiceBookPdf({
        car,
        records: carRecords,
        currencySymbol,
        distanceLabel,
      });
    } catch (err) {
      console.error('PDF Generation failed', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const fluidKeys: FluidKey[] = ['engine_oil', 'brake_fluid', 'coolant', 'transmission_oil'];

  return (
    <div 
      id="modal-pdf-service-report"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto"
    >
      <div className="w-full max-w-4xl bg-[#0D121D] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 bg-[#121927] border-b border-[#1E273D] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/15 text-cyan-400 rounded-lg border border-cyan-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Электронная сервисная книжка</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  PDF Экспорт
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {car.make} {car.model} ({car.year}) • Одометр: {car.mileage?.toLocaleString('ru-RU')} {distanceLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-pdf-download-action"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="h-9 px-3.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Формирование PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Скачать PDF (A4)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="h-9 px-3 bg-[#172133] hover:bg-[#1E2B42] text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700 hidden sm:flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Печать"
            >
              <Printer className="w-4 h-4" />
              <span>Печать</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Live Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#090D15]">
          
          {/* Paper Sheet Preview */}
          <div className="bg-white text-slate-900 rounded-xl p-6 sm:p-8 shadow-2xl border border-slate-200 max-w-3xl mx-auto font-sans">
            
            {/* Sheet Header */}
            <div className="border-b-2 border-[#0284C7] pb-4 mb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3.5 h-3.5 bg-[#0284C7] rounded-xs" />
                  <span className="text-[11px] font-black text-[#0284C7] tracking-wider uppercase">
                    ВАСИЛИЧ // ИНЖЕНЕРНЫЙ ТЕРМИНАЛ
                  </span>
                </div>
                <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                  ЦИФРОВАЯ СЕРВИСНАЯ КНИЖКА
                </h1>
                <p className="text-xs text-slate-600 mt-0.5">
                  Официальный электронный реестр обслуживания, регламентных замен и технического состояния
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 sm:text-right shrink-0">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Дата выгрузки</div>
                <div className="text-xs font-black text-slate-900">{new Date().toLocaleDateString('ru-RU')}</div>
                <div className="text-[9px] text-slate-400 font-mono">
                  {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} МСК
                </div>
              </div>
            </div>

            {/* Passport Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
              <div className="text-[10px] font-black text-[#0284C7] uppercase tracking-wider mb-2.5">
                Паспортные данные автомобиля
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">Автомобиль:</div>
                  <div className="text-sm font-black text-slate-950 mt-0.5">{car.make} {car.model}</div>
                  <div className="text-[10px] text-slate-600">{car.year} г.в. {car.engine ? `• ${car.engine}` : ''}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">VIN-номер:</div>
                  <div className="text-xs font-mono font-bold text-slate-950 mt-0.5 break-all">
                    {car.vin || 'Не указан'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">Гос. номер:</div>
                  <div className="text-xs font-bold text-slate-950 mt-0.5">
                    {car.licensePlate || 'Не указан'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">Текущий одометр:</div>
                  <div className="text-sm font-mono font-black text-[#0284C7] mt-0.5">
                    {car.mileage?.toLocaleString('ru-RU')} {distanceLabel}
                  </div>
                </div>
              </div>
            </div>

            {/* Block 1: ЗДОРОВЬЕ ЖИДКОСТЕЙ */}
            {fluidsHealth && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-wide flex items-center gap-1.5">
                    <span className="text-[#0284C7]">■</span>
                    Здоровье технических жидкостей (Регламент Dual-Limit)
                  </h3>
                  <span className="text-[10px] text-slate-500">Контроль по километражу и старению</span>
                </div>

                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <table className="w-full text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white text-[10px]">
                        <th className="p-2 text-left font-bold">Тех. жидкость</th>
                        <th className="p-2 text-right font-bold">Пробег / Лимит</th>
                        <th className="p-2 text-right font-bold">Срок / Лимит</th>
                        <th className="p-2 text-center font-bold">Ресурс</th>
                        <th className="p-2 text-center font-bold">Статус</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {fluidKeys.map(key => {
                        const f = fluidsHealth[key];
                        const isCrit = f.remainingHealth < 10;
                        const isDue = f.statusLevel === 'replace_due';
                        return (
                          <tr key={key} className="hover:bg-slate-50/80">
                            <td className="p-2 font-bold text-slate-800">{f.nameRu}</td>
                            <td className="p-2 font-mono text-right text-slate-700">
                              {f.kmPassed.toLocaleString('ru-RU')} / {f.maxKm.toLocaleString('ru-RU')} км
                            </td>
                            <td className="p-2 font-mono text-right text-slate-700">
                              {f.daysPassed} / {f.maxDays} дн.
                            </td>
                            <td className="p-2 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${isCrit ? 'bg-rose-500' : isDue ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${Math.max(4, f.remainingHealth)}%` }}
                                  />
                                </div>
                                <span className="font-mono font-bold text-[10px]">{f.remainingHealth}%</span>
                              </div>
                            </td>
                            <td className="p-2 text-center">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                isCrit 
                                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                                  : isDue
                                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                                  : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              }`}>
                                {f.statusText}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Block 2: ХРОНОЛОГИЯ ОБСЛУЖИВАНИЯ */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wide flex items-center gap-1.5">
                  <span className="text-[#0284C7]">■</span>
                  Хронология обслуживания и выполненных работ
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold">
                  Записей: {carRecords.length}
                </span>
              </div>

              {carRecords.length === 0 ? (
                <div className="border border-dashed border-slate-300 rounded-lg p-5 text-center text-xs text-slate-500">
                  Записи о ТО отсутствуют.
                </div>
              ) : (
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <table className="w-full text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white text-[10px]">
                        <th className="p-2 text-center font-bold w-7">№</th>
                        <th className="p-2 text-left font-bold w-20">Дата</th>
                        <th className="p-2 text-right font-bold w-24">Пробег</th>
                        <th className="p-2 text-left font-bold w-28">Категория</th>
                        <th className="p-2 text-left font-bold">Работы и запчасти</th>
                        <th className="p-2 text-right font-bold w-24">Стоимость</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {carRecords.map((r, idx) => {
                        const total = (r.partsPrice || 0) + (r.laborPrice || 0);
                        const parts = r.partsUsed && r.partsUsed.length > 0 ? r.partsUsed.join(', ') : '';
                        return (
                          <tr key={r.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="p-2 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                            <td className="p-2 font-medium text-slate-700 whitespace-nowrap">
                              {new Date(r.date).toLocaleDateString('ru-RU')}
                            </td>
                            <td className="p-2 font-mono font-bold text-right text-[#0284C7] whitespace-nowrap">
                              {r.mileage?.toLocaleString('ru-RU')} {distanceLabel}
                            </td>
                            <td className="p-2">
                              <span className="inline-block bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded text-[9.5px] font-semibold">
                                {CATEGORY_NAMES[r.category] || r.category || 'ТО'}
                              </span>
                            </td>
                            <td className="p-2 text-slate-900 leading-snug">
                              <div className="font-bold">{r.description || 'Регламентное ТО'}</div>
                              {parts && (
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  <span className="font-semibold text-slate-600">Запчасти:</span> {parts}
                                </div>
                              )}
                            </td>
                            <td className="p-2 font-mono font-bold text-right text-slate-950 whitespace-nowrap">
                              {total.toLocaleString('ru-RU')} {currencySymbol}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-900 text-white rounded-lg p-3.5 sm:p-4 mb-6">
              <div className="text-[9.5px] font-black uppercase tracking-wider text-cyan-400 mb-2">
                Итоговая финансовая сводка
              </div>
              <div className="grid grid-cols-3 gap-3 border-t border-slate-700 pt-2.5 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Запчасти:</div>
                  <div className="text-sm font-mono font-bold text-white mt-0.5">
                    {totalPartsCost.toLocaleString('ru-RU')} {currencySymbol}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Работы и сервис:</div>
                  <div className="text-sm font-mono font-bold text-white mt-0.5">
                    {totalLaborCost.toLocaleString('ru-RU')} {currencySymbol}
                  </div>
                </div>
                <div className="bg-cyan-950/60 border border-cyan-500/40 rounded-lg p-2">
                  <div className="text-[9.5px] font-bold text-cyan-300">ОБЩАЯ СУММА:</div>
                  <div className="text-base font-mono font-black text-cyan-400 mt-0.5">
                    {grandTotalCost.toLocaleString('ru-RU')} {currencySymbol}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with Branding and QR Code */}
            <div className="border-t-2 border-slate-200 pt-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-slate-900">
                  Сформировано в приложении ВАСИЛИЧ // Инженерный Терминал
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Электронная верификация сервисной истории автомобиля
                </div>
                <div className="text-[9px] font-mono text-slate-400 mt-1">
                  DOC-ID: {car.id.toUpperCase()}-{Date.now().toString(36).toUpperCase()}
                </div>
              </div>

              {qrCodeDataUrl && (
                <div className="flex items-center gap-2.5 text-right shrink-0">
                  <div>
                    <div className="text-[10px] font-bold text-slate-800">Электронный паспорт</div>
                    <div className="text-[9px] text-slate-500">Наведите камеру</div>
                  </div>
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Код паспорта" 
                    className="w-12 h-12 border border-slate-300 rounded p-0.5 bg-white" 
                  />
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Modal Bottom Bar with Action */}
        <div className="px-5 py-3.5 bg-[#121927] border-t border-[#1E273D] flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            PDF готов к скачиванию или печати для подтверждения истории перед продажей
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#172133] hover:bg-[#1E2B42] text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              Закрыть
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Скачать PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
