import { useState, useEffect } from "react";
import { 
  Truck, 
  DollarSign, 
  Clock, 
  Shield,
  MapPin,
  Globe
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MetricCard from "@/components/MetricCard";
import AnimatedChart from "@/components/AnimatedChart";
import MediaBackground from "@/components/MediaBackground";
import AlertsPanel from "@/components/AlertsPanel";
import EnhancedFeatures from "@/components/EnhancedFeatures";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { ROLES, Anomaly, LiveRoute, Notification } from "@/lib/types";
import { getMetricData, getShipmentData, getRevenueData, getRouteData, getAnomalies, getLiveRoutes } from "@/lib/api";
import { MetricData, ChartData } from "@/lib/types";
import Chatbot from "@/components/Chatbot";
import { detectAnomalies } from "@/lib/anomaly-detector";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const Index = () => {
  const { user, hasRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAlertsPanelOpen, setIsAlertsPanelOpen] = useState(false);
  const [liveRoutes, setLiveRoutes] = useState<LiveRoute[]>([]);
  const queryClient = useQueryClient();

  const { data: anomalies = [], refetch: refetchAnomalies } = useQuery<Anomaly[]>({
    queryKey: ['anomalies'],
    queryFn: () => getAnomalies(),
  });

  const { data: metricData } = useQuery({ queryKey: ['metricData'], queryFn: getMetricData });
  const { data: shipmentData } = useQuery({ queryKey: ['shipmentData'], queryFn: getShipmentData });
  const { data: revenueData } = useQuery({ queryKey: ['revenueData'], queryFn: getRevenueData });
  const { data: routeData } = useQuery({ queryKey: ['routeData'], queryFn: getRouteData });

  useEffect(() => {
    const fetchLiveRoutes = async () => {
      const routes = await getLiveRoutes();
      setLiveRoutes(routes);
    };
    fetchLiveRoutes();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      let newAnomaliesFound = false;
      const updatedRoutes = liveRoutes.map(route => {
        const newAnomaly = detectAnomalies(route);
        if (newAnomaly && !route.anomalies.some(a => a.type === newAnomaly.type)) {
            newAnomaliesFound = true;

            // Add a new notification
            const newNotification: Notification = {
                id: `notif-${new Date().getTime()}`,
                type: "anomaly",
                message: `Anomaly Detected: ${newAnomaly.description} *Email & SMS alerts sent.*`,
                timestamp: new Date().toISOString(),
                read: false,
                relatedId: newAnomaly.vehicleId,
            };

            queryClient.setQueryData(['notifications'], (oldData: Notification[] = []) => [newNotification, ...oldData]);

            return { ...route, anomalies: [...route.anomalies, newAnomaly] };
        }
        return route;
      });

      if (newAnomaliesFound) {
        setLiveRoutes(updatedRoutes);
        queryClient.setQueryData(['anomalies'], (oldData: Anomaly[] = []) => {
            const allNewAnomalies = updatedRoutes.flatMap(r => r.anomalies);
            return allNewAnomalies;
        });
      }
    }, 10000); // Check for anomalies every 10 seconds

    return () => clearInterval(interval);
  }, [liveRoutes, queryClient]);

  const handleClearAlerts = () => {
    queryClient.setQueryData(['anomalies'], []);
  };

  const handleRemoveAlert = (id: string) => {
    queryClient.setQueryData(['anomalies'], (oldData: Anomaly[] = []) => {
      return oldData.filter(a => a.id !== id);
    });
  };

  const generateHistoricalData = (baseValue: number, days = 30) => {
    return Array.from({ length: days }, (_, i) => ({
      label: `Dan ${i + 1}`,
      value: baseValue + (Math.random() - 0.5) * baseValue * 0.2 + i * Math.random() * 2,
      color: 'bg-primary'
    }));
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MediaBackground mediaSrc="/src/assets/hero-logistics.jpg" type="image" />
      <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/80 to-background/90 z-10" />
      
      <div className="relative z-20">
        
        <Sidebar 
          isOpen={sidebarOpen}
          onAlertsClick={() => setIsAlertsPanelOpen(true)}
          alertsCount={anomalies?.length || 0}
        />
        
        <AlertsPanel
          isOpen={isAlertsPanelOpen}
          onOpenChange={setIsAlertsPanelOpen}
          alerts={anomalies}
          onClearAlerts={handleClearAlerts}
          onRemoveAlert={handleRemoveAlert}
        />

        <main className={cn("transition-all duration-300 pt-header", sidebarOpen ? "ml-64" : "ml-16")}>
           <div className="p-6 space-y-6">
            <div className="space-y-2 animate-slide-up-fade">
              <h1 className="text-3xl font-bold gradient-text">{`Welcome, ${user?.username}`}</h1>
              <p className="text-muted-foreground">Here is your logistics overview.</p>
            </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Dialog>
                    <DialogTrigger asChild>
                      <div>
                        <MetricCard title='Active Shipments' value={metricData?.activeShipments.value || 0} change={metricData?.activeShipments.change} changeType="positive" icon={Truck} delay={100} />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="glass">
                      <DialogHeader>
                        <DialogTitle>Historical Data For: Active Shipments</DialogTitle>
                      </DialogHeader>
                      <AnimatedChart title='Last 30 Days' data={generateHistoricalData(478)} type="line" />
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <div>
                        <MetricCard title='Total Revenue' value={metricData?.totalRevenue.value || 0} change={metricData?.totalRevenue.change} changeType="positive" icon={DollarSign} delay={200} currency="€" />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="glass">
                      <DialogHeader>
                        <DialogTitle>Historical Data For: Total Revenue</DialogTitle>
                      </DialogHeader>
                      <AnimatedChart title='Last 30 Days' data={generateHistoricalData(125840)} type="line" />
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <div>
                        <MetricCard title='On-Time Delivery' value={metricData?.onTimeDelivery.value || 0} change={metricData?.onTimeDelivery.change} changeType="positive" icon={Clock} delay={300} currency="%" />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="glass">
                      <DialogHeader>
                        <DialogTitle>Historical Data For: On-Time Delivery</DialogTitle>
                      </DialogHeader>
                      <AnimatedChart title='Last 30 Days' data={generateHistoricalData(94.8)} type="line" />
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <div>
                        <MetricCard title='Border Crossings' value={metricData?.borderCrossings.value || 0} change={metricData?.borderCrossings.change} changeType="neutral" icon={Shield} delay={400} />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="glass">
                      <DialogHeader>
                        <DialogTitle>Historical Data For: Border Crossings</DialogTitle>
                      </DialogHeader>
                      <AnimatedChart title='Last 30 Days' data={generateHistoricalData(1247)} type="line" />
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  <AnimatedChart title='Shipment Status Distribution' data={shipmentData || []} type="donut" delay={500} />
                  <AnimatedChart title='Monthly Revenue Trend' data={revenueData || []} type="line" delay={600} />
                  <AnimatedChart title='Popular Trade Routes' data={routeData || []} type="bar" delay={700} />
                </div>
                </div>
        </main>
        <Chatbot />
      </div>
    </div>
  );
};

export default Index;
