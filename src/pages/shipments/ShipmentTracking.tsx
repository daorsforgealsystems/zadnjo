import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import MapView from '@/components/MapView';
import { useQuery } from '@tanstack/react-query';
import { GeoAPI } from '@/lib/api/gateway';

const ShipmentTracking: React.FC = () => {
  const { data } = useQuery({ queryKey: ['vehicles'], queryFn: GeoAPI.vehicles });
  const vehicles = (data?.data || []).map(v => ({ id: v.id, position: [v.lat, v.lng] as [number, number], driver: v.id, status: v.speed > 0 ? 'In Transit' : 'Stopped' }));
  
  return (
    <div className="p-6 space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardTitle>Shipment Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[480px]">
            <MapView vehicles={vehicles} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShipmentTracking;