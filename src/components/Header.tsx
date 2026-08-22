/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Car } from '../types';
import { LogoIcon } from './LogoIcon';
import { 
  Car as CarIcon,
  ChevronDown,
  Download,
  Smartphone,
  Wifi,
  WifiOff,
  ClipboardList,
  Cpu,
  Bot,
  Warehouse,
  BookOpen
} from 'lucide-react';

export type MainNavTab = 'dashboard' | 'service' | 'rag' | 'garage' | 'obd';

export interface HeaderProps {
  isHeaderVisible: boolean;
  activeCar?: Car;
  onOpenCarSelector: () => void;
  deferredPrompt?: any;
  isInstalled?: boolean;
  onInstallClick?: () => void;
  timeStr?: string;
  isOnline: boolean;
  activeTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  onOpenTechSpecs: () => void;
}

export function Header({
  isHeaderVisible,
  activeCar,
  onOpenCarSelector,
  deferredPrompt,
  isInstalled,
  onInstallClick,
  isOnline,
  activeTab,
  onSelectTab,
  onOpenTechSpecs,
}: HeaderProps) {
  return (
    <header className={`border-b border-[#1E2638] bg-[#090C12]/95 sticky top-0 z-40 backdrop-blur-md transition-transform duration-200 ease-in-out ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      
      {/* MOBILE HEADER (Clean 52px HUD) */}
      <div className="flex md:hidden px-3.5 py-2 items-center justify-between min-h-[52px]">
        <div 
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(10);
            onSelectTab('dashboard');
          }}
          className="flex items-center gap-2 min-w-0 pr-1.5 cursor-pointer select-none"
          title="На главную"
        >
          <div className="w-7 h-7 rounded-lg bg-[#10151E] border border-[#1E2638] flex items-center justify-center shrink-0 text-[#06B6D4]">
            <LogoIcon className="w-4 h-4" />
          </div>
          <div className="flex flex-col leading-none min-w-0 truncate">
            <span className="text-xs font-bold tracking-tight text-slate-100 font-sans truncate">
              ВАСИЛИЧ
            </span>
            <span className={`text-[9px] font-mono mt-0.5 block truncate ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isOnline ? 'ОНЛАЙН' : 'ОФЛАЙН'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              onOpenCarSelector();
            }}
            className="bg-[#10151E] hover:bg-[#151B25] border border-[#1E2638] hover:border-[#273248] text-slate-200 font-sans text-xs font-semibold px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer rounded-xl transition-all active:scale-95 shrink-0 max-w-[170px]"
          >
            <CarIcon className="w-3.5 h-3.5 text-[#06B6D4] shrink-0" />
            <span className="truncate max-w-[110px]">
              {activeCar ? `${activeCar.make} ${activeCar.model}` : 'Выбрать авто'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>
        </div>
      </div>

      {/* DESKTOP HEADER (Full Cockpit HUD) */}
      <div className="hidden md:flex max-w-7xl mx-auto px-6 py-3 flex-row justify-between items-center gap-4">
        {/* Logo Title & Status */}
        <div 
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(10);
            onSelectTab('dashboard');
          }}
          className="flex items-center gap-3 cursor-pointer select-none"
          title="На главную панель"
        >
          <div className="w-8 h-8 rounded-xl bg-[#10151E] border border-[#1E2638] flex items-center justify-center shrink-0 text-[#06B6D4]">
            <LogoIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans text-base font-bold tracking-tight text-slate-100 leading-tight">
                ВАСИЛИЧ
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#151B25] text-[#06B6D4] border border-[#1E2638] font-mono font-semibold">
                PRO
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Car Selector & Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              onOpenCarSelector();
            }}
            className="bg-[#10151E] hover:bg-[#151B25] border border-[#1E2638] hover:border-[#273248] text-slate-200 font-sans text-xs font-semibold px-3 py-2 flex items-center gap-2 cursor-pointer transition-all rounded-xl active:scale-98"
            title="Выбрать активный автомобиль"
          >
            <CarIcon className="w-4 h-4 text-[#06B6D4] shrink-0" />
            <span className="truncate max-w-[190px]">
              {activeCar ? `${activeCar.make} ${activeCar.model}` : 'Выбрать авто'}
            </span>
            {activeCar?.mileage !== undefined && (
              <span className="text-[11px] font-mono text-slate-400 border-l border-[#1E2638] pl-2">
                {activeCar.mileage.toLocaleString('ru-RU')} км
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {deferredPrompt && !isInstalled && onInstallClick && (
            <button
              onClick={onInstallClick}
              className="bg-[#06B6D4] hover:bg-[#22D3EE] text-[#090C12] font-sans font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-98 shrink-0"
              title="Установить PWA на устройство"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>PWA</span>
            </button>
          )}

          {isInstalled && (
            <div className="flex items-center gap-1.5 bg-[#10151E] border border-[#1E2638] px-2.5 py-1.5 rounded-xl text-[10px] font-mono text-[#06B6D4]">
              <Smartphone className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>PWA Ready</span>
            </div>
          )}

          <div className="border-l border-[#1E2638] pl-3">
            {isOnline ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1 font-mono text-xs">
                <Wifi className="w-3.5 h-3.5" /> ОНЛАЙН
              </span>
            ) : (
              <span className="text-amber-400 font-semibold flex items-center gap-1 font-mono text-xs">
                <WifiOff className="w-3.5 h-3.5" /> ОФЛАЙН
              </span>
            )}
          </div>
        </div>
      </div>

      {/* DESKTOP TOP NAVIGATION TABS (5 SECTIONS) */}
      <div className="hidden md:block border-t border-[#1E2638] bg-[#0C1018] px-6 py-1.5">
        <nav className="max-w-7xl mx-auto flex items-center justify-between font-sans text-xs font-semibold">
          <div className="flex items-center gap-1">
            {/* 1. ГЛАВНАЯ */}
            <button
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(10);
                onSelectTab('dashboard');
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-[#151B25] text-[#06B6D4] border border-[#06B6D4]/30 font-bold'
                  : 'bg-transparent text-slate-400 border border-transparent hover:text-slate-200 hover:bg-[#151B25]/60'
              }`}
              id="tab-btn-dashboard"
            >
              <CarIcon className="w-3.5 h-3.5" />
              <span>Главная</span>
            </button>

            {/* 2. ТО */}
            <button
              onClick={() => { 
                if (navigator.vibrate) navigator.vibrate(10);
                onSelectTab('service'); 
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'service'
                  ? 'bg-[#151B25] text-[#06B6D4] border border-[#06B6D4]/30 font-bold'
                  : 'bg-transparent text-slate-400 border border-transparent hover:text-slate-200 hover:bg-[#151B25]/60'
              }`}
              id="tab-btn-service"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>ТО</span>
            </button>

            {/* 3. ВАСИЛИЧ */}
            <button
              onClick={() => { 
                if (navigator.vibrate) navigator.vibrate(10);
                onSelectTab('rag'); 
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'rag'
                  ? 'bg-[#151B25] text-[#06B6D4] border border-[#06B6D4]/30 font-bold'
                  : 'bg-transparent text-slate-400 border border-transparent hover:text-slate-200 hover:bg-[#151B25]/60'
              }`}
              id="tab-btn-rag"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Василич</span>
            </button>

            {/* 4. ГАРАЖ */}
            <button
              onClick={() => { 
                if (navigator.vibrate) navigator.vibrate(10);
                onSelectTab('garage'); 
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'garage'
                  ? 'bg-[#151B25] text-[#06B6D4] border border-[#06B6D4]/30 font-bold'
                  : 'bg-transparent text-slate-400 border border-transparent hover:text-slate-200 hover:bg-[#151B25]/60'
              }`}
              id="tab-btn-garage"
            >
              <Warehouse className="w-3.5 h-3.5" />
              <span>Гараж</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { 
                if (navigator.vibrate) navigator.vibrate(10);
                onOpenTechSpecs();
              }}
              className="px-3 py-1.5 rounded-lg bg-[#10151E] text-slate-300 border border-[#1E2638] hover:border-[#273248] hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#06B6D4] shrink-0" />
              <span>Справочник OEM</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
