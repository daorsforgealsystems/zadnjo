import React from 'react';
import { createRoot } from 'react-dom/client';
import ReactCompatLayer, { ensureReactGlobals } from './components/ReactCompatLayer';

// Initialize React compatibility layer
ensureReactGlobals();
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import './i18n';
import ErrorBoundary from './components/ErrorBoundary';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from './components/ui/theme-provider';
import { AnimationProvider } from '@/components/providers';
import { LayoutProvider } from '@/components/providers/LayoutProvider';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './store';
import { debug, initDebug } from './lib/debug';
import { validateConfig } from './lib/config';

// Create a client with more resilient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3, // Increased retries
      retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff
  // cacheTime intentionally omitted to satisfy @tanstack/react-query types here
    },
    mutations: {
      retry: 2,
      retryDelay: 1000,
    },
  },
});

// Function to render fallback UI in case of errors
const renderFallbackUI = (container: HTMLElement, message: string) => {
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui; background-color: #111827; color: white;">
      <div style="text-align: center; padding: 2rem; max-width: 500px;">
        <div style="margin-bottom: 1.5rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h1 style="color: #f87171; margin-bottom: 1rem; font-size: 1.5rem;">Application Error</h1>
        <p style="color: #d1d5db; margin-bottom: 1.5rem;">${message}</p>
        <div style="display: flex; gap: 0.75rem; justify-content: center;">
          <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 500;">
            Refresh Page
          </button>
          <button onclick="localStorage.clear(); window.location.reload()" style="background: transparent; color: #d1d5db; padding: 0.5rem 1rem; border: 1px solid #374151; border-radius: 0.375rem; cursor: pointer; font-weight: 500;">
            Clear Cache & Reload
          </button>
        </div>
        <p style="color: #6b7280; margin-top: 1.5rem; font-size: 0.875rem;">
          If the problem persists, please contact support.
        </p>
      </div>
    </div>
  `;
};

// Main rendering logic
const container = document.getElementById('root');

// Initialize debug system
initDebug();
debug('Application initialization started', 'info');

// Validate runtime configuration early and fail-safe
try {
  validateConfig();
  debug('Configuration validated successfully', 'info');
} catch (error) {
  debug('Configuration validation failed', 'critical', error);
  // If validation fails, render the fallback UI and abort startup
  if (container) {
    renderFallbackUI(container, 'Invalid application configuration. Check environment variables.');
  } else if (document.body) {
    renderFallbackUI(document.body, 'Invalid application configuration. Check environment variables.');
  }
  // Stop further execution by rethrowing after rendering fallback UI
  throw error;
}

if (container) {
  try {
    debug('Root container found', 'info');
    
    // Add a global error handler
    window.onerror = function(message, source, lineno, colno, error) {
      debug('Global error caught', 'error', { message, source, lineno, colno, error });
      return false; // Let other error handlers run
    };
    
    // Create root and render app
    debug('Creating React root', 'info');
    const root = createRoot(container);
    
    // Render each component with debug logs
    debug('Starting React render', 'info');
    
    // Wrap the entire app in error boundaries
    // Call debug logs before rendering to avoid void expressions in JSX
    debug('Rendering QueryClientProvider', 'info');
    debug('Rendering AuthProvider', 'info');
    debug('Rendering ThemeProvider', 'info');
    debug('Rendering LayoutProvider', 'info');
    debug('Wiring Redux Provider', 'info');

    root.render(
      <React.StrictMode>
        <ReactCompatLayer>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <ErrorBoundary>
                <AuthProvider>
                  <ErrorBoundary>
                    <ThemeProvider
                      attribute="class"
                      defaultTheme="system"
                      enableSystem
                      disableTransitionOnChange
                    >
                      <ErrorBoundary>
                        <AnimationProvider>
                          <LayoutProvider>
                          <ReduxProvider store={store}>
                            <Router>
                              <App />
                            </Router>
                          </ReduxProvider>
                          </LayoutProvider>
                        </AnimationProvider>
                      </ErrorBoundary>
                    </ThemeProvider>
                  </ErrorBoundary>
                </AuthProvider>
              </ErrorBoundary>
            </QueryClientProvider>
          </ErrorBoundary>
        </ReactCompatLayer>
      </React.StrictMode>
    );
    
    debug('React render completed successfully', 'info');
  } catch (error) {
    debug('Failed to render React app', 'critical', error);
    // Fallback rendering
    renderFallbackUI(container, 'Failed to load the application. Please refresh the page.');
  }
} else {
  debug('Root element with ID "root" was not found', 'critical');
  // If root is not found, try to render to body
  if (document.body) {
    renderFallbackUI(document.body, 'Root element not found. Please check the HTML configuration.');
  }
}
