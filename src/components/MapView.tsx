import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { Icon } from 'leaflet';
import { useMemo, memo } from 'react';

// Fix for default icon issue with webpack
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Memoize icon creation to prevent recreation on each render
const useVehicleIcons = () => {
  return useMemo(() => ({
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
  }), []);
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
  icons
}: {
  vehicle: Vehicle;
  icons: { vehicle: Icon; anomaly: Icon };
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
const RoutePolyline = memo(({ route }: { route: { id: string; path: [number, number][] } }) => (
  <Polyline key={route.id} positions={route.path} color="blue" />
));

RoutePolyline.displayName = 'RoutePolyline';

const MapView = memo(({
  coordinates,
  vehicles,
  routes,
  center,
  zoom = 13
}: MapViewProps) => {
  const icons = useVehicleIcons();

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
        <RoutePolyline key={route.id} route={route} />
      ))}

      {/* Draw vehicle markers */}
      {vehicles?.map(vehicle => (
        <VehicleMarker key={vehicle.id} vehicle={vehicle} icons={icons} />
      ))}
    </MapContainer>
  );
});

MapView.displayName = 'MapView';

export default MapView;
