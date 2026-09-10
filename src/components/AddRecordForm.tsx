/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRecordParser } from '../hooks/useRecordParser';
import { useUserSettings } from './UserSettingsContext';
import { MaintenanceRecord, RecordCategory } from '../types';
import { normalizeVoiceTranscript, extractFinalSpeechTranscript } from '../lib/voiceNormalizer';
import { 
  Mic, 
  MicOff, 
  UploadCloud, 
  Layers, 
  DollarSign, 
  Gauge, 
  Calendar, 
  Cpu, 
  Play, 
  Check, 
  Sparkles, 
  X,
  FileImage
} from 'lucide-react';

interface AddRecordFormProps {
  carId: string;
  currentCarMileage: number;
  onRecordAdded: (record: Omit<MaintenanceRecord, 'createdAt' | 'updatedAt'>) => void;
  onCancel?: () => void;
  initialValues?: {
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
}

const CATEGORIES: RecordCategory[] = [
  'Engine', 'Suspension', 'Brakes', 'Transmission', 'Electrical', 'Body', 'Oil & Fluids', 'Diagnostics', 'Other'
];

export const CATEGORY_NAMES: Record<RecordCategory, string> = {
  'Engine': 'Двигатель',
  'Suspension': 'Подвеска и ходовая',
  'Brakes': 'Тормозная система',
  'Transmission': 'Коробка передач (КПП)',
  'Electrical': 'Электрика и свет',
  'Body': 'Кузовной ремонт',
  'Oil & Fluids': 'Масла и жидкости',
  'Diagnostics': 'Диагностика',
  'Other': 'Разное / Другое'
};

// Presets for the speech simulator
const SPEECH_PRESETS = [
  {
    label: "Замена масла",
    text: "Поменял моторное масло мотюль пять в сорок и масляный фильтр за четыре тысячи пятьсот рублей на пробеге сто двадцать тысяч километров. Работа обошлась в тысячу рублей."
  },
  {
    label: "Замена тормозов",
    text: "Заменил передние тормозные колодки Брембо и диски за девять тысяч двести рублей, замена в автосервисе стоила две тысячи рублей."
  },
  {
    label: "Ремонт подвески",
    text: "Поменял задние амортизаторы и рычаги подвески за двенадцать тысяч рублей, сход-развал на пробеге сто пятьдесят тысяч километров обошелся в полторы тысячи."
  }
];

export function AddRecordForm({ carId, currentCarMileage, onRecordAdded, onCancel, initialValues }: AddRecordFormProps) {
  const { currencySymbol, distanceLabel } = useUserSettings();

  // Manual inputs
  const [description, setDescription] = useState(initialValues?.description || '');
  const [mileage, setMileage] = useState<number>(initialValues?.mileage !== undefined ? initialValues.mileage : currentCarMileage);
  const [partsPrice, setPartsPrice] = useState<number>(initialValues?.partsPrice || 0);
  const [laborPrice, setLaborPrice] = useState<number>(initialValues?.laborPrice || 0);
  const [date, setDate] = useState(() => initialValues?.date || new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<RecordCategory>(initialValues?.category || 'Engine');
  const [partsUsedInput, setPartsUsedInput] = useState('');
  const [partsUsed, setPartsUsed] = useState<string[]>(initialValues?.partsUsed || []);
  const [photos, setPhotos] = useState<string[]>(initialValues?.photoUrls || []); // Base64 or Blob URLs

  const mileageRef = useRef<HTMLInputElement>(null);

  // Auto-focus mileage on mount if prefilled values are provided
  useEffect(() => {
    if (initialValues && mileageRef.current) {
      mileageRef.current.focus();
    }
  }, [initialValues]);

  // Sync state if initialValues changes
  useEffect(() => {
    if (initialValues) {
      setDescription(initialValues.description || '');
      if (initialValues.mileage !== undefined) setMileage(initialValues.mileage);
      setPartsPrice(initialValues.partsPrice || 0);
      setLaborPrice(initialValues.laborPrice || 0);
      if (initialValues.date) setDate(initialValues.date);
      if (initialValues.category) setCategory(initialValues.category);
      setPartsUsed(initialValues.partsUsed || []);
      if (initialValues.photoUrls) setPhotos(initialValues.photoUrls);
    }
  }, [initialValues]);

  // Audio recording state (Speech Recognition)
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [recognitionError, setRecognitionError] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');

  // Hook for AI processing
  const { parseRecordText, isLoading: isAiParsing, error: aiError, result: parsedResult } = useRecordParser();

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      // Autodetect language but default to RU or EN
      rec.lang = 'ru-RU';

      rec.onstart = () => {
        setIsListening(true);
        setRecognitionError('');
        setParseError(null);
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error', e);
        setRecognitionError(`Ошибка Web Speech API: ${e.error}`);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
        const textToParse = normalizeVoiceTranscript(transcriptRef.current.trim());
        if (textToParse) {
          handleAiParse(textToParse);
        } else {
          setParseError('Не удалось распознать текст. Пожалуйста, повторите ввод.');
        }
      };

      rec.onresult = (event: any) => {
        const currentText = extractFinalSpeechTranscript(event.results);
        if (currentText) {
          setSpeechTranscript(currentText);
          transcriptRef.current = currentText;
        }
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Sync mileage with parent car if it changes
  useEffect(() => {
    setMileage(currentCarMileage);
  }, [currentCarMileage]);

  // Handle Speech Recognition Toggle Events
  const startListening = () => {
    if (!recognitionRef.current) {
      setRecognitionError('Web Speech API не поддерживается вашим браузером. Используйте симулятор ниже!');
      return;
    }
    setSpeechTranscript('');
    transcriptRef.current = '';
    setParseError(null);
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error(err);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleListening = () => {
    if (navigator.vibrate) navigator.vibrate(15);
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Run the AI LLM parser on the transcript or simulator text
  const handleAiParse = async (textToParse: string) => {
    if (!textToParse.trim()) {
      setParseError('Не удалось распознать текст. Пожалуйста, повторите ввод.');
      return;
    }

    setParseError(null);
    try {
      const res = await parseRecordText(textToParse, currentCarMileage);
      if (res && (res.description || res.partsPrice !== undefined || res.laborPrice !== undefined)) {
        if (res.description) setDescription(res.description);
        if (res.mileage) setMileage(res.mileage);
        if (res.partsPrice !== undefined) setPartsPrice(res.partsPrice);
        if (res.laborPrice !== undefined) setLaborPrice(res.laborPrice);
        if (res.category) setCategory(res.category);
        if (res.partsUsed) setPartsUsed(res.partsUsed);
      } else {
        setParseError('Не удалось распознать текст. Пожалуйста, повторите ввод.');
      }
    } catch (err) {
      console.error(err);
      setParseError('Не удалось распознать текст. Пожалуйста, повторите ввод.');
    }
  };

  // Drag-and-drop file upload simulator
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddPartTag = () => {
    if (partsUsedInput.trim()) {
      setPartsUsed(prev => [...prev, partsUsedInput.trim()]);
      setPartsUsedInput('');
    }
  };

  const removePartTag = (idx: number) => {
    setPartsUsed(prev => prev.filter((_, i) => i !== idx));
  };

  const isEditMode = Boolean(initialValues?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    onRecordAdded({
      id: initialValues?.id || Math.random().toString(36).substr(2, 9),
      carId,
      description: description.trim(),
      mileage,
      partsPrice: Number(partsPrice) || 0,
      laborPrice: Number(laborPrice) || 0,
      date,
      category,
      partsUsed,
      photoUrls: photos,
      voiceTranscript: speechTranscript || initialValues?.voiceTranscript || undefined,
      relatedDtc: initialValues?.relatedDtc,
      relatedPartIds: initialValues?.relatedPartIds,
      source: initialValues?.source || 'manual',
      obdSnapshotId: initialValues?.obdSnapshotId,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm transition-all duration-300 ease-out">
      <div className="w-full md:max-w-2xl bg-[#111622] border-t md:border border-[#1E273D] rounded-t-2xl md:rounded-2xl shadow-2xl overflow-y-auto max-h-[calc(100vh-60px)] md:max-h-[90vh] p-4 sm:p-5 relative">
        {/* Drag handle for iOS style bottom sheet */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3 md:hidden" />
        
        {onCancel && (
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(15);
              onCancel();
            }}
            className="absolute top-3 right-3 md:top-4 md:right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#151C2C] transition-colors cursor-pointer z-20"
            title="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-[#1E273D] pb-3 mb-4">
          <div>
            <span className="text-[10px] text-[#06B6D4] font-semibold uppercase block">
              {isEditMode ? 'Редактирование ТО' : 'Новая запись'}
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {isEditMode ? 'Редактирование записи ТО' : 'Добавить сервисную запись'}
            </h3>
          </div>
          <div className="flex items-center text-xs text-slate-400 mr-8 md:mr-0">
            <Cpu className="w-3.5 h-3.5 mr-1 text-[#06B6D4]" />
            Помощник ИИ
          </div>
        </div>

      {/* 1. Voice Input & Speech Simulator Section */}
      <div className="mb-4 bg-[#0B0E14] border border-[#1E273D] p-3.5 rounded-xl relative shadow-sm">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-xs font-semibold text-[#06B6D4] uppercase flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Голосовой ввод</span>
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">Автозаполнение</span>
        </div>

        {/* Microphone Button */}
        <div className="mb-3">
          <button
            type="button"
            onClick={handleToggleListening}
            disabled={isAiParsing}
            className={`w-full py-3 px-4 flex items-center justify-center font-medium text-xs rounded-xl border transition-all cursor-pointer select-none disabled:opacity-50 ${
              isAiParsing
                ? 'bg-[#151C2C] border-cyan-500/50 text-[#06B6D4]'
                : isListening 
                  ? 'bg-rose-600 border-rose-400 text-white' 
                  : 'btn-primary'
            }`}
            id="btn-voice-rec-handsfree"
          >
            {isAiParsing ? (
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 animate-spin text-cyan-300" />
                <span>ИИ обрабатывает запись...</span>
              </div>
            ) : isListening ? (
              <div className="flex items-center gap-2">
                <MicOff className="w-4 h-4 text-white" />
                <span>Идет запись... Нажмите для завершения</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                <span>Сказать голосом («Замена масла 4500 руб, пробег 120000»)</span>
              </div>
            )}
          </button>
          {recognitionError && (
            <div className="text-xs text-rose-400 mt-2 text-center bg-rose-950/40 p-2 rounded-lg border border-rose-500/30">
              {recognitionError}
            </div>
          )}
        </div>

        {/* Real-time transcript display */}
        <div className="border border-[#1E273D] bg-[#111622] p-2.5 min-h-[44px] flex items-center justify-between rounded-xl">
          <p className="text-xs text-slate-200 leading-relaxed pr-3">
            {speechTranscript || (
              <span className="text-slate-500 italic text-[11px]">
                Назовите работу, стоимость и пробег...
              </span>
            )}
          </p>
          {speechTranscript && (
            <button
              type="button"
              onClick={() => handleAiParse(speechTranscript)}
              disabled={isAiParsing}
              className="btn-primary px-2.5 py-1 text-xs font-semibold rounded-lg shrink-0 disabled:opacity-50 cursor-pointer"
              id="btn-parse-speech"
            >
              {isAiParsing ? '...' : 'В ИИ'}
            </button>
          )}
        </div>

        {/* Error Displays */}
        {parseError && (
          <div className="mt-2.5 p-2.5 border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs rounded-xl flex items-center">
            <span className="font-semibold mr-1.5">Внимание:</span> {parseError}
          </div>
        )}

        {/* Speech simulator presets */}
        <div className="mt-2.5 pt-2.5 border-t border-[#1E273D]">
          <div className="text-[11px] text-slate-400 mb-1.5">
            Быстрые шаблоны:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SPEECH_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSpeechTranscript(p.text);
                  handleAiParse(p.text);
                }}
                disabled={isAiParsing}
                className="text-[11px] border border-[#1E273D] bg-[#111622] hover:bg-[#151C2C] text-slate-300 hover:text-white px-2.5 py-1 rounded-lg transition-all flex items-center cursor-pointer disabled:opacity-40"
              >
                <Play className="w-3 h-3 mr-1 text-[#06B6D4] shrink-0" />
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Main Manual Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Row 1: Description */}
        <div className="flex flex-col">
          <label className="text-xs text-slate-300 font-medium mb-1">
            Описание работы *
          </label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Замена комплекта сцепления..."
            disabled={isAiParsing}
            className="border border-[#1E273D] bg-[#0B0E14] p-2.5 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
            id="input-desc"
          />
        </div>

        {/* Row 2: Category & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-slate-300 font-medium mb-1">
              Категория системы *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as RecordCategory)}
              disabled={isAiParsing}
              className="border border-[#1E273D] bg-[#0B0E14] p-2.5 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
              id="select-category"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{CATEGORY_NAMES[cat] || cat}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-slate-300 font-medium mb-1">
              Дата *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isAiParsing}
              className="border border-[#1E273D] bg-[#0B0E14] p-2.5 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
              id="input-date"
            />
          </div>
        </div>

        {/* Row 3: Mileage, Parts Cost, Labor Cost */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-slate-300 font-medium mb-1 flex items-center">
              <Gauge className="w-3.5 h-3.5 mr-1 text-[#06B6D4]" /> Пробег ({distanceLabel}) *
            </label>
            <input
              ref={mileageRef}
              type="number"
              required
              min="0"
              value={mileage}
              onChange={(e) => setMileage(Number(e.target.value))}
              disabled={isAiParsing}
              className="border border-[#1E273D] bg-[#0B0E14] p-2.5 rounded-xl text-xs sm:text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-400 disabled:opacity-50"
              id="input-mileage"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-slate-300 font-medium mb-1 flex items-center">
              <DollarSign className="w-3.5 h-3.5 mr-0.5 text-[#06B6D4]" /> Запчасти ({currencySymbol})
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={partsPrice}
              onChange={(e) => setPartsPrice(Number(e.target.value))}
              disabled={isAiParsing}
              className="border border-[#1E273D] bg-[#0B0E14] p-2.5 rounded-xl text-xs sm:text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-400 disabled:opacity-50"
              id="input-parts-price"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-slate-300 font-medium mb-1 flex items-center">
              <DollarSign className="w-3.5 h-3.5 mr-0.5 text-[#06B6D4]" /> Работа ({currencySymbol})
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={laborPrice}
              onChange={(e) => setLaborPrice(Number(e.target.value))}
              disabled={isAiParsing}
              className="border border-[#1E273D] bg-[#0B0E14] p-2.5 rounded-xl text-xs sm:text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-400 disabled:opacity-50"
              id="input-labor-price"
            />
          </div>
        </div>

        {/* Row 4: Parts Allocation list */}
        <div className="flex flex-col">
          <label className="text-xs text-slate-300 font-medium mb-1 flex items-center">
            <Layers className="w-3.5 h-3.5 mr-1 text-[#06B6D4]" /> Использованные запчасти
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={partsUsedInput}
              onChange={(e) => setPartsUsedInput(e.target.value)}
              disabled={isAiParsing}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddPartTag();
                }
              }}
              placeholder="Масляный фильтр MANN..."
              className="flex-1 border border-[#1E273D] bg-[#0B0E14] p-2 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
              id="input-part-tag"
            />
            <button
              type="button"
              onClick={handleAddPartTag}
              disabled={isAiParsing}
              className="btn-secondary px-3 py-2 text-xs font-semibold rounded-xl shrink-0 disabled:opacity-50"
              id="btn-add-part-tag"
            >
              Добавить
            </button>
          </div>

          {/* List of active parts tags */}
          {partsUsed.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 p-2.5 border border-[#1E273D] bg-[#0B0E14] rounded-xl">
              {partsUsed.map((p, idx) => (
                <span key={idx} className="inline-flex items-center text-xs bg-cyan-500/10 border border-cyan-500/25 text-[#06B6D4] px-2 py-0.5 rounded-lg">
                  {p}
                  <button type="button" disabled={isAiParsing} onClick={() => removePartTag(idx)} className="ml-1.5 hover:text-rose-400 disabled:opacity-50">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Row 5: Photo Upload */}
        <div className="flex flex-col">
          <label className="text-xs text-slate-300 font-medium mb-1">
            Фотографии ремонта
          </label>
          <div className="border border-dashed border-[#1E273D] hover:border-cyan-500/50 bg-[#0B0E14] p-4 rounded-xl transition-all flex flex-col items-center justify-center relative cursor-pointer group">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={isAiParsing}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              id="input-photo-file"
            />
            <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-[#06B6D4] transition-colors mb-1.5" />
            <span className="text-xs text-slate-300 font-medium">
              Нажмите или перетащите фото сюда
            </span>
          </div>

          {/* Thumbnails */}
          {photos.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2.5">
              {photos.map((url, idx) => (
                <div key={idx} className="w-14 h-12 border border-[#1E273D] bg-[#0B0E14] relative rounded-lg overflow-hidden group">
                  <img src={url} alt={`preview-${idx}`} className="w-full h-full object-cover opacity-90" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-0.5 right-0.5 bg-rose-600 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[10px] text-white hover:bg-rose-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Autocomplete Visual HUD */}
        {isAiParsing && (
          <div className="mt-3 p-3 border border-cyan-500/30 bg-[#151C2C] text-cyan-300 rounded-xl flex items-center gap-2.5 animate-pulse">
            <Cpu className="w-4 h-4 animate-spin text-[#06B6D4]" />
            <div className="text-xs">
              <span className="font-semibold block">Анализ ИИ...</span>
              Обрабатываем данные и распределяем по категориям
            </div>
          </div>
        )}

        {aiError && (
          <div className="mt-3 p-3 border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs rounded-xl">
            <span className="font-semibold block">Ошибка анализа ИИ:</span>
            {aiError}
          </div>
        )}

        {/* Form Actions */}
        <div className="pt-2 flex flex-row items-center gap-2.5">
          {onCancel && (
            <button
              type="button"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                onCancel();
              }}
              disabled={isAiParsing}
              className="btn-secondary flex-1 py-2 px-3 text-xs font-semibold rounded-xl disabled:opacity-50 cursor-pointer"
              id="btn-cancel"
            >
              Отмена
            </button>
          )}

          <button
            type="submit"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(15);
            }}
            disabled={isAiParsing}
            className="btn-primary flex-[2] py-2 px-4 text-xs font-semibold rounded-xl disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            id="btn-save-record"
          >
            <Check className="w-3.5 h-3.5" />
            {isEditMode ? 'Сохранить изменения' : 'Сохранить запись'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
