import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { UserSettingsProvider } from './components/UserSettingsContext';
import { AuthProvider } from './components/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { registerAutoUpdateSW } from './registerSW';
import './index.css';

// 1. Hard LocalStorage Purge & Sanity Check
try {
  JSON.parse(localStorage.getItem('car-store') || '{}');
} catch (e) {
  console.warn('Corrupted car-store in localStorage detected, performing emergency purge:', e);
  try {
    localStorage.clear();
  } catch (_) {}
}

// Scan and sanitize other known terminal storage keys
try {
  const jsonKeys = [
    'terminal_cars_v2',
    'terminal_records_v2',
    'terminal_parts_v2',
    'terminal_tasks_v2',
    'terminal_diagnostic_sessions_v2',
    'app_settings',
    'blueprint_user_settings',
  ];
  for (const k of jsonKeys) {
    const raw = localStorage.getItem(k);
    if (raw) {
      try {
        JSON.parse(raw);
      } catch {
        console.warn(`Purging corrupted localStorage key [${k}]`);
        localStorage.removeItem(k);
      }
    }
  }
} catch (e) {
  console.warn('Failed scanning localStorage keys:', e);
}

// 2. Emergency fallback renderer for fatal uncaught errors
function renderEmergencyFallback(errorTitle: string, errorDetails: string) {
  const el = document.getElementById('root') || document.body;
  if (!el) return;
  el.innerHTML = `
    <div style="min-height: 100vh; background-color: #0b0e14; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-family: system-ui, -apple-system, sans-serif; padding: 24px; text-align: center;">
      <h1 style="color: white; font-size: 22px; font-weight: 700; margin: 0 0 12px 0;">Терминал пересобирается...</h1>
      <p style="color: #94a3b8; font-size: 14px; max-width: 480px; margin: 0 0 20px 0;">${errorTitle}</p>
      <div style="background: #000; border: 1px solid #1e293b; color: #f43f5e; padding: 12px 16px; border-radius: 8px; font-family: monospace; font-size: 12px; max-width: 500px; overflow-x: auto; text-align: left; margin-bottom: 20px;">
        ${errorDetails}
      </div>
      <button onclick="localStorage.clear(); window.location.reload();" style="background: #06b6d4; color: #000; font-weight: bold; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px;">
        Сбросить кэш и перезагрузить
      </button>
    </div>
  `;
}

// Catch uncaught errors at window level to prevent any blank white screen
window.addEventListener('error', (event) => {
  if (event.error && !document.querySelector('#root > *')) {
    renderEmergencyFallback('Неперехваченная ошибка выполнения скрипта', event.error?.stack || event.error?.message || event.message);
  }
});

// Service Worker auto-update management with skipWaiting and clientsClaim
registerAutoUpdateSW();

// 3. Strict Entry Point Mounting
const rootElement = document.getElementById('root');

if (!rootElement) {
  renderEmergencyFallback('Корневой контейнер не найден', 'Элемент #root отсутствует в index.html');
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <UserSettingsProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </UserSettingsProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (e: any) {
    console.error('Mount error:', e);
    renderEmergencyFallback('Ошибка монтирования приложения React', e?.stack || e?.message || String(e));
  }
}
