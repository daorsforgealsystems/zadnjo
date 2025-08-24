import React, { Suspense, lazy, useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import SimpleMapView from './SimpleMapView';
import MapErrorBoundary from './MapErrorBoundary';

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
  const [useSimpleMap, setUseSimpleMap] = useState(false);

  // Error boundary for the lazy-loaded component
  const ErrorFallback = () => {
    useEffect(() => {
      console.warn('MapView failed to load, falling back to SimpleMapView');
      setUseSimpleMap(true);
    }, []);

    return <SimpleMapView {...props} />;
  };

  if (useSimpleMap) {
    return <SimpleMapView {...props} />;
  }

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
      <MapErrorBoundary
        fallback={<ErrorFallback />}
        onError={(error) => {
          console.error('MapView error:', error);
          setUseSimpleMap(true);
        }}
      >
        <LazyMapView {...props} />
      </MapErrorBoundary>
    </Suspense>
  );
};

export default MapWrapper;