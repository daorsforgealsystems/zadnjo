import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, DollarSign, Clock, Globe, TrendingUp, AlertTriangle } from 'lucide-react';

// API functions
import { getMetricData, getShipmentData, getRevenueData, getRouteData } from '@/lib/api';

// Components
import MetricCard from '@/components/widgets/MetricCard';
import AnimatedChart from '@/components/AnimatedChart';
import EnhancedTable from '@/components/EnhancedTable';
import AlertsPanel from '@/components/AlertsPanel';
import MapView from '@/components/MapView';

// Types
import { Item, LiveRoute } from '@/lib/types';

const MainDashboard: React.FC = () => {
  // Fetch dashboard data
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: getMetricData
  });
  
  const { data: shipmentData, isLoading: isLoadingShipments } = useQuery({
    queryKey: ['shipmentData'],
    queryFn: getShipmentData
  });
  
  const { data: revenueData, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['revenueData'],
    queryFn: getRevenueData
  });
  
  const { data: routeData, isLoading: isLoadingRoutes } = useQuery({
    queryKey: ['routeData'],
    queryFn: getRouteData
  });

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
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    }
  };

  // Mock data for recent shipments
  const recentShipments: Item[] = [
    {
      id: '1',
      name: 'Electronics Package',
      status: 'In Transit',
      location: 'Belgrade, Serbia',
      coordinates: { lat: 44.787197, lng: 20.457273 },
      history: [
        { status: 'Pending', timestamp: '2023-06-01T08:00:00Z' },
        { status: 'In Transit', timestamp: '2023-06-02T10:30:00Z' }
      ],
      documents: [
        { name: 'Invoice', url: '/documents/invoice-1.pdf' },
        { name: 'Customs Form', url: '/documents/customs-1.pdf' }
      ]
    },
    {
      id: '2',
      name: 'Medical Supplies',
      status: 'Delivered',
      location: 'Sarajevo, Bosnia',
      coordinates: { lat: 43.856430, lng: 18.413029 },
      history: [
        { status: 'Pending', timestamp: '2023-06-01T09:00:00Z' },
        { status: 'In Transit', timestamp: '2023-06-01T11:30:00Z' },
        { status: 'Delivered', timestamp: '2023-06-02T14:00:00Z' }
      ],
      documents: [
        { name: 'Invoice', url: '/documents/invoice-2.pdf' },
        { name: 'Delivery Note', url: '/documents/delivery-2.pdf' }
      ]
    },
    {
      id: '3',
      name: 'Furniture Shipment',
      status: 'Pending',
      location: 'Zagreb, Croatia',
      coordinates: { lat: 45.815399, lng: 15.966568 },
      history: [
        { status: 'Pending', timestamp: '2023-06-02T15:00:00Z' }
      ],
      documents: [
        { name: 'Invoice', url: '/documents/invoice-3.pdf' }
      ]
    }
  ];

  // Mock data for active routes
  const activeRoutes: LiveRoute[] = [
    {
      id: '1',
      from: 'Belgrade, Serbia',
      to: 'Sarajevo, Bosnia',
      status: 'In Progress',
      progress: 65,
      eta: '2023-06-03T18:30:00Z',
      driver: 'Milan Petrović',
      predictedEta: {
        time: '2023-06-03T18:45:00Z',
        confidence: 85
      },
      anomalies: [],
      currentPosition: { lat: 44.08, lng: 19.22 },
      speed: 72,
      lastMoved: '2023-06-03T14:22:00Z',
      plannedRoute: [
        { lat: 44.787197, lng: 20.457273 },
        { lat: 44.08, lng: 19.22 },
        { lat: 43.856430, lng: 18.413029 }
      ]
    },
    {
      id: '2',
      from: 'Zagreb, Croatia',
      to: 'Ljubljana, Slovenia',
      status: 'In Progress',
      progress: 30,
      eta: '2023-06-03T20:15:00Z',
      driver: 'Ana Kovačić',
      predictedEta: {
        time: '2023-06-03T20:30:00Z',
        confidence: 90
      },
      anomalies: [
        {
          id: 'a1',
          type: 'UNSCHEDULED_STOP',
          timestamp: '2023-06-03T13:45:00Z',
          severity: 'low',
          description: 'Vehicle stopped for 15 minutes outside scheduled rest area',
          vehicleId: 'v2'
        }
      ],
      currentPosition: { lat: 45.55, lng: 15.68 },
      speed: 0,
      lastMoved: '2023-06-03T13:45:00Z',
      plannedRoute: [
        { lat: 45.815399, lng: 15.966568 },
        { lat: 45.55, lng: 15.68 },
        { lat: 46.056946, lng: 14.505751 }
      ]
    }
  ];

  // Table columns for recent shipments
  const shipmentColumns = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Name', accessorKey: 'name' },
    { header: 'Status', accessorKey: 'status' },
    { header: 'Location', accessorKey: 'location' },
    { 
      header: 'Last Updated', 
      accessorKey: 'history',
      cell: ({ row }: any) => {
        const history = row.original.history;
        if (history && history.length > 0) {
          const lastUpdate = new Date(history[history.length - 1].timestamp);
          return lastUpdate.toLocaleString();
        }
        return 'N/A';
      }
    }
  ];

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
            change={metrics?.activeShipments.change || ''}
            changeType={metrics?.activeShipments.changeType || 'neutral'}
            icon={<Package className="h-5 w-5" />}
            isLoading={isLoadingMetrics}
          />
          <MetricCard 
            title="Total Revenue" 
            value={metrics?.totalRevenue.value || 0} 
            change={metrics?.totalRevenue.change || ''}
            changeType={metrics?.totalRevenue.changeType || 'neutral'}
            icon={<DollarSign className="h-5 w-5" />}
            formatter={(val) => `$${val.toLocaleString()}`}
            isLoading={isLoadingMetrics}
          />
          <MetricCard 
            title="On-Time Delivery" 
            value={metrics?.onTimeDelivery.value || 0} 
            change={metrics?.onTimeDelivery.change || ''}
            changeType={metrics?.onTimeDelivery.changeType || 'neutral'}
            icon={<Clock className="h-5 w-5" />}
            formatter={(val) => `${val}%`}
            isLoading={isLoadingMetrics}
          />
          <MetricCard 
            title="Border Crossings" 
            value={metrics?.borderCrossings.value || 0} 
            change={metrics?.borderCrossings.change || ''}
            changeType={metrics?.borderCrossings.changeType || 'neutral'}
            icon={<Globe className="h-5 w-5" />}
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
              type="pie"
              data={shipmentData || []}
              isLoading={isLoadingShipments}
              height={300}
            />
          </div>
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Revenue Trend</h2>
            <AnimatedChart 
              type="bar"
              data={revenueData || []}
              isLoading={isLoadingRevenue}
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
              <MapView 
                routes={activeRoutes}
                shipments={recentShipments}
              />
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Alerts</h2>
            <AlertsPanel />
          </div>
        </motion.div>

        {/* Recent Shipments Table */}
        <motion.div variants={itemVariants}>
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Recent Shipments</h2>
            <EnhancedTable 
              data={recentShipments}
              columns={shipmentColumns}
              pagination={{ pageSize: 5 }}
            />
          </div>
        </motion.div>

        {/* Popular Routes */}
        <motion.div variants={itemVariants}>
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Popular Routes</h2>
            <AnimatedChart 
              type="horizontalBar"
              data={routeData || []}
              isLoading={isLoadingRoutes}
              height={250}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MainDashboard;