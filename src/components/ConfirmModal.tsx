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
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300 font-sans">
      <div 
        className="w-full md:max-w-md bg-[#111622] border-t md:border border-[#1E273D] shadow-2xl relative rounded-t-2xl md:rounded-2xl overflow-hidden transform transition-all duration-300 ease-out"
        id="confirm-modal-box"
      >
        {/* iOS style drag handle indicator */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto my-3 md:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E273D] px-4 py-3 bg-[#111622] relative z-10">
          <span className="text-rose-400 font-bold text-xs flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            {title}
          </span>
          <button 
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(15);
              onCancel();
            }}
            className="text-slate-400 hover:text-white p-1 cursor-pointer hover:bg-[#151C2C] rounded-lg transition-colors"
            id="confirm-modal-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 text-xs text-slate-200 leading-relaxed space-y-2 relative z-10">
          <p className="text-slate-300">{message}</p>
        </div>

        {/* Footer actions */}
        <div className="border-t border-[#1E273D] px-4 py-3 flex flex-col-reverse sm:flex-row gap-2 justify-end bg-[#111622] relative z-10">
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(15);
              onCancel();
            }}
            className="btn-secondary py-2 px-4 text-xs font-medium rounded-xl cursor-pointer"
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
            className="py-2 px-4 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            id="confirm-modal-confirm"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
