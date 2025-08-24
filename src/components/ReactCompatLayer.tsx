import React from 'react';
import { ensureReactGlobals, suppressReact19Warnings } from '../utils/reactCompatUtils';

// React Compatibility Layer Component
interface ReactCompatLayerProps {
  children: React.ReactNode;
}

const ReactCompatLayer: React.FC<ReactCompatLayerProps> = ({ children }) => {
  React.useEffect(() => {
    // Ensure React globals are available when the component mounts
    ensureReactGlobals();
    suppressReact19Warnings();
  }, []);

  return <>{children}</>;
};

export default ReactCompatLayer;
