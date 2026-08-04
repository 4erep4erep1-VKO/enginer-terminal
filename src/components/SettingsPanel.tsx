import React from 'react';
import { useUserSettings } from './UserSettingsContext';
import { Currency, DistanceUnit, VolumeUnit, AssistantTone } from '../types';
import { Cpu, DollarSign, Gauge, Droplet, MessageSquare, ShieldCheck } from 'lucide-react';

export function SettingsPanel() {
  const { settings, updateSettings } = useUserSettings();

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

  const handleToneChange = (assistantTone: AssistantTone) => {
    if (navigator.vibrate) navigator.vibrate(15);
    updateSettings({ assistantTone });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* HUD Header */}
      <div className="bento-card p-6 blueprint-corner border border-cyan-800/30 relative overflow-hidden bg-black/60">
        <div className="absolute top-0 right-0 p-1 bg-cyan-800/30 text-cyan-400 text-[8px] font-bold uppercase font-mono">
          КОНФИГУРАТОР СИСТЕМЫ
        </div>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blueprint-cyan/10 border border-blueprint-cyan/30 text-blueprint-cyan rounded-none shrink-0">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-blueprint-cyan tracking-widest font-mono uppercase block">
              ПАНЕЛЬ НАСТРОЕК БОРТОВОГО КОМПЬЮТЕРА
            </span>
            <h2 className="text-xl font-bold text-cyan-100 font-mono tracking-wide uppercase">
              СИСТЕМНЫЕ ПАРАМЕТРЫ И СТИЛЬ ИИ
            </h2>
            <p className="text-xs text-cyan-300/60 font-mono mt-1 max-w-xl">
              Настройте параметры отображения финансовых данных, единиц измерения пробега и объемов технических жидкостей во всех модулях системы.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Unit Settings */}
        <div className="bento-card p-6 blueprint-corner border border-cyan-800/20 relative bg-black/40 space-y-6">
          <div className="absolute top-0 right-0 p-1 bg-cyan-900/40 text-cyan-500 text-[8px] font-bold uppercase font-mono">
            ЕДИНИЦЫ ИЗМЕРЕНИЯ
          </div>
          <h3 className="text-sm font-bold text-blueprint-cyan font-mono uppercase tracking-wider flex items-center gap-2">
            <Gauge className="w-4 h-4" /> ИНТЕРФЕЙС И МЕТРИКИ
          </h3>

          {/* Currency */}
          <div className="space-y-2">
            <label className="block text-[10px] text-cyan-300/60 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-blueprint-cyan" /> Валюта Финансового Учета
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['KZT', 'RUB', 'USD', 'EUR'] as Currency[]).map((curr) => {
                const labels: Record<Currency, string> = {
                  KZT: '₸ (KZT)',
                  RUB: '₽ (RUB)',
                  USD: '$ (USD)',
                  EUR: '€ (EUR)',
                };
                const active = settings.currency === curr;
                return (
                  <button
                    key={curr}
                    onClick={() => handleCurrencyChange(curr)}
                    className={`py-2 px-1 text-[11px] font-mono border transition-all cursor-pointer text-center uppercase tracking-tighter ${
                      active
                        ? 'bg-blueprint-cyan/15 border-blueprint-cyan text-blueprint-cyan font-bold shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                        : 'border-cyan-800/40 text-cyan-200/50 hover:text-cyan-100 bg-cyan-950/5'
                    }`}
                  >
                    {labels[curr]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Distance */}
          <div className="space-y-2">
            <label className="block text-[10px] text-cyan-300/60 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-blueprint-cyan" /> Единицы Расстояния (Пробег)
            </label>
            <div className="grid grid-cols-2 gap-2">
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
                    className={`py-2.5 px-3 text-xs font-mono border transition-all cursor-pointer text-center uppercase ${
                      active
                        ? 'bg-blueprint-cyan/15 border-blueprint-cyan text-blueprint-cyan font-bold shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                        : 'border-cyan-800/40 text-cyan-200/50 hover:text-cyan-100 bg-cyan-950/5'
                    }`}
                  >
                    {labels[unit]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Volume */}
          <div className="space-y-2">
            <label className="block text-[10px] text-cyan-300/60 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5 text-blueprint-cyan" /> Единицы Объема Жидкостей
            </label>
            <div className="grid grid-cols-2 gap-2">
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
                    className={`py-2.5 px-3 text-xs font-mono border transition-all cursor-pointer text-center uppercase ${
                      active
                        ? 'bg-blueprint-cyan/15 border-blueprint-cyan text-blueprint-cyan font-bold shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                        : 'border-cyan-800/40 text-cyan-200/50 hover:text-cyan-100 bg-cyan-950/5'
                    }`}
                  >
                    {labels[unit]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI Assistant Tone Settings */}
        <div className="bento-card p-6 blueprint-corner border border-cyan-800/20 relative bg-black/40 space-y-6">
          <div className="absolute top-0 right-0 p-1 bg-cyan-900/40 text-cyan-500 text-[8px] font-bold uppercase font-mono">
            ИИ ВАСИЛИЧ СЕТЬ
          </div>
          <h3 className="text-sm font-bold text-blueprint-cyan font-mono uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> ХАРАКТЕР И ИНТЕЛЛЕКТ
          </h3>

          <div className="space-y-4">
            <label className="block text-[10px] text-cyan-300/60 font-mono uppercase tracking-wider">
              Выбор Точности и Стиля Общения Помощника
            </label>

            <div className="space-y-3">
              {/* Tone Option 1: Vasilich */}
              <button
                type="button"
                onClick={() => handleToneChange('vasilich')}
                className={`w-full text-left p-4 border transition-all cursor-pointer flex flex-col gap-1.5 relative ${
                  settings.assistantTone === 'vasilich'
                    ? 'bg-blueprint-cyan/10 border-blueprint-cyan text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                    : 'border-cyan-800/30 text-cyan-300/50 hover:border-cyan-800 hover:text-cyan-200 bg-cyan-950/5'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-blueprint-cyan">
                    «ДЯДЯ ВАСИЛИЧ»
                  </span>
                  {settings.assistantTone === 'vasilich' && (
                    <span className="text-[8px] bg-blueprint-cyan text-blueprint-bg font-extrabold px-1.5 py-0.5 uppercase tracking-wide">
                      АКТИВЕН
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono leading-relaxed text-cyan-300/70">
                  Свойский, душевный тон опытного гаражного мастера. Использует профессиональный сленг, подбадривает и дает практические житейские советы.
                </p>
                <p className="text-[10px] font-mono text-cyan-400/40 italic mt-0.5">
                  Пример: «Здоро́во, хозяин! Глянул я твою ходовку... Надо бы сайлентблоки махнуть, пока стойки не убил.»
                </p>
              </button>

              {/* Tone Option 2: Strict */}
              <button
                type="button"
                onClick={() => handleToneChange('strict')}
                className={`w-full text-left p-4 border transition-all cursor-pointer flex flex-col gap-1.5 relative ${
                  settings.assistantTone === 'strict'
                    ? 'bg-blueprint-cyan/10 border-blueprint-cyan text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                    : 'border-cyan-800/30 text-cyan-300/50 hover:border-cyan-800 hover:text-cyan-200 bg-cyan-950/5'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-blueprint-cyan">
                    СТРОГИЙ ИНЖЕНЕР
                  </span>
                  {settings.assistantTone === 'strict' && (
                    <span className="text-[8px] bg-blueprint-cyan text-blueprint-bg font-extrabold px-1.5 py-0.5 uppercase tracking-wide">
                      АКТИВЕН
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono leading-relaxed text-cyan-300/70">
                  Абсолютно сухой, технический язык без лишних эмоций. Опирается строго на инструкции завода-изготовителя и точные каталожные номера деталей.
                </p>
                <p className="text-[10px] font-mono text-cyan-400/40 italic mt-0.5">
                  Пример: «Система самодиагностики функционирует штатно. Рекомендуемый регламент замены ремня ГРМ — 90 000 км.»
                </p>
              </button>

              {/* Tone Option 3: Brief */}
              <button
                type="button"
                onClick={() => handleToneChange('brief')}
                className={`w-full text-left p-4 border transition-all cursor-pointer flex flex-col gap-1.5 relative ${
                  settings.assistantTone === 'brief'
                    ? 'bg-blueprint-cyan/10 border-blueprint-cyan text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                    : 'border-cyan-800/30 text-cyan-300/50 hover:border-cyan-800 hover:text-cyan-200 bg-cyan-950/5'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-blueprint-cyan">
                    КРАТКИЙ ТЕРМИНАЛ
                  </span>
                  {settings.assistantTone === 'brief' && (
                    <span className="text-[8px] bg-blueprint-cyan text-blueprint-bg font-extrabold px-1.5 py-0.5 uppercase tracking-wide">
                      АКТИВЕН
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono leading-relaxed text-cyan-300/70">
                  Минимальное количество слов. Короткие списки, конкретные цифры и ключевые действия. Идеально для быстрого просмотра на мобильных устройствах.
                </p>
                <p className="text-[10px] font-mono text-cyan-400/40 italic mt-0.5">
                  Пример: «Статус: масло двигателя — замена через 1500 км. Задачи: 2 активные.»
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security note / footer status */}
      <div className="border border-cyan-800/20 bg-cyan-950/10 p-4 blueprint-corner flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-blueprint-cyan shrink-0" />
        <span className="text-[10px] text-cyan-300/50 font-mono leading-relaxed">
          Все параметры сохраняются локально в шифрованном кеше бортового терминала. Изменения вступают в силу мгновенно для всех системных модулей и навигационных дашбордов.
        </span>
      </div>
    </div>
  );
}
