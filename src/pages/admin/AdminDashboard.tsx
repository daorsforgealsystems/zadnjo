import React from 'react';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import MetricCard from '@/components/widgets/MetricCard';
import ChartWidget from '@/components/widgets/ChartWidget';
import ActivityFeed from '@/components/widgets/ActivityFeed';
import { Users, ShieldCheck, Server, Activity, Settings, ClipboardList } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const metrics = [
    { title: 'Active Users', value: 328, change: { value: 4, type: 'increase', period: 'last week' }, icon: Users },
    { title: 'System Health', value: '99.9%', change: { value: 0.1, type: 'increase', period: 'last month' }, icon: Server },
    { title: 'Security Events', value: 12, change: { value: 3, type: 'decrease', period: 'last week' }, icon: ShieldCheck },
    { title: 'Open Tickets', value: 5, change: { value: 2, type: 'decrease', period: 'yesterday' }, icon: ClipboardList },
  ];

  const activity = [
    { id: '1', type: 'user_login', title: 'New admin added', description: 'User ana.k promoted to ADMIN', timestamp: new Date() },
    { id: '2', type: 'alert', title: 'Failed login attempt', description: 'Multiple attempts from IP 178.22.15.10', timestamp: new Date() },
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
            title="Users by Role"
            type="bar"
            data={[
              { label: 'Admin', value: 4 },
              { label: 'Manager', value: 12 },
              { label: 'Driver', value: 48 },
              { label: 'Client', value: 264 },
            ]}
            showTrend
            trendValue={8}
          />
          <ChartWidget
            title="System Events"
            type="line"
            data={[
              { label: 'Mon', value: 12 },
              { label: 'Tue', value: 18 },
              { label: 'Wed', value: 9 },
              { label: 'Thu', value: 21 },
              { label: 'Fri', value: 14 },
            ]}
            showTrend
            trendValue={-4}
          />
        </div>

        <ActivityFeed activities={activity} />
      </div>
    </ResponsiveLayout>
  );
};

export default AdminDashboard;