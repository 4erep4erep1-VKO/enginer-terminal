/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  DiagnosticResponse, 
  DiagnosticRecommendedPart, 
  Part 
} from '../types';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Wrench, 
  FileText, 
  Package, 
  Zap, 
  Layers, 
  Check, 
  Compass,
  Sparkles
} from 'lucide-react';

interface DiagnosticResponseCardProps {
  response: DiagnosticResponse;
  parts: Part[];
  onShowDiagram?: (query?: string) => void;
  onCreateTask?: (taskData: { title: string; category?: any; relatedDtc?: string; relatedPartIds?: string[] }) => void;
  onCheckInventory?: (searchQuery?: string) => void;
  onAskFollowup?: (question: string) => void;
}

export function DiagnosticResponseCard({
  response,
  parts,
  onShowDiagram,
  onCreateTask,
  onCheckInventory,
  onAskFollowup,
}: DiagnosticResponseCardProps) {
  const findInventoryMatch = (recPart: DiagnosticRecommendedPart) => {
    if (!parts || parts.length === 0) return null;
    const nameLower = recPart.name.toLowerCase();
    const partNumLower = recPart.partNumber?.toLowerCase();

    return parts.find(p => {
      const pNumMatch = partNumLower && p.partNumber && p.partNumber.toLowerCase() === partNumLower;
      const pNameMatch = p.name.toLowerCase().includes(nameLower) || nameLower.includes(p.name.toLowerCase());
      return pNumMatch || pNameMatch;
    });
  };

  const matchedPartIds: string[] = [];
  response.recommendedParts?.forEach(p => {
    const match = findInventoryMatch(p);
    if (match) matchedPartIds.push(match.id);
  });

  const severityColor = response.severity === 'critical' 
    ? '#EF4444' 
    : response.severity === 'warning' 
    ? '#F59E0B' 
    : '#06B6D4';

  const severityLabel = response.severity === 'critical'
    ? 'CRITICAL'
    : response.severity === 'warning'
    ? 'WARNING'
    : 'INFO';

  return (
    <div className="text-left font-sans text-slate-200 divide-y divide-[#1E293B] space-y-3">
      
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. HEADER & DIAGNOSIS HERO (Compact Hierarchy)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="space-y-1.5 pt-0.5">
        {/* Status Indicator */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-mono font-bold tracking-wider">
            <span 
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: severityColor }}
            />
            <span style={{ color: severityColor }} className="text-xs uppercase">
              {severityLabel}
            </span>
          </div>

          {typeof response.confidence === 'number' && (
            <div className="text-[11px] text-slate-400 font-mono">
              ДОСТОВЕРНОСТЬ: <span className="text-slate-200 font-bold">{Math.round(response.confidence * 100)}%</span>
            </div>
          )}
        </div>

        {/* DTC & Diagnosis Title */}
        <div className="space-y-0.5">
          {response.relatedDtc && (
            <div className="text-lg sm:text-xl font-mono font-bold tracking-tight text-white flex items-center gap-2">
              <span className="text-[#06B6D4]">{response.relatedDtc}</span>
            </div>
          )}

          {response.summary && (
            <h3 className="text-[16px] sm:text-[17px] font-semibold text-slate-100 leading-snug tracking-tight">
              {response.summary}
            </h3>
          )}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. ФАКТЫ
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {response.facts && response.facts.length > 0 && (
        <div className="pt-2.5 space-y-1.5">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#94A3B8]">
            ФАКТЫ
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[13px] sm:text-[14px]">
            {response.facts.map((fact, idx) => (
              <div key={idx} className="flex items-start gap-2 text-slate-300 py-0.5">
                <span className="text-cyan-400 select-none text-xs mt-1">▪</span>
                <span className="leading-relaxed">{fact}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. ТЕХНИКА БЕЗОПАСНОСТИ (Calm Amber Notification)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {response.safetyWarning && response.safetyWarning.trim().length > 0 && (
        <div className="pt-3">
          <div className="p-2.5 rounded-lg bg-[#181308] border border-[#F59E0B]/30 text-xs leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 text-[#F59E0B] font-mono font-bold text-[10px] tracking-wider uppercase">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>ТЕХНИКА БЕЗОПАСНОСТИ</span>
            </div>
            <p className="text-amber-100/90 leading-relaxed font-sans">{response.safetyWarning}</p>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. ВОЗМОЖНЫЕ ПРИЧИНЫ (Clean Engineering List)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {response.possibleCauses && response.possibleCauses.length > 0 && (
        <div className="pt-3 space-y-2">
          <div className="text-xs font-mono font-semibold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>ВОЗМОЖНЫЕ ПРИЧИНЫ</span>
          </div>

          <div className="divide-y divide-[#1E293B]/60">
            {response.possibleCauses.map((cause, idx) => {
              const probLabel = cause.probability === 'high' 
                ? 'ВЫСОКАЯ' 
                : cause.probability === 'medium' 
                ? 'СРЕДНЯЯ' 
                : 'НИЗКАЯ';

              const probColor = cause.probability === 'high'
                ? 'text-[#EF4444]'
                : cause.probability === 'medium'
                ? 'text-[#F59E0B]'
                : 'text-[#64748B]';

              return (
                <div key={idx} className="py-2 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="font-mono font-bold text-xs text-[#06B6D4] shrink-0 pt-0.5">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-slate-100">
                        {cause.title}
                      </div>
                      {cause.explanation && (
                        <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed">
                          {cause.explanation}
                        </p>
                      )}
                    </div>
                  </div>

                  {cause.probability && (
                    <span className={`text-[10px] font-mono font-bold shrink-0 tracking-wider pt-0.5 ${probColor}`}>
                      {probLabel}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          5. ЧТО ПРОВЕРИТЬ (Main Working Block, Flat Precision)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {response.recommendedChecks && response.recommendedChecks.length > 0 && (
        <div className="pt-3 space-y-2.5">
          <div className="text-xs font-mono font-semibold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
            <Wrench className="w-3.5 h-3.5 text-[#10B981]" />
            <span>ЧТО ПРОВЕРИТЬ</span>
          </div>

          <div className="space-y-2.5">
            {response.recommendedChecks.map((chk, idx) => (
              <div key={idx} className="space-y-1 py-0.5">
                <div className="flex items-start gap-2.5">
                  <span className="font-mono font-bold text-xs text-[#10B981] shrink-0 pt-0.5">
                    {chk.step ? String(chk.step).padStart(2, '0') : String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-slate-100 leading-snug">
                      {chk.title}
                    </div>
                    {chk.description && (
                      <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed">
                        {chk.description}
                      </p>
                    )}
                  </div>
                </div>

                {chk.expectedResult && (
                  <div className="ml-6 text-xs font-mono text-slate-300 bg-[#080B11] border-l-2 border-[#10B981] px-2.5 py-1 rounded-r">
                    <span className="text-[#10B981] font-bold block text-[10px] uppercase tracking-wider mb-0.5">
                      ОЖИДАЕМЫЙ РЕЗУЛЬТАТ:
                    </span>
                    <span className="text-slate-200">{chk.expectedResult}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          6. ЗАПЧАСТИ (Instant Scannable Sheet)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {response.recommendedParts && response.recommendedParts.length > 0 && (
        <div className="pt-3 space-y-2">
          <div className="text-xs font-mono font-semibold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>ЗАПЧАСТИ</span>
          </div>

          <div className="divide-y divide-[#1E293B]/60">
            {response.recommendedParts.map((part, idx) => {
              const match = findInventoryMatch(part);
              const available = match ? Math.max(0, match.quantity - (match.reservedQuantity || 0)) : 0;

              return (
                <div key={idx} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-slate-100">{part.name}</span>
                      {part.partNumber && (
                        <span className="font-mono text-xs text-[#06B6D4]">
                          #{part.partNumber}
                        </span>
                      )}
                    </div>
                    {part.reason && <p className="text-xs text-[#94A3B8]">{part.reason}</p>}
                    
                    <div className="text-[11px] font-mono pt-0.5">
                      {match ? (
                        available > 0 ? (
                          <span className="text-[#10B981]">
                            В наличии: {match.quantity} шт. · Доступно: {available} шт. {match.location ? `(ячейка ${match.location})` : ''}
                          </span>
                        ) : (
                          <span className="text-[#EF4444]">
                            Нет на складе (0 шт.)
                          </span>
                        )
                      ) : (
                        <span className="text-[#64748B]">
                          Не числится в каталоге склада
                        </span>
                      )}
                    </div>
                  </div>

                  {onCheckInventory && (
                    <button
                      type="button"
                      onClick={() => onCheckInventory(part.name)}
                      className="px-2.5 py-1 rounded bg-transparent hover:bg-[#1E293B] text-xs font-mono text-[#06B6D4] border border-[#1E293B] hover:border-[#06B6D4]/40 cursor-pointer self-start sm:self-center shrink-0 transition-colors"
                    >
                      СКЛАД
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          7. ДЕЙСТВИЯ
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="pt-2.5 flex flex-wrap items-center gap-2">
        {/* Primary Action */}
        {onCreateTask && (
          <button
            type="button"
            onClick={() => {
              const primaryTaskTitle = response.recommendedChecks?.[0]?.title 
                || (response.relatedDtc ? `Устранить неисправность ${response.relatedDtc}` : response.summary.slice(0, 50));
              onCreateTask({
                title: primaryTaskTitle,
                relatedDtc: response.relatedDtc,
                relatedPartIds: matchedPartIds.length > 0 ? matchedPartIds : undefined,
                category: 'Двигатель'
              });
            }}
            className="h-8 px-3 rounded-lg bg-[#06B6D4] hover:bg-[#22D3EE] text-[#080B11] text-[13px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            id="btn-diag-create-task"
          >
            <FileText className="w-3.5 h-3.5 text-[#080B11]" />
            <span>Внести в план ТО</span>
          </button>
        )}

        {/* Secondary Action: СХЕМА */}
        {onShowDiagram && (
          <button
            type="button"
            onClick={() => onShowDiagram(response.relatedDtc || response.summary)}
            className="h-8 px-3 rounded-lg bg-[#080B11] hover:bg-[#1E293B] text-slate-200 border border-[#1E293B] hover:border-cyan-500/50 text-[13px] font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            id="btn-diag-show-diagram"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Схема</span>
          </button>
        )}

        {/* Tertiary Action: СКЛАД */}
        {onCheckInventory && (
          <button
            type="button"
            onClick={() => onCheckInventory(response.recommendedParts?.[0]?.name || response.relatedDtc)}
            className="h-8 px-3 rounded-lg bg-[#080B11] hover:bg-[#1E293B] text-slate-300 hover:text-white border border-[#1E293B] hover:border-amber-500/50 text-[13px] font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            id="btn-diag-check-stock"
          >
            <Package className="w-3.5 h-3.5 text-amber-400" />
            <span>Склад</span>
          </button>
        )}

        {onAskFollowup && (
          <button
            type="button"
            onClick={() => onAskFollowup(`Василич, поясни подробнее: ${response.summary}`)}
            className="h-8 px-2.5 rounded-lg bg-transparent hover:bg-[#1E293B] text-slate-400 hover:text-slate-200 text-[12px] flex items-center justify-center gap-1.5 sm:ml-auto cursor-pointer transition-colors"
            id="btn-diag-followup"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Уточнить</span>
          </button>
        )}
      </div>

    </div>
  );
}


