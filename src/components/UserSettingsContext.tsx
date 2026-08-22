import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings, Currency, DistanceUnit, VolumeUnit, PressureUnit, AssistantTone } from '../types';

interface UserSettingsContextType {
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

const defaultSettings: UserSettings = {
  currency: 'KZT',
  distanceUnit: 'km',
  volumeUnit: 'L',
  pressureUnit: 'bar',
  assistantTone: 'vasilich',
  garageMode: false,
};

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const savedAppSettings = localStorage.getItem('app_settings');
    const savedBlueprint = localStorage.getItem('blueprint_user_settings');
    const saved = savedAppSettings || savedBlueprint;
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
    const jsonStr = JSON.stringify(settings);
    localStorage.setItem('app_settings', jsonStr);
    localStorage.setItem('blueprint_user_settings', jsonStr);
    if (typeof document !== 'undefined') {
      if (settings.garageMode) {
        document.documentElement.classList.add('garage-mode');
      } else {
        document.documentElement.classList.remove('garage-mode');
      }
    }
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

  return (
    <UserSettingsContext.Provider
      value={{
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
      }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (!context) {
    return {
      settings: defaultSettings,
      updateSettings: () => {},
      formatCurrency: (val: number) => `${(val || 0).toLocaleString('ru-RU')} ₸`,
      formatMileage: (km: number) => `${(km || 0).toLocaleString('ru-RU')} км`,
      convertDistance: (val: number) => val,
      unconvertDistance: (val: number) => val,
      formatPressure: (barVal: number) => `${barVal.toFixed(1)} бар`,
      distanceLabel: 'км',
      volumeLabel: 'л',
      pressureLabel: 'бар',
      currencySymbol: '₸'
    } as unknown as UserSettingsContextType;
  }
  return context;
}
