import React from 'react';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import MetricCard from '@/components/widgets/MetricCard';
import ActivityFeed from '@/components/widgets/ActivityFeed';
import { Truck, CheckCircle, Clock, MapPin, Route, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const DriverDashboard: React.FC = () => {
  const metrics = [
    { title: 'Assigned Jobs', value: 6, change: { value: 12, type: 'increase', period: 'last week' }, icon: Truck },
    { title: 'Completed Today', value: 3, change: { value: 5, type: 'increase', period: 'yesterday' }, icon: CheckCircle },
    { title: 'Avg. ETA Deviation', value: '8m', change: { value: 2, type: 'decrease', period: 'last week' }, icon: Clock },
    { title: 'Next Stop', value: 'BZ-102', change: { value: 0, type: 'neutral' as const, period: 'current' }, icon: MapPin },
  ];

  const activities = [
    { id: '1', type: 'location_update', title: 'Reached checkpoint Banja Luka', description: 'TRK-001 arrived at checkpoint', timestamp: new Date() },
    { id: '2', type: 'package_picked_up', title: 'PKG-884 picked up', description: 'Collected from depot', timestamp: new Date() },
  ] as any;

  return (
    <ResponsiveLayout>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <MetricCard key={m.title} title={m.title} value={m.value} change={m.change as any} icon={m.icon as any} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Today\'s Route</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="p-3 rounded-md border flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Navigation className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Stop #{i}</div>
                    <div className="text-xs text-muted-foreground">ETA: {8 + i}:15</div>
                  </div>
                  <Button size="sm" variant="secondary">Details</Button>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link to="/live-map"><Button><Route className="h-4 w-4 mr-2" /> Open Live Map</Button></Link>
            </div>
          </div>
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default DriverDashboard;