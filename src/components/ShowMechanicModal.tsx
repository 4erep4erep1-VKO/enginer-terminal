/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Car, MaintenanceRecord, VehicleTask } from '../types';
import { useUserSettings } from './UserSettingsContext';
import { 
  X, 
  Copy, 
  Check, 
  Wrench, 
  Car as CarIcon, 
  Gauge, 
  Calendar, 
  AlertCircle,
  FileText,
  Bot
} from 'lucide-react';

interface ShowMechanicModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car | null;
  records: MaintenanceRecord[];
  tasks: VehicleTask[];
  onAskVasilich?: (question: string) => void;
}

export function ShowMechanicModal({
  isOpen,
  onClose,
  car,
  records,
  tasks,
  onAskVasilich
}: ShowMechanicModalProps) {
  const { formatCurrency, distanceLabel } = useUserSettings();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !car) return null;

  // Filter records for this car
  const carRecords = records
    .filter(r => r.carId === car.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const lastRecord = carRecords.length > 0 ? carRecords[0] : null;
  const recentRecords = carRecords.slice(0, 4);

  // Active pending tasks
  const pendingTasks = tasks.filter(t => t.carId === car.id && t.status === 'pending');

  // Generate copyable text summary
  const generateTextSummary = () => {
    const lines: string[] = [];
    const carOdo = car?.odometer ?? car?.mileage ?? 0;
    lines.push(`📋 СВОДКА ДЛЯ АВТОМАСТЕРА / СТО`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`🚗 Автомобиль: ${car?.make || 'Автомобиль'} ${car?.model || ''} ${car?.year ? `(${car.year} г.в.)` : ''}`.trim());
    if (car?.engine) lines.push(`⚙️ Двигатель: ${car.engine}`);
    if (car?.licensePlate) lines.push(`🔢 Госномер: ${car.licensePlate}`);
    if (car?.vin) lines.push(`🪪 VIN: ${car.vin}`);
    lines.push(`⏱️ Текущий пробег: ${carOdo.toLocaleString('ru-RU')} ${distanceLabel}`);
    lines.push(``);

    if (lastRecord) {
      const recOdo = lastRecord.mileage ?? (lastRecord as any).odometer ?? 0;
      const kmAgo = carOdo > 0 && recOdo > 0 ? Math.max(0, carOdo - recOdo) : null;
      lines.push(`🕒 ПОСЛЕДНЕЕ ОБСЛУЖИВАНИЕ:`);
      lines.push(`• Дата: ${lastRecord.date} (при пробеге ${recOdo.toLocaleString('ru-RU')} ${distanceLabel}${kmAgo !== null ? `, ${kmAgo.toLocaleString('ru-RU')} км назад` : ''})`);
      lines.push(`• Работы: ${lastRecord.description || lastRecord.title || 'Обслуживание'}`);
      lines.push(``);
    }

    if (recentRecords.length > 0) {
      lines.push(`🔧 ЧТО ДЕЛАЛИ НЕДАВНО:`);
      recentRecords.forEach(r => {
        const rOdo = r.mileage ?? (r as any).odometer ?? 0;
        lines.push(`• ${r.date} (${rOdo.toLocaleString('ru-RU')} ${distanceLabel}): ${r.description || r.title || 'Обслуживание'}`);
      });
      lines.push(``);
    }

    if (pendingTasks.length > 0) {
      lines.push(`⚠️ ЧТО ТРЕБУЕТ ВНИМАНИЯ / В ПЛАНЕ ТО:`);
      pendingTasks.forEach(t => {
        const targetStr = t.targetMileage ? `до ${t.targetMileage.toLocaleString('ru-RU')} ${distanceLabel}` : t.targetDate ? `до ${t.targetDate}` : '';
        lines.push(`• ${t.title} ${targetStr ? `(${targetStr})` : ''}`);
      });
      lines.push(``);
    }

    lines.push(`💡 Сформировано в АвтоГараж (Мастер Василич)`);
    return lines.join('\n');
  };

  const handleCopy = () => {
    const text = generateTextSummary();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#111622] border border-[#1E273D] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E273D] bg-[#111622]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-[#06B6D4]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Показать мастеру на СТО
              </h2>
              <span className="text-[11px] text-slate-400 block">
                Готовая сводка по машине для автослесаря
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#151C2C] transition-colors cursor-pointer"
            title="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body - Clean phone card style */}
        <div className="p-4 overflow-y-auto space-y-3 text-slate-200">
          
          {/* Card: Vehicle identity */}
          <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#1E273D]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CarIcon className="w-4 h-4 text-[#06B6D4]" />
                <span className="text-xs sm:text-sm font-bold text-white">
                  {car?.make || 'Автомобиль'} {car?.model || ''} {car?.year && `(${car.year})`}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono font-medium text-[#06B6D4] bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                <Gauge className="w-3.5 h-3.5" />
                <span>{(car?.odometer ?? car?.mileage ?? 0).toLocaleString('ru-RU')} {distanceLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-2 text-xs text-slate-400 font-mono flex-wrap">
              {car?.engine && <span>Двигатель: <strong className="text-slate-200">{car.engine}</strong></span>}
              {car?.licensePlate && <span>Госномер: <strong className="text-slate-200">{car.licensePlate}</strong></span>}
              {car?.vin && <span className="text-[11px] text-slate-500">VIN: {car.vin}</span>}
            </div>
          </div>

          {/* Card: Last Service */}
          {lastRecord ? (
            <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#1E273D]">
              <span className="text-[11px] text-slate-400 uppercase block mb-1">
                Последнее обслуживание:
              </span>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-white">
                    {lastRecord.description || lastRecord.title || 'Обслуживание'}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-mono">
                    <span>{lastRecord.date}</span>
                    {(lastRecord.mileage ?? (lastRecord as any).odometer) !== undefined && (
                      <span>• {(lastRecord.mileage ?? (lastRecord as any).odometer ?? 0).toLocaleString('ru-RU')} {distanceLabel}</span>
                    )}
                    {((car?.odometer ?? car?.mileage ?? 0) > 0) && (lastRecord.mileage ?? (lastRecord as any).odometer) && (
                      <span className="text-[#06B6D4]">
                        • {Math.max(0, (car?.odometer ?? car?.mileage ?? 0) - (lastRecord.mileage ?? (lastRecord as any).odometer ?? 0)).toLocaleString('ru-RU')} км назад
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#1E273D] text-xs text-slate-400">
              В сервисной истории пока нет сохранённых записей ТО.
            </div>
          )}

          {/* Card: Recent Works */}
          {recentRecords.length > 1 && (
            <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#1E273D]">
              <span className="text-[11px] text-slate-400 uppercase block mb-1">
                Что делали недавно ({recentRecords.length} замен):
              </span>
              <div className="space-y-1">
                {recentRecords.map(r => (
                  <div key={r.id} className="flex items-center justify-between text-xs py-1 border-b border-[#1E273D]/60 last:border-0">
                    <span className="text-slate-200 truncate pr-2">• {r.description}</span>
                    <span className="text-slate-400 font-mono text-[11px] shrink-0">{r.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card: What needs attention */}
          <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#1E273D]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] text-slate-300 uppercase">
                Что требует внимания / в плане ТО:
              </span>
            </div>

            {pendingTasks.length > 0 ? (
              <div className="space-y-1">
                {pendingTasks.slice(0, 4).map(t => (
                  <div key={t.id} className="p-1.5 rounded-lg bg-[#151C2C] border border-[#1E273D] flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-medium">{t.title}</span>
                    {t.targetMileage && (
                      <span className="text-amber-400 font-mono text-[11px]">
                        до {t.targetMileage.toLocaleString('ru-RU')} км
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-emerald-400 font-mono">
                Критических запланированных задач нет. Все регламенты соблюдены.
              </span>
            )}
          </div>

          {/* Card: Vasilich Note */}
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-start gap-2.5">
            <Bot className="w-4 h-4 text-[#06B6D4] shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-white block">Рекомендация Василича:</span>
              <p className="text-slate-300 mt-0.5 leading-relaxed">
                Попросите мастера осмотреть подвеску на подъемнике, проверить состояние тормозных колодок и уровень технических жидкостей.
              </p>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-[#1E273D] bg-[#111622] flex flex-col sm:flex-row items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#151C2C] hover:bg-[#1C253B] border border-[#1E273D] text-white text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Скопировано</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-300" />
                <span>Скопировать текст</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#06B6D4] hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-colors cursor-pointer"
          >
            Понятно
          </button>
        </div>

      </div>
    </div>
  );
}
