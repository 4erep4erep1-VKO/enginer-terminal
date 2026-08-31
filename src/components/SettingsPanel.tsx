/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { useUserSettings } from './UserSettingsContext';
import { Currency, DistanceUnit, VolumeUnit, PressureUnit, AssistantTone } from '../types';
import { validateAndNormalizeBackup, TerminalBackupData } from '../lib/dataIntegrity';
import { 
  Cpu, 
  DollarSign, 
  Gauge, 
  Droplet, 
  MessageSquare, 
  ShieldCheck, 
  Wrench, 
  Activity, 
  Download, 
  Upload, 
  Database, 
  CheckCircle2,
  AlertTriangle,
  Settings
} from 'lucide-react';

export function SettingsPanel() {
  const { settings, updateSettings } = useUserSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleGarageModeToggle = () => {
    if (navigator.vibrate) navigator.vibrate(20);
    updateSettings({ garageMode: !settings.garageMode });
  };

  const [importError, setImportError] = useState<string | null>(null);

  const handleExportJSON = () => {
    if (navigator.vibrate) navigator.vibrate(20);
    try {
      // Read current primary datasets
      const cars = JSON.parse(localStorage.getItem('terminal_cars_v2') || '[]');
      const activeCarId = localStorage.getItem('terminal_active_car_id_v2') || '';
      const records = JSON.parse(localStorage.getItem('terminal_records_v2') || '[]');
      const parts = JSON.parse(localStorage.getItem('terminal_parts_v2') || '[]');
      const tasks = JSON.parse(localStorage.getItem('terminal_tasks_v2') || '[]');
      const diagnosticSessions = JSON.parse(localStorage.getItem('terminal_diagnostic_sessions_v2') || '[]');
      const appSettings = JSON.parse(localStorage.getItem('terminal_user_settings_v2') || localStorage.getItem('app_settings') || '{}');

      const backupData: TerminalBackupData = {
        version: '2.0',
        timestamp: new Date().toISOString(),
        app: 'Инженерный Терминал',
        cars,
        activeCarId,
        records,
        parts,
        tasks,
        diagnosticSessions,
        settings: appSettings
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `terminal_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setImportError('Ошибка при создании файла бэкапа.');
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawJson = JSON.parse(event.target?.result as string);
        const { isValid, error, normalized } = validateAndNormalizeBackup(rawJson);

        if (!isValid || !normalized) {
          setImportError(error || 'Некорректный формат или поврежденный файл бэкапа');
          return;
        }

        // Apply validated and normalized data to storage
        localStorage.setItem('terminal_cars_v2', JSON.stringify(normalized.cars));
        if (normalized.activeCarId) {
          localStorage.setItem('terminal_active_car_id_v2', normalized.activeCarId);
        }
        localStorage.setItem('terminal_records_v2', JSON.stringify(normalized.records));
        localStorage.setItem('terminal_parts_v2', JSON.stringify(normalized.parts));
        localStorage.setItem('terminal_tasks_v2', JSON.stringify(normalized.tasks));
        localStorage.setItem('terminal_diagnostic_sessions_v2', JSON.stringify(normalized.diagnosticSessions));

        if (normalized.settings) {
          localStorage.setItem('terminal_user_settings_v2', JSON.stringify(normalized.settings));
          updateSettings(normalized.settings);
        }

        if (navigator.vibrate) navigator.vibrate(30);
        setImportStatus(`Импортировано: ${normalized.cars.length} авто, ${normalized.records.length} записей, ${normalized.parts.length} деталей, ${normalized.tasks.length} задач, ${normalized.diagnosticSessions.length} сессий. Перезагрузка...`);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err: any) {
        console.error('Import parse error:', err);
        setImportError('Не удалось прочитать JSON файл бэкапа. Проверьте синтаксис файла.');
      }
    };
    reader.readAsText(file);
  };

  const handleCurrencyChange = (currency: Currency) => {
    if (navigator.vibrate) navigator.vibrate(15);
    updateSettings({ currency });
  };

  const handleDistanceChange = (distanceUnit: DistanceUnit) => {
    if (navigator.vibrate) navigator.vibrate(15);
    updateSettings({ distanceUnit });
  };

  const handleVolumeChange = (volumeUnit: VolumeUnit) => {
    if (navigator.vibrate) navigator.vibrate(15);
    updateSettings({ volumeUnit });
  };

  const handlePressureChange = (pressureUnit: PressureUnit) => {
    if (navigator.vibrate) navigator.vibrate(15);
    updateSettings({ pressureUnit });
  };

  const handleToneChange = (assistantTone: AssistantTone) => {
    if (navigator.vibrate) navigator.vibrate(15);
    updateSettings({ assistantTone });
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div className="bg-[#111622] border border-[#1E273D] rounded-2xl p-4 sm:p-5 relative shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/25 text-[#06B6D4] rounded-xl shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Настройки приложения
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              Валюта, единицы измерения, характер Василича и резервное копирование данных.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unit Settings & Financial Accounting */}
        <div className="bg-[#111622] border border-[#1E273D] rounded-2xl p-4 sm:p-5 relative space-y-4 shadow-sm">
          <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-[#06B6D4]" />
            <span>Единицы измерения и валюта</span>
          </h3>

          {/* Currency */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#06B6D4]" /> Валюта учета
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['KZT', 'RUB', 'USD', 'EUR'] as Currency[]).map((curr) => {
                const labels: Record<Currency, string> = {
                  KZT: '₸ KZT',
                  RUB: '₽ RUB',
                  USD: '$ USD',
                  EUR: '€ EUR',
                };
                const active = settings.currency === curr;
                return (
                  <button
                    key={curr}
                    onClick={() => handleCurrencyChange(curr)}
                    className={`py-2 px-1 text-xs rounded-xl border transition-all cursor-pointer text-center font-medium ${
                      active
                        ? 'bg-[#151C2C] border-cyan-500/50 text-[#06B6D4]'
                        : 'border-[#1E273D] bg-[#0B0E14] text-slate-400 hover:text-slate-200'
                    }`}
                    id={`btn-curr-${curr.toLowerCase()}`}
                  >
                    {labels[curr]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Distance */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-[#06B6D4]" /> Пробег
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['km', 'mi'] as DistanceUnit[]).map((unit) => {
                const labels: Record<DistanceUnit, string> = {
                  km: 'Километры (км)',
                  mi: 'Мили (mi)',
                };
                const active = settings.distanceUnit === unit;
                return (
                  <button
                    key={unit}
                    onClick={() => handleDistanceChange(unit)}
                    className={`py-2 px-2 text-xs rounded-xl border transition-all cursor-pointer text-center font-medium ${
                      active
                        ? 'bg-[#151C2C] border-cyan-500/50 text-[#06B6D4]'
                        : 'border-[#1E273D] bg-[#0B0E14] text-slate-400 hover:text-slate-200'
                    }`}
                    id={`btn-dist-${unit}`}
                  >
                    {labels[unit]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Volume */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5 text-[#06B6D4]" /> Объем топлива и жидкостей
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['L', 'gal'] as VolumeUnit[]).map((unit) => {
                const labels: Record<VolumeUnit, string> = {
                  L: 'Литры (л)',
                  gal: 'Галлоны (gal)',
                };
                const active = settings.volumeUnit === unit;
                return (
                  <button
                    key={unit}
                    onClick={() => handleVolumeChange(unit)}
                    className={`py-2 px-2 text-xs rounded-xl border transition-all cursor-pointer text-center font-medium ${
                      active
                        ? 'bg-[#151C2C] border-cyan-500/50 text-[#06B6D4]'
                        : 'border-[#1E273D] bg-[#0B0E14] text-slate-400 hover:text-slate-200'
                    }`}
                    id={`btn-vol-${unit.toLowerCase()}`}
                  >
                    {labels[unit]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pressure */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#06B6D4]" /> Давление
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['bar', 'kPa', 'PSI'] as PressureUnit[]).map((unit) => {
                const labels: Record<PressureUnit, string> = {
                  bar: 'Бар (bar)',
                  kPa: 'КПа (kPa)',
                  PSI: 'PSI',
                };
                const active = (settings.pressureUnit || 'bar') === unit;
                return (
                  <button
                    key={unit}
                    onClick={() => handlePressureChange(unit)}
                    className={`py-2 px-2 text-xs rounded-xl border transition-all cursor-pointer text-center font-medium ${
                      active
                        ? 'bg-[#151C2C] border-cyan-500/50 text-[#06B6D4]'
                        : 'border-[#1E273D] bg-[#0B0E14] text-slate-400 hover:text-slate-200'
                    }`}
                    id={`btn-press-${unit.toLowerCase()}`}
                  >
                    {labels[unit]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Garage Mode Toggle */}
          <div className="pt-2.5 border-t border-[#1E273D] space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-[#06B6D4]" /> Крупный гаражный режим
            </label>
            <button
              type="button"
              onClick={handleGarageModeToggle}
              className={`w-full py-2.5 px-3.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                settings.garageMode
                  ? 'bg-[#151C2C] text-[#06B6D4] border-cyan-500/50'
                  : 'bg-[#0B0E14] text-slate-400 border-[#1E273D] hover:border-slate-700'
              }`}
              id="btn-toggle-garage-mode"
            >
              <span>{settings.garageMode ? 'Гаражный режим включен' : 'Обычный режим'}</span>
              <span className={`px-2 py-0.5 text-[10px] rounded-lg font-semibold ${settings.garageMode ? 'bg-[#06B6D4] text-slate-950' : 'bg-[#151C2C] text-slate-400'}`}>
                {settings.garageMode ? 'ВКЛ' : 'ВЫКЛ'}
              </span>
            </button>
            <p className="text-[11px] text-slate-500">
              Увеличивает размер элементов интерфейса для удобного нажатия в гараже.
            </p>
          </div>
        </div>

        {/* AI Assistant Tone Settings */}
        <div className="bg-[#111622] border border-[#1E273D] rounded-2xl p-4 sm:p-5 relative space-y-3.5 shadow-sm">
          <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#06B6D4]" />
            <span>Стиль общения Василича</span>
          </h3>

          <div className="space-y-2.5">
            <label className="block text-xs font-medium text-slate-300">
              Выберите манеру ответов:
            </label>

            <div className="space-y-2">
              {/* Tone Option 1: Vasilich */}
              <button
                type="button"
                onClick={() => handleToneChange('vasilich')}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 relative ${
                  settings.assistantTone === 'vasilich'
                    ? 'bg-[#151C2C] border-cyan-500/50 text-slate-100 shadow-sm'
                    : 'border-[#1E273D] text-slate-400 hover:text-slate-200 bg-[#0B0E14]'
                }`}
                id="btn-tone-vasilich"
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-semibold text-cyan-300">
                    Опытный механик (по умолчанию)
                  </span>
                  {settings.assistantTone === 'vasilich' && (
                    <span className="text-[9px] bg-[#06B6D4] text-slate-950 font-bold px-1.5 py-0.5 rounded">
                      Выбран
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  Простой и понятный язык с легким гаражным колоритом.
                </p>
              </button>

              {/* Tone Option 2: Strict */}
              <button
                type="button"
                onClick={() => handleToneChange('strict')}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 relative ${
                  settings.assistantTone === 'strict'
                    ? 'bg-[#151C2C] border-cyan-500/50 text-slate-100 shadow-sm'
                    : 'border-[#1E273D] text-slate-400 hover:text-slate-200 bg-[#0B0E14]'
                }`}
                id="btn-tone-strict"
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-semibold text-cyan-300">
                    Строгий инженер-диагност
                  </span>
                  {settings.assistantTone === 'strict' && (
                    <span className="text-[9px] bg-[#06B6D4] text-slate-950 font-bold px-1.5 py-0.5 rounded">
                      Выбран
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  Точный технический язык, регламенты OEM и моменты затяжки.
                </p>
              </button>

              {/* Tone Option 3: Brief */}
              <button
                type="button"
                onClick={() => handleToneChange('brief')}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 relative ${
                  settings.assistantTone === 'brief'
                    ? 'bg-[#151C2C] border-cyan-500/50 text-slate-100 shadow-sm'
                    : 'border-[#1E273D] text-slate-400 hover:text-slate-200 bg-[#0B0E14]'
                }`}
                id="btn-tone-brief"
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-semibold text-cyan-300">
                    Кратко и по делу
                  </span>
                  {settings.assistantTone === 'brief' && (
                    <span className="text-[9px] bg-[#06B6D4] text-slate-950 font-bold px-1.5 py-0.5 rounded">
                      Выбран
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  Минимум слов, только конкретные цифры и списки.
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backup and Export Section */}
      <div className="bg-[#111622] border border-[#1E273D] rounded-2xl p-4 sm:p-5 relative space-y-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Database className="w-4 h-4 text-[#06B6D4]" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-100">
            Резервное копирование и экспорт (JSON)
          </h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Сохраните резервную копию вашего гаража, журнала ТО, запчастей и задач в файл или восстановите данные.
        </p>

        {importStatus && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}

        {importError && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleExportJSON}
            className="btn-primary flex-1 py-2 px-4 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            id="btn-export-json"
          >
            <Download className="w-4 h-4" />
            <span>Экспортировать JSON</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJSON}
            accept=".json,application/json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary flex-1 py-2 px-4 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            id="btn-import-json"
          >
            <Upload className="w-4 h-4 text-[#06B6D4]" />
            <span>Импортировать JSON</span>
          </button>
        </div>
      </div>

      {/* Security note / footer status */}
      <div className="border border-[#1E273D] bg-[#111622] rounded-2xl p-3.5 flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[#06B6D4] shrink-0" />
        <span className="text-xs text-slate-400 leading-relaxed">
          Все данные и настройки сохраняются локально в вашем браузере.
        </span>
      </div>
    </div>
  );
}
