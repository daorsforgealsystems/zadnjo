import React from 'react';

// Ensure React APIs are available globally for libraries that might need them
const ensureReactGlobals = () => {
  if (typeof window !== 'undefined') {
    // Make React available globally
    (window as any).React = React;
    
    // Ensure specific React APIs are available
    if (React.createContext) {
      (window as any).createContext = React.createContext;
    }
    if (React.useState) {
      (window as any).useState = React.useState;
    }
    if (React.useEffect) {
      (window as any).useEffect = React.useEffect;
    }
    if (React.useRef) {
      (window as any).useRef = React.useRef;
    }
    if (React.useMemo) {
      (window as any).useMemo = React.useMemo;
    }
    if (React.useCallback) {
      (window as any).useCallback = React.useCallback;
    }
  }
  
  // Also ensure on globalThis
  (globalThis as any).React = React;
  if (React.createContext) {
    (globalThis as any).createContext = React.createContext;
  }
};

// Initialize immediately
ensureReactGlobals();

// React Compatibility Layer Component
interface ReactCompatLayerProps {
  children: React.ReactNode;
}

const ReactCompatLayer: React.FC<ReactCompatLayerProps> = ({ children }) => {
  React.useEffect(() => {
    ensureReactGlobals();
  }, []);

  return <>{children}</>;
};

export default ReactCompatLayer;
export { ensureReactGlobals };