import React from 'react';

interface SimpleMapViewProps {
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

const SimpleMapView: React.FC<SimpleMapViewProps> = ({ 
  coordinates, 
  vehicles, 
  routes, 
  center, 
  zoom = 13 
}) => {
  const mapCenter = coordinates 
    ? [coordinates.lat, coordinates.lng] 
    : center || (vehicles && vehicles.length > 0 ? vehicles[0].position : [44.7866, 20.4489]);

  const googleMapsUrl = `https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dOWTgHz-TK7VFC&center=${mapCenter[0]},${mapCenter[1]}&zoom=${zoom}`;

  return (
    <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden">
      <iframe
        src={googleMapsUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Map View"
      />
      
      {/* Overlay with vehicle/location info */}
      {(vehicles || coordinates) && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
          <h3 className="font-semibold text-sm mb-2">Location Info</h3>
          {coordinates && (
            <div className="text-xs text-gray-600">
              <p>Lat: {coordinates.lat.toFixed(6)}</p>
              <p>Lng: {coordinates.lng.toFixed(6)}</p>
            </div>
          )}
          {vehicles && vehicles.length > 0 && (
            <div className="text-xs text-gray-600">
              <p>{vehicles.length} vehicle(s) tracked</p>
              {vehicles.slice(0, 3).map(vehicle => (
                <div key={vehicle.id} className="mt-1">
                  <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                    vehicle.hasAnomaly ? 'bg-red-500' : 'bg-green-500'
                  }`}></span>
                  {vehicle.driver} - {vehicle.status}
                </div>
              ))}
              {vehicles.length > 3 && (
                <p className="mt-1 text-gray-500">+{vehicles.length - 3} more</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SimpleMapView;