// Diagnostic logging for JSX runtime
console.log('🔍 JSX Runtime Diagnostics:');
console.log('React available:', typeof React !== 'undefined' ? 'YES' : 'NO');
console.log('ReactDOM available:', typeof ReactDOM !== 'undefined' ? 'YES' : 'NO');
console.log('React JSX runtime check:', typeof React !== 'undefined' && React.jsxDEV ? 'jsxDEV available' : 'jsxDEV missing');

// Try to access JSX runtime functions directly
try {
  const jsxRuntime = require('react/jsx-runtime');
  console.log('JSX runtime module available:', jsxRuntime ? 'YES' : 'NO');
  console.log('jsxDEV function:', typeof jsxRuntime.jsxDEV === 'function' ? 'YES' : 'NO');
} catch (e) {
  console.log('JSX runtime module error:', e.message);
}

import ReactDOM from 'react-dom/client';
import './index.css';
// Ensure i18n is initialized before any component (useTranslation) runs
import './i18n';
import App from './App';
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
// Test JSX functionality
const TestJSX = () => {
  console.log('🧪 Testing JSX component creation');
  try {
    return <div>JSX Test Component</div>;
  } catch (error) {
    console.error('❌ JSX creation failed:', error);
    return null;
  }
};

console.log('🧪 Creating test JSX component...');
const testElement = <TestJSX />;
console.log('🧪 Test JSX element created:', testElement ? 'SUCCESS' : 'FAILED');
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
