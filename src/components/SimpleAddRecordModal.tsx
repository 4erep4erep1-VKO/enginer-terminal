/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MaintenanceRecord, RecordCategory } from '../types';
import { useUserSettings } from './UserSettingsContext';
import { normalizeVoiceTranscript } from '../lib/voiceNormalizer';
import { 
  X, 
  Check, 
  PlusCircle, 
  Mic, 
  MicOff, 
  Sparkles, 
  Gauge, 
  DollarSign, 
  Wrench,
  CheckCircle2
} from 'lucide-react';

interface SimpleAddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  carId: string;
  carName: string;
  currentCarMileage: number;
  onRecordAdded: (record: Omit<MaintenanceRecord, 'createdAt' | 'updatedAt'>) => void;
}

const COMMON_QUICK_WORKS = [
  { label: 'Замена масла и фильтра', category: 'Oil & Fluids' as RecordCategory },
  { label: 'Замена свечей зажигания', category: 'Engine' as RecordCategory },
  { label: 'Передние тормозные колодки', category: 'Brakes' as RecordCategory },
  { label: 'Воздушный / салонный фильтр', category: 'Oil & Fluids' as RecordCategory },
  { label: 'Замена антифриза', category: 'Oil & Fluids' as RecordCategory },
  { label: 'Стойки стабилизатора', category: 'Suspension' as RecordCategory },
];

export function SimpleAddRecordModal({
  isOpen,
  onClose,
  carId,
  carName,
  currentCarMileage,
  onRecordAdded
}: SimpleAddRecordModalProps) {
  const { currencySymbol, distanceLabel, formatCurrency } = useUserSettings();

  const [description, setDescription] = useState('');
  const [mileage, setMileage] = useState<number | ''>(currentCarMileage || 0);
  const [cost, setCost] = useState<number | ''>('');
  const [category, setCategory] = useState<RecordCategory>('Oil & Fluids');
  
  const [isListening, setIsListening] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setMileage(currentCarMileage || 0);
      setCost('');
      setCategory('Oil & Fluids');
      setSavedSuccess(false);
      setErrorMsg('');
    }
  }, [isOpen, currentCarMileage]);

  if (!isOpen) return null;

  // Voice recording support
  const handleToggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg('Голосовой ввод не поддерживается в вашем браузере. Используйте поле ввода текста.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ru-RU';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        if (navigator.vibrate) navigator.vibrate(20);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          const cleaned = normalizeVoiceTranscript(transcript);
          parseVoiceTranscript(cleaned);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Simple parser for spoken Russian text
  const parseVoiceTranscript = (text: string) => {
    setDescription(text);

    // Try finding cost: e.g. "за 4000 рублей", "3500 р"
    const costMatch = text.match(/(\d+[\s\d]*)\s*(?:руб|р|тыс|тысяч)/i);
    if (costMatch) {
      const rawNum = costMatch[1].replace(/\s+/g, '');
      const parsedCost = parseInt(rawNum, 10);
      if (!isNaN(parsedCost)) {
        setCost(parsedCost);
      }
    }

    // Try finding mileage: e.g. "пробег 192000", "на 185 тысячах"
    const mileageMatch = text.match(/(?:пробег|пробеге|на)\s*(\d+[\s\d]*)/i);
    if (mileageMatch) {
      const rawNum = mileageMatch[1].replace(/\s+/g, '');
      const parsedMileage = parseInt(rawNum, 10);
      if (!isNaN(parsedMileage) && parsedMileage > 1000) {
        setMileage(parsedMileage);
      }
    }

    // Category deduction
    const tLow = text.toLowerCase();
    if (tLow.includes('масл') || tLow.includes('фильтр') || tLow.includes('жидкост') || tLow.includes('антифриз')) {
      setCategory('Oil & Fluids');
    } else if (tLow.includes('свеч') || tLow.includes('ремень') || tLow.includes('грм') || tLow.includes('двигател')) {
      setCategory('Engine');
    } else if (tLow.includes('колодк') || tLow.includes('диск') || tLow.includes('тормоз')) {
      setCategory('Brakes');
    } else if (tLow.includes('рычаг') || tLow.includes('амортизатор') || tLow.includes('подвеск') || tLow.includes('стойк')) {
      setCategory('Suspension');
    }
  };

  const handleSelectPreset = (preset: { label: string; category: RecordCategory }) => {
    if (navigator.vibrate) navigator.vibrate(10);
    setDescription(preset.label);
    setCategory(preset.category);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Пожалуйста, напишите, какую работу выполнили');
      return;
    }

    const finalMileage = mileage !== '' ? Number(mileage) : currentCarMileage;
    const finalCost = cost !== '' ? Number(cost) : 0;
    const todayStr = new Date().toISOString().split('T')[0];

    const newRecord: Omit<MaintenanceRecord, 'createdAt' | 'updatedAt'> = {
      id: `rec-${Date.now()}`,
      carId: carId,
      date: todayStr,
      description: description.trim(),
      category: category,
      mileage: finalMileage,
      partsPrice: finalCost,
      laborPrice: 0,
      partsUsed: [],
      source: 'manual',
    };

    onRecordAdded(newRecord);
    if (navigator.vibrate) navigator.vibrate(25);
    setSavedSuccess(true);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#111622] border border-[#1E273D] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E273D] bg-[#111622]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-[#06B6D4]">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Быстрая запись ТО
              </h2>
              <span className="text-[11px] text-slate-400 block">
                {carName}
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

        {/* Content Body */}
        {savedSuccess ? (
          <div className="p-8 text-center space-y-2.5 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">Записано!</h3>
            <p className="text-xs text-slate-300">
              Работа сохранена в истории автомобиля на пробеге {Number(mileage || currentCarMileage).toLocaleString('ru-RU')} {distanceLabel}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
            
            {/* Quick voice bar */}
            <div className="p-2.5 rounded-xl bg-[#0B0E14] border border-[#1E273D] flex items-center justify-between gap-3">
              <div className="text-xs text-slate-300">
                <span className="font-medium text-white block">Сказать голосом:</span>
                <span className="text-[11px] text-slate-400">«Поменял масло за 3500»</span>
              </div>

              <button
                type="button"
                onClick={handleToggleVoice}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isListening
                    ? 'bg-rose-600 text-white'
                    : 'bg-[#151C2C] hover:bg-[#1C253B] text-[#06B6D4] border border-cyan-500/30'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Слушаю...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>Голос</span>
                  </>
                )}
              </button>
            </div>

            {/* Step 1: Что сделали */}
            <div>
              <label className="text-xs font-medium text-white block mb-1">
                1. Что сделали? <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Замена моторного масла и фильтра..."
                className="w-full bg-[#0B0E14] border border-[#1E273D] focus:border-cyan-400 text-white text-xs sm:text-sm rounded-xl px-3 py-2 outline-none transition-colors"
                autoFocus
              />

              {/* Quick suggestion chips */}
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {COMMON_QUICK_WORKS.map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-[#0B0E14] hover:bg-[#151C2C] text-slate-300 hover:text-white border border-[#1E273D] cursor-pointer transition-colors"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Пробег и Стоимость в 2 колонки */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  2. Пробег ({distanceLabel})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={String(currentCarMileage)}
                    className="w-full bg-[#0B0E14] border border-[#1E273D] focus:border-cyan-400 text-white font-mono text-xs rounded-xl pl-2.5 pr-7 py-2 outline-none"
                  />
                  <Gauge className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  3. Стоимость ({currencySymbol})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-[#0B0E14] border border-[#1E273D] focus:border-cyan-400 text-white font-mono text-xs rounded-xl pl-2.5 pr-7 py-2 outline-none"
                  />
                  <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400">{errorMsg}</p>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2 rounded-xl bg-[#151C2C] hover:bg-[#1C253B] border border-[#1E273D] text-slate-300 text-xs font-medium cursor-pointer transition-colors"
              >
                Отмена
              </button>

              <button
                type="submit"
                className="w-2/3 py-2 rounded-xl bg-[#06B6D4] hover:bg-cyan-400 text-slate-950 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                id="btn-simple-save-record"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Сохранить запись</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
