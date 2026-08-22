/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Bot, 
  PlusCircle, 
  Mic, 
  PackagePlus
} from 'lucide-react';

interface QuickActionGridProps {
  onAskVasilich?: () => void;
  onScanObd?: () => void;
  onAddRecord: () => void;
  onVoiceInput: () => void;
  onOpenParts: () => void;
}

export function QuickActionGrid({
  onAskVasilich,
  onScanObd,
  onAddRecord,
  onVoiceInput,
  onOpenParts,
}: QuickActionGridProps) {
  const triggerAction = (action?: () => void) => {
    if (!action) return;
    if (navigator.vibrate) navigator.vibrate(15);
    action();
  };

  const handleAsk = onAskVasilich || onScanObd || (() => {});

  return (
    <section className="space-y-2 font-sans" aria-label="Быстрые действия">
      <div className="flex items-center justify-between px-0.5">
        <h3 className="text-xs font-mono font-semibold text-slate-400 tracking-wider uppercase flex items-center gap-2">
          <span>БЫСТРЫЕ ДЕЙСТВИЯ</span>
        </h3>
        <span className="text-[10px] font-mono text-[#06B6D4]">1-ТАП</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        
        {/* 1. Спросить Василича */}
        <button
          type="button"
          onClick={() => triggerAction(handleAsk)}
          className="h-11 sm:h-12 px-3 rounded-lg bg-[#0F172A] hover:bg-[#131D33] border border-[#1E293B] hover:border-[#06B6D4]/40 text-left transition-colors flex items-center gap-2.5 cursor-pointer active:scale-98"
          id="btn-quick-ask-vasilich"
        >
          <div className="w-7 h-7 rounded bg-[#06B6D4]/15 text-[#06B6D4] flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-slate-100 truncate">
              Василич
            </span>
            <span className="block text-[10px] font-mono text-slate-400 truncate">
              Помощь мастера
            </span>
          </div>
        </button>

        {/* 2. Добавить ТО */}
        <button
          type="button"
          onClick={() => triggerAction(onAddRecord)}
          className="h-11 sm:h-12 px-3 rounded-lg bg-[#0F172A] hover:bg-[#131D33] border border-[#1E293B] hover:border-[#10B981]/40 text-left transition-colors flex items-center gap-2.5 cursor-pointer active:scale-98"
          id="btn-quick-add-record"
        >
          <div className="w-7 h-7 rounded bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shrink-0">
            <PlusCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-slate-100 truncate">
              Запись ТО
            </span>
            <span className="block text-[10px] font-mono text-slate-400 truncate">
              Внести чек
            </span>
          </div>
        </button>

        {/* 3. Голос */}
        <button
          type="button"
          onClick={() => triggerAction(onVoiceInput)}
          className="h-11 sm:h-12 px-3 rounded-lg bg-[#0F172A] hover:bg-[#131D33] border border-[#1E293B] hover:border-[#F59E0B]/40 text-left transition-colors flex items-center gap-2.5 cursor-pointer active:scale-98"
          id="btn-quick-voice-input"
        >
          <div className="w-7 h-7 rounded bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center shrink-0">
            <Mic className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-slate-100 truncate">
              Голос
            </span>
            <span className="block text-[10px] font-mono text-slate-400 truncate">
              Диктовка
            </span>
          </div>
        </button>

        {/* 4. Запчасть / Склад */}
        <button
          type="button"
          onClick={() => triggerAction(onOpenParts)}
          className="h-11 sm:h-12 px-3 rounded-lg bg-[#0F172A] hover:bg-[#131D33] border border-[#1E293B] hover:border-[#818CF8]/40 text-left transition-colors flex items-center gap-2.5 cursor-pointer active:scale-98"
          id="btn-quick-open-parts"
        >
          <div className="w-7 h-7 rounded bg-[#818CF8]/15 text-[#818CF8] flex items-center justify-center shrink-0">
            <PackagePlus className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-slate-100 truncate">
              Склад
            </span>
            <span className="block text-[10px] font-mono text-slate-400 truncate">
              Запчасти
            </span>
          </div>
        </button>

      </div>
    </section>
  );
}
