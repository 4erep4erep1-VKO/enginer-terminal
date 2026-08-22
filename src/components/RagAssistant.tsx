/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Message, Car, MaintenanceRecord, Part, VehicleTask, ObdSnapshot, CarDiagram, DiagnosticResponse, DiagnosticSession, AppActionPayload } from '../types';
import { DiagramLightboxModal } from './DiagramLightboxModal';
import { ConfirmTaskModal, TaskCategory } from './ConfirmTaskModal';
import { DiagnosticResponseCard } from './DiagnosticResponseCard';
import { 
  Bot,
  Send, 
  Mic, 
  Trash2, 
  RotateCcw, 
  RefreshCw, 
  MoreVertical,
  Zap,
  Check,
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Volume2
} from 'lucide-react';

interface RagAssistantProps {
  activeCar: Car | null;
  records: MaintenanceRecord[];
  parts: Part[];
  tasks: VehicleTask[];
  diagnosticSessions?: DiagnosticSession[];
  initialQuestion?: string | null;
  onClearInitialQuestion?: () => void;
  onAddTask?: (task: { title: string; type: 'simple' | 'mileage' | 'recurring'; targetMileage?: number; targetDate?: string }) => void;
  onCreateTaskFromDtc?: (taskParam: string | { title: string; description?: string; relatedDtc: string; relatedPartIds?: string[]; category?: any }, descParam?: string) => void;
  onAddRecord?: (recordData: Omit<MaintenanceRecord, 'createdAt' | 'updatedAt'>) => void;
  onUpdateRecord?: (updatedRecord: MaintenanceRecord) => void;
  onDeleteRecord?: (id: string) => void;
  onUpdateCar?: (car: Car) => void;
  onNavigateTab?: (tab: 'dashboard' | 'obd' | 'service' | 'garage' | 'rag', dtcCode?: string) => void;
}

export function extractTaskSummary(fullText: string): string {
  if (!fullText) return 'Совет от Василича';

  let text = fullText
    .replace(/\[CREATE_TASK:[^\]]+\]/gi, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\s*---\s*/g, '\n')
    .replace(/^[-_*]{3,}\s*$/gm, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .trim();

  text = text.replace(/(\D)(\d+[\.\)]\s+)/g, '$1\n$2');
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const isNoiseLine = (line: string) => {
    const l = line.toLowerCase();
    return (
      l.includes('василич на связи') ||
      l.includes('по опыту скажу') ||
      l.includes('я проанализировал') ||
      l.includes('привет') ||
      l.includes('на связи') ||
      l.includes('дисклеймер') ||
      l.includes('удачи в гараже') ||
      l.includes('обрати внимание') ||
      l.includes('пиши, если что')
    );
  };

  const extractedListItems: string[] = [];
  for (const line of lines) {
    if (isNoiseLine(line)) continue;
    const listMatch = line.match(/^(?:(?:\d+[\.\)]|\(\d+\)|[•\-\*✓📌]))\s*(.+)/);
    if (listMatch && listMatch[1]) {
      let item = listMatch[1].trim();
      item = item.replace(/[\.:]+$/, '').trim();
      if (item.length > 2 && !isNoiseLine(item)) {
        extractedListItems.push(item);
      }
    }
  }

  if (extractedListItems.length > 0) {
    if (extractedListItems.length === 1) return extractedListItems[0];
    return extractedListItems.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
  }

  const usefulLines = lines.filter(l => !isNoiseLine(l));
  if (usefulLines.length > 0) {
    let fallback = usefulLines[0].replace(/^[\*\-\d\.\s✓📌]+/, '').trim();
    const firstSentence = fallback.split(/(?<=[.!?])\s+/)[0] || fallback;
    if (firstSentence.length > 120) {
      return firstSentence.slice(0, 117) + '...';
    }
    return firstSentence;
  }

  return 'Совет от Василича';
}

export function RagAssistant({
  activeCar,
  records,
  parts,
  tasks,
  diagnosticSessions,
  initialQuestion,
  onClearInitialQuestion,
  onAddTask,
  onCreateTaskFromDtc,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onUpdateCar,
  onNavigateTab,
}: RagAssistantProps) {
  const [isOnlineState, setIsOnlineState] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnlineState(true);
    const handleOffline = () => setIsOnlineState(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const executeApplicationAction = (action: AppActionPayload) => {
    if (navigator.vibrate) navigator.vibrate(25);
    if (action.type === 'add_record') {
      if (onAddRecord && activeCar) {
        onAddRecord({
          id: `rec-${Date.now()}`,
          carId: activeCar.id,
          date: action.data.date || new Date().toISOString().split('T')[0],
          mileage: Number(action.data.mileage) || activeCar.mileage || 0,
          description: action.data.description || 'Техническое обслуживание',
          partsPrice: Number(action.data.partsPrice) || 0,
          laborPrice: Number(action.data.laborPrice) || 0,
          partsUsed: Array.isArray(action.data.partsUsed) ? action.data.partsUsed : [],
          category: action.data.category || 'Oil & Fluids',
          source: 'manual'
        });
      }
    } else if (action.type === 'update_record') {
      if (onUpdateRecord && action.data.id) {
        const existing = records.find(r => r.id === action.data.id);
        if (existing) {
          onUpdateRecord({
            ...existing,
            ...action.data,
            updatedAt: new Date().toISOString()
          });
        }
      }
    } else if (action.type === 'delete_record') {
      if (onDeleteRecord && action.data.id) {
        onDeleteRecord(action.data.id);
      }
    } else if (action.type === 'update_mileage') {
      if (onUpdateCar && activeCar && action.data.mileage) {
        onUpdateCar({
          ...activeCar,
          mileage: Number(action.data.mileage),
          updatedAt: new Date().toISOString()
        });
      }
    } else if (action.type === 'add_task') {
      if (onAddTask) {
        onAddTask({
          title: action.data.title || 'Новая задача',
          type: action.data.type || 'mileage',
          targetMileage: action.data.targetMileage,
          targetDate: action.data.targetDate
        });
      }
    } else if (action.type === 'update_car_notes') {
      if (onUpdateCar && activeCar && action.data.note) {
        const existingNotes = activeCar.notes ? `${activeCar.notes}\n• ${action.data.note}` : `• ${action.data.note}`;
        onUpdateCar({
          ...activeCar,
          notes: existingNotes,
          updatedAt: new Date().toISOString()
        });
      }
    }
  };

  const getWelcomeMessage = (car: Car | null): Message => {
    const carName = car ? `${car.make} ${car.model}` : 'автомобилем';
    const mileageStr = car?.mileage ? `${car.mileage.toLocaleString('ru-RU')} км` : '';
    
    return {
      id: 'init-msg',
      sender: 'assistant',
      text: `Здорово! Я Василич — твой автомеханик-наставник по **${carName}**${mileageStr ? ` (${mileageStr})` : ''}.\n\nРассказывай, что случилось с машиной или что сделал. Можно обычными словами — я разберусь.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isWelcome: true
    };
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [activeDiagramForLightbox, setActiveDiagramForLightbox] = useState<CarDiagram | null>(null);
  const [savedOfflineDiagrams, setSavedOfflineDiagrams] = useState<CarDiagram[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const [taskModalState, setTaskModalState] = useState<{
    isOpen: boolean;
    initialText: string;
    messageId: string;
    suggestedCategory?: TaskCategory;
    relatedDtc?: string;
    relatedPartIds?: string[];
  }>({
    isOpen: false,
    initialText: '',
    messageId: '',
    suggestedCategory: 'Двигатель'
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // OBD Snapshot state
  const [obdSnapshot, setObdSnapshot] = useState<ObdSnapshot | null>(null);

  const refreshObdSnapshot = () => {
    if (!activeCar) {
      setObdSnapshot(null);
      return;
    }
    try {
      const carSnap = localStorage.getItem(`obd_snapshot_${activeCar.id}`);
      if (carSnap) {
        setObdSnapshot(JSON.parse(carSnap));
        return;
      }
      const globalSnap = localStorage.getItem('terminal_obd_snapshot');
      if (globalSnap) {
        setObdSnapshot(JSON.parse(globalSnap));
        return;
      }
      setObdSnapshot(null);
    } catch (e) {
      setObdSnapshot(null);
    }
  };

  useEffect(() => {
    refreshObdSnapshot();
  }, [activeCar]);

  // Load chat history for active car
  const chatStorageKey = activeCar ? `vasilich_chat_history_${activeCar.id}` : 'vasilich_chat_history_default';
  useEffect(() => {
    try {
      const saved = localStorage.getItem(chatStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch (e) {}
    setMessages([getWelcomeMessage(activeCar)]);
  }, [activeCar?.id]);

  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(chatStorageKey, JSON.stringify(messages));
      } catch (e) {}
    }
  }, [messages, chatStorageKey]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Initial Question Handler from other tabs
  useEffect(() => {
    if (initialQuestion && initialQuestion.trim().length > 0) {
      sendMessageDirectly(initialQuestion);
      if (onClearInitialQuestion) {
        onClearInitialQuestion();
      }
    }
  }, [initialQuestion]);

  const handleClearChatHistory = () => {
    if (navigator.vibrate) navigator.vibrate(20);
    const welcome = getWelcomeMessage(activeCar);
    setMessages([welcome]);
    setIsHeaderMenuOpen(false);
    try {
      localStorage.setItem(chatStorageKey, JSON.stringify([welcome]));
    } catch (e) {}
  };

  // Speech recognition
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Голосовой ввод не поддерживается данным браузером.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ru-RU';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        if (navigator.vibrate) navigator.vibrate(30);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputValue(transcript);
          sendMessageDirectly(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  const sendMessageDirectly = async (questionText: string) => {
    if (!questionText.trim() || isLoading) return;

    if (!isOnlineState) {
      const offlineMsg: Message = {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'assistant',
        text: '⚠️ Связь с Василичем отсутствует (нет интернета). Подключите интернет, чтобы продолжить диалог.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, offlineMsg]);
      return;
    }

    const userMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'user',
      text: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/rag/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          activeCar,
          records,
          parts,
          tasks,
          diagnosticSessions,
          obdSnapshot,
          chatHistory: messages.slice(-6)
        })
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      const data = await response.json();
      const rawAnswer = data.answer || 'Ответ сформирован.';

      let structuredDiagnostic: DiagnosticResponse | undefined = undefined;
      if (data.diagnosticResponse) {
        structuredDiagnostic = data.diagnosticResponse;
      }

      if (data.executedAction) {
        executeApplicationAction(data.executedAction);
      }

      const botMsg: Message = {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'assistant',
        text: rawAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: data.actions || [],
        safetyWarning: structuredDiagnostic?.safetyWarning || '',
        diagnosticResponse: structuredDiagnostic,
        userQuery: questionText,
        pendingAction: data.pendingAction || undefined,
        executedAction: data.executedAction || undefined,
        actionStatus: data.executedAction ? 'executed' : (data.pendingAction ? 'pending' : undefined)
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'assistant',
        text: `Не удалось связаться с Василичем: ${err.message}. Проверьте соединение с интернетом.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
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

  const handleConfirmPendingAction = (msg: Message) => {
    if (!msg.pendingAction) return;
    executeApplicationAction(msg.pendingAction);
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, actionStatus: 'executed', executedAction: msg.pendingAction } : m));
  };

  const handleCancelPendingAction = (msg: Message) => {
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, actionStatus: 'cancelled' } : m));
  };

  const handleActionClick = (action: { type: string; label: string; payload?: any }, messageText?: string, msgId?: string) => {
    if (action.type === 'confirm_action') {
      const targetMsg = msgId ? messages.find(m => m.id === msgId) : messages.find(m => m.pendingAction);
      if (targetMsg) {
        handleConfirmPendingAction(targetMsg);
      }
    } else if (action.type === 'cancel_action') {
      const targetMsg = msgId ? messages.find(m => m.id === msgId) : messages.find(m => m.pendingAction);
      if (targetMsg) {
        handleCancelPendingAction(targetMsg);
      }
    } else if (action.type === 'copy_summary') {
      if (messageText) {
        navigator.clipboard?.writeText(messageText);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2500);
      }
    } else if (action.type === 'create_task') {
      const taskTitle = action.payload?.title || action.label.replace(/^Создать задачу:?\s*/i, '') || 'Новая сервисная задача';
      setTaskModalState({
        isOpen: true,
        initialText: taskTitle,
        messageId: '',
        suggestedCategory: action.payload?.category || 'Двигатель',
        relatedDtc: action.payload?.relatedDtc
      });
    } else if (action.type === 'navigate_service') {
      if (onNavigateTab) {
        onNavigateTab('service');
      }
    }
  };

  const handleConfirmTaskFromModal = (task: { title: string; category: TaskCategory }) => {
    if (onAddTask) {
      onAddTask({
        title: task.title,
        type: 'simple'
      });
    }

    const confirmMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'assistant',
      text: `✓ Добавил задачу в План ТО: **"${task.title}"**.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, confirmMsg]);
  };

  const handleShowDiagramForMessage = (query?: string) => {
    const dummyDiagram: CarDiagram = {
      id: `diag-${Date.now()}`,
      title: query ? `Электросхема: ${query}` : 'Электросхема узла',
      category: 'wiring',
      imageUrl: '',
      description: `Принципиальная схема электропроводки для ${activeCar ? `${activeCar.make} ${activeCar.model}` : 'автомобиля'}.`
    };
    setActiveDiagramForLightbox(dummyDiagram);
  };

  const isChatEmptyOrWelcomeOnly = messages.length <= 1;

  const quickQuestions = [
    "Когда я последний раз менял масло?",
    "Сегодня поменял масло, пробег 52 тыс, отдал 3500",
    "Что мне скоро нужно сделать?",
    "Машина утром плохо заводится"
  ];

  return (
    <div className="w-full h-full flex flex-col font-sans select-text overflow-hidden p-0 sm:p-3 max-w-4xl mx-auto">
      
      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col h-full bg-[#080B11] sm:border sm:border-[#1E293B] sm:rounded-2xl min-w-0 relative overflow-hidden shadow-xl">
        
        {/* 1. Header: Friendly, Human, Non-technical */}
        <div className="h-14 px-4 py-2.5 bg-[#0F172A] border-b border-[#1E293B] flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm text-white tracking-wide leading-tight">
                ВАСИЛИЧ
              </h1>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {activeCar ? `${activeCar.make} ${activeCar.model} · ${(activeCar.mileage || 0).toLocaleString('ru-RU')} км` : 'Автомобиль не выбран'}
              </p>
            </div>
          </div>

          {/* Right Header Menu */}
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                className="w-8 h-8 rounded-lg bg-[#080B11] hover:bg-[#1E293B] border border-[#1E293B] text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Меню"
                id="btn-vasilich-menu"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isHeaderMenuOpen && (
                <div className="absolute right-0 top-10 w-48 bg-[#0F172A] border border-[#1E293B] rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-1">
                  <button
                    type="button"
                    onClick={handleClearChatHistory}
                    className="w-full px-3 py-2 text-left rounded-lg text-rose-300 hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Очистить диалог</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      refreshObdSnapshot();
                      setIsHeaderMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left rounded-lg text-slate-200 hover:bg-[#1E293B] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Обновить данные</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {copiedToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-emerald-950/95 border border-emerald-500/60 text-emerald-200 px-4 py-2 rounded-full text-xs font-medium shadow-2xl z-50 flex items-center gap-2 animate-fade-in pointer-events-none">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Сводка скопирована</span>
          </div>
        )}

        {/* 2. Messages Stream */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-6 py-4 space-y-4">
          
          {/* Welcome Screen when conversation is fresh */}
          {isChatEmptyOrWelcomeOnly && (
            <div className="py-6 sm:py-10 flex flex-col items-center text-center max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-500/10">
                <Bot className="w-8 h-8" />
              </div>
              
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                ВАСИЛИЧ
              </h2>
              
              <p className="text-sm font-medium text-cyan-400 mb-4">
                {activeCar ? `${activeCar.make} ${activeCar.model} · ${(activeCar.mileage || 0).toLocaleString('ru-RU')} км` : 'Автомобиль в гараже'}
              </p>

              <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 sm:p-5 text-[15px] sm:text-[16px] text-slate-200 leading-relaxed mb-6 shadow-sm">
                «Рассказывай, что случилось с машиной. Можно обычными словами — я разберусь.»
              </div>

              {/* Big Voice Button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`w-full sm:w-auto min-w-[220px] h-14 px-8 rounded-2xl font-semibold text-[16px] flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg active:scale-95 mb-6 ${
                  isRecording 
                    ? 'bg-rose-500 text-white shadow-rose-500/25 animate-pulse' 
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                }`}
                title="Нажмите, чтобы сказать голосом"
              >
                <Mic className="w-5 h-5" />
                <span>{isRecording ? "Слушаю... говорите" : "🎙 Говорить"}</span>
              </button>

              {/* Quick Sample Questions */}
              <div className="w-full text-left space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Или спросите прямо сейчас:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickQuestions.map((q, qIdx) => (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => sendMessageDirectly(q)}
                      className="p-3 bg-[#0F172A] hover:bg-[#1E293B] border border-[#1E293B] hover:border-cyan-500/40 rounded-xl text-left text-xs sm:text-[13px] text-slate-300 hover:text-white transition-all cursor-pointer leading-snug"
                    >
                      💬 {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Conversation Messages */}
          {!isChatEmptyOrWelcomeOnly && messages.map((m) => {
            const msgActions = m.actions || [];

            if (m.sender === 'user') {
              return (
                <div key={m.id} className="flex flex-col items-end max-w-[85%] sm:max-w-[75%] ml-auto">
                  <div className="text-[11px] text-slate-400 mb-1 pr-1">
                    {m.timestamp}
                  </div>
                  <div className="bg-[#1E293B] text-slate-100 border border-slate-700/60 rounded-2xl rounded-tr-sm px-4 py-2.5 text-[14px] sm:text-[15px] leading-relaxed shadow-sm">
                    {m.text}
                  </div>
                </div>
              );
            }

            return (
              <div key={m.id} className="flex flex-col items-start w-full max-w-full mr-auto">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 pl-1">
                  <span className="text-cyan-400 font-bold">ВАСИЛИЧ</span>
                  <span>·</span>
                  <span>{m.timestamp}</span>
                </div>

                <div className="w-full max-w-[96%] sm:max-w-[90%] bg-[#0F172A] border border-[#1E293B] rounded-2xl rounded-tl-sm px-4 py-3 sm:px-5 sm:py-3.5 text-[14px] sm:text-[15px] leading-relaxed text-slate-200 shadow-sm">
                  {m.diagnosticResponse && m.diagnosticResponse.possibleCauses?.length > 0 ? (
                    <DiagnosticResponseCard
                      response={m.diagnosticResponse}
                      parts={parts}
                      onShowDiagram={() => handleShowDiagramForMessage(m.diagnosticResponse?.relatedDtc || m.userQuery)}
                      onCreateTask={() => {}}
                      onCheckInventory={() => onNavigateTab && onNavigateTab('garage')}
                      onAskFollowup={(q) => sendMessageDirectly(q)}
                    />
                  ) : (
                    <FormattedMessage text={m.text} />
                  )}

                  {/* Safety Warning */}
                  {m.safetyWarning && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[13px] flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      <span className="leading-relaxed">{m.safetyWarning}</span>
                    </div>
                  )}

                  {/* Executed Action Line */}
                  {m.actionStatus === 'executed' && (
                    <div className="mt-3 pt-2.5 border-t border-[#1E293B] flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Записано в историю машины</span>
                    </div>
                  )}

                  {/* Cancelled Action Line */}
                  {m.actionStatus === 'cancelled' && (
                    <div className="mt-3 pt-2.5 border-t border-[#1E293B] flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Отменено</span>
                    </div>
                  )}

                  {/* Contextual Action Buttons (Strictly when user confirmation is needed) */}
                  {msgActions.length > 0 && (!m.actionStatus || m.actionStatus === 'pending') && (
                    <div className="mt-3 pt-2.5 border-t border-[#1E293B] flex flex-wrap items-center gap-2">
                      {msgActions.map((act, actIdx) => {
                        let isConfirm = act.type === 'confirm_action' || act.label.toLowerCase().includes('записать') || act.label.toLowerCase().includes('исправить') || act.label.toLowerCase().includes('удалить');
                        let isCancel = act.type === 'cancel_action' || act.label.toLowerCase().includes('отмена') || act.label.toLowerCase().includes('нет') || act.label.toLowerCase().includes('изменить');

                        if (isConfirm) {
                          return (
                            <button
                              key={actIdx}
                              type="button"
                              onClick={() => handleActionClick(act, m.text, m.id)}
                              className="h-10 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl flex items-center gap-2 cursor-pointer transition-all text-[14px] font-bold shadow-md shadow-emerald-500/20 active:scale-95"
                            >
                              <Check className="w-4 h-4 text-slate-950" />
                              <span>{act.label}</span>
                            </button>
                          );
                        }

                        if (isCancel) {
                          return (
                            <button
                              key={actIdx}
                              type="button"
                              onClick={() => handleActionClick(act, m.text, m.id)}
                              className="h-10 px-4 bg-[#080B11] hover:bg-[#1E293B] text-slate-300 hover:text-white border border-[#1E293B] rounded-xl flex items-center gap-2 cursor-pointer transition-all text-[14px] font-medium"
                            >
                              <X className="w-4 h-4 text-slate-400" />
                              <span>{act.label}</span>
                            </button>
                          );
                        }

                        return (
                          <button
                            key={actIdx}
                            type="button"
                            onClick={() => handleActionClick(act, m.text, m.id)}
                            className="h-9 px-3.5 bg-[#080B11] hover:bg-[#1E293B] text-cyan-300 hover:text-white border border-cyan-500/30 rounded-xl flex items-center gap-2 cursor-pointer transition-all text-[13px] font-medium"
                          >
                            <FileText className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{act.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex flex-col items-start w-full max-w-full mr-auto">
              <div className="text-[11px] text-cyan-400 font-medium mb-1 pl-1">
                ВАСИЛИЧ ДУМАЕТ...
              </div>
              <div className="px-4 py-3 border border-[#1E293B] bg-[#0F172A] text-[14px] text-slate-300 rounded-2xl rounded-tl-sm flex items-center gap-3 shadow-sm">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Василич сверяет историю машины...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* 3. Bottom Composer: Large touch target for mic, clean input */}
        <div className="p-3 bg-[#0F172A] border-t border-[#1E293B] shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 w-full max-w-4xl mx-auto">
            <div className="relative flex items-center flex-1 bg-[#080B11] border border-[#1E293B] focus-within:border-cyan-500/70 rounded-2xl px-2 py-1 transition-all">
              
              {/* Mic button */}
              <button
                type="button"
                disabled={isLoading || !isOnlineState}
                onClick={toggleSpeechRecognition}
                className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                  isRecording 
                    ? 'text-white bg-rose-500 animate-pulse' 
                    : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60'
                }`}
                title={isRecording ? "Остановить запись" : "Голосовой ввод"}
                aria-label="Голосовой ввод"
              >
                <Mic className="w-5 h-5" />
              </button>

              <input
                type="text"
                required={!isRecording}
                disabled={isLoading || !isOnlineState}
                value={isRecording ? "🎙 Слушаю вас... Говорите обычными словами" : inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={!isOnlineState ? "Автономный режим (нет сети)" : isRecording ? "Слушаю..." : "Напишите Василичу…"}
                className={`flex-1 bg-transparent px-3 py-2 text-[15px] text-slate-100 placeholder-slate-500 focus:outline-none min-w-0 ${isRecording ? 'font-medium text-rose-300 italic' : ''}`}
                id="rag-input"
              />

              {/* Send button */}
              <button
                type="submit"
                disabled={isLoading || isRecording || !isOnlineState || !inputValue.trim()}
                className="w-10 h-10 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-cyan-500 text-slate-950 flex items-center justify-center font-bold cursor-pointer shrink-0 transition-colors shadow-sm"
                id="btn-rag-send"
                title="Отправить"
                aria-label="Отправить"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <Send className="w-4 h-4 text-slate-950" />
                )}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Lightbox Modal for Schematics if requested */}
      {activeDiagramForLightbox && (
        <DiagramLightboxModal
          diagram={activeDiagramForLightbox}
          carName={activeCar ? `${activeCar.make} ${activeCar.model}` : undefined}
          carId={activeCar?.id}
          isSavedOffline={savedOfflineDiagrams.some(d => d.id === activeDiagramForLightbox.id)}
          onToggleSaveOffline={() => {}}
          onClose={() => setActiveDiagramForLightbox(null)}
        />
      )}

      {/* Task Confirmation Modal */}
      <ConfirmTaskModal
        isOpen={taskModalState.isOpen}
        onClose={() => setTaskModalState(prev => ({ ...prev, isOpen: false }))}
        initialText={taskModalState.initialText}
        carName={activeCar ? `${activeCar.make} ${activeCar.model}` : undefined}
        onConfirm={handleConfirmTaskFromModal}
      />
    </div>
  );
}

function FormattedMessage({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 font-sans text-[14px] sm:text-[15px]">
      {lines.map((line, idx) => {
        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-[14px] sm:text-[15px] font-semibold text-cyan-300 uppercase tracking-wide mt-2 mb-0.5 border-l-2 border-cyan-400 pl-2">
              {line.substring(4)}
            </h4>
          );
        }
        if (line.startsWith('## ') || line.startsWith('# ')) {
          const headerText = line.startsWith('## ') ? line.substring(3) : line.substring(2);
          return (
            <h3 key={idx} className="text-[15px] sm:text-[16px] font-bold text-white uppercase tracking-wider mt-2.5 mb-1 border-b border-[#1E293B] pb-1">
              {headerText}
            </h3>
          );
        }
        if (line.startsWith('* ') || line.startsWith('- ') || line.startsWith('• ')) {
          const content = parseInlineFormatting(line.replace(/^[\*\-•]\s*/, ''));
          return (
            <div key={idx} className="flex items-start gap-2 ml-1 py-0.5 text-slate-200">
              <span className="text-cyan-400 select-none text-xs mt-1">•</span>
              <span className="flex-1 leading-relaxed">{content}</span>
            </div>
          );
        }
        const numberedMatch = line.match(/^(\d+[\.\)])\s+(.*)/);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-1 py-0.5 text-slate-200">
              <span className="text-cyan-400 font-bold text-[13px] mt-0.5">{numberedMatch[1]}</span>
              <span className="flex-1 leading-relaxed">{parseInlineFormatting(numberedMatch[2])}</span>
            </div>
          );
        }
        if (line.trim() === '') {
          return <div key={idx} className="h-1" />;
        }
        return <p key={idx} className="leading-relaxed text-slate-200">{parseInlineFormatting(line)}</p>;
      })}
    </div>
  );
}

function parseInlineFormatting(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-cyan-300 font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="text-slate-300 italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-[#080B11] border border-[#1E293B] text-xs text-cyan-300 px-1 py-0.5 rounded font-mono">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
