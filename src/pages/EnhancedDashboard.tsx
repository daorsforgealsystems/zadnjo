import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Truck,
  MapPin,
  BarChart3,
  Users,
  TrendingUp,
  Activity,
  CheckCircle,
  DollarSign,
  Clock,
  AlertTriangle,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlobalFilterBar } from "@/components/filters/GlobalFilterBar";
import MetricCard from "@/components/MetricCard";
import ChartWidget from "@/components/widgets/ChartWidget";
import ActivityFeed from "@/components/widgets/ActivityFeed";
import Sidebar from "@/components/Sidebar";
const EnhancedDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleAlertsClick = () => {
    console.log("Alerts panel triggered");
  };

  const deliveryData = [
    { label: 'Mon', value: 45 },
    { label: 'Tue', value: 52 },
    { label: 'Wed', value: 48 },
    { label: 'Thu', value: 60 },
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

  const activeShipments = 89 + 34;
  const deliveredToday = 25; 
  const totalRevenue = 125000;
  const avgDeliveryTime = 2.4;
  const mockActivities = [
    {
      id: '1',
      type: 'package_delivered' as const,
      title: 'Package #123 delivered',
      description: 'Delivered to client at Main St.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      user: { name: 'Driver A', avatar: '' },
      metadata: { packageId: 'PKG-123', status: 'delivered' }
    },
    {
      id: '2',
      type: 'route_optimized' as const,
      title: 'Route optimization completed',
      description: 'Optimized 5 routes for today',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
    }
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Sidebar isOpen={sidebarOpen} onAlertsClick={handleAlertsClick} />
      <div
        className="flex-1 bg-cover bg-center bg-no-repeat relative overflow-y-auto"
        style={{ backgroundImage: 'url(/hero-logistics.jpg)', backgroundColor: '#f8fafc' }}
      >
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
        <main className={cn("transition-all duration-300 p-6 relative z-10", sidebarOpen ? "lg:ml-64" : "lg:ml-16")}>
          <div className="space-y-6">
            <header>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">Enhanced Dashboard</h1>
                  <p className="text-gray-300">Real-time logistics overview</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1 text-white border-gray-400">
                    <Activity className="h-3 w-3" />
                    Live Updates
                  </Badge>
                  <Badge variant="secondary">
                    {new Date().toLocaleDateString()}
                  </Badge>
                </div>
              </div>
              <GlobalFilterBar className="mt-4" />
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Active Shipments"
                value={activeShipments.toString()}
                change="12% increase from last week"
                icon={Package}
              />
              <MetricCard
                title="Delivered Today"
                value={deliveredToday}
                change="8% increase from yesterday"
                icon={CheckCircle}
              />
              <MetricCard
                title="Total Revenue"
                value={`$${totalRevenue.toLocaleString()}`}
                change="15% increase from last month"
                icon={DollarSign}
              />
              <MetricCard
                title="Avg Delivery Time"
                value={`${avgDeliveryTime}h`}
                change="5% decrease from last month"
                icon={Clock}
              />
            </div>

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
