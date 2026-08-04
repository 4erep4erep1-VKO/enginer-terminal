import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings, Currency, DistanceUnit, VolumeUnit, AssistantTone } from '../types';

interface UserSettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  formatCurrency: (amount: number) => string;
  formatMileage: (km: number) => string;
  convertDistance: (km: number) => number;
  unconvertDistance: (miles: number) => number;
  distanceLabel: string;
  volumeLabel: string;
  currencySymbol: string;
}

const defaultSettings: UserSettings = {
  currency: 'KZT',
  distanceUnit: 'km',
  volumeUnit: 'L',
  assistantTone: 'vasilich',
};

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('blueprint_user_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultSettings, ...parsed };
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('blueprint_user_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

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
    // Format with thousand separators
    const formatted = amount.toLocaleString('ru-RU', {
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

  const formatMileage = (km: number) => {
    const converted = convertDistance(km);
    return `${converted.toLocaleString('ru-RU')} ${distanceLabel}`;
  };

  return (
    <UserSettingsContext.Provider
      value={{
        settings,
        updateSettings,
        formatCurrency,
        formatMileage,
        convertDistance,
        unconvertDistance,
        distanceLabel,
        volumeLabel,
        currencySymbol,
      }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
}
