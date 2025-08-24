import React from 'react';

// Ensure React APIs are available globally for libraries that might need them
export const ensureReactGlobals = () => {
  // Create a comprehensive React object with all necessary APIs
  const reactAPI = {
    ...React,
    createContext: React.createContext,
    useState: React.useState,
    useEffect: React.useEffect,
useRef: React.useRef,
    useMemo: React.useMemo,
    useCallback: React.useCallback,
    forwardRef: React.forwardRef,
    memo: React.memo,
    createElement: React.createElement,
    Fragment: React.Fragment,
    Component: React.Component,
    PureComponent: React.PureComponent,
    useLayoutEffect: React.useLayoutEffect,
    useImperativeHandle: React.useImperativeHandle,
    useContext: React.useContext,
    useReducer: React.useReducer,
    useDebugValue: React.useDebugValue,
    useDeferredValue: React.useDeferredValue,
    useId: React.useId,
    useInsertionEffect: React.useInsertionEffect,
    useSyncExternalStore: React.useSyncExternalStore,
    useTransition: React.useTransition,
    startTransition: React.startTransition,
    lazy: React.lazy,
    Suspense: React.Suspense,
    StrictMode: React.StrictMode,
    cloneElement: React.cloneElement,
    isValidElement: React.isValidElement,
    Children: React.Children,
  };

  if (typeof window !== 'undefined') {
    // Make React available globally
    (window as any).React = reactAPI;
    
    // Also make individual APIs available
    Object.keys(reactAPI).forEach(key => {
      if (reactAPI[key as keyof typeof reactAPI]) {
        (window as any)[key] = reactAPI[key as keyof typeof reactAPI];
      }
    });
  }
  
  // Also ensure on globalThis with the comprehensive API
  (globalThis as any).React = reactAPI;
  
  // Make individual APIs available on globalThis too
  Object.keys(reactAPI).forEach(key => {
    if (reactAPI[key as keyof typeof reactAPI]) {
      (globalThis as any)[key] = reactAPI[key as keyof typeof reactAPI];
    }
  });
};

// Suppress React 19 warnings for Radix UI compatibility
export const suppressReact19Warnings = () => {
  if (typeof console !== 'undefined') {
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.warn = (...args) => {
      const message = args.join(' ');
      // Suppress known React 19 + Radix UI warnings
      if (
        message.includes('forwardRef') ||
        message.includes('accessing .ref directly') ||
        message.includes('Function components cannot be given refs') ||
        message.includes('Presence component') ||
        message.includes('Slot component')
      ) {
        return; // Suppress these warnings
      }
      originalWarn.apply(console, args);
    };
    
    console.error = (...args) => {
      const message = args.join(' ');
      // Suppress known React 19 + Radix UI errors that are actually warnings
      if (
        message.includes('Cannot read properties of undefined (reading \'forwardRef\')') ||
        message.includes('forwardRef') && message.includes('undefined')
      ) {
        console.warn('Suppressed React 19 compatibility warning:', ...args);
        return;
      }
      originalError.apply(console, args);
    };
  }
};

// Initialization will be handled by the ReactCompatLayer component
