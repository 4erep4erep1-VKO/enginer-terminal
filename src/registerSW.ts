/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Progressive Web App (PWA) Auto-Update Service Worker Registration
 * Enforces automatic cache busting, immediate skipWaiting(), clientsClaim(),
 * and triggers automated window reload whenever an updated service worker activates.
 */
export function registerAutoUpdateSW(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const isProd = Boolean((import.meta as any).env?.PROD);

  // In development, clear stale service workers and caches to prevent stale chunks
  if (!isProd) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister().then((success) => {
          if (success) console.log('[PWA-Dev] Unregistered stale service worker');
        });
      }
    }).catch(() => {});

    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          caches.delete(key);
        }
      }).catch(() => {});
    }
    return;
  }

  // Auto-reload the page when a new service worker takes control
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      console.log('[PWA] Service worker controller changed. Refreshing app to load new build...');
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service worker registered with autoUpdate:', registration.scope);

        // Immediate check for updates
        registration.update().catch(() => {});

        // If a new worker is already waiting, tell it to skip waiting immediately
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        // When a new service worker is installing, listen for installation complete
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New version available! Force skipWaiting so it takes over immediately
                  console.log('[PWA] New version installed, activating immediately...');
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              }
            });
          }
        });

        // Periodic background update check every 15 minutes
        setInterval(() => {
          registration.update().catch(() => {});
        }, 15 * 60 * 1000);

        // Re-check for new versions whenever the user returns to the tab or app
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        });
        window.addEventListener('focus', () => {
          registration.update().catch(() => {});
        });
      })
      .catch((err) => {
        console.warn('[PWA] Service worker registration failed:', err);
      });
  });
}
