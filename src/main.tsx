import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// Ensure i18n is initialized before any component (useTranslation) runs
import './i18n';
import App from './App';
import { registerServiceWorker } from './registerSW';
import { BrowserRouter } from 'react-router-dom';
/// <reference types="@sentry/react/types" />
import * as Sentry from '@sentry/browser';
import { logger } from './lib/utils/logger';

if (process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    release: `logi-core@${process.env.REACT_APP_VERSION}`,
    environment: process.env.NODE_ENV,
    beforeSend(event) {
      logger.error('Sentry captured error', { event });
      return event;
    },
  });
}

// Dev-only: ensure no Service Worker from a prior production build controls the dev server
// This prevents devtools/extensions (e.g., LocatorJS) from detecting a "production" bundle.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => { /* ignore */ });
}
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Register service worker in production (safe no-op in dev because registerSW guards by env)
if (!import.meta.env.DEV && 'serviceWorker' in navigator) {
  registerServiceWorker().catch((err) => {
    // Non-fatal: log for diagnostics
    // eslint-disable-next-line no-console
    console.warn('Service worker registration failed:', err);
  });
}
