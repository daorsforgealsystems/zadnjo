import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Truck, 
  Package, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  MessageSquare
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getItems } from '@/lib/api';
import { Item } from '@/lib/types';
import { Link } from 'react-router-dom';
import AnimatedChart from '@/components/AnimatedChart';

const CustomerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: 'shipment_update',
      message: 'Shipment #12345 has been picked up',
      timestamp: '2 hours ago',
      icon: Truck
    },
    {
      id: 2,
      type: 'delivery',
      message: 'Package delivered to Zagreb, Croatia',
      timestamp: '1 day ago',
      icon: CheckCircle
    },
    {
      id: 3,
      type: 'alert',
      message: 'Route delay on shipment #12344',
      timestamp: '2 days ago',
      icon: AlertTriangle
    }
  ]);

  const { data: items = [] } = useQuery({
    queryKey: ['customerItems'],
    queryFn: getItems,
  });

  // Filter items for current user (in a real app, this would be done server-side)
  const userItems = items.filter(item => 
    user?.associatedItemIds?.includes(item.id) || items.slice(0, 3)
  );

  const activeShipments = userItems.filter(item => 
    item.status === 'In Transit' || item.status === 'Processing'
  ).length;

  const deliveredThisMonth = userItems.filter(item => 
    item.status === 'Delivered'
  ).length;

  const pendingShipments = userItems.filter(item => 
    item.status === 'Pending'
  ).length;

  // Mock data for charts
  const shipmentStatusData = [
    { label: 'In Transit', value: activeShipments, color: 'bg-blue-500' },
    { label: 'Delivered', value: deliveredThisMonth, color: 'bg-green-500' },
    { label: 'Pending', value: pendingShipments, color: 'bg-yellow-500' },
  ];

  const monthlyShipmentsData = Array.from({ length: 6 }, (_, i) => ({
    label: new Date(Date.now() - (5-i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en', { month: 'short' }),
    value: Math.floor(Math.random() * 10) + 5,
    color: 'bg-primary'
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold gradient-text">
          {t('customerDashboard.welcome', `Welcome back, ${user?.username}!`)}
        </h1>
        <p className="text-muted-foreground">
          {t('customerDashboard.description', 'Here\'s an overview of your shipments and account activity.')}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Shipments</p>
                <p className="text-2xl font-bold">{activeShipments}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Truck className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivered This Month</p>
                <p className="text-2xl font-bold">{deliveredThisMonth}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingShipments}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Shipments</p>
                <p className="text-2xl font-bold">{userItems.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts */}
        <div className="space-y-6">
          <AnimatedChart 
            title="Shipment Status Distribution" 
            data={shipmentStatusData} 
            type="donut" 
          />
          <AnimatedChart 
            title="Monthly Shipments" 
            data={monthlyShipmentsData} 
            type="bar" 
          />
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
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
            {userItems.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">ID: {item.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.location}</p>
                    <p className="text-xs text-muted-foreground">Current Location</p>
                  </div>
                  <Badge variant={
                    item.status === 'Delivered' ? 'default' :
                    item.status === 'In Transit' ? 'secondary' :
                    item.status === 'Processing' ? 'outline' : 'destructive'
                  }>
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
            {userItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No shipments found</p>
                <p className="text-sm">Your shipments will appear here once you create them.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDashboard;
