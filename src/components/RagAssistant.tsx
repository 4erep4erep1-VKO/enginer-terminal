/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTypewriter } from '../hooks/useTypewriter';
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
  Volume2,
  VolumeX,
  ArrowUp,
  ArrowDown,
  Sliders,
  SlidersHorizontal,
  Wrench,
  Pencil,
  Copy,
  Plus,
  MessageSquare,
  CornerDownLeft
} from 'lucide-react';
import { useUserSettings } from './UserSettingsContext';

interface RagAssistantProps {
  activeCar: Car | null;
  records: MaintenanceRecord[];
  parts: Part[];
  tasks: VehicleTask[];
  diagnosticSessions?: DiagnosticSession[];
  initialQuestion?: string | null;
  onClearInitialQuestion?: () => void;
  onAddTask?: (task: { 
    title: string; 
    type: 'simple' | 'mileage' | 'recurring'; 
    targetMileage?: number; 
    targetDate?: string;
    category?: any;
    description?: string;
    relatedDtc?: string;
    source?: any;
  }) => void;
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
  const { settings, updateSettings } = useUserSettings();
  const [isOnlineState, setIsOnlineState] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isToneMenuOpen, setIsToneMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

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
        let mappedCategory: any = 'Other';
        const catRaw = String(action.data.category || '');
        if (catRaw) {
          if (catRaw === 'Transmission' || /трансмисс|кпп|коробк|сцеплен|акпп|мкпп/i.test(catRaw)) mappedCategory = 'Transmission';
          else if (catRaw === 'Brakes' || /тормоз|колодк|диск/i.test(catRaw)) mappedCategory = 'Brakes';
          else if (catRaw === 'Suspension' || /подвеск|стойк|рычаг|амортиз|шаров/i.test(catRaw)) mappedCategory = 'Suspension';
          else if (catRaw === 'Engine' || /двигател|мотор|свеч|грм/i.test(catRaw)) mappedCategory = 'Engine';
          else if (catRaw === 'Oil & Fluids' || /масл|жидкост|фильтр|антифриз/i.test(catRaw)) mappedCategory = 'Oil & Fluids';
          else if (catRaw === 'Electrical' || /электрик|аккумул|датчик|генератор/i.test(catRaw)) mappedCategory = 'Electrical';
          else if (catRaw === 'Body' || /кузов/i.test(catRaw)) mappedCategory = 'Body';
          else if (catRaw === 'Diagnostics' || /диагностик/i.test(catRaw)) mappedCategory = 'Diagnostics';
          else mappedCategory = 'Other';
        }

        const taskTitle = action.data.title || action.data.description || 'Новая задача';
        const targetKm = action.data.targetMileage ? Number(action.data.targetMileage) : undefined;
        const taskType = action.data.type || (targetKm ? 'mileage' : 'simple');

        onAddTask({
          title: taskTitle,
          type: taskType,
          targetMileage: targetKm,
          targetDate: action.data.targetDate,
          category: mappedCategory,
          description: action.data.description || action.data.notes,
          source: 'ai'
        });

        // Trigger floating toast notification
        setTaskToast({
          title: taskTitle,
          targetMileage: targetKm,
          targetDate: action.data.targetDate,
          category: mappedCategory
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
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const [taskToast, setTaskToast] = useState<{
    title: string;
    targetMileage?: number;
    targetDate?: string;
    category?: string;
  } | null>(null);
  const [activeDiagramForLightbox, setActiveDiagramForLightbox] = useState<CarDiagram | null>(null);
  const [savedOfflineDiagrams, setSavedOfflineDiagrams] = useState<CarDiagram[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingState, setRecordingState] = useState<'idle' | 'preparing' | 'listening'>('idle');

  // New features state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (taskToast) {
      const timer = setTimeout(() => {
        setTaskToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [taskToast]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 38), 120)}px`;
    }
  }, [inputValue]);

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const spokenTextRef = useRef<string>('');
  const isUserAtBottomRef = useRef<boolean>(true);

  const smartScrollToBottom = (force: boolean = false, smooth: boolean = false) => {
    if (!chatRef.current) return;
    if (force || isUserAtBottomRef.current) {
      if (smooth) {
        chatRef.current.scrollTo({
          top: chatRef.current.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }
  };

  const stopSpeechRecognition = (shouldSend: boolean = false) => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setRecordingState('idle');

    const textToSend = spokenTextRef.current.trim();
    // Очищаем временный сэмпл распознанной речи
    spokenTextRef.current = '';

    if (shouldSend) {
      setInputValue('');
      if (textToSend) {
        sendMessageDirectly(textToSend);
      }
    } else {
      setInputValue('');
    }
  };

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

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

  // Track car ID in ref to prevent writing previous car's state into the new car's storage on car switch
  const currentCarIdRef = useRef<string | undefined>(activeCar?.id);
  const chatStorageKey = activeCar ? `vasilich_chat_history_${activeCar.id}` : 'vasilich_chat_history_default';

  // Load chat history when active car changes
  useEffect(() => {
    currentCarIdRef.current = activeCar?.id;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    }
    setEditingMessageId(null);
    setEditingText('');

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

  // Persist messages only when they belong to the current active car
  useEffect(() => {
    if (messages.length > 0 && currentCarIdRef.current === activeCar?.id) {
      try {
        localStorage.setItem(chatStorageKey, JSON.stringify(messages));
      } catch (e) {}
    }
  }, [messages, chatStorageKey, activeCar?.id]);

  useEffect(() => {
    smartScrollToBottom(false);
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
    setShowClearConfirmModal(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    }
    try {
      localStorage.setItem(chatStorageKey, JSON.stringify([welcome]));
    } catch (e) {}
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
    if (navigator.vibrate) navigator.vibrate(15);
  };

  // Text-to-Speech (TTS) handler for Vasilich answers
  const toggleSpeakMessage = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Синтез речи не поддерживается в данном браузере.');
      return;
    }

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean text for speech synthesis (strip markdown, links, asterisks)
    const cleanSpeechText = text
      .replace(/\[CREATE_TASK:[^\]]+\]/gi, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/[*_#`~]/g, '')
      .replace(/•/g, '')
      .trim();

    if (!cleanSpeechText) return;

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.lang = 'ru-RU';

    // Dynamic voice parameters strictly based on selected character style
    const currentTone = settings.assistantTone;
    if (currentTone === 'strict' || (currentTone as string) === 'engineer') {
      utterance.pitch = 1.0; // Четкий, ровный дикторский тон
      utterance.rate = 1.05; // Размеренная, четкая речь
    } else if (currentTone === 'brief' || (currentTone as string) === 'concise') {
      utterance.pitch = 0.95;
      utterance.rate = 1.35; // Быстрая, энергичная вычитка без пауз
    } else {
      // Default: 'vasilich' / 'mechanic' (Опытный механик)
      utterance.pitch = 0.85; // Низкий, плотный мужественный бас
      utterance.rate = 1.15; // Умеренно-разговорный темп
    }

    // Select Russian voice if available
    const voices = window.speechSynthesis.getVoices();
    const ruVoice = voices.find(v => v.lang.startsWith('ru') || v.lang.includes('RU'));
    if (ruVoice) {
      utterance.voice = ruVoice;
    }

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };
    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Edit user message and resend from that point
  const handleStartEditMessage = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.text);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSaveAndResendEdit = async (msgId: string) => {
    if (!editingText.trim() || isLoading) return;
    const newText = editingText.trim();
    
    // Find index of the edited user message
    const msgIdx = messages.findIndex(m => m.id === msgId);
    if (msgIdx === -1) return;

    // Truncate messages up to this index (remove subsequent assistant replies)
    const priorHistory = messages.slice(0, msgIdx);
    
    setEditingMessageId(null);
    setEditingText('');

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    }

    await sendMessageWithCustomHistory(newText, priorHistory);
  };

  // Regenerate assistant reply
  const handleRegenerateReply = async (assistantMsgIndex: number) => {
    if (isLoading) return;

    // Find the closest preceding user message
    let userMsg: Message | null = null;
    let userMsgIdx = -1;
    for (let i = assistantMsgIndex - 1; i >= 0; i--) {
      if (messages[i].sender === 'user') {
        userMsg = messages[i];
        userMsgIdx = i;
        break;
      }
    }

    if (!userMsg || userMsgIdx === -1) return;

    // History before the user message
    const priorHistory = messages.slice(0, userMsgIdx);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    }

    await sendMessageWithCustomHistory(userMsg.text, priorHistory);
  };

  const sendMessageWithCustomHistory = async (questionText: string, historyPrefix: Message[]) => {
    if (!questionText.trim() || isLoading) return;

    if (!isOnlineState) {
      const offlineMsg: Message = {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'assistant',
        text: '⚠️ Связь с Василичем отсутствует (нет интернета). Подключите интернет, чтобы продолжить диалог.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...historyPrefix, offlineMsg]);
      return;
    }

    const userMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'user',
      text: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessagesList = [...historyPrefix, userMsg];
    setMessages(newMessagesList);
    setIsLoading(true);
    isUserAtBottomRef.current = true;
    setTimeout(() => smartScrollToBottom(true, true), 30);

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
          chatHistory: historyPrefix.slice(-6),
          assistantTone: settings.assistantTone
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

      setTypingMessageId(botMsg.id);
      setMessages([...newMessagesList, botMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'assistant',
        text: `Не удалось связаться с Василичем: ${err.message}. Проверьте соединение с интернетом.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setTypingMessageId(errorMsg.id);
      setMessages([...newMessagesList, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Speech recognition with debounce / silence detection and audio warmup
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Голосовой ввод не поддерживается данным браузером.');
      return;
    }

    if (isRecording) {
      stopSpeechRecognition(true);
      return;
    }

    try {
      spokenTextRef.current = '';
      setInputValue('');
      setIsRecording(true);
      setRecordingState('preparing');

      const recognition = new SpeechRecognition();
      recognition.lang = 'ru-RU';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // Audio engine active and ready for input
      recognition.onstart = () => {
        setRecordingState('listening');
        if (navigator.vibrate) navigator.vibrate(30);
      };

      recognition.onaudiostart = () => {
        setRecordingState('listening');
      };

      recognition.onspeechstart = () => {
        setRecordingState('listening');
      };

      recognition.onresult = (event: any) => {
        // Collect all transcripts safely without slicing or cutting leading characters
        const cleanText = Array.from(event.results)
          .map((result: any) => (result && result[0] ? result[0].transcript : ''))
          .join('')
          .trimStart();

        // Automatically capitalize first letter
        const capitalizedText = cleanText 
          ? cleanText.charAt(0).toUpperCase() + cleanText.slice(1)
          : '';

        if (capitalizedText) {
          spokenTextRef.current = capitalizedText;
          setInputValue(capitalizedText);

          // Reset silence timer on any speech activity
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // Delay auto-send until 2.0 seconds of complete silence
          silenceTimerRef.current = setTimeout(() => {
            const textToSend = spokenTextRef.current.trim();
            if (textToSend) {
              if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
              stopSpeechRecognition(true);
            }
          }, 2000);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error !== 'no-speech') {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          spokenTextRef.current = '';
          setIsRecording(false);
          setRecordingState('idle');
        }
      };

      recognition.onend = () => {
        if (!silenceTimerRef.current) {
          spokenTextRef.current = '';
          setIsRecording(false);
          setRecordingState('idle');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      spokenTextRef.current = '';
      setIsRecording(false);
      setRecordingState('idle');
    }
  };

  const sendMessageDirectly = async (questionText: string) => {
    if (!questionText.trim() || isLoading) return;

    setInputValue('');
    spokenTextRef.current = '';
    isUserAtBottomRef.current = true;
    setTimeout(() => smartScrollToBottom(true, true), 30);

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
          chatHistory: messages.slice(-6),
          assistantTone: settings.assistantTone
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

      setTypingMessageId(botMsg.id);
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'assistant',
        text: `Не удалось связаться с Василичем: ${err.message}. Проверьте соединение с интернетом.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setTypingMessageId(errorMsg.id);
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
    let cat: any = 'Other';
    if (task.category === 'Двигатель') cat = 'Engine';
    else if (task.category === 'Трансмиссия') cat = 'Transmission';
    else if (task.category === 'Тормозная система') cat = 'Brakes';
    else if (task.category === 'Ходовая/Рулевое') cat = 'Suspension';
    else if (task.category === 'Электрика') cat = 'Electrical';
    else if (task.category === 'Общее ТО') cat = 'Oil & Fluids';

    if (onAddTask) {
      onAddTask({
        title: task.title,
        type: 'simple',
        category: cat,
        relatedDtc: taskModalState.relatedDtc,
        source: 'ai'
      });

      setTaskToast({
        title: task.title,
        category: cat
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

  const toneOptions: { key: 'vasilich' | 'strict' | 'brief'; label: string; desc: string; iconLabel: string }[] = [
    {
      key: 'vasilich',
      label: 'Опытный механик',
      desc: 'Разговорный тон, гаражный юмор, простые аналогии и житейские советы.',
      iconLabel: 'Механик'
    },
    {
      key: 'strict',
      label: 'Строгий инженер-диагност',
      desc: 'Академический тон, допуски OEM/SAE/API, моменты затяжки (Н·м) и пошаговые алгоритмы.',
      iconLabel: 'Инженер'
    },
    {
      key: 'brief',
      label: 'Кратко и по делу',
      desc: 'Телеграфный стиль: максимум 2-3 предложения, без приветствий, только цифры и факты.',
      iconLabel: 'Кратко'
    }
  ];

  return (
    <div className="w-full h-full flex flex-col font-sans select-text overflow-hidden p-0 sm:p-2 max-w-4xl mx-auto">
      
      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col h-full bg-[#0B0E14] sm:border sm:border-[#1E273D] sm:rounded-2xl min-w-0 relative overflow-hidden shadow-md">
        
        {/* 1. Header */}
        <div className="h-12 px-4 py-2 bg-[#111622] border-b border-[#1E273D] flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-[#06B6D4] shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-xs sm:text-sm text-white tracking-wide leading-tight flex items-center gap-1.5">
                ВАСИЛИЧ
              </h1>
              <p className="text-[11px] text-slate-400 truncate">
                {activeCar ? `${activeCar.make} ${activeCar.model} · ${(activeCar.mileage || 0).toLocaleString('ru-RU')} км` : 'Автомобиль не выбран'}
              </p>
            </div>
          </div>

          {/* Right Header Menu */}
          <div className="flex items-center gap-1.5">
            {/* Quick Style / Tone Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsToneMenuOpen(!isToneMenuOpen);
                  setIsHeaderMenuOpen(false);
                }}
                className={`h-7 px-2 rounded-lg border text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                  isToneMenuOpen 
                    ? 'bg-cyan-500/20 text-[#06B6D4] border-cyan-500/40' 
                    : 'bg-[#0B0E14] hover:bg-[#151C2C] border-[#1E273D] text-slate-300 hover:text-white'
                }`}
                title="Стиль общения Василича"
                id="btn-vasilich-tone"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span className="text-[11px] font-medium hidden sm:inline text-slate-200">
                  {settings.assistantTone === 'strict' ? 'Инженер' : settings.assistantTone === 'brief' ? 'Кратко' : 'Механик'}
                </span>
              </button>

              {isToneMenuOpen && (
                <div className="absolute right-0 top-9 w-72 sm:w-80 bg-[#111622] border border-[#1E273D] rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1 backdrop-blur-md">
                  <div className="px-2 py-1 border-b border-[#1E273D] flex items-center justify-between text-slate-400 mb-1">
                    <span className="font-semibold text-white flex items-center gap-1.5 text-xs">
                      <Sliders className="w-3.5 h-3.5 text-[#06B6D4]" /> Стиль ответов Василича
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsToneMenuOpen(false)}
                      className="text-slate-500 hover:text-slate-300 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {toneOptions.map(opt => {
                    const isSelected = settings.assistantTone === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          if (navigator.vibrate) navigator.vibrate(15);
                          updateSettings({ assistantTone: opt.key });
                          setIsToneMenuOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg border transition-all cursor-pointer flex flex-col gap-0.5 ${
                          isSelected
                            ? 'bg-[#151C2C] border-cyan-500/50 text-white shadow-sm'
                            : 'border-transparent bg-transparent text-slate-300 hover:bg-[#151C2C]/50 hover:text-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`font-semibold text-xs ${isSelected ? 'text-[#06B6D4]' : 'text-slate-200'}`}>
                            {opt.label}
                          </span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-[#06B6D4]" />
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 leading-tight">
                          {opt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsHeaderMenuOpen(!isHeaderMenuOpen);
                  setIsToneMenuOpen(false);
                }}
                className="w-7 h-7 rounded-lg bg-[#0B0E14] hover:bg-[#151C2C] border border-[#1E273D] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Меню"
                id="btn-vasilich-menu"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {isHeaderMenuOpen && (
                <div className="absolute right-0 top-9 w-52 bg-[#111622] border border-[#1E273D] rounded-xl shadow-xl p-1 z-50 text-xs space-y-0.5 backdrop-blur-md">
                  <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Управление диалогом
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsHeaderMenuOpen(false);
                      setShowClearConfirmModal(true);
                    }}
                    className="w-full px-2.5 py-1.5 text-left rounded-lg text-rose-300 hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Очистить историю этого авто</span>
                  </button>
                  <div className="border-t border-[#1E273D] my-1"></div>
                  <button
                    type="button"
                    onClick={() => {
                      refreshObdSnapshot();
                      setIsHeaderMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-200 hover:bg-[#151C2C] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#06B6D4]" />
                    <span>Обновить данные</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {copiedToast && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-emerald-950/95 border border-emerald-500/50 text-emerald-200 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg z-50 flex items-center gap-1.5 pointer-events-none">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Скопировано</span>
          </div>
        )}

        {/* Floating Task Created Toast Notification */}
        {taskToast && (
          <div 
            id="toast-task-created"
            className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[120] max-w-sm sm:max-w-md bg-[#10151E]/95 border border-cyan-500/40 text-slate-100 p-4 rounded-xl shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-4 flex items-start gap-3 pointer-events-auto"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-[#06B6D4] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-[#06B6D4]" />
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-xs sm:text-sm text-white tracking-wide flex items-center gap-1.5">
                  <span>Задача добавлена в План ТО</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setTaskToast(null)}
                  className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer transition-colors"
                  title="Закрыть"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed truncate">
                <span>{taskToast.title}</span>
                {taskToast.targetMileage ? ` • Цель: ${taskToast.targetMileage.toLocaleString('ru-RU')} км` : taskToast.targetDate ? ` • До: ${taskToast.targetDate}` : ''}
              </p>
            </div>
          </div>
        )}

        {/* Floating Scroll Controls (Top & Bottom) */}
        <div className="absolute right-4 bottom-20 z-20 flex flex-col gap-2 pointer-events-none">
          {showScrollTop && (
            <button
              type="button"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                chatRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="pointer-events-auto bg-[#10151E]/90 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 p-2.5 rounded-full shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer flex items-center justify-center animate-in fade-in"
              title="Прокрутить в начало"
              aria-label="Прокрутить в начало"
              id="btn-scroll-chat-top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}

          {showScrollBottom && (
            <button
              type="button"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                isUserAtBottomRef.current = true;
                smartScrollToBottom(true, true);
              }}
              className="pointer-events-auto bg-[#10151E]/90 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 p-2.5 rounded-full shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer flex items-center justify-center animate-in fade-in"
              title="Прокрутить вниз"
              aria-label="Прокрутить вниз к новым сообщениям"
              id="btn-scroll-chat-bottom"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 2. Messages Stream */}
        <div 
          ref={chatRef}
          onScroll={(e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
            // Mark whether user is currently anchored at the bottom
            isUserAtBottomRef.current = distanceFromBottom < 100;
            setShowScrollTop(scrollTop > 300);
            setShowScrollBottom(distanceFromBottom > 120);
          }}
          className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-5 py-3.5 space-y-3"
        >
          
          {/* Welcome Screen when conversation is fresh */}
          {isChatEmptyOrWelcomeOnly && (
            <div className="py-8 sm:py-12 flex flex-col items-center text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-[#06B6D4] mb-3.5 shadow-sm">
                <Bot className="w-7 h-7" />
              </div>
              
              <h2 className="text-lg sm:text-xl font-bold text-white mb-1">
                Василич на связи
              </h2>
              
              <p className="text-xs text-[#06B6D4] mb-4 font-semibold tracking-wide">
                {activeCar ? `${activeCar.make} ${activeCar.model} · ${(activeCar.mileage || 0).toLocaleString('ru-RU')} км` : 'Автомобиль в гараже'}
              </p>

              <div className="bg-[#111622] border border-[#1E273D] rounded-2xl p-4 text-xs sm:text-[13px] text-slate-300 leading-relaxed mb-5 shadow-sm">
                «Рассказывай, что с машиной. Можно обычными словами — я разберусь.»
              </div>

              {/* Voice Button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`w-full sm:w-auto min-w-[200px] h-11 px-6 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-sm ${
                  isRecording 
                    ? 'bg-rose-500 text-white' 
                    : 'bg-[#06B6D4] hover:bg-cyan-400 text-slate-950 font-semibold'
                }`}
                title="Нажмите, чтобы сказать голосом"
              >
                <Mic className="w-4 h-4" />
                <span>{isRecording ? "Слушаю..." : "Сказать голосом"}</span>
              </button>
            </div>
          )}

          {/* Active Conversation Messages */}
          {!isChatEmptyOrWelcomeOnly && messages.map((m, mIdx) => {
            const msgActions = m.actions || [];
            const isEditingThisMsg = editingMessageId === m.id;
            const isSpeakingThisMsg = speakingMessageId === m.id;

            if (m.sender === 'user') {
              return (
                <div key={m.id} className="group relative flex flex-col items-end max-w-[85%] sm:max-w-[75%] ml-auto">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-0.5 pr-1">
                    <span>Вы</span>
                    <span>·</span>
                    <span>{m.timestamp}</span>
                  </div>

                  {isEditingThisMsg ? (
                    <div className="w-full bg-[#151D2C] border border-cyan-500/50 rounded-2xl rounded-tr-sm p-2.5 shadow-lg space-y-2 animate-in fade-in">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSaveAndResendEdit(m.id);
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        rows={2}
                        autoFocus
                        className="w-full bg-[#0B0E14] border border-[#1E273D] rounded-xl p-2 text-xs sm:text-[13px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 resize-none"
                      />
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-[#1E273D] transition-colors cursor-pointer"
                        >
                          Отмена
                        </button>
                        <button
                          type="button"
                          disabled={!editingText.trim() || isLoading}
                          onClick={() => handleSaveAndResendEdit(m.id)}
                          className="px-3 py-1 bg-[#06B6D4] hover:bg-cyan-400 disabled:opacity-40 text-slate-950 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                        >
                          <Send className="w-3 h-3 text-slate-950" />
                          <span>Сохранить и отправить</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="bg-[#1A2336] text-slate-100 border border-[#26354D] rounded-2xl rounded-tr-sm px-3.5 py-2 text-xs sm:text-[13px] leading-relaxed shadow-sm whitespace-pre-wrap break-words">
                        {m.text}
                      </div>

                      {/* User Message Actions Bar (Visible on hover on desktop / always subtle on mobile) */}
                      <div className="opacity-0 group-hover:opacity-100 sm:transition-opacity flex items-center gap-1 absolute -bottom-3 right-2 bg-[#111622]/95 border border-[#1E273D] px-1.5 py-0.5 rounded-lg shadow-md z-10 backdrop-blur-sm">
                        <button
                          type="button"
                          onClick={() => handleStartEditMessage(m)}
                          className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-[#151C2C] transition-colors cursor-pointer"
                          title="Редактировать запрос"
                          aria-label="Редактировать сообщение"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(m.text)}
                          className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-[#151C2C] transition-colors cursor-pointer"
                          title="Копировать"
                          aria-label="Копировать сообщение"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Assistant Message
            return (
              <div key={m.id} className="group relative flex flex-col items-start w-full max-w-full mr-auto">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-0.5 pl-1">
                  <span className="text-[#06B6D4] font-medium">Василич</span>
                  <span>·</span>
                  <span>{m.timestamp}</span>
                </div>

                <div className="w-full max-w-[96%] sm:max-w-[90%] bg-[#111622] border border-[#1E273D] rounded-2xl rounded-tl-sm px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-[13px] leading-relaxed text-slate-200 shadow-sm relative">
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
                    <FormattedMessage 
                      text={m.text} 
                      animate={typingMessageId === m.id} 
                      onType={() => smartScrollToBottom(false)} 
                      onComplete={() => {
                        if (typingMessageId === m.id) {
                          setTypingMessageId(null);
                        }
                      }}
                    />
                  )}

                  {/* Safety Warning */}
                  {m.safetyWarning && (
                    <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                      <span className="leading-relaxed">{m.safetyWarning}</span>
                    </div>
                  )}

                  {/* Executed Action Line */}
                  {m.actionStatus === 'executed' && (
                    <div className="mt-2 pt-2 border-t border-[#1E273D] flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Записано в историю</span>
                    </div>
                  )}

                  {/* Cancelled Action Line */}
                  {m.actionStatus === 'cancelled' && (
                    <div className="mt-2 pt-2 border-t border-[#1E273D] flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <X className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Отменено</span>
                    </div>
                  )}

                  {/* Contextual Action Buttons (Only when user confirmation is pending) */}
                  {msgActions.length > 0 && (!m.actionStatus || m.actionStatus === 'pending') && (
                    <div className="mt-2.5 pt-2 border-t border-[#1E273D] flex flex-wrap items-center gap-1.5">
                      {msgActions.map((act, actIdx) => {
                        let isConfirm = act.type === 'confirm_action' || act.label.toLowerCase().includes('записать') || act.label.toLowerCase().includes('исправить') || act.label.toLowerCase().includes('удалить');
                        let isCancel = act.type === 'cancel_action' || act.label.toLowerCase().includes('отмена') || act.label.toLowerCase().includes('нет') || act.label.toLowerCase().includes('изменить');

                        if (isConfirm) {
                          return (
                            <button
                              key={actIdx}
                              type="button"
                              onClick={() => handleActionClick(act, m.text, m.id)}
                              className="h-8 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all text-xs font-semibold active:scale-95"
                            >
                              <Check className="w-3.5 h-3.5 text-slate-950" />
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
                              className="h-8 px-3 bg-[#151C2C] hover:bg-[#1C253B] text-slate-300 hover:text-white border border-[#1E273D] rounded-lg flex items-center gap-1.5 cursor-pointer transition-all text-xs font-medium"
                            >
                              <X className="w-3.5 h-3.5 text-slate-400" />
                              <span>{act.label}</span>
                            </button>
                          );
                        }

                        return (
                          <button
                            key={actIdx}
                            type="button"
                            onClick={() => handleActionClick(act, m.text, m.id)}
                            className="h-8 px-3 bg-[#151C2C] hover:bg-[#1C253B] text-[#06B6D4] hover:text-white border border-cyan-500/25 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all text-xs font-medium"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#06B6D4]" />
                            <span>{act.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Assistant Message Actions Toolbar */}
                  <div className="mt-2.5 pt-2 border-t border-[#1E273D]/60 flex items-center justify-between text-slate-400 text-xs">
                    <div className="flex items-center gap-1">
                      {/* Copy response */}
                      <button
                        type="button"
                        onClick={() => copyToClipboard(m.text)}
                        className="p-1 px-1.5 hover:text-cyan-400 rounded-md hover:bg-[#151C2C] transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                        title="Скопировать ответ"
                      >
                        <Copy className="w-3 h-3 text-slate-400 hover:text-cyan-400" />
                        <span className="hidden sm:inline">Копировать</span>
                      </button>

                      {/* Text to speech (TTS) */}
                      <button
                        type="button"
                        onClick={() => toggleSpeakMessage(m.id, m.text)}
                        className={`p-1 px-1.5 rounded-md transition-colors flex items-center gap-1 text-[11px] cursor-pointer ${
                          isSpeakingThisMsg 
                            ? 'text-cyan-300 bg-cyan-500/20 animate-pulse' 
                            : 'hover:text-cyan-400 hover:bg-[#151C2C]'
                        }`}
                        title={isSpeakingThisMsg ? "Остановить озвучку" : "Озвучить ответ"}
                      >
                        {isSpeakingThisMsg ? (
                          <>
                            <VolumeX className="w-3 h-3 text-cyan-300" />
                            <span className="hidden sm:inline">Стоп</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Озвучить</span>
                          </>
                        )}
                      </button>

                      {/* Regenerate / Retry response (if not welcome) */}
                      {!m.isWelcome && (
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleRegenerateReply(mIdx)}
                          className="p-1 px-1.5 hover:text-cyan-400 disabled:opacity-40 rounded-md hover:bg-[#151C2C] transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                          title="Перегенерировать ответ"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span className="hidden sm:inline">Повторить</span>
                        </button>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-500">
                      Василич AI
                    </span>
                  </div>

                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex flex-col items-start w-full max-w-full mr-auto">
              <div className="text-[10px] text-[#06B6D4] font-medium mb-0.5 pl-1">
                Василич думает...
              </div>
              <div className="px-3.5 py-2.5 border border-[#1E273D] bg-[#111622] text-xs text-slate-300 rounded-2xl rounded-tl-sm flex items-center gap-2.5 shadow-sm">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#06B6D4]" />
                <span>Сверяю историю автомобиля...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 3. Bottom Composer */}
        <div className="p-2.5 bg-[#111622] border-t border-[#1E273D] shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 w-full max-w-4xl mx-auto">
            <div className="relative flex items-center flex-1 bg-[#0B0E14] border border-[#1E273D] focus-within:border-cyan-500/70 rounded-xl px-1.5 py-0.5 transition-all">
              
              {/* Mic button */}
              <button
                type="button"
                disabled={isLoading || !isOnlineState}
                onClick={toggleSpeechRecognition}
                className={`w-9 h-9 rounded-lg transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                  recordingState === 'preparing'
                    ? 'text-amber-300 bg-amber-500/20 border border-amber-500/40 animate-pulse'
                    : recordingState === 'listening'
                    ? 'text-white bg-rose-500 animate-pulse shadow-sm shadow-rose-500/40'
                    : 'text-slate-400 hover:text-[#06B6D4] hover:bg-[#151C2C]'
                }`}
                title={
                  recordingState === 'preparing'
                    ? 'Подключение микрофона...'
                    : recordingState === 'listening'
                    ? 'Слушаю вас... Нажмите, чтобы остановить и отправить'
                    : 'Голосовой ввод'
                }
                aria-label="Голосовой ввод"
              >
                <Mic className="w-4 h-4" />
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                required={!isRecording}
                disabled={isLoading || !isOnlineState}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (inputValue.trim() && !isLoading && !isRecording && isOnlineState) {
                      const userText = inputValue.trim();
                      setInputValue('');
                      sendMessageDirectly(userText);
                    }
                  }
                }}
                placeholder={
                  !isOnlineState
                    ? 'Автономный режим (нет сети)'
                    : recordingState === 'preparing'
                    ? '🎙 Подключение микрофона...'
                    : recordingState === 'listening'
                    ? '🎙 Слушаю вас... Говорите!'
                    : 'Напишите Василичу… (Enter — отправить, Shift+Enter — перенос)'
                }
                className={`flex-1 bg-transparent px-2.5 py-2 text-xs sm:text-[13px] text-slate-100 placeholder-slate-500 focus:outline-none min-w-0 resize-none max-h-32 overflow-y-auto leading-relaxed ${
                  recordingState === 'listening' ? 'font-medium text-cyan-300 placeholder-cyan-400/70' : ''
                }`}
                id="rag-input"
              />

              {/* Send button */}
              <button
                type="submit"
                disabled={isLoading || isRecording || !isOnlineState || !inputValue.trim()}
                className="w-9 h-9 rounded-lg bg-[#06B6D4] hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-[#06B6D4] text-slate-950 flex items-center justify-center font-bold cursor-pointer shrink-0 transition-colors self-end mb-0.5"
                id="btn-rag-send"
                title="Отправить (Enter)"
                aria-label="Отправить"
              >
                {isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-slate-950" />
                )}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101520] border border-[#1E273D] rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">
                  Очистить историю {activeCar ? `${activeCar.make} ${activeCar.model}` : 'автомобиля'}?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Все сообщения диалога для этого автомобиля будут удалены. История других машин не пострадает.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-[#151C2C] hover:bg-[#1C253B] border border-[#1E273D] transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleClearChatHistory}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-all cursor-pointer shadow-md active:scale-95"
              >
                Очистить
              </button>
            </div>
          </div>
        </div>
      )}

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

function FormattedMessage({ 
  text, 
  animate = false, 
  onType, 
  onComplete 
}: { 
  text: string; 
  animate?: boolean; 
  onType?: () => void; 
  onComplete?: () => void; 
}) {
  const animatedText = useTypewriter(animate ? text : '', 10);
  const displayText = animate ? animatedText : text;
  const isTyping = animate && animatedText.length < text.length;
  const lines = displayText.split('\n');

  useEffect(() => {
    if (animate && onType) {
      onType();
    }
    if (animate && animatedText.length >= text.length && onComplete) {
      onComplete();
    }
  }, [displayText, animate, onType, animatedText.length, text.length, onComplete]);

  return (
    <div className="space-y-1 font-sans text-xs sm:text-[13px] relative">
      {lines.map((line, idx) => {
        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-xs font-semibold text-[#06B6D4] mt-2 mb-0.5">
              {line.substring(4)}
            </h4>
          );
        }
        if (line.startsWith('## ') || line.startsWith('# ')) {
          const headerText = line.startsWith('## ') ? line.substring(3) : line.substring(2);
          return (
            <h3 key={idx} className="text-xs sm:text-[13px] font-bold text-white mt-2 mb-0.5">
              {headerText}
            </h3>
          );
        }
        if (line.startsWith('* ') || line.startsWith('- ') || line.startsWith('• ')) {
          const content = parseInlineFormatting(line.replace(/^[\*\-•]\s*/, ''));
          return (
            <div key={idx} className="flex items-start gap-1.5 ml-0.5 py-0.5 text-slate-200">
              <span className="text-[#06B6D4] select-none text-xs mt-0.5">•</span>
              <span className="flex-1 leading-relaxed">{content}</span>
            </div>
          );
        }
        const numberedMatch = line.match(/^(\d+[\.\)])\s+(.*)/);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex items-start gap-1.5 ml-0.5 py-0.5 text-slate-200">
              <span className="text-[#06B6D4] font-semibold text-xs mt-0.5">{numberedMatch[1]}</span>
              <span className="flex-1 leading-relaxed">{parseInlineFormatting(numberedMatch[2])}</span>
            </div>
          );
        }
        if (line.trim() === '') {
          return <div key={idx} className="h-0.5" />;
        }
        return <p key={idx} className="leading-relaxed text-slate-200">{parseInlineFormatting(line)}</p>;
      })}
      {isTyping && (
        <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-[#06B6D4] animate-pulse align-middle" />
      )}
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
      return <code key={i} className="bg-[#0B0E14] border border-[#1E273D] text-[11px] text-[#06B6D4] px-1 py-0.5 rounded font-mono">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
