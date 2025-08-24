import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getAnomalies } from '@/lib/api';
import { Anomaly } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, DollarSign, Clock, Globe } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

// API functions
import { getMetricData, getShipmentData, getRevenueData, getRouteData, getItems, getLiveRoutes } from '@/lib/api';

// Components
import MetricCard from '@/components/widgets/MetricCard';
import AnimatedChart from '@/components/AnimatedChart';
import EnhancedTable from '@/components/EnhancedTable';
import AlertsPanel from '@/components/AlertsPanel';
import MapView from '@/components/MapView';

// Types
import { Item } from '@/lib/types';

const MainDashboard: React.FC = () => {
  // Fetch dashboard data
  const metricsQuery = useQuery({ queryKey: ['metrics'], queryFn: () => getMetricData() });
  const metrics = metricsQuery.data as import('@/lib/types').MetricData | undefined;
  const isLoadingMetrics = metricsQuery.isLoading;

  const shipmentDataQuery = useQuery({ queryKey: ['shipmentData'], queryFn: () => getShipmentData() });
  const shipmentData = shipmentDataQuery.data as any;
  const _isLoadingShipments = shipmentDataQuery.isLoading;

  const revenueDataQuery = useQuery({ queryKey: ['revenueData'], queryFn: () => getRevenueData() });
  const revenueData = revenueDataQuery.data as any;
  const _isLoadingRevenue = revenueDataQuery.isLoading;

  const routeDataQuery = useQuery({ queryKey: ['routeData'], queryFn: () => getRouteData() });
  const routeData = routeDataQuery.data as any;
  const _isLoadingRoutes = routeDataQuery.isLoading;

  // Animation variants for staggered loading
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
  staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
  transition: ({ type: 'spring', stiffness: 100, damping: 15 } as any)
    }
  };

  // Use live data where available
  const { data: items, isLoading: isLoadingItems } = useQuery<import('@/lib/types').Item[]>({ queryKey: ['items'], queryFn: () => getItems() });
  const { data: liveRoutes, isLoading: isLoadingLiveRoutes } = useQuery<import('@/lib/types').LiveRoute[]>({ queryKey: ['liveRoutes'], queryFn: () => getLiveRoutes() });

  // Table columns for recent shipments
  // EnhancedTable expects columns with key, title, and optional render
  interface Shipment {
    id: string;
    name: string;
    status: string;
    location: string;
    history: { timestamp: string }[];
  }
  // Helper to ensure columns keys match the `Item` interface
  const shipmentColumns: { key: keyof Item; title: string; render?: (value: unknown, row: Item) => React.ReactNode }[] = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: 'Name' },
    { key: 'status', title: 'Status' },
    { key: 'location', title: 'Location' },
    {
      key: 'history',
      title: 'Last Updated',
      render: (_: unknown, row: Shipment) => {
        const history = row.history;
        if (history && history.length > 0) {
          const lastUpdate = new Date(history[history.length - 1].timestamp);
          return lastUpdate.toLocaleString();
        }
        return 'N/A';
      },
    },
  ];

  // Alerts panel state & handlers (small, local implementation similar to Index page)
  const queryClient = useQueryClient();
  const { data: anomalies = [] } = useQuery<Anomaly[]>({ queryKey: ['anomalies'], queryFn: () => getAnomalies() });
  const [alertsOpen, setAlertsOpen] = React.useState(false);
  const alerts: Anomaly[] = anomalies;

  const handleClearAlerts = () => {
    queryClient.setQueryData(['anomalies'], []);
  };

  const handleRemoveAlert = (id: string) => {
    queryClient.setQueryData(['anomalies'], (oldData: Anomaly[] = []) => oldData.filter(a => a.id !== id));
  };

  // Map metric changeType from API ('positive'|'negative'|'neutral') to MetricCard expected values
  const mapChangeType = (t?: string) => t === 'positive' ? 'increase' : t === 'negative' ? 'decrease' : 'neutral';

  return (
    <div className="p-6">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold mb-2">Main Dashboard</h1>
          <p className="text-muted-foreground mb-6">Overview of logistics operations and key metrics</p>
        </motion.div>

        {/* Metrics Row */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <MetricCard
            title="Active Shipments"
            value={metrics?.activeShipments.value || 0}
            change={
              metrics?.activeShipments && metrics.activeShipments.change !== undefined
                ? { value: Number(metrics.activeShipments.change) || 0, type: mapChangeType(metrics.activeShipments.changeType) }
                : undefined
            }
            icon={Package}
            isLoading={isLoadingMetrics}
          />
          <MetricCard
            title="Total Revenue"
            value={metrics?.totalRevenue.value || 0}
            change={
              metrics?.totalRevenue && metrics.totalRevenue.change !== undefined
                ? { value: Number(metrics.totalRevenue.change) || 0, type: mapChangeType(metrics.totalRevenue.changeType) }
                : undefined
            }
            icon={DollarSign}
            formatter={(val: number) => `$${val.toLocaleString()}`}
            isLoading={isLoadingMetrics}
          />
          <MetricCard
            title="On-Time Delivery"
            value={metrics?.onTimeDelivery.value || 0}
            change={
              metrics?.onTimeDelivery && metrics.onTimeDelivery.change !== undefined
                ? { value: Number(metrics.onTimeDelivery.change) || 0, type: mapChangeType(metrics.onTimeDelivery.changeType) }
                : undefined
            }
            icon={Clock}
            formatter={(val: number) => `${val}%`}
            isLoading={isLoadingMetrics}
          />
          <MetricCard
            title="Border Crossings"
            value={metrics?.borderCrossings.value || 0}
            change={
              metrics?.borderCrossings && metrics.borderCrossings.change !== undefined
                ? { value: Number(metrics.borderCrossings.change) || 0, type: mapChangeType(metrics.borderCrossings.changeType) }
                : undefined
            }
            icon={Globe}
            isLoading={isLoadingMetrics}
          />
        </motion.div>

        {/* Charts Row */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Shipment Status</h2>
            <AnimatedChart
              title="Shipment Status"
              type="donut"
              data={shipmentData || []}
              height={300}
            />
          </div>
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Revenue Trend</h2>
            <AnimatedChart
              title="Revenue Trend"
              type="bar"
              data={revenueData || []}
              height={300}
            />
          </div>
        </motion.div>

        {/* Map and Alerts Row */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-2 bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Active Routes</h2>
            <div className="h-[400px]">
              { (isLoadingItems || isLoadingLiveRoutes) ? (
                <div className="h-full w-full flex items-center justify-center">
                  <LoadingSpinner size="lg" text="Loading map data..." />
                </div>
              ) : (
                <MapView
                  routes={liveRoutes?.map((r) => ({ id: r.id, path: r.plannedRoute.map(p => [p.lat, p.lng] as [number, number]) }))}
                  vehicles={
                    [
                      ...(liveRoutes?.map(r => ({
                        id: `route-${r.id}`,
                        position: [r.currentPosition.lat, r.currentPosition.lng] as [number, number],
                        driver: r.driver,
                        status: r.status,
                        hasAnomaly: (r.anomalies && r.anomalies.length > 0) || false,
                        popupInfo: { eta: r.eta, speed: String(r.speed) }
                      })) || []),
                      ...(items?.map(i => ({
                        id: `item-${i.id}`,
                        position: [i.coordinates.lat, i.coordinates.lng] as [number, number],
                        driver: i.name,
                        status: i.status,
                        hasAnomaly: false,
                        popupInfo: { location: i.location }
                      })) || [])
                    ]
                  }
                />
              )}
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Alerts</h2>
            {/* You must provide all required props for AlertsPanel. Replace the following with your actual state/handlers. */}
            <AlertsPanel
              isOpen={alertsOpen}
              onOpenChange={setAlertsOpen}
              alerts={alerts}
              onClearAlerts={handleClearAlerts}
              onRemoveAlert={handleRemoveAlert}
            />
          </div>
        </motion.div>

        {/* Recent Shipments Table */}
        <motion.div variants={itemVariants}>
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Recent Shipments</h2>
            <EnhancedTable
              data={items || []}
              columns={shipmentColumns}
              itemsPerPage={5}
            />
          </div>
        </motion.div>

        {/* Popular Routes */}
        <motion.div variants={itemVariants}>
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Popular Routes</h2>
              <AnimatedChart
                title="Popular Routes"
                type="bar"
                data={routeData || []}
                height={250}
              />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MainDashboard;