import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Tabs from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Package, MapPin, RefreshCw, Clock, Info } from 'lucide-react';
import { debug } from '@/lib/debug';

// Fix for Leaflet marker icons in React
import L from 'leaflet';
// Use string paths instead of direct imports for marker icons
const markerIcon = 'leaflet/dist/images/marker-icon.png';
const markerIcon2x = 'leaflet/dist/images/marker-icon-2x.png';
const markerShadow = 'leaflet/dist/images/marker-shadow.png';

// Mock data for demonstration
const mockVehicles = [
  { id: 'v1', name: 'Truck #1042', lat: 51.505, lng: -0.09, status: 'active', speed: 65, driver: 'John Smith', lastUpdate: '2 min ago' },
  { id: 'v2', name: 'Van #2371', lat: 51.51, lng: -0.1, status: 'idle', speed: 0, driver: 'Sarah Johnson', lastUpdate: '5 min ago' },
  { id: 'v3', name: 'Truck #3845', lat: 51.49, lng: -0.12, status: 'active', speed: 48, driver: 'Mike Davis', lastUpdate: '1 min ago' },
];

const mockShipments = [
  { id: 's1', trackingNumber: 'TRK-7823-4921', status: 'in-transit', origin: 'London', destination: 'Manchester', eta: '2h 15m' },
  { id: 's2', trackingNumber: 'TRK-6392-1047', status: 'delivered', origin: 'Birmingham', destination: 'London', eta: '0h 0m' },
  { id: 's3', trackingNumber: 'TRK-9371-5280', status: 'loading', origin: 'Liverpool', destination: 'Leeds', eta: '3h 45m' },
];

// Fix Leaflet icon issues
const iconDefaultProto = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown };
delete iconDefaultProto._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const LiveTracking: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  useEffect(() => {
    debug('LiveTracking component mounted', 'info');
    return () => {
      debug('LiveTracking component unmounted', 'info');
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    debug('Refreshing tracking data...', 'info');
    
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
      setLastRefreshed(new Date());
      debug('Tracking data refreshed', 'info');
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-amber-500';
      case 'inactive': return 'bg-gray-500';
      case 'in-transit': return 'bg-blue-500';
      case 'delivered': return 'bg-green-500';
      case 'loading': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Live Tracking</h1>
          <p className="text-muted-foreground">
            Monitor your fleet and shipments in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="text-xs text-muted-foreground flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </div>
        </div>
      </div>

  <Tabs.Root defaultValue="map">
        <Tabs.List className="grid w-full grid-cols-3 mb-6">
          <Tabs.Trigger value="map">Map View</Tabs.Trigger>
          <Tabs.Trigger value="vehicles">Vehicles</Tabs.Trigger>
          <Tabs.Trigger value="shipments">Shipments</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="map" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="h-[500px] w-full rounded-md overflow-hidden">
                <MapContainer 
                  center={[51.505, -0.09]} 
                  zoom={12} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {mockVehicles.map(vehicle => (
                    <Marker 
                      key={vehicle.id} 
                      position={[vehicle.lat, vehicle.lng]}
                      eventHandlers={{
                        click: () => setSelectedVehicle(vehicle.id),
                      }}
                    >
                      <Popup>
                        <div className="p-1">
                          <h3 className="font-semibold">{vehicle.name}</h3>
                          <p className="text-sm">Driver: {vehicle.driver}</p>
                          <p className="text-sm">Speed: {vehicle.speed} km/h</p>
                          <div className="flex items-center mt-1">
                            <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor(vehicle.status)} mr-1`}></span>
                            <span className="text-xs capitalize">{vehicle.status}</span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="vehicles" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockVehicles.map(vehicle => (
              <Card key={vehicle.id} className={`${selectedVehicle === vehicle.id ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center">
                      <Truck className="w-5 h-5 mr-2" />
                      {vehicle.name}
                    </CardTitle>
                    <Badge className={getStatusColor(vehicle.status)}>
                      {vehicle.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    Driver: {vehicle.driver}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Speed:</span>
                      <span className="font-medium">{vehicle.speed} km/h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Update:</span>
                      <span>{vehicle.lastUpdate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Location:</span>
                      <span>{vehicle.lat.toFixed(4)}, {vehicle.lng.toFixed(4)}</span>
                    </div>
                    <div className="pt-2">
                      <Button variant="outline" size="sm" className="w-full">
                        <MapPin className="w-4 h-4 mr-2" />
                        View on Map
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Tabs.Content>

        <Tabs.Content value="shipments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockShipments.map(shipment => (
              <Card key={shipment.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center">
                      <Package className="w-5 h-5 mr-2" />
                      Shipment
                    </CardTitle>
                    <Badge className={getStatusColor(shipment.status)}>
                      {shipment.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {shipment.trackingNumber}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Origin:</span>
                      <span>{shipment.origin}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Destination:</span>
                      <span>{shipment.destination}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ETA:</span>
                      <span className="font-medium">{shipment.eta}</span>
                    </div>
                    <div className="pt-2">
                      <Button variant="outline" size="sm" className="w-full">
                        <Info className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

export default LiveTracking;