import React, { useMemo, memo, useState, useEffect, Suspense } from 'react';
import type * as Leaflet from 'leaflet';
import type { MapContainerProps, TileLayerProps, MarkerProps, PopupProps, PolylineProps } from 'react-leaflet';
import LoadingSpinner from './LoadingSpinner';

// Types for dynamic imports
type LeafletComponents = {
  MapContainer: React.ComponentType<MapContainerProps & { children?: React.ReactNode }>;
  TileLayer: React.ComponentType<TileLayerProps>;
  Marker: React.ComponentType<MarkerProps>;
  Popup: React.ComponentType<PopupProps>;
  Polyline: React.ComponentType<PolylineProps>;
  L: typeof Leaflet;
  Icon: typeof Leaflet.Icon;
};

import { loadLeafletComponents } from './mapUtils';

// Hook for creating vehicle icons
const useVehicleIcons = (Icon: typeof Leaflet.Icon | null | undefined) => {
  return useMemo<null | { vehicle: Leaflet.Icon; anomaly: Leaflet.Icon }>(() => {
    if (!Icon) return null;
    return {
      vehicle: new Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448609.png',
        iconSize: [35, 35],
        iconAnchor: [17, 35],
        popupAnchor: [0, -35]
      }) as Leaflet.Icon,
      anomaly: new Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/10464/10464243.png',
        iconSize: [35, 35],
        iconAnchor: [17, 35],
        popupAnchor: [0, -35]
      }) as Leaflet.Icon
    };
  }, [Icon]);
};

export interface Vehicle {
  id: string;
  position: [number, number];
  driver: string;
  status: string;
  hasAnomaly?: boolean;
  popupInfo?: Record<string, string>;
}

interface MapViewProps {
  // For single-point display (backward compatibility)
  coordinates?: { lat: number; lng: number };
  // For multi-vehicle display
  vehicles?: Vehicle[];
  routes?: { id: string; path: [number, number][] }[];
  center?: [number, number];
  zoom?: number;
}

// Memoized VehicleMarker component to prevent unnecessary re-renders
const VehicleMarker = memo(({
  vehicle,
  icons,
  Marker,
  Popup
}: {
  vehicle: Vehicle;
  icons: { vehicle: Leaflet.Icon; anomaly: Leaflet.Icon };
  Marker: React.ComponentType<MarkerProps>;
  Popup: React.ComponentType<PopupProps>;
}) => (
  <Marker
    position={vehicle.position}
    icon={vehicle.hasAnomaly ? icons.anomaly : icons.vehicle}
  >
    <Popup>
      <b>Driver:</b> {vehicle.driver}<br/>
      <b>Status:</b> {vehicle.status}<br/>
      {vehicle.popupInfo && Object.entries(vehicle.popupInfo).map(([key, value]) => (
        <div key={key}><b>{key}:</b> {value}</div>
      ))}
    </Popup>
  </Marker>
));

VehicleMarker.displayName = 'VehicleMarker';

// Memoized RoutePolyline component to prevent unnecessary re-renders
const RoutePolyline = memo(({ 
  route, 
  Polyline 
}: { 
  route: { id: string; path: [number, number][] };
  Polyline: React.ComponentType<PolylineProps>;
}) => (
  <Polyline key={route.id} positions={route.path} color="blue" />
));

RoutePolyline.displayName = 'RoutePolyline';

// Internal map component that uses loaded Leaflet components
const LeafletMapView = memo(({
  coordinates,
  vehicles,
  routes,
  center,
  zoom = 13,
  components
}: MapViewProps & { components: LeafletComponents }) => {
  const { MapContainer, TileLayer, Marker, Popup, Polyline } = components;
  const icons = useVehicleIcons(components.Icon);

  // Memoize map center calculation
  const mapCenter = useMemo(() => {
    if (coordinates) {
      return [coordinates.lat, coordinates.lng] as [number, number];
    }
    return center || (vehicles && vehicles.length > 0 ? vehicles[0].position : [44.7866, 20.4489] as [number, number]);
  }, [coordinates, center, vehicles]);

  // Memoize zoom level calculation
  const mapZoom = useMemo(() => {
    return coordinates ? zoom : (center ? zoom : 7);
  }, [coordinates, center, zoom]);

  // Handle single coordinate display
  if (coordinates) {
    return (
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={mapCenter}>
          <Popup>Item's current location.</Popup>
        </Marker>
      </MapContainer>
    );
  }

  if (!icons) {
    return <LoadingSpinner />;
  }

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Draw routes */}
      {routes?.map(route => (
        <RoutePolyline key={route.id} route={route} Polyline={Polyline} />
      ))}

      {/* Draw vehicle markers */}
      {vehicles?.map(vehicle => (
        <VehicleMarker 
          key={vehicle.id} 
          vehicle={vehicle} 
          icons={icons}
          Marker={Marker}
          Popup={Popup}
        />
      ))}
    </MapContainer>
  );
});

LeafletMapView.displayName = 'LeafletMapView';

// Main MapView component with dynamic loading
const MapView = memo((props: MapViewProps) => {
  const [components, setComponents] = useState<LeafletComponents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadComponents = async () => {
      try {
        const leafletComponents = await loadLeafletComponents();
        if (isMounted) {
          setComponents(leafletComponents);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load map components');
          setLoading(false);
        }
      }
    };

    loadComponents();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div 
        style={{ height: '100%', width: '100%' }} 
        className="flex items-center justify-center bg-gray-100"
      >
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div 
        style={{ height: '100%', width: '100%' }} 
        className="flex items-center justify-center bg-red-50 text-red-600"
      >
        <p>Error loading map: {error}</p>
      </div>
    );
  }

  if (!components) {
    return (
      <div 
        style={{ height: '100%', width: '100%' }} 
        className="flex items-center justify-center bg-gray-100"
      >
        <p>Map components not loaded</p>
      </div>
    );
  }

  return <LeafletMapView {...props} components={components} />;
});

MapView.displayName = 'MapView';

// Export default MapView (kept component-only to preserve fast refresh)
const MapViewExport = MapView as typeof MapView;
export default MapViewExport;
