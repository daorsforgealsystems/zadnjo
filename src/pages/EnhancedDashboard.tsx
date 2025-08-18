import { useState, useEffect } from "react";
import { 
  Package, 
  Truck, 
  MapPin, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Activity,
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{ backgroundImage: 'url(/Whisk_cauajde4m2myzdrmlwfkyzutnduzyi1hngqzltk.mp4)', backgroundColor: '#f8fafc' }}
    >
      {/* Optionally, you can use a video background for .mp4, but for now use as image for performance */}
      <Sidebar isOpen={sidebarOpen} onAlertsClick={handleAlertsClick} />
      <main className={cn("transition-all duration-300 pt-6", sidebarOpen ? "ml-64" : "ml-16")}> 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-2">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
