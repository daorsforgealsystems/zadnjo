import React from 'react';
import RealTimeTracker from '@/components/tracking/RealTimeTracker';
import { Helmet } from 'react-helmet';

const FleetTracking: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Helmet>
        <title>Fleet Tracking | LogiCore</title>
      </Helmet>
      
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Fleet Tracking</h1>
        <p className="text-muted-foreground">
          Real-time tracking and monitoring of your logistics fleet.
        </p>
      </div>
      
      <RealTimeTracker />
    </div>
  );
};

export default FleetTracking;