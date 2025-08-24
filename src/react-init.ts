// This file must be imported before any React components
import React, { forwardRef } from 'react';

// Aggressively ensure React is available globally before any other modules load
if (typeof window !== 'undefined') {
  // Make React available on window
  (window as any).React = React;
  
  // Make all React APIs available individually
  (window as any).createElement = React.createElement;
  (window as any).forwardRef = forwardRef;
  (window as any).memo = React.memo;
  (window as any).createContext = React.createContext;
  (window as any).useState = React.useState;
  (window as any).useEffect = React.useEffect;
  (window as any).useRef = React.useRef;
  (window as any).useMemo = React.useMemo;
  (window as any).useCallback = React.useCallback;
  (window as any).useLayoutEffect = React.useLayoutEffect;
  (window as any).useImperativeHandle = React.useImperativeHandle;
  (window as any).useContext = React.useContext;
  (window as any).useReducer = React.useReducer;
  (window as any).Fragment = React.Fragment;
  (window as any).Component = React.Component;
  (window as any).PureComponent = React.PureComponent;
  (window as any).Suspense = React.Suspense;
  (window as any).lazy = React.lazy;
  (window as any).StrictMode = React.StrictMode;
  (window as any).cloneElement = React.cloneElement;
  (window as any).isValidElement = React.isValidElement;
  (window as any).Children = React.Children;
}

// Also on globalThis
(globalThis as any).React = React;
(globalThis as any).createElement = React.createElement;
(globalThis as any).forwardRef = forwardRef;
(globalThis as any).memo = React.memo;
(globalThis as any).createContext = React.createContext;

console.log('React initialization complete:', {
  React: typeof React,
  forwardRef: typeof forwardRef,
  createElement: typeof React.createElement,
  memo: typeof React.memo,
  createContext: typeof React.createContext
});

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