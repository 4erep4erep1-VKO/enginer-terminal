import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { UserSettingsProvider } from './components/UserSettingsContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Register Service Worker for offline PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (reg) => console.log('ServiceWorker registered:', reg.scope),
      (err) => console.warn('ServiceWorker registration failed:', err)
    );
  });
}

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <UserSettingsProvider>
            <App />
          </UserSettingsProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (e: any) {
    console.error('Mount error:', e);
    rootElement.innerHTML = `<div style="color:#ff4444;padding:20px;background:#050a14;font-family:monospace;min-height:100vh;"><h1>Ошибка запуска</h1><pre>${e?.stack || e?.message || e}</pre></div>`;
  }
}
