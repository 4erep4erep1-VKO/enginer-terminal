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
    lines.push(`📋 СВОДКА ДЛЯ АВТОМАСТЕРА / СТО`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`🚗 Автомобиль: ${car.make} ${car.model} ${car.year ? `(${car.year} г.в.)` : ''}`);
    if (car.engine) lines.push(`⚙️ Двигатель: ${car.engine}`);
    if (car.licensePlate) lines.push(`🔢 Госномер: ${car.licensePlate}`);
    if (car.vin) lines.push(`🪪 VIN: ${car.vin}`);
    lines.push(`⏱️ Текущий пробег: ${car.mileage?.toLocaleString('ru-RU') || 0} ${distanceLabel}`);
    lines.push(``);

    if (lastRecord) {
      const kmAgo = car.mileage && lastRecord.mileage ? Math.max(0, car.mileage - lastRecord.mileage) : null;
      lines.push(`🕒 ПОСЛЕДНЕЕ ОБСЛУЖИВАНИЕ:`);
      lines.push(`• Дата: ${lastRecord.date} (при пробеге ${(lastRecord.mileage || 0).toLocaleString('ru-RU')} ${distanceLabel}${kmAgo !== null ? `, ${kmAgo.toLocaleString('ru-RU')} км назад` : ''})`);
      lines.push(`• Работы: ${lastRecord.description}`);
      lines.push(``);
    }

    if (recentRecords.length > 0) {
      lines.push(`🔧 ЧТО ДЕЛАЛИ НЕДАВНО:`);
      recentRecords.forEach(r => {
        lines.push(`• ${r.date} (${(r.mileage || 0).toLocaleString('ru-RU')} ${distanceLabel}): ${r.description}`);
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
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#1E293B] bg-[#080B11]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/15 border border-[#06B6D4]/30 flex items-center justify-center text-[#06B6D4]">
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
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors cursor-pointer"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body - Clean phone card style */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-slate-200">
          
          {/* Card: Vehicle identity */}
          <div className="p-3 rounded-lg bg-[#080B11] border border-[#1E293B]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CarIcon className="w-4 h-4 text-[#06B6D4]" />
                <span className="text-sm font-bold text-white">
                  {car.make} {car.model} {car.year && `(${car.year})`}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded border border-[#06B6D4]/30">
                <Gauge className="w-3.5 h-3.5" />
                <span>{car.mileage?.toLocaleString('ru-RU') || 0} {distanceLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 font-mono flex-wrap">
              {car.engine && <span>Двигатель: <strong className="text-slate-200">{car.engine}</strong></span>}
              {car.licensePlate && <span>Госномер: <strong className="text-slate-200">{car.licensePlate}</strong></span>}
              {car.vin && <span className="text-[11px] text-slate-500">VIN: {car.vin}</span>}
            </div>
          </div>

          {/* Card: Last Service */}
          {lastRecord ? (
            <div className="p-3 rounded-lg bg-[#080B11] border border-[#1E293B]">
              <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                Последнее обслуживание:
              </span>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-white">
                    {lastRecord.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-mono">
                    <span>{lastRecord.date}</span>
                    {lastRecord.mileage && <span>• {lastRecord.mileage.toLocaleString('ru-RU')} {distanceLabel}</span>}
                    {car.mileage && lastRecord.mileage && (
                      <span className="text-[#06B6D4]">
                        • {(car.mileage - lastRecord.mileage).toLocaleString('ru-RU')} км назад
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-[#080B11] border border-[#1E293B] text-xs text-slate-400">
              В сервисной истории пока нет сохранённых записей ТО.
            </div>
          )}

          {/* Card: Recent Works */}
          {recentRecords.length > 1 && (
            <div className="p-3 rounded-lg bg-[#080B11] border border-[#1E293B]">
              <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1.5">
                Что делали недавно ({recentRecords.length} замен):
              </span>
              <div className="space-y-1.5">
                {recentRecords.map(r => (
                  <div key={r.id} className="flex items-center justify-between text-xs py-1 border-b border-[#1E293B]/60 last:border-0">
                    <span className="text-slate-200 truncate pr-2">• {r.description}</span>
                    <span className="text-slate-400 font-mono text-[11px] shrink-0">{r.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card: What needs attention */}
          <div className="p-3 rounded-lg bg-[#080B11] border border-[#1E293B]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-mono text-slate-300 uppercase">
                Что требует внимания / запланировано:
              </span>
            </div>

            {pendingTasks.length > 0 ? (
              <div className="space-y-1.5">
                {pendingTasks.slice(0, 4).map(t => (
                  <div key={t.id} className="p-1.5 rounded bg-[#0F172A] border border-[#1E293B] flex items-center justify-between text-xs">
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
          <div className="p-3 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/30 flex items-start gap-2.5">
            <Bot className="w-4 h-4 text-[#06B6D4] shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-white block">Рекомендация Василича:</span>
              <p className="text-slate-300 mt-0.5 leading-relaxed">
                Попросите мастера осмотреть подвеску на подъемнике, проверить состояние тормозных колодок и уровень технических жидкостей.
              </p>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-[#1E293B] bg-[#080B11] flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 min-h-[42px] rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Скопировано в буфер</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-300" />
                <span>Скопировать для мастера</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 min-h-[42px] rounded-lg bg-[#06B6D4] hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
          >
            Понятно
          </button>
        </div>

      </div>
    </div>
  );
}
