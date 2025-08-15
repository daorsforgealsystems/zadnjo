import { useState, useEffect } from "react";
import { 
  Package, 
  Truck, 
  MapPin, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Globe
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MetricCard from "@/components/widgets/MetricCard";
import ChartWidget from "@/components/widgets/ChartWidget";
import ActivityFeed from "@/components/widgets/ActivityFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import ParticleBackground from "@/components/ParticleBackground";
import { useQuery } from "@tanstack/react-query";
import { getItems, getMetricData } from "@/lib/api";
import GlobalFilterBar from "@/components/filters/GlobalFilterBar";

const EnhancedDashboard = () => {
  const { user, hasRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleAlertsClick = () => {
    // Handle alerts click - could navigate to alerts page or show alerts modal
    console.log('Alerts clicked');
    // You can add navigation logic here, for example:
    // navigate('/alerts');
  };

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: getItems,
  });

  const { data: metrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: getMetricData,
  });

  // Mock data for demonstration
  const mockActivities = [
    {
      id: '1',
      type: 'package_delivered' as const,
      title: 'Package PKG-001 delivered',
      description: 'Successfully delivered to Belgrade, Serbia',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      user: { name: 'Marko Petrović', avatar: 'https://i.pravatar.cc/150?u=marko' },
      metadata: { packageId: 'PKG-001', location: 'Belgrade, Serbia', status: 'delivered' }
    },
    {
      id: '2',
      type: 'route_optimized' as const,
      title: 'Route optimization completed',
      description: 'Optimized route for 5 deliveries, saved 45 minutes',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      user: { name: 'Ana Jovanović', avatar: 'https://i.pravatar.cc/150?u=ana' },
      metadata: { location: 'Sarajevo Region' }
    },
    {
      id: '3',
      type: 'package_picked_up' as const,
      title: 'Package PKG-002 picked up',
      description: 'Collected from distribution center',
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
      user: { name: 'Stefan Nikolić', avatar: 'https://i.pravatar.cc/150?u=stefan' },
      metadata: { packageId: 'PKG-002', location: 'Zagreb, Croatia', status: 'in_transit' }
    },
    {
      id: '4',
      type: 'alert' as const,
      title: 'Delivery delay alert',
      description: 'PKG-003 delayed due to traffic conditions',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      metadata: { packageId: 'PKG-003', location: 'Novi Sad, Serbia', status: 'delayed' }
    },
    {
      id: '5',
      type: 'location_update' as const,
      title: 'Vehicle location updated',
      description: 'TRK-001 reached checkpoint in Banja Luka',
      timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
      user: { name: 'Aleksandar Mitrović', avatar: 'https://i.pravatar.cc/150?u=aleksandar' },
      metadata: { location: 'Banja Luka, BiH' }
    }
  ];

  const deliveryData = [
    { label: 'Mon', value: 45 },
    { label: 'Tue', value: 52 },
    { label: 'Wed', value: 38 },
    { label: 'Thu', value: 61 },
    { label: 'Fri', value: 55 },
    { label: 'Sat', value: 42 },
    { label: 'Sun', value: 35 }
  ];

  const revenueData = [
    { label: 'Jan', value: 12500 },
    { label: 'Feb', value: 15200 },
    { label: 'Mar', value: 18900 },
    { label: 'Apr', value: 16800 },
    { label: 'May', value: 21300 },
    { label: 'Jun', value: 19600 }
  ];

  const statusDistribution = [
    { label: 'Delivered', value: 156, color: '#10b981' },
    { label: 'In Transit', value: 89, color: '#3b82f6' },
    { label: 'Processing', value: 34, color: '#f59e0b' },
    { label: 'Delayed', value: 12, color: '#ef4444' }
  ];

  const activeShipments = items.filter(item => 
    item.status === 'In Transit' || item.status === 'Processing'
  ).length;

  const deliveredToday = items.filter(item => 
    item.status === 'Delivered'
  ).length;

  const totalRevenue = 125000;
  const avgDeliveryTime = 2.4;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      <div className="relative z-20">
        <Sidebar isOpen={sidebarOpen} onAlertsClick={handleAlertsClick} />

        <main className={cn("transition-all duration-300 pt-header", sidebarOpen ? "ml-64" : "ml-16")}>
          <div className="p-6 space-y-6">
            {/* Header */}
            <header className="space-y-2 animate-slide-up-fade">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold gradient-text">
                    Welcome back, {user?.username || 'User'}!
                  </h1>
                  <p className="text-muted-foreground">
                    Here's what's happening with your logistics operations today.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Activity className="h-3 w-3" />
                    Live Updates
                  </Badge>
                  <Badge variant="secondary">
                    {new Date().toLocaleDateString()}
                  </Badge>
                </div>
              </div>
              {/* Global filters synced to URL */}
              <GlobalFilterBar className="mt-4" />
            </header>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Active Shipments"
                value={activeShipments}
                change={{ value: 12, type: 'increase', period: 'last week' }}
                icon={Package}
                iconColor="text-blue-600"
                description="Currently in transit"
                trend={[
                  { label: 'Mon', value: 45 },
                  { label: 'Tue', value: 52 },
                  { label: 'Wed', value: 48 },
                  { label: 'Thu', value: activeShipments }
                ]}
              />

              <MetricCard
                title="Delivered Today"
                value={deliveredToday}
                change={{ value: 8, type: 'increase', period: 'yesterday' }}
                icon={CheckCircle}
                iconColor="text-green-600"
                description="Successfully completed"
              />

              <MetricCard
                title="Total Revenue"
                value={`$${totalRevenue.toLocaleString()}`}
                change={{ value: 15, type: 'increase', period: 'last month' }}
                icon={DollarSign}
                iconColor="text-yellow-600"
                description="This month"
              />

              <MetricCard
                title="Avg Delivery Time"
                value={`${avgDeliveryTime}h`}
                change={{ value: 5, type: 'decrease', period: 'last month' }}
                icon={Clock}
                iconColor="text-purple-600"
                description="Average completion time"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartWidget
                title="Weekly Deliveries"
                data={deliveryData}
                type="line"
                showTrend
                trendValue={12}
              />

              <ChartWidget
                title="Monthly Revenue"
                data={revenueData}
                type="bar"
                showTrend
                trendValue={18}
              />
            </div>

            {/* Status Distribution and Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ChartWidget
                title="Shipment Status Distribution"
                data={statusDistribution}
                type="pie"
                className="lg:col-span-1"
              />

              <ActivityFeed
                activities={mockActivities}
                className="lg:col-span-2"
                maxItems={8}
              />
            </div>

            {/* Quick Actions */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link to="/item-tracking">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2 hover-lift">
                      <Package className="h-6 w-6" />
                      <span>Track Package</span>
                    </Button>
                  </Link>

                  <Link to="/route-optimization">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2 hover-lift">
                      <Truck className="h-6 w-6" />
                      <span>Optimize Routes</span>
                    </Button>
                  </Link>

                  <Link to="/live-map">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2 hover-lift">
                      <MapPin className="h-6 w-6" />
                      <span>Live Map</span>
                    </Button>
                  </Link>

                  <Link to="/reports">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2 hover-lift">
                      <BarChart3 className="h-6 w-6" />
                      <span>View Reports</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recent Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Traffic Delay Alert</p>
                      <p className="text-xs text-muted-foreground">Route to Belgrade experiencing 30min delay</p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Weather Update</p>
                      <p className="text-xs text-muted-foreground">Rain expected in Sarajevo region - adjust routes</p>
                    </div>
                    <Badge variant="secondary">Info</Badge>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Route Optimization Complete</p>
                      <p className="text-xs text-muted-foreground">5 routes optimized, 2.5 hours saved</p>
                    </div>
                    <Badge variant="outline">Resolved</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
