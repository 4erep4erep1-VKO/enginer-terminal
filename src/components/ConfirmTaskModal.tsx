/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Check, Bookmark, Sparkles, Car, CheckSquare, Layers } from 'lucide-react';

export const TASK_CATEGORIES = [
  'Общее ТО',
  'Двигатель',
  'Ходовая/Рулевое',
  'Электрика',
  'Тормозная система',
  'Трансмиссия'
] as const;

export type TaskCategory = typeof TASK_CATEGORIES[number];

export function detectTaskCategory(text: string): TaskCategory {
  const lower = text.toLowerCase();
  
  // 1. Рулевое / Ходовая / ГУР
  if (/гур|рулев|рейк|тяг|жидкость гур|насос гур|стойк|амортизатор|сайлентблок|подвеск|рычаг|пружин|шаров|ступиц|колес/i.test(lower)) {
    return 'Ходовая/Рулевое';
  }
  // 2. Двигатель / Масло / Ремни / ДВС
  if (/масл|ремн|ремень|грм|двс|свеч|фильтр|мотор|двигател|клапан|цилиндр|тосол|антифриз|радиатор|помпа|турбин/i.test(lower)) {
    return 'Двигатель';
  }
  // 3. Электрика / Ошибки / Предохранители
  if (/ошибк|предохранител|реле|проводк|акб|аккумулятор|генератор|свет|фара|фары|ламп|эбу|пиноут|датчик|электр/i.test(lower)) {
    return 'Электрика';
  }
  // 4. Тормозная система
  if (/колодк|диск|суппорт|тормоз|жидкость тормоз|ручник/i.test(lower)) {
    return 'Тормозная система';
  }
  // 5. Трансмиссия
  if (/коробк|кпп|акпп|мкпп|сцеплен|масло кпп|редуктор|привод|шрус/i.test(lower)) {
    return 'Трансмиссия';
  }
  return 'Общее ТО';
}

interface ConfirmTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText: string;
  carName?: string;
  onConfirm: (task: { title: string; category: TaskCategory }) => void;
}

export function ConfirmTaskModal({
  isOpen,
  onClose,
  initialText,
  carName,
  onConfirm
}: ConfirmTaskModalProps) {
  const [taskText, setTaskText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('Общее ТО');

  useEffect(() => {
    if (isOpen) {
      // Clean up brackets or markdown symbols if present
      let cleaned = initialText
        .replace(/^#+\s*/gm, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .trim();

      // If initialText is single line, strip leading list icon/bullet
      if (!cleaned.includes('\n')) {
        cleaned = cleaned.replace(/^[•\-\*✓📌]+\s*/, '').trim();
      }

      setTaskText(cleaned);
      const autoCategory = detectTaskCategory(cleaned);
      setSelectedCategory(autoCategory);
    }
  }, [isOpen, initialText]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    // Build title with category tag if not present
    let finalTitle = taskText.trim();
    if (selectedCategory !== 'Общее ТО' && !finalTitle.toLowerCase().includes(selectedCategory.toLowerCase()) && !finalTitle.startsWith('[')) {
      finalTitle = `[${selectedCategory}] ${finalTitle}`;
    }

    onConfirm({
      title: finalTitle,
      category: selectedCategory
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div 
        className="bg-[#111622] border border-[#1E273D] rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl space-y-3.5 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#1E273D] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/25 rounded-xl text-[#06B6D4]">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Подтверждение новой задачи</span>
              </h3>
              {carName && (
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Car className="w-3 h-3 text-[#06B6D4]" />
                  <span>Автомобиль: <strong className="text-slate-200">{carName}</strong></span>
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-[#151C2C] rounded-lg transition-all cursor-pointer"
            title="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Текст задачи / Содержание работ *
            </label>
            <textarea
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              required
              rows={3}
              placeholder="Опишите планируемую работу..."
              className="w-full bg-[#0B0E14] border border-[#1E273D] rounded-xl p-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans transition-all resize-none"
            />
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>Категория</span>
            </label>
            <div className="flex flex-wrap gap-1">
              {TASK_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                      isActive
                        ? 'bg-[#151C2C] text-[#06B6D4] border-cyan-500/40'
                        : 'bg-[#0B0E14] text-slate-400 border-[#1E273D] hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {isActive ? `✓ ${cat}` : cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-[#1E273D] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary py-2 px-3 text-xs font-medium rounded-xl cursor-pointer"
              id="btn-cancel-task-modal"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!taskText.trim()}
              className="btn-primary py-2 px-4 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              id="btn-confirm-task-modal"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Подтвердить и создать</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
