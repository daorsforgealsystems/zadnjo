import React from 'react';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import MetricCard from '@/components/widgets/MetricCard';
import ChartWidget from '@/components/widgets/ChartWidget';
import { Truck, Users, DollarSign, AlertTriangle } from 'lucide-react';
import ActivityFeed from '@/components/widgets/ActivityFeed';

const ManagerDashboard: React.FC = () => {
  const metrics = [
    { title: 'Fleet Utilization', value: '82%', change: { value: 6, type: 'increase', period: 'last week' }, icon: Truck },
    { title: 'Active Drivers', value: 42, change: { value: 3, type: 'increase', period: 'yesterday' }, icon: Users },
    { title: 'Revenue (MTD)', value: '$212,450', change: { value: 11, type: 'increase', period: 'last month' }, icon: DollarSign },
    { title: 'Open Incidents', value: 3, change: { value: 2, type: 'decrease', period: 'last week' }, icon: AlertTriangle },
  ];

  const activities = [
    { id: '1', type: 'route_optimized', title: 'Optimization saved 2h 15m', description: 'Applied to Sarajevo region', timestamp: new Date() },
    { id: '2', type: 'alert', title: 'Delay on BG -> NS route', description: 'Traffic congestion, +25m', timestamp: new Date() },
  ] as any;

  return (
    <ResponsiveLayout>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <MetricCard key={m.title} title={m.title} value={m.value} change={m.change as any} icon={m.icon as any} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWidget
            title="Deliveries per Day"
            type="line"
            data={[{label:'Mon',value:45},{label:'Tue',value:52},{label:'Wed',value:61},{label:'Thu',value:55},{label:'Fri',value:64}]}
            showTrend
            trendValue={7}
          />
          <ChartWidget
            title="Status Distribution"
            type="pie"
            data={[{label:'Delivered',value:156,color:'#10b981'},{label:'In Transit',value:89,color:'#3b82f6'},{label:'Processing',value:34,color:'#f59e0b'},{label:'Delayed',value:12,color:'#ef4444'}]}
          />
        </div>

        <ActivityFeed activities={activities} />
      </div>
    </ResponsiveLayout>
  );
};

export default ManagerDashboard;