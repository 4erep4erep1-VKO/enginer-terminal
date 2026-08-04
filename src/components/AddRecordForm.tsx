/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRecordParser } from '../hooks/useRecordParser';
import { MaintenanceRecord, RecordCategory } from '../types';
import { 
  Mic, 
  MicOff, 
  UploadCloud, 
  Layers, 
  RussianRuble, 
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
    description?: string;
    partsPrice?: number;
    partsUsed?: string[];
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
  // Manual inputs
  const [description, setDescription] = useState(initialValues?.description || '');
  const [mileage, setMileage] = useState<number>(currentCarMileage);
  const [partsPrice, setPartsPrice] = useState<number>(initialValues?.partsPrice || 0);
  const [laborPrice, setLaborPrice] = useState<number>(0);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<RecordCategory>('Engine');
  const [partsUsedInput, setPartsUsedInput] = useState('');
  const [partsUsed, setPartsUsed] = useState<string[]>(initialValues?.partsUsed || []);
  const [photos, setPhotos] = useState<string[]>([]); // Base64 or Blob URLs

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
      setPartsPrice(initialValues.partsPrice || 0);
      setPartsUsed(initialValues.partsUsed || []);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    onRecordAdded({
      id: Math.random().toString(36).substr(2, 9),
      carId,
      description,
      mileage,
      partsPrice,
      laborPrice,
      date,
      category,
      partsUsed,
      photoUrls: photos,
      voiceTranscript: speechTranscript || undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm transition-all duration-300 ease-out">
      <div className="w-full md:max-w-2xl bg-[#050b18] border-t-2 md:border-2 border-blueprint-cyan rounded-t-2xl md:rounded-none shadow-[0_-10px_25px_rgba(0,255,204,0.15)] md:shadow-[0_0_30px_rgba(0,255,204,0.25)] overflow-y-auto max-h-[92vh] md:max-h-[90vh] p-6 relative">
        {/* Drag handle for iOS style bottom sheet */}
        <div className="w-12 h-1 bg-cyan-800/40 rounded-full mx-auto mb-4 md:hidden" />
        
        {onCancel && (
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(15);
              onCancel();
            }}
            className="absolute top-3 right-3 md:top-4 md:right-4 text-blueprint-cyan hover:text-cyan-400 p-1.5 hover:bg-cyan-950/40 transition-colors cursor-pointer z-20"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="absolute top-0 right-0 p-1 bg-cyan-800/30 text-cyan-400 text-[8px] font-bold uppercase font-mono hidden md:block">ФОРМА ЗАПИСИ</div>
        {/* Blueprint Header */}
        <div className="flex justify-between items-center border-b border-cyan-800/30 pb-4 mb-6">
          <div>
            <span className="text-[10px] text-blueprint-cyan tracking-widest font-mono uppercase block">ДОБАВЛЕНИЕ РЕМОНТА</span>
            <h3 className="text-lg font-bold text-cyan-100 font-mono">РЕГИСТРАЦИЯ ТЕХНИЧЕСКИХ РАБОТ</h3>
          </div>
          <div className="flex items-center text-[10px] text-blueprint-cyan/50 font-mono mr-8 md:mr-0">
            <Cpu className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
            ПОМОЩЬ ИИ ВКЛЮЧЕНА
          </div>
        </div>

      {/* 1. Voice Input & Speech Simulator Section */}
      <div className="mb-6 bento-card border-dashed border-cyan-800/40 bg-cyan-950/10 p-4 blueprint-corner relative">
        <div className="absolute top-0 right-0 p-0.5 bg-cyan-800/30 text-cyan-400 text-[8px] font-bold uppercase font-mono">ГОЛОС</div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-blueprint-cyan tracking-wider font-mono uppercase flex items-center">
            <Mic className="w-4 h-4 mr-2" /> ИНТЕРФЕЙС РАСПОЗНАВАНИЯ ГОЛОСА
          </span>
          <span className="text-[9px] text-cyan-400/40 font-mono">ГОЛОСОВОЙ ВВОД</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Record button */}
          <div className="md:col-span-4 flex flex-col items-center">
            <button
              type="button"
              onClick={handleToggleListening}
              disabled={isAiParsing}
              className={`w-full py-3 px-4 flex items-center justify-center font-mono text-xs border transition-all cursor-pointer select-none disabled:opacity-50 ${
                isAiParsing
                  ? 'bg-cyan-950/40 border-blueprint-cyan text-cyan-400 animate-pulse'
                  : isListening 
                    ? 'bg-red-950/30 border-red-500 text-red-400 hover:bg-red-900/40 animate-pulse' 
                    : 'bg-blueprint-cyan/10 border-blueprint-cyan/40 text-blueprint-cyan hover:bg-blueprint-cyan/20'
              }`}
              id="btn-voice-rec"
            >
              {isAiParsing ? (
                <>
                  <Cpu className="w-4 h-4 mr-2 animate-spin text-blueprint-cyan" />
                  АНАЛИЗ ИИ...
                </>
              ) : isListening ? (
                <>
                  <MicOff className="w-4 h-4 mr-2 animate-bounce text-red-400" />
                  ОСТАНОВИТЬ ЗАПИСЬ
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2 text-blueprint-cyan" />
                  ГОЛОСОВОЙ ВВОД (СТАРТ)
                </>
              )}
            </button>
            {recognitionError && (
              <span className="text-[9px] text-red-400 font-mono mt-1 text-center">{recognitionError}</span>
            )}
          </div>

          {/* Real-time transcript display */}
          <div className="md:col-span-8">
            <div className="relative border border-cyan-800/40 bg-blueprint-bg/60 p-3 min-h-[50px] flex items-center justify-between blueprint-corner">
              <span className="absolute -top-2 left-2 bg-blueprint-bg-card px-1.5 text-[9px] text-blueprint-cyan/60 font-mono">
                РАСПОЗНАННЫЙ ТЕКСТ
              </span>
              <p className="text-xs text-cyan-100 font-mono leading-relaxed pr-8">
                {speechTranscript || (
                  <span className="text-cyan-400/40 italic">
                    Нажмите «Голосовой ввод» и скажите, что вы отремонтировали, либо выберите готовую фразу ниже...
                  </span>
                )}
              </p>
              {speechTranscript && (
                <button
                  type="button"
                  onClick={() => handleAiParse(speechTranscript)}
                  disabled={isAiParsing}
                  className="bg-blueprint-cyan text-blueprint-bg px-2.5 py-1 text-[10px] font-bold font-mono tracking-wider hover:bg-cyan-400 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                  id="btn-parse-speech"
                >
                  {isAiParsing ? 'АНАЛИЗ...' : 'РАСШИФРОВАТЬ ИИ'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Displays */}
        {parseError && (
          <div className="mt-3 p-3 border border-red-500/40 bg-red-950/20 text-red-400 text-xs font-mono blueprint-corner flex items-center">
            <span className="font-bold mr-1.5 animate-pulse">ВНИМАНИЕ:</span> {parseError}
          </div>
        )}

        {/* Speech simulator presets */}
        <div className="mt-4 pt-3 border-t border-cyan-800/20">
          <div className="text-[10px] text-blueprint-cyan/60 tracking-wider uppercase mb-2 font-mono">
            Готовые фразы для быстрой проверки ИИ:
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
                className="text-[10px] border border-cyan-800/40 hover:border-blueprint-cyan bg-cyan-950/10 hover:bg-blueprint-cyan/10 text-cyan-200/80 hover:text-cyan-200 px-2.5 py-1 font-mono transition-all flex items-center cursor-pointer disabled:opacity-40"
              >
                <Play className="w-3 h-3 mr-1 text-blueprint-cyan shrink-0" />
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
          <label className="text-[11px] text-blueprint-cyan tracking-widest font-mono uppercase mb-1">
            Описание выполненной работы *
          </label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="например, Замена комплекта сцепления Sachs"
            disabled={isAiParsing}
            className="border border-cyan-800/40 bg-blueprint-bg/60 p-2 text-xs text-cyan-100 font-mono focus:outline-none focus:border-blueprint-cyan focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] disabled:opacity-50"
            id="input-desc"
          />
        </div>

        {/* Row 2: Category & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-[11px] text-blueprint-cyan tracking-widest font-mono uppercase mb-1">
              Система автомобиля (Категория) *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as RecordCategory)}
              disabled={isAiParsing}
              className="border border-cyan-800/40 bg-blueprint-bg/60 p-2 text-xs text-cyan-100 font-mono focus:outline-none focus:border-blueprint-cyan focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] disabled:opacity-50"
              id="select-category"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{CATEGORY_NAMES[cat] || cat}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[11px] text-blueprint-cyan tracking-widest font-mono uppercase mb-1">
              Дата проведения работ *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isAiParsing}
              className="border border-cyan-800/40 bg-blueprint-bg/60 p-2 text-xs text-cyan-100 font-mono focus:outline-none focus:border-blueprint-cyan disabled:opacity-50"
              id="input-date"
            />
          </div>
        </div>

        {/* Row 3: Mileage, Parts Cost, Labor Cost */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label className="text-[11px] text-blueprint-cyan tracking-widest font-mono uppercase mb-1 flex items-center">
              <Gauge className="w-3.5 h-3.5 mr-1 text-blueprint-cyan" /> Пробег (км) *
            </label>
            <input
              ref={mileageRef}
              type="number"
              required
              min="0"
              value={mileage}
              onChange={(e) => setMileage(Number(e.target.value))}
              disabled={isAiParsing}
              className="border border-cyan-800/40 bg-blueprint-bg/60 p-2 text-xs text-cyan-100 font-mono focus:outline-none focus:border-blueprint-cyan disabled:opacity-50"
              id="input-mileage"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[11px] text-blueprint-cyan tracking-widest font-mono uppercase mb-1 flex items-center">
              <RussianRuble className="w-3.5 h-3.5 mr-0.5 text-blueprint-cyan" /> Стоимость запчастей (₽)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={partsPrice}
              onChange={(e) => setPartsPrice(Number(e.target.value))}
              disabled={isAiParsing}
              className="border border-cyan-800/40 bg-blueprint-bg/60 p-2 text-xs text-cyan-100 font-mono focus:outline-none focus:border-blueprint-cyan disabled:opacity-50"
              id="input-parts-price"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[11px] text-blueprint-cyan tracking-widest font-mono uppercase mb-1 flex items-center">
              <RussianRuble className="w-3.5 h-3.5 mr-0.5 text-blueprint-cyan" /> Стоимость работ (₽)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={laborPrice}
              onChange={(e) => setLaborPrice(Number(e.target.value))}
              disabled={isAiParsing}
              className="border border-cyan-800/40 bg-blueprint-bg/60 p-2 text-xs text-cyan-100 font-mono focus:outline-none focus:border-blueprint-cyan disabled:opacity-50"
              id="input-labor-price"
            />
          </div>
        </div>

        {/* Row 4: Parts Allocation list */}
        <div className="flex flex-col">
          <label className="text-[11px] text-blueprint-cyan tracking-widest font-mono uppercase mb-1 flex items-center">
            <Layers className="w-3.5 h-3.5 mr-1.5 text-blueprint-cyan" /> Использованные запчасти
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
              className="flex-1 border border-cyan-800/40 bg-blueprint-bg/60 p-2 text-xs text-cyan-100 font-mono focus:outline-none focus:border-blueprint-cyan disabled:opacity-50"
              id="input-part-tag"
            />
            <button
              type="button"
              onClick={handleAddPartTag}
              disabled={isAiParsing}
              className="bg-blueprint-cyan/20 border border-blueprint-cyan/50 text-blueprint-cyan px-4 py-2 text-xs font-mono hover:bg-blueprint-cyan/30 cursor-pointer disabled:opacity-50"
              id="btn-add-part-tag"
            >
              ДОБАВИТЬ
            </button>
          </div>

          {/* List of active parts tags */}
          {partsUsed.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 p-2 border border-cyan-800/30 bg-cyan-950/10 blueprint-corner">
              {partsUsed.map((p, idx) => (
                <span key={idx} className="inline-flex items-center text-[10px] font-mono bg-blueprint-cyan/10 border border-blueprint-cyan/30 text-blueprint-cyan px-2 py-0.5">
                  {p}
                  <button type="button" disabled={isAiParsing} onClick={() => removePartTag(idx)} className="ml-1.5 hover:text-red-400 disabled:opacity-50">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Row 5: Drag & Drop Schematic Photos */}
        <div className="flex flex-col">
          <label className="text-[11px] text-blueprint-cyan tracking-widest font-mono uppercase mb-1">
            Загрузить фотографии деталей / Фотоотчет
          </label>
          <div className="border border-dashed border-cyan-800/40 hover:border-blueprint-cyan bg-cyan-950/10 p-4 transition-all flex flex-col items-center justify-center relative cursor-pointer group blueprint-corner">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={isAiParsing}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              id="input-photo-file"
            />
            <UploadCloud className="w-8 h-8 text-blueprint-cyan/60 group-hover:text-blueprint-cyan transition-colors mb-2" />
            <span className="text-xs text-cyan-200/80 font-mono">
              Перетащите файлы сюда или кликните для выбора
            </span>
            <span className="text-[10px] text-cyan-400/40 font-mono mt-1">
              PNG, JPG, HEIC до 5МБ
            </span>
          </div>

          {/* Thumbnails of uploaded images */}
          {photos.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-3">
              {photos.map((url, idx) => (
                <div key={idx} className="w-16 h-12 border border-cyan-800/40 bg-blueprint-bg/60 relative group blueprint-corner">
                  <img src={url} alt={`preview-${idx}`} className="w-full h-full object-cover opacity-80" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute -top-1.5 -right-1.5 bg-red-900 border border-red-500 rounded-full w-4 h-4 flex items-center justify-center text-[9px] text-red-200 hover:bg-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-blueprint-line/40">
          {onCancel && (
            <button
              type="button"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                onCancel();
              }}
              disabled={isAiParsing}
              className="w-full sm:w-auto justify-center flex border border-cyan-800/40 text-cyan-200/60 hover:text-cyan-100 hover:bg-cyan-950/20 px-5 py-2 text-xs font-mono transition-colors cursor-pointer disabled:opacity-50"
              id="btn-cancel"
            >
              ОТМЕНА
            </button>
          )}

          <button
            type="submit"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(15);
            }}
            disabled={isAiParsing}
            className="w-full sm:w-auto justify-center flex bg-blueprint-cyan text-blueprint-bg font-bold font-mono tracking-wider text-xs px-6 py-2.5 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all items-center disabled:opacity-50 cursor-pointer"
            id="btn-save-record"
          >
            <Check className="w-4 h-4 mr-1.5" />
            СОХРАНИТЬ ЗАПИСЬ
          </button>
        </div>
      </form>

      {/* 3. AI Autocomplete Visual HUD */}
      {isAiParsing && (
        <div className="mt-4 p-3 border border-blueprint-cyan/30 bg-cyan-950/10 text-blueprint-cyan flex items-center gap-3 animate-pulse">
          <Cpu className="w-5 h-5 animate-spin" />
          <div className="text-xs font-mono">
            <span className="font-semibold block uppercase tracking-wider">АНАЛИЗ ИИ В ПРОЦЕССЕ:</span>
            Анализируем текст, определяем пробег, стоимость запчастей и распределяем по категориям...
          </div>
        </div>
      )}

      {aiError && (
        <div className="mt-4 p-3 border border-red-500/30 bg-red-950/10 text-red-400 text-xs font-mono">
          <span className="font-semibold block uppercase tracking-wider">ОШИБКА АНАЛИЗА ИИ:</span>
          {aiError}
        </div>
      )}
      </div>
    </div>
  );
}
