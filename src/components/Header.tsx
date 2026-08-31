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
    <header className={`border-b border-cyan-500/15 bg-[#090C12]/90 sticky top-0 z-40 backdrop-blur-md transition-transform duration-200 ease-in-out ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      
      {/* MOBILE HEADER (Clean 52px Bar) */}
      <div className="flex md:hidden px-4 h-[52px] items-center justify-between">
        <div 
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(10);
            onSelectTab('dashboard');
          }}
          className="flex items-center gap-2 min-w-0 pr-1.5 cursor-pointer select-none"
          title="На главную"
        >
          <div className="w-7 h-7 rounded-lg bg-[#10151E]/95 border border-cyan-500/15 flex items-center justify-center shrink-0 text-[#06B6D4]">
            <LogoIcon className="w-4 h-4" />
          </div>
          <div className="flex flex-col leading-none min-w-0 truncate">
            <span className="text-xs font-bold tracking-tight text-slate-100 font-sans truncate">
              ВАСИЛИЧ
            </span>
            <span className={`text-[8px] font-mono mt-0.5 block truncate max-w-fit px-1 rounded-full ${isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
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
            className="bg-[#10151E]/90 hover:bg-[#151C2C] border border-cyan-500/15 hover:border-cyan-500/30 text-slate-200 font-sans text-xs font-medium px-2.5 py-1 flex items-center gap-1.5 cursor-pointer rounded-xl transition-all active:scale-95 shrink-0 max-w-[170px]"
          >
            <CarIcon className="w-3.5 h-3.5 text-[#06B6D4] shrink-0" />
            <span className="truncate max-w-[110px]">
              {activeCar ? `${activeCar.make} ${activeCar.model}` : 'Выбрать авто'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>
        </div>
      </div>

      {/* DESKTOP HEADER */}
      <div className="hidden md:flex max-w-7xl mx-auto px-6 h-[52px] flex-row justify-between items-center gap-4">
        {/* Logo Title & Status */}
        <div 
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(10);
            onSelectTab('dashboard');
          }}
          className="flex items-center gap-3 cursor-pointer select-none"
          title="На главную панель"
        >
          <div className="w-8 h-8 rounded-xl bg-[#10151E]/95 border border-cyan-500/15 flex items-center justify-center shrink-0 text-[#06B6D4]">
            <LogoIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans text-base font-bold tracking-tight text-slate-100 leading-tight">
                ВАСИЛИЧ
              </h1>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#10151E] text-[#06B6D4] border border-cyan-500/15 font-mono font-medium">
                ГАРАЖ
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
            className="bg-[#10151E]/95 hover:bg-[#151C2C]/80 border border-cyan-500/15 hover:border-cyan-500/30 text-slate-200 font-sans text-xs font-medium px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-all rounded-xl active:scale-98"
            title="Выбрать активный автомобиль"
          >
            <CarIcon className="w-4 h-4 text-[#06B6D4] shrink-0" />
            <span className="truncate max-w-[190px]">
              {activeCar ? `${activeCar.make} ${activeCar.model}` : 'Выбрать авто'}
            </span>
            {activeCar?.mileage !== undefined && (
              <span className="text-[11px] font-mono text-slate-400 border-l border-cyan-500/15 pl-2">
                {activeCar.mileage.toLocaleString('ru-RU')} км
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {deferredPrompt && !isInstalled && onInstallClick && (
            <button
              onClick={onInstallClick}
              className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/25 font-sans font-semibold text-[10px] px-2.5 py-1 rounded-full transition-all flex items-center gap-1 cursor-pointer active:scale-98 shrink-0"
              title="Установить PWA на устройство"
            >
              <Download className="w-3 h-3 shrink-0" />
              <span>PWA</span>
            </button>
          )}

          {isInstalled && (
            <div className="flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-full text-[10px] font-mono text-cyan-400">
              <Smartphone className="w-3 h-3 text-cyan-400" />
              <span>PWA</span>
            </div>
          )}

          <div className="border-l border-cyan-500/15 pl-3">
            {isOnline ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
                <Wifi className="w-3 h-3" /> ОНЛАЙН
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 font-mono">
                <WifiOff className="w-3 h-3" /> ОФЛАЙН
              </span>
            )}
          </div>
        </div>
      </div>

      {/* DESKTOP TOP NAVIGATION TABS */}
      <div className="hidden md:block border-t border-[#1E273D] bg-[#0E121B] px-6 py-1.5">
        <nav className="max-w-7xl mx-auto flex items-center justify-between font-sans text-xs font-medium">
          <div className="flex items-center gap-1">
            {/* 1. ГЛАВНАЯ */}
            <button
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(10);
                onSelectTab('dashboard');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-[#151C2C] text-[#06B6D4] border border-[#06B6D4]/30 font-semibold'
                  : 'bg-transparent text-slate-400 border border-transparent hover:text-slate-200 hover:bg-[#151C2C]/50'
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
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'service'
                  ? 'bg-[#151C2C] text-[#06B6D4] border border-[#06B6D4]/30 font-semibold'
                  : 'bg-transparent text-slate-400 border border-transparent hover:text-slate-200 hover:bg-[#151C2C]/50'
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
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'rag'
                  ? 'bg-[#151C2C] text-[#06B6D4] border border-[#06B6D4]/30 font-semibold'
                  : 'bg-transparent text-slate-400 border border-transparent hover:text-slate-200 hover:bg-[#151C2C]/50'
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
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'garage'
                  ? 'bg-[#151C2C] text-[#06B6D4] border border-[#06B6D4]/30 font-semibold'
                  : 'bg-transparent text-slate-400 border border-transparent hover:text-slate-200 hover:bg-[#151C2C]/50'
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
              className="px-3 py-1.5 rounded-lg bg-[#111622] text-slate-300 border border-[#1E273D] hover:border-[#26324D] hover:text-white text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
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
