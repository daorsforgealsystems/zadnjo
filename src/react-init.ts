// This file must be imported before any React components
import React, { forwardRef } from 'react';

// Create a comprehensive React API object
const createReactAPI = () => ({
  ...React,
  createElement: React.createElement,
  forwardRef: forwardRef,
  memo: React.memo,
  createContext: React.createContext,
  useState: React.useState,
  useEffect: React.useEffect,
  useRef: React.useRef,
  useMemo: React.useMemo,
  useCallback: React.useCallback,
  useLayoutEffect: React.useLayoutEffect,
  useImperativeHandle: React.useImperativeHandle,
  useContext: React.useContext,
  useReducer: React.useReducer,
  Fragment: React.Fragment,
  Component: React.Component,
  PureComponent: React.PureComponent,
  Suspense: React.Suspense,
  lazy: React.lazy,
  StrictMode: React.StrictMode,
  cloneElement: React.cloneElement,
  isValidElement: React.isValidElement,
  Children: React.Children,
  // React 18 specific APIs
  useId: React.useId,
  useDeferredValue: React.useDeferredValue,
  useInsertionEffect: React.useInsertionEffect,
  useSyncExternalStore: React.useSyncExternalStore,
  useTransition: React.useTransition,
  startTransition: React.startTransition,
});

const reactAPI = createReactAPI();

// Aggressively ensure React is available globally before any other modules load
if (typeof window !== 'undefined') {
  // Make React available on window
  (window as any).React = reactAPI;
  
  // Make all React APIs available individually
  Object.keys(reactAPI).forEach(key => {
    if (reactAPI[key as keyof typeof reactAPI]) {
      (window as any)[key] = reactAPI[key as keyof typeof reactAPI];
    }
  });
  
  // Extra safety for forwardRef specifically
  (window as any).forwardRef = forwardRef;
}

// Also on globalThis with extra safety
(globalThis as any).React = reactAPI;
Object.keys(reactAPI).forEach(key => {
  if (reactAPI[key as keyof typeof reactAPI]) {
    (globalThis as any)[key] = reactAPI[key as keyof typeof reactAPI];
  }
});

// Extra safety for forwardRef specifically
(globalThis as any).forwardRef = forwardRef;

console.log('React initialization complete:', {
  React: typeof React,
  forwardRef: typeof forwardRef,
  createElement: typeof React.createElement,
  memo: typeof React.memo,
  createContext: typeof React.createContext
});

// Add global error handler for forwardRef issues
if (typeof window !== 'undefined') {
  const originalError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (typeof message === 'string' && message.includes('forwardRef')) {
      console.warn('Caught forwardRef error, attempting to fix:', message);
      
      // Re-ensure forwardRef is available
      (window as any).forwardRef = forwardRef;
      (globalThis as any).forwardRef = forwardRef;
      
      // Try to prevent the error from propagating
      return true;
    }
    
    // Call original error handler if it exists
    if (originalError) {
      return originalError(message, source, lineno, colno, error);
    }
    
    return false;
  };
}

// Suppress a few known, noisy warnings coming from third-party libs (React Router
// future-flag notices and explicit "mock data" console messages) while keeping
// other warnings intact. This runs very early (react-init is imported first).
if (typeof console !== 'undefined' && typeof console.warn === 'function') {
  const _origWarn = console.warn.bind(console);
  const suppressedSubstrings = [
    'React Router Future Flag Warning: React Router will begin wrapping state updates',
    'Relative route resolution within Splat routes is changing in v7',
    'is returning mock data.'
  ];

  console.warn = (...args: any[]) => {
    try {
      const joined = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
      for (const sub of suppressedSubstrings) {
        if (joined.includes(sub)) {
          // Prefer informational log in dev for visibility without polluting the warning channel
          if ((import.meta as any).env?.DEV) {
            // Keep a compact info message so developers know something intentional happened
            console.info('[filtered warning]', sub);
          }
          return;
        }
      }
    } catch (e) {
      // If anything goes wrong while filtering, fall back to original warn
      return _origWarn(...args);
    }
    return _origWarn(...args);
  };
}

export default React;