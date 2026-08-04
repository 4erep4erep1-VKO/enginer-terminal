/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Message, Car, MaintenanceRecord, Part, VehicleTask } from '../types';
import { useUserSettings } from './UserSettingsContext';
import { 
  Cpu, 
  Send, 
  BookOpen, 
  Database, 
  HelpCircle, 
  Code, 
  Search, 
  Compass, 
  Check, 
  Layers,
  Sparkles,
  RefreshCw,
  Terminal,
  Activity,
  Zap,
  AlertTriangle,
  Bookmark,
  ExternalLink,
  ChevronRight,
  Info,
  Server,
  Workflow,
  Mic,
  MicOff
} from 'lucide-react';

interface RagAssistantProps {
  activeCar: Car | null;
  records: MaintenanceRecord[];
  parts: Part[];
  tasks: VehicleTask[];
}

export function RagAssistant({ activeCar, records, parts, tasks }: RagAssistantProps) {
  const { settings } = useUserSettings();
  const getWelcomeMessageText = (car: Car | null) => {
    if (!car) {
      return `Василич на связи. Выберите автомобиль в левой панели, и я отвечу на любые вопросы по его ремонту и обслуживанию.`;
    }
    return `Василич на связи. Задавай вопрос по **${car.make} ${car.model}** — подтяну руководство, историю твоих ремонтов и активные задачи.`;
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [retrievedContexts, setRetrievedContexts] = useState<{ car: string, category: string }[]>([]);
  const [retrievedHistory, setRetrievedHistory] = useState<{ date: string, description: string }[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  const initSpeechRecognition = () => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'ru-RU';

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        if (resultText && resultText.trim()) {
          sendMessageDirectly(resultText);
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
      return rec;
    }
    return null;
  };

  useEffect(() => {
    initSpeechRecognition();
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const toggleSpeechRecognition = () => {
    if (isLoading) return;

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      let rec = recognitionRef.current;
      if (!rec) {
        rec = initSpeechRecognition();
      }
      if (rec) {
        try {
          rec.start();
        } catch (e) {
          console.error("Error starting speech recognition:", e);
        }
      } else {
        alert("Голосовой ввод не поддерживается вашим браузером. Попробуйте Google Chrome.");
      }
    }
  };

  useEffect(() => {
    const welcomeText = getWelcomeMessageText(activeCar);
    setMessages([
      {
        id: 'init-msg',
        sender: 'assistant',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setRetrievedContexts([]);
    setRetrievedHistory([]);
    setTerminalLogs([]);
  }, [activeCar?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, terminalLogs]);

  const sendMessageDirectly = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    setRetrievedContexts([]);
    setRetrievedHistory([]);
    setTerminalLogs([
      'Подключение к архиву обслуживания...',
      'Поиск совпадений по руководствам и истории...',
    ]);

    const userMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Simulated terminal stage logs to make the RAG pipeline transparent and authentic
    const logStages = [
      { delay: 400, log: 'ИИ анализирует техническую суть вопроса...' },
      { delay: 800, log: 'Проверяем заводское руководство по ремонту...' },
      { delay: 1200, log: 'Ищем совпадения в вашей истории обслуживания...' },
      { delay: 1600, log: 'Проверяем наличие деталей на складе...' },
      { delay: 2000, log: 'Собираем все найденные данные воедино...' },
      { delay: 2400, log: 'Составляем подробный совет от Василича...' }
    ];

    logStages.forEach((stage) => {
      setTimeout(() => {
        setTerminalLogs(prev => [...prev, stage.log]);
      }, stage.delay);
    });

    try {
      const response = await fetch('/api/rag-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userText,
          carProfile: activeCar,
          records: records,
          parts: parts,
          tasks: tasks,
          assistantTone: settings.assistantTone,
          currency: settings.currency,
          distanceUnit: settings.distanceUnit,
        }),
      });

      if (!response.ok) {
        throw new Error(`RAG assistant server error: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMsg: Message = {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'assistant',
        text: data.answer || "Ошибка при генерации ответа.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
      
      if (data.retrievedContexts) {
        setRetrievedContexts(data.retrievedContexts);
      }
      if (data.retrievedHistory) {
        setRetrievedHistory(data.retrievedHistory);
      }
      
      setTerminalLogs(prev => [
        ...prev, 
        'Поиск завершен успешно. Ответ подготовлен.'
      ]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'assistant',
        text: `Ошибка соединения со службой ИИ: ${err.message}. Убедитесь, что сервер терминала запущен.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
      setTerminalLogs(prev => [...prev, `Ошибка анализа: не удалось получить данные (${err.message})`]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    setInputValue('');
    await sendMessageDirectly(userText);
  };

  return (
    <div className="bento-card p-5 blueprint-corner flex flex-col h-[700px] relative">
      <div className="absolute top-0 right-0 p-1 bg-cyan-800/30 text-cyan-400 text-[8px] font-bold uppercase font-mono">СОВЕТНИК ВАСИЛИЧ</div>
      
      <div className="flex flex-col h-full overflow-hidden mt-2">
          {/* Active vehicle context banner */}
          <div className="bg-cyan-950/20 border border-cyan-800/30 p-2.5 mb-2.5 flex items-center justify-between text-[10px] font-mono">
            <span className="text-cyan-200/80 uppercase tracking-widest flex items-center">
              <Compass className="w-3.5 h-3.5 mr-2 text-blueprint-cyan animate-pulse" />
              АКТИВНЫЙ КОНТЕНТ-КОНТЕКСТ ДЛЯ ИИ:
            </span>
            <span className="text-blueprint-cyan font-bold">
              {activeCar ? `${activeCar.make} ${activeCar.model} (${activeCar.year})` : "ОБЩИЙ ИНЖЕНЕРНЫЙ РЕЖИМ"}
            </span>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-3 border border-cyan-800/40 bg-[#081226]/40 space-y-4 relative blueprint-corner">
            <div className="absolute inset-0 bg-[radial-gradient(#0d1b3a_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>
            
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col max-w-[90%] ${m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div className="flex items-center gap-1.5 text-[9px] text-blueprint-cyan/60 font-mono mb-1">
                  <span>{m.sender === 'user' ? 'ВЛАДЕЛЕЦ' : 'ВАСИЛИЧ'}</span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </div>
                <div
                  className={`p-3 text-xs font-mono leading-relaxed border ${
                    m.sender === 'user'
                      ? 'bg-blueprint-cyan/15 border-blueprint-cyan text-cyan-100 blueprint-corner'
                      : 'bg-blueprint-bg/90 border-cyan-800/40 text-cyan-100 blueprint-corner shadow-[0_0_15px_rgba(6,182,212,0.05)]'
                  }`}
                >
                  {m.sender === 'assistant' ? (
                    <FormattedMessage text={m.text} />
                  ) : (
                    m.text
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex flex-col items-start max-w-[90%]">
                <div className="flex items-center gap-1.5 text-[9px] text-blueprint-cyan/60 font-mono mb-1">
                  <span>ПОИСК СОВЕТА...</span>
                </div>
                <div className="p-3 border border-dashed border-blueprint-cyan/40 bg-blueprint-cyan/5 text-xs font-mono text-blueprint-cyan flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Выполняется поиск в заводских инструкциях и вашей истории ремонта...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form input */}
          <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
            <div className="flex-1 relative flex items-center">
              <button
                type="button"
                disabled={isLoading}
                onClick={toggleSpeechRecognition}
                className={`absolute left-2.5 z-10 p-1.5 transition-all rounded hover:bg-cyan-950/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isRecording 
                    ? 'text-blueprint-cyan animate-pulse bg-blueprint-cyan/10 border border-blueprint-cyan/30' 
                    : 'text-blueprint-cyan/70 hover:text-blueprint-cyan'
                }`}
                title={isRecording ? "Остановить запись" : "Голосовой ввод (Web Speech API)"}
                id="btn-voice-input"
              >
                {isRecording ? (
                  <Mic className="w-4 h-4 text-blueprint-cyan animate-pulse" />
                ) : (
                  <Mic className="w-4 h-4 text-blueprint-cyan/70" />
                )}
              </button>
              <input
                type="text"
                required={!isRecording}
                disabled={isLoading}
                value={isRecording ? "ИИ слушает... Говорите" : inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isRecording ? "ИИ слушает... Говорите" : activeCar ? `Спросите Василича по ${activeCar.make} (например, "когда менять ГРМ?" или "какое лить масло?")` : "Задайте вопрос по ремонту ВАЗ..."}
                className="w-full border border-cyan-800/40 bg-blueprint-bg/60 py-2.5 pl-11 pr-3 text-xs text-cyan-100 font-mono focus:outline-none focus:border-blueprint-cyan focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] disabled:opacity-50"
                id="rag-input"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || isRecording}
              className="bg-blueprint-cyan text-blueprint-bg font-bold font-mono text-xs px-5 hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.2)] cursor-pointer"
              id="btn-rag-send"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                  ПОИСК...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-1.5" />
                  СПРОСИТЬ
                </>
              )}
            </button>
          </form>
      </div>
    </div>
  );
}

// Custom Markdown formatted paragraph renderer for Blueprint aesthetic
function FormattedMessage({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-2 font-mono text-xs">
      {lines.map((line, idx) => {
        // Headers
        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-[11px] font-extrabold font-mono text-blueprint-cyan tracking-wider uppercase mt-3 mb-1 border-l-2 border-blueprint-cyan pl-2">
              {line.substring(4)}
            </h4>
          );
        }
        if (line.startsWith('## ') || line.startsWith('# ')) {
          const headerText = line.startsWith('## ') ? line.substring(3) : line.substring(2);
          return (
            <h3 key={idx} className="text-xs font-black font-mono text-cyan-200 uppercase tracking-widest mt-4 mb-2 border-b border-cyan-800/30 pb-1">
              {headerText}
            </h3>
          );
        }
        // Bullet list
        if (line.startsWith('* ') || line.startsWith('- ')) {
          const content = parseInlineFormatting(line.substring(2));
          return (
            <div key={idx} className="flex items-start gap-2 ml-2 py-0.5 text-cyan-100">
              <span className="text-blueprint-cyan mt-1 select-none text-[10px]">▪</span>
              <span className="flex-1">{content}</span>
            </div>
          );
        }
        // Regular line
        if (line.trim() === '') {
          return <div key={idx} className="h-1.5" />;
        }
        
        return <p key={idx} className="leading-relaxed text-cyan-100">{parseInlineFormatting(line)}</p>;
      })}
    </div>
  );
}

// Simple inline formatting parser (bold and code backticks)
function parseInlineFormatting(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-blueprint-cyan font-bold font-mono">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-cyan-950/50 border border-cyan-800/50 text-[10px] text-cyan-300 px-1 py-0.5 font-mono">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
