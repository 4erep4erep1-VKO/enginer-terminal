import React, { createContext, useContext } from 'react';
import { create } from 'zustand';
import { UserSettings, Currency } from '../types';

export interface UserSettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  formatCurrency: (amount: number) => string;
  formatMileage: (km: number) => string;
  convertDistance: (km: number) => number;
  unconvertDistance: (miles: number) => number;
  formatPressure: (barValue: number) => string;
  distanceLabel: string;
  volumeLabel: string;
  pressureLabel: string;
  currencySymbol: string;
}

export const defaultSettings: UserSettings = {
  currency: 'KZT',
  distanceUnit: 'km',
  volumeUnit: 'L',
  pressureUnit: 'bar',
  assistantTone: 'vasilich',
};

function getSafeStorage(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (e) {
    console.warn(`[UserSettings] Error reading ${key} from storage:`, e);
  }
  return null;
}

function setSafeStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn(`[UserSettings] Error saving ${key} to storage:`, e);
  }
}

function getInitialSettings(): UserSettings {
  try {
    const savedAppSettings = getSafeStorage('app_settings');
    const savedBlueprint = getSafeStorage('blueprint_user_settings');
    const saved = savedAppSettings || savedBlueprint;
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultSettings, ...parsed };
    }
  } catch (e) {
    console.warn('[UserSettings] Could not parse stored settings, using defaults:', e);
  }
  return defaultSettings;
}

interface UserSettingsStoreState {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const useUserSettingsStore = create<UserSettingsStoreState>((set) => ({
  settings: getInitialSettings(),
  updateSettings: (newSettings: Partial<UserSettings>) => {
    set((state) => {
      const updated = { ...state.settings, ...newSettings };
      try {
        const jsonStr = JSON.stringify(updated);
        setSafeStorage('app_settings', jsonStr);
        setSafeStorage('blueprint_user_settings', jsonStr);
      } catch (e) {
        console.warn('[UserSettings] Failed serializing settings:', e);
      }
      return { settings: updated };
    });
  },
}));

export const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
  // Pure pass-through component: zero hook dependencies, completely crash-proof
  return <>{children}</>;
}

export function useUserSettings(): UserSettingsContextType {
  const settings = useUserSettingsStore((state) => state.settings);
  const updateSettings = useUserSettingsStore((state) => state.updateSettings);

  const getCurrencySymbol = (curr: Currency) => {
    switch (curr) {
      case 'RUB':
        return '₽';
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'KZT':
      default:
        return '₸';
    }
  };

  const currencySymbol = getCurrencySymbol(settings.currency);

  const formatCurrency = (amount: number) => {
    const formatted = (amount || 0).toLocaleString('ru-RU', {
      maximumFractionDigits: 0,
    });
    return `${formatted} ${currencySymbol}`;
  };

  const convertDistance = (km: number) => {
    if (settings.distanceUnit === 'mi') {
      return Math.round(km / 1.60934);
    }
    return km;
  };

  const unconvertDistance = (val: number) => {
    if (settings.distanceUnit === 'mi') {
      return Math.round(val * 1.60934);
    }
    return val;
  };

  const distanceLabel = settings.distanceUnit === 'mi' ? 'миль' : 'км';
  const volumeLabel = settings.volumeUnit === 'gal' ? 'гал.' : 'л';
  const pressureUnit = settings.pressureUnit || 'bar';
  const pressureLabel = pressureUnit === 'kPa' ? 'кПа' : pressureUnit === 'PSI' ? 'PSI' : 'бар';

  const formatPressure = (barValue: number) => {
    if (pressureUnit === 'kPa') {
      return `${Math.round(barValue * 100)} кПа`;
    }
    if (pressureUnit === 'PSI') {
      return `${(barValue * 14.5038).toFixed(1)} PSI`;
    }
    return `${barValue.toFixed(1)} бар`;
  };

  const formatMileage = (km: number) => {
    const converted = convertDistance(km);
    return `${converted.toLocaleString('ru-RU')} ${distanceLabel}`;
  };

  return {
    settings,
    updateSettings,
    formatCurrency,
    formatMileage,
    convertDistance,
    unconvertDistance,
    formatPressure,
    distanceLabel,
    volumeLabel,
    pressureLabel,
    currencySymbol,
  };
}
