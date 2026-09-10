/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, X, Sparkles, Bot, ArrowRight, CornerDownLeft, Volume2, AlertCircle } from 'lucide-react';
import { parseServiceTranscript } from '../lib/serviceRecordParser';
import { ParsedServiceEntry } from '../types/car';
import { useUserSettings } from './UserSettingsContext';
import { normalizeVoiceTranscript, extractFinalSpeechTranscript } from '../lib/voiceNormalizer';

interface VoiceRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  carName: string;
  currentOdometer: number;
  initialText?: string;
  onParsedReady: (parsed: ParsedServiceEntry) => void;
}

const QUICK_PROMPTS = [
  'Поменял свечи на 60000 км, свечи NGK за 6000 тенге',
  'Замена масла Лукойл 5W-40 и фильтра на 185000 км, 4500 ₸',
  'Поставил передние колодки на 72000 км, колодки Brembo за 12000 тг, работа 3000'
];

export function VoiceRecordModal({
  isOpen,
  onClose,
  carName,
  currentOdometer,
  initialText = '',
  onParsedReady,
}: VoiceRecordModalProps) {
  const { currencySymbol, distanceLabel } = useUserSettings();

  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setTranscript(initialText || '');
      setErrorMessage('');
      setIsParsing(false);

      // Check Speech Recognition support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      } else {
        setSpeechSupported(true);
      }
    } else {
      stopListening();
    }
  }, [isOpen, initialText]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const startListening = () => {
    setErrorMessage('');
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage('Голосовой ввод не поддерживается браузером. Напишите текст вручную.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ru-RU';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        if (navigator.vibrate) navigator.vibrate(20);
      };

      recognition.onresult = (event: any) => {
        const cleanedText = extractFinalSpeechTranscript(event.results);
        if (cleanedText) {
          setTranscript(prev => {
            // If prev is empty or user is continuously talking
            if (!prev) return cleanedText;
            // Deduplicate across ongoing speech chunks
            return normalizeVoiceTranscript(`${prev} ${cleanedText}`);
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Доступ к микрофону заблокирован. Разрешите микрофон в настройках браузера.');
        } else if (event.error !== 'no-speech') {
          setErrorMessage(`Ошибка распознавания: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setIsListening(false);
      setErrorMessage('Не удалось запустить микрофон. Введите текст вручную.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleProcessTranscript = async () => {
    const cleanedText = normalizeVoiceTranscript(transcript);
    if (!cleanedText.trim()) {
      setErrorMessage('Пожалуйста, надиктуйте или напишите выполненные работы');
      return;
    }

    setTranscript(cleanedText);
    stopListening();
    setIsParsing(true);
    setErrorMessage('');

    try {
      if (navigator.vibrate) navigator.vibrate(15);
      const parsed = await parseServiceTranscript(cleanedText, currentOdometer, { make: carName });
      onParsedReady(parsed);
      onClose();
    } catch (err: any) {
      setErrorMessage('Ошибка при разборе текста. Попробуйте еще раз.');
    } finally {
      setIsParsing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-[#0f172a] border border-cyan-500/30 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(6,182,212,0.12)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        id="voice-record-modal"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E273D] bg-[#111622]/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Рассказать Василичу
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
                  ГОЛОС & ТЕКСТ
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {carName} • Текущий одометр: <span className="text-cyan-400 font-mono font-semibold">{currentOdometer.toLocaleString('ru-RU')} {distanceLabel}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 flex items-center justify-center cursor-pointer transition-colors"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          
          {/* Microphone Central Button */}
          <div className="flex flex-col items-center justify-center py-3">
            <button
              type="button"
              onClick={toggleListening}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-xl ${
                isListening
                  ? 'bg-rose-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.6)] animate-pulse scale-105'
                  : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border-2 border-cyan-500/40 hover:border-cyan-400'
              }`}
              id="btn-toggle-mic"
              title={isListening ? 'Нажмите, чтобы остановить запись' : 'Нажмите, чтобы говорить'}
            >
              {isListening ? (
                <Mic className="w-10 h-10 animate-bounce" />
              ) : (
                <Mic className="w-9 h-9" />
              )}

              {/* Pulsing ring when active */}
              {isListening && (
                <span className="absolute inset-0 rounded-full border-4 border-rose-400/50 animate-ping" />
              )}
            </button>

            <span className="mt-3 text-xs sm:text-sm font-semibold tracking-wide">
              {isListening ? (
                <span className="text-rose-400 flex items-center gap-1.5 animate-pulse">
                  <Volume2 className="w-4 h-4" /> Слушаю... говорите
                </span>
              ) : (
                <span className="text-slate-300">
                  Нажмите на микрофон или введите текст ниже
                </span>
              )}
            </span>
          </div>

          {/* Transcript / Input text area */}
          <div className="relative">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Например: Поменял свечи на 60000 км, свечи NGK за 6000 тенге..."
              rows={3}
              className="w-full bg-[#111622] border-2 border-[#1E273D] focus:border-cyan-500 text-slate-100 placeholder-slate-500 rounded-xl p-3.5 text-sm sm:text-base outline-none resize-none transition-colors"
              id="voice-transcript-input"
            />

            {transcript.trim() && (
              <button
                type="button"
                onClick={() => setTranscript('')}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 text-xs p-1"
                title="Очистить"
              >
                Очистить
              </button>
            )}
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick example prompt chips */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Примеры для быстрой диктовки:
            </span>
            <div className="flex flex-col gap-1.5">
              {QUICK_PROMPTS.map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(10);
                    setTranscript(promptText);
                  }}
                  className="text-left px-3 py-2 rounded-xl bg-[#111622] hover:bg-[#182133] border border-cyan-500/15 hover:border-cyan-500/35 text-xs text-slate-300 hover:text-white transition-all cursor-pointer truncate"
                >
                  💬 {promptText}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#1E273D] bg-[#111622] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-13 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm rounded-xl cursor-pointer transition-colors"
          >
            Отмена
          </button>

          <button
            type="button"
            onClick={handleProcessTranscript}
            disabled={!transcript.trim() || isParsing}
            className="flex-1 h-13 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-slate-950 font-bold text-base rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            id="btn-process-transcript"
          >
            {isParsing ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-spin" />
                Разбираю детали...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Проверить запись</span>
                <ArrowRight className="w-5 h-5" />
              </span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
