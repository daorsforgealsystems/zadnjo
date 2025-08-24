import React, { Suspense, lazy } from 'react';
import LoadingSpinner from './LoadingSpinner';

// Lazy load the MapView component to ensure React is available
const LazyMapView = lazy(() => import('./MapView'));

interface MapWrapperProps {
  coordinates?: { lat: number; lng: number };
  vehicles?: Array<{
    id: string;
    position: [number, number];
    driver: string;
    status: string;
    hasAnomaly?: boolean;
    popupInfo?: Record<string, string>;
  }>;
  routes?: Array<{ id: string; path: [number, number][] }>;
  center?: [number, number];
  zoom?: number;
}

const MapWrapper: React.FC<MapWrapperProps> = (props) => {
  return (
    <Suspense 
      fallback={
        <div 
          style={{ height: '100%', width: '100%' }} 
          className="flex items-center justify-center bg-gray-100"
        >
          <LoadingSpinner />
        </div>
      }
    >
      <LazyMapView {...props} />
    </Suspense>
  );
};

export default MapWrapper;