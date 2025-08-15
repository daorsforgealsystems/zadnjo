import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Truck, 
  CheckCircle, 
  AlertTriangle, 
  Package, 
  Clock,
  TrendingUp,
  MapPin,
  Calendar,
  Eye,
  MessageSquare,
  FileText,
  Bell
} from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import AnimatedChart from '@/components/AnimatedChart';
import { useQuery } from '@tanstack/react-query';
import { getItems } from '@/lib/api';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const PortalDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: 'shipment_update',
      title: 'Shipment Update',
      message: 'Your package #SH-2024-001 has been picked up from Belgrade',
      timestamp: '2 hours ago',
      icon: Truck,
      status: 'info'
    },
    {
      id: 2,
      type: 'delivery',
      title: 'Delivery Completed',
      message: 'Package #SH-2024-002 delivered to Zagreb, Croatia',
      timestamp: '1 day ago',
      icon: CheckCircle,
      status: 'success'
    },
    {
      id: 3,
      type: 'alert',
      title: 'Route Delay',
      message: 'Minor delay on shipment #SH-2024-003 due to weather conditions',
      timestamp: '2 days ago',
      icon: AlertTriangle,
      status: 'warning'
    },
    {
      id: 4,
      type: 'document',
      title: 'Document Ready',
      message: 'Invoice for shipment #SH-2024-001 is now available',
      timestamp: '3 days ago',
      icon: FileText,
      status: 'info'
    }
  ]);

  const { data: items = [] } = useQuery({
    queryKey: ['portalItems'],
    queryFn: getItems,
  });

  // Filter items for current user (in a real app, this would be done server-side)
  const userItems = items.filter(item => 
    user?.associatedItemIds?.includes(item.id)
  ).slice(0, 5) || items.slice(0, 5);

  const activeShipments = userItems.filter(item => 
    item.status === 'In Transit' || item.status === 'Processing'
  ).length;

  const deliveredShipments = userItems.filter(item => 
    item.status === 'Delivered'
  ).length;

  const pendingShipments = userItems.filter(item => 
    item.status === 'Pending'
  ).length;

  const alerts = 1; // mock value

  // Mock data for charts
  const shipmentTrendData = Array.from({ length: 7 }, (_, i) => ({
    label: new Date(Date.now() - (6-i) * 24 * 60 * 60 * 1000).toLocaleDateString('en', { weekday: 'short' }),
    value: Math.floor(Math.random() * 5) + 1,
    color: 'bg-primary'
  }));

  const statusDistributionData = [
    { label: 'In Transit', value: activeShipments, color: 'bg-blue-500' },
    { label: 'Delivered', value: deliveredShipments, color: 'bg-green-500' },
    { label: 'Pending', value: pendingShipments, color: 'bg-yellow-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold gradient-text">Welcome back, {user?.username}!</h1>
        <p className="text-muted-foreground">Here's a summary of your account and shipments.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Shipments"
          value={activeShipments}
          icon={Truck}
          change="+1 this week"
          changeType="positive"
        />
        <MetricCard
          title="Delivered This Month"
          value={deliveredShipments}
          icon={CheckCircle}
          change="+5%"
          changeType="positive"
        />
        <MetricCard
          title="Pending Orders"
          value={pendingShipments}
          icon={Clock}
          change="2 awaiting pickup"
          changeType="neutral"
        />
        <MetricCard
          title="Active Alerts"
          value={alerts}
          icon={AlertTriangle}
          change="1 requires attention"
          changeType="negative"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts */}
        <div className="space-y-6">
          <AnimatedChart 
            title="Weekly Shipment Activity" 
            data={shipmentTrendData} 
            type="line" 
          />
          <AnimatedChart 
            title="Shipment Status Distribution" 
            data={statusDistributionData} 
            type="donut" 
          />
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.status === 'success' ? 'bg-green-500/10 text-green-500' :
                      activity.status === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/portal/shipments">
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="mr-2 h-4 w-4" />
                  View All Shipments
                </Button>
              </Link>
              <Link to="/item-tracking">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Track a Package
                </Button>
              </Link>
              <Link to="/support">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </Link>
              <Link to="/portal/profile">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Manage Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Shipments */}
      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Shipments</CardTitle>
          <Link to="/portal/shipments">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userItems.length > 0 ? userItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">ID: {item.id}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{item.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge variant={
                      item.status === 'Delivered' ? 'default' :
                      item.status === 'In Transit' ? 'secondary' :
                      item.status === 'Processing' ? 'outline' : 'destructive'
                    }>
                      {item.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated 2h ago
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No shipments found</p>
                <p className="text-sm">Your shipments will appear here once you create them.</p>
                <Link to="/item-tracking">
                  <Button className="mt-4">
                    <Package className="mr-2 h-4 w-4" />
                    Track Your First Package
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>On-Time Delivery Rate</span>
                <span className="font-medium">94%</span>
              </div>
              <Progress value={94} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Customer Satisfaction</span>
                <span className="font-medium">98%</span>
              </div>
              <Progress value={98} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Shipment Success Rate</span>
                <span className="font-medium">99.2%</span>
              </div>
              <Progress value={99.2} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Package #SH-2024-005</p>
                <p className="text-sm text-muted-foreground">To: Zagreb, Croatia</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Tomorrow</p>
                <p className="text-xs text-muted-foreground">14:30 EST</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Package #SH-2024-006</p>
                <p className="text-sm text-muted-foreground">To: Sarajevo, BiH</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Dec 28</p>
                <p className="text-xs text-muted-foreground">10:15 EST</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Package #SH-2024-007</p>
                <p className="text-sm text-muted-foreground">To: Belgrade, Serbia</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Dec 30</p>
                <p className="text-xs text-muted-foreground">16:45 EST</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PortalDashboard;
