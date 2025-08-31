import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
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

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
