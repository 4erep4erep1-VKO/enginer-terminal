/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRecordParser } from '../hooks/useRecordParser';
import { useUserSettings } from './UserSettingsContext';
import { MaintenanceRecord, RecordCategory } from '../types';
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
      rec.interimResults = true;
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
        if (transcriptRef.current.trim()) {
          handleAiParse(transcriptRef.current);
        } else {
          setParseError('Не удалось распознать текст. Пожалуйста, повторите ввод.');
        }
      };

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
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
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300 ease-out">
      <div className="w-full md:max-w-2xl bg-slate-900/95 border-t md:border border-slate-800 rounded-t-2xl md:rounded-2xl shadow-2xl overflow-y-auto max-h-[calc(100vh-60px)] md:max-h-[90vh] p-4 sm:p-6 relative">
        {/* Drag handle for iOS style bottom sheet */}
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-4 md:hidden" />
        
        {onCancel && (
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(15);
              onCancel();
            }}
            className="absolute top-3 right-3 md:top-4 md:right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer z-20"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
          <div>
            <span className="text-[10px] text-cyan-400 tracking-widest font-sans font-semibold uppercase block">
              {isEditMode ? 'Редактирование ТО' : 'Добавление ремонта'}
            </span>
            <h3 className="text-lg font-bold text-white font-sans">
              {isEditMode ? 'Редактирование записи ТО' : 'Регистрация технических работ'}
            </h3>
          </div>
          <div className="flex items-center text-xs text-slate-400 font-sans mr-8 md:mr-0">
            <Cpu className="w-4 h-4 mr-1.5 text-cyan-400 animate-pulse" />
            Помощь ИИ включена
          </div>
        </div>

      {/* 1. Voice Input & Speech Simulator Section (HANDS-FREE MODE) */}
      <div className="mb-6 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl relative shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-semibold text-cyan-400 font-sans uppercase flex items-center gap-1.5">
            <Mic className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Режим "грязных рук" (Голосовой ввод)</span>
          </span>
          <span className="text-[10px] text-slate-400 font-sans hidden sm:inline">Автозаполнение через ИИ</span>
        </div>

        {/* Large Prominent Microphone Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleToggleListening}
            disabled={isAiParsing}
            className={`w-full py-4 px-6 flex items-center justify-center font-sans font-bold text-sm rounded-xl border transition-all cursor-pointer select-none disabled:opacity-50 min-h-[56px] ${
              isAiParsing
                ? 'bg-slate-900 border-cyan-500/50 text-cyan-300 animate-pulse'
                : isListening 
                  ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-500/30 animate-pulse' 
                  : 'btn-primary'
            }`}
            id="btn-voice-rec-handsfree"
          >
            {isAiParsing ? (
              <div className="flex items-center gap-2">
                <Cpu className="w-6 h-6 animate-spin text-cyan-300" />
                <span className="uppercase">ИИ распределяет данные...</span>
              </div>
            ) : isListening ? (
              <div className="flex items-center gap-2">
                <MicOff className="w-6 h-6 animate-bounce text-white" />
                <span className="uppercase">Идет запись... Нажмите для завершения</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-950/40 rounded-lg">
                  <Mic className="w-6 h-6 text-slate-950" />
                </div>
                <div className="text-left">
                  <span className="block text-base font-bold uppercase leading-none">Голосовой ввод (Hands-free)</span>
                  <span className="block text-xs opacity-90 font-normal font-sans mt-1">
                    Скажите: "Замена масла в двигателе 4500 рублей пробег 120000 км"
                  </span>
                </div>
              </div>
            )}
          </button>
          {recognitionError && (
            <div className="text-xs text-rose-400 font-sans mt-2 text-center bg-rose-950/40 p-2 rounded-lg border border-rose-500/30">
              {recognitionError}
            </div>
          )}
        </div>

        {/* Real-time transcript display */}
        <div className="relative border border-slate-800 bg-slate-900/90 p-3 min-h-[55px] flex items-center justify-between rounded-xl">
          <span className="absolute -top-2.5 left-3 bg-slate-950 px-2 text-[10px] text-cyan-400 font-sans font-semibold">
            Распознанный поток речи:
          </span>
          <p className="text-xs text-slate-200 font-sans leading-relaxed pr-4">
            {speechTranscript || (
              <span className="text-slate-500 italic">
                Нажмите большую кнопку выше и назовите выполненную работу, категорию, стоимость и пробег...
              </span>
            )}
          </p>
          {speechTranscript && (
            <button
              type="button"
              onClick={() => handleAiParse(speechTranscript)}
              disabled={isAiParsing}
              className="btn-primary px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 disabled:opacity-50 cursor-pointer"
              id="btn-parse-speech"
            >
              {isAiParsing ? 'Анализ...' : 'В ИИ'}
            </button>
          )}
        </div>

        {/* Error Displays */}
        {parseError && (
          <div className="mt-3 p-3 border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs font-sans rounded-xl flex items-center">
            <span className="font-bold mr-1.5 animate-pulse">Внимание:</span> {parseError}
          </div>
        )}

        {/* Speech simulator presets */}
        <div className="mt-3 pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-400 mb-2 font-sans">
            Готовые фразы для быстрой проверки:
          </div>
          <div className="flex flex-wrap gap-2">
            {SPEECH_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSpeechTranscript(p.text);
                  handleAiParse(p.text);
                }}
                disabled={isAiParsing}
                className="text-xs border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg font-sans transition-all flex items-center cursor-pointer disabled:opacity-40 min-h-[36px]"
              >
                <Play className="w-3.5 h-3.5 mr-1 text-cyan-400 shrink-0" />
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Main Manual Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Description */}
        <div className="flex flex-col">
          <label className="text-xs text-slate-300 font-sans font-semibold mb-1.5">
            Описание выполненной работы *
          </label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Например, Замена комплекта сцепления Sachs"
            disabled={isAiParsing}
            className="border border-slate-800 bg-slate-950/80 p-3 rounded-xl text-sm text-slate-100 font-sans focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 disabled:opacity-50"
            id="input-desc"
          />
        </div>

        {/* Row 2: Category & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-xs text-slate-300 font-sans font-semibold mb-1.5">
              Система автомобиля (Категория) *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as RecordCategory)}
              disabled={isAiParsing}
              className="border border-slate-800 bg-slate-950/80 p-3 rounded-xl text-sm text-slate-100 font-sans focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 disabled:opacity-50"
              id="select-category"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{CATEGORY_NAMES[cat] || cat}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-slate-300 font-sans font-semibold mb-1.5">
              Дата проведения работ *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isAiParsing}
              className="border border-slate-800 bg-slate-950/80 p-3 rounded-xl text-sm text-slate-100 font-sans focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 disabled:opacity-50"
              id="input-date"
            />
          </div>
        </div>

        {/* Row 3: Mileage, Parts Cost, Labor Cost */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label className="text-xs text-slate-300 font-sans font-semibold mb-1.5 flex items-center">
              <Gauge className="w-4 h-4 mr-1 text-cyan-400" /> Пробег ({distanceLabel}) *
            </label>
            <input
              ref={mileageRef}
              type="number"
              required
              min="0"
              value={mileage}
              onChange={(e) => setMileage(Number(e.target.value))}
              disabled={isAiParsing}
              className="border border-slate-800 bg-slate-950/80 p-3 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 disabled:opacity-50"
              id="input-mileage"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-slate-300 font-sans font-semibold mb-1.5 flex items-center">
              <DollarSign className="w-4 h-4 mr-0.5 text-cyan-400" /> Запчасти ({currencySymbol})
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={partsPrice}
              onChange={(e) => setPartsPrice(Number(e.target.value))}
              disabled={isAiParsing}
              className="border border-slate-800 bg-slate-950/80 p-3 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 disabled:opacity-50"
              id="input-parts-price"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-slate-300 font-sans font-semibold mb-1.5 flex items-center">
              <DollarSign className="w-4 h-4 mr-0.5 text-cyan-400" /> Работа ({currencySymbol})
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={laborPrice}
              onChange={(e) => setLaborPrice(Number(e.target.value))}
              disabled={isAiParsing}
              className="border border-slate-800 bg-slate-950/80 p-3 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 disabled:opacity-50"
              id="input-labor-price"
            />
          </div>
        </div>

        {/* Row 4: Parts Allocation list */}
        <div className="flex flex-col">
          <label className="text-xs text-slate-300 font-sans font-semibold mb-1.5 flex items-center">
            <Layers className="w-4 h-4 mr-1.5 text-cyan-400" /> Использованные запчасти
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
              placeholder="Добавить деталь, например: Масляный фильтр MANN HU816X"
              className="flex-1 border border-slate-800 bg-slate-950/80 p-3 rounded-xl text-sm text-slate-100 font-sans focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 disabled:opacity-50"
              id="input-part-tag"
            />
            <button
              type="button"
              onClick={handleAddPartTag}
              disabled={isAiParsing}
              className="btn-secondary min-h-[48px] px-4 text-xs font-semibold rounded-xl shrink-0 disabled:opacity-50"
              id="btn-add-part-tag"
            >
              Добавить
            </button>
          </div>

          {/* List of active parts tags */}
          {partsUsed.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2.5 p-3 border border-slate-800 bg-slate-950/60 rounded-xl">
              {partsUsed.map((p, idx) => (
                <span key={idx} className="inline-flex items-center text-xs font-sans bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-2.5 py-1 rounded-lg">
                  {p}
                  <button type="button" disabled={isAiParsing} onClick={() => removePartTag(idx)} className="ml-2 hover:text-rose-400 disabled:opacity-50">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Row 5: Drag & Drop Schematic Photos */}
        <div className="flex flex-col">
          <label className="text-xs text-slate-300 font-sans font-semibold mb-1.5">
            Загрузить фотографии деталей / Фотоотчет
          </label>
          <div className="border border-dashed border-slate-700 hover:border-cyan-400 bg-slate-950/60 p-5 rounded-2xl transition-all flex flex-col items-center justify-center relative cursor-pointer group">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={isAiParsing}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              id="input-photo-file"
            />
            <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-cyan-400 transition-colors mb-2" />
            <span className="text-xs text-slate-300 font-sans font-medium">
              Перетащите файлы сюда или кликните для выбора
            </span>
            <span className="text-[10px] text-slate-500 font-sans mt-1">
              PNG, JPG, HEIC до 5МБ
            </span>
          </div>

          {/* Thumbnails of uploaded images */}
          {photos.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-3">
              {photos.map((url, idx) => (
                <div key={idx} className="w-16 h-12 border border-slate-700 bg-slate-950 relative rounded-lg overflow-hidden group">
                  <img src={url} alt={`preview-${idx}`} className="w-full h-full object-cover opacity-90" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 bg-rose-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px] text-white hover:bg-rose-500"
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
          <div className="mt-4 p-4 border border-cyan-500/40 bg-slate-950/80 text-cyan-300 rounded-xl flex items-center gap-3 animate-pulse">
            <Cpu className="w-5 h-5 animate-spin text-cyan-400" />
            <div className="text-xs font-sans">
              <span className="font-semibold block uppercase">Анализ ИИ в процессе:</span>
              Анализируем текст, определяем пробег, стоимость запчастей и распределяем по категориям...
            </div>
          </div>
        )}

        {aiError && (
          <div className="mt-4 p-4 border border-rose-500/40 bg-rose-950/40 text-rose-300 text-xs font-sans rounded-xl">
            <span className="font-semibold block uppercase">Ошибка анализа ИИ:</span>
            {aiError}
          </div>
        )}

        {/* Form Actions - Placed cleanly at the bottom of the form in a single row */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md pt-3 pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-slate-800 flex flex-row items-center gap-3 z-20 mt-6">
          {onCancel && (
            <button
              type="button"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                onCancel();
              }}
              disabled={isAiParsing}
              className="btn-secondary flex-1 min-h-[48px] px-4 text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
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
            className="btn-primary flex-[2] min-h-[48px] px-6 text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            id="btn-save-record"
          >
            <Check className="w-4 h-4" />
            {isEditMode ? 'Сохранить изменения' : 'Сохранить запись'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
