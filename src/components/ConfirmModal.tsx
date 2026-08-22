/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'УДАЛИТЬ',
  cancelText = 'ОТМЕНА',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/85 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="w-full md:max-w-md bg-[#050b18] border-t-2 md:border-2 border-red-500/80 shadow-[0_-10px_25px_rgba(239,68,68,0.2)] md:shadow-[0_0_30px_rgba(239,68,68,0.25)] relative font-mono rounded-t-2xl md:rounded-none overflow-hidden transform transition-all duration-300 ease-out"
        id="confirm-modal-box"
      >
        {/* iOS style drag handle indicator */}
        <div className="w-12 h-1 bg-red-800/40 rounded-full mx-auto my-3 md:hidden" />

        {/* Neon accent top border block */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-pink-500 to-red-600 hidden md:block"></div>
        
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:16px_16px] opacity-5 pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-500/20 px-4 py-3.5 bg-red-950/10 relative z-10">
          <span className="text-red-500 font-extrabold text-xs tracking-widest uppercase flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
            {title}
          </span>
          <button 
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(15);
              onCancel();
            }}
            className="text-red-400 hover:text-red-300 p-1 cursor-pointer hover:bg-red-950/40 rounded transition-colors"
            id="confirm-modal-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 text-xs text-cyan-100 leading-relaxed space-y-3 relative z-10">
          <p className="font-mono text-cyan-200/90">{message}</p>
        </div>

        {/* Footer actions */}
        <div className="border-t border-cyan-800/20 px-4 py-4 md:py-3.5 flex flex-col-reverse sm:flex-row gap-3 justify-end bg-black/40 relative z-10 pb-24 sm:pb-3.5">
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(15);
              onCancel();
            }}
            className="w-full sm:w-auto justify-center flex border border-cyan-800/40 text-cyan-200/60 hover:text-cyan-100 hover:bg-cyan-950/20 px-5 py-2.5 md:py-2 text-xs font-mono transition-colors cursor-pointer"
            id="confirm-modal-cancel"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(15);
              onConfirm();
            }}
            className="w-full sm:w-auto justify-center flex bg-red-600 text-white font-extrabold font-mono text-xs px-5 py-2.5 md:py-2 hover:bg-red-500 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] items-center cursor-pointer uppercase"
            id="confirm-modal-confirm"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
