import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Define a custom icon for vehicles
const vehicleIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448609.png', // A truck icon
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
});

const anomalyVehicleIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/10464/10464243.png', // A red truck icon
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
});


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

const MapView = ({ coordinates, vehicles, routes, center, zoom = 13 }: MapViewProps) => {

  // Handle single coordinate display
  if (coordinates) {
    return (
      <MapContainer center={[coordinates.lat, coordinates.lng]} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={[coordinates.lat, coordinates.lng]}>
          <Popup>Item's current location.</Popup>
        </Marker>
      </MapContainer>
    );
  }

  // Handle multi-vehicle display
  const mapCenter = center || (vehicles && vehicles.length > 0 ? vehicles[0].position : [44.7866, 20.4489]); // Default to Belgrade if no center/vehicles
  const mapZoom = center ? zoom : 7; // Zoom out if showing all vehicles without a specific center

  return (
    <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Draw routes */}
      {routes?.map(route => (
        <Polyline key={route.id} positions={route.path} color="blue" />
      ))}

      {/* Draw vehicle markers */}
      {vehicles?.map(vehicle => (
        <Marker key={vehicle.id} position={vehicle.position} icon={vehicle.hasAnomaly ? anomalyVehicleIcon : vehicleIcon}>
          <Popup>
            <b>Driver:</b> {vehicle.driver}<br/>
            <b>Status:</b> {vehicle.status}<br/>
            {vehicle.popupInfo && Object.entries(vehicle.popupInfo).map(([key, value]) => (
              <div key={key}><b>{key}:</b> {value}</div>
            ))}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;
