import { useMemo, memo, useState, useEffect, Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';

// Types for dynamic imports
type LeafletComponents = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MapContainer: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TileLayer: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Marker: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Popup: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Polyline: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  L: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Icon: any;
};

// Dynamic imports for Leaflet
const loadLeafletComponents = async (): Promise<LeafletComponents> => {
  const [reactLeaflet, leaflet] = await Promise.all([
    import('react-leaflet'),
    import('leaflet')
  ]);

  // Load CSS dynamically
  await import('leaflet/dist/leaflet.css');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { L, Icon } = leaflet as any;

  // Fix for default icon issue with webpack
  delete ((L as any).Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;

  (L as any).Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });

  return {
    MapContainer: reactLeaflet.MapContainer,
    TileLayer: reactLeaflet.TileLayer,
    Marker: reactLeaflet.Marker,
    Popup: reactLeaflet.Popup,
    Polyline: reactLeaflet.Polyline,
    L,
    Icon
  };
};

// Hook for creating vehicle icons
const useVehicleIcons = (Icon: any) => {
  return useMemo(() => {
    if (!Icon) return null;
    return {
      vehicle: new Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448609.png',
        iconSize: [35, 35],
        iconAnchor: [17, 35],
        popupAnchor: [0, -35]
      }),
      anomaly: new Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/10464/10464243.png',
        iconSize: [35, 35],
        iconAnchor: [17, 35],
        popupAnchor: [0, -35]
      })
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
  icons: { vehicle: any; anomaly: any };
  Marker: any;
  Popup: any;
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
  Polyline: any;
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
  const { MapContainer, TileLayer, Marker, Popup } = components;
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
        <RoutePolyline key={route.id} route={route} Polyline={components.Polyline} />
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

// Preload function for hover prefetching
export const preloadMapComponents = () => {
  void loadLeafletComponents();
};

export default MapView;
