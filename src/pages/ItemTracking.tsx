import { useState } from "react";
import { Package, Search, MapPin, Clock, Truck, CheckCircle, AlertTriangle, Filter, Eye } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ItemsTable from "@/components/ItemsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import ParticleBackground from "@/components/ParticleBackground";
import { useQuery } from "@tanstack/react-query";
import { getItems } from "@/lib/api";

const ItemTracking = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: getItems,
  });

  const handleQuickTrack = () => {
    if (!trackingNumber.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }

    const item = items.find(item => 
      item.id.toLowerCase().includes(trackingNumber.toLowerCase()) ||
      item.name.toLowerCase().includes(trackingNumber.toLowerCase())
    );

    if (item) {
      setSelectedItem(item);
      setIsTrackingDialogOpen(true);
      toast.success("Package found!");
    } else {
      toast.error("Package not found. Please check the tracking number.");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in transit':
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-500';
      case 'in transit':
        return 'bg-blue-500';
      case 'processing':
        return 'bg-yellow-500';
      default:
        return 'bg-red-500';
    }
  };

  // Mock tracking history
  const getTrackingHistory = (item: { location: string; status: string; }) => [
    {
      date: "2024-12-26 14:30",
      location: item.location,
      status: item.status,
      description: `Package is currently ${item.status.toLowerCase()} at ${item.location}`
    },
    {
      date: "2024-12-26 09:15",
      location: "Distribution Center - Belgrade",
      status: "In Transit",
      description: "Package departed from distribution center"
    },
    {
      date: "2024-12-25 16:45",
      location: "Sorting Facility - Belgrade",
      status: "Processing",
      description: "Package arrived at sorting facility"
    },
    {
      date: "2024-12-25 10:00",
      location: "Origin - Sarajevo",
      status: "Picked Up",
      description: "Package picked up from sender"
    }
  ];

  const activeShipments = items.filter(item => 
    item.status === 'In Transit' || item.status === 'Processing'
  ).length;

  const deliveredToday = items.filter(item => 
    item.status === 'Delivered'
  ).length;

  const pendingPickups = items.filter(item => 
    item.status === 'Pending'
  ).length;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      <div className="relative z-20">
        <Sidebar isOpen={sidebarOpen} onAlertsClick={() => {}} />

        <main className={cn("transition-all duration-300 pt-header", sidebarOpen ? "ml-64" : "ml-16")}>
          <div className="p-6 space-y-6">
            <header className="space-y-2 animate-slide-up-fade">
              <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
                <Package className="h-8 w-8" />
                Package Tracking
              </h1>
              <p className="text-muted-foreground">
                Track your packages in real-time and view detailed shipping information.
              </p>
            </header>

            {/* Quick Track Section */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Quick Track
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter tracking number or package ID..."
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleQuickTrack()}
                      className="text-lg h-12"
                    />
                  </div>
                  <Button 
                    onClick={handleQuickTrack}
                    size="lg"
                    className="bg-gradient-primary hover:scale-105 transition-transform px-8"
                  >
                    <Search className="h-5 w-5 mr-2" />
                    Track
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Enter your tracking number to get real-time updates on your package location and status.
                </p>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Shipments</p>
                      <p className="text-2xl font-bold">{activeShipments}</p>
                      <p className="text-xs text-muted-foreground">Currently in transit</p>
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
                      <p className="text-sm font-medium text-muted-foreground">Delivered Today</p>
                      <p className="text-2xl font-bold">{deliveredToday}</p>
                      <p className="text-xs text-muted-foreground">Successfully completed</p>
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
                      <p className="text-sm font-medium text-muted-foreground">Pending Pickups</p>
                      <p className="text-2xl font-bold">{pendingPickups}</p>
                      <p className="text-xs text-muted-foreground">Awaiting collection</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-yellow-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Items Table */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>All Packages</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ItemsTable />
                )}
              </CardContent>
            </Card>

            {/* Tracking Details Dialog */}
            <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Package Details
                  </DialogTitle>
                  <DialogDescription>
                    Detailed tracking information for your package
                  </DialogDescription>
                </DialogHeader>
                {selectedItem && (
                  <div className="space-y-6">
                    {/* Package Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Package ID</p>
                        <p className="font-mono">{selectedItem.id}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Package Name</p>
                        <p>{selectedItem.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Current Status</p>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(selectedItem.status)}
                          <Badge variant="outline">{selectedItem.status}</Badge>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Current Location</p>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <p>{selectedItem.location}</p>
                        </div>
                      </div>
                    </div>

                    {/* Tracking Timeline */}
                    <div>
                      <h4 className="font-semibold mb-4">Tracking History</h4>
                      <div className="space-y-4">
                        {getTrackingHistory(selectedItem).map((event, index) => (
                          <div key={index} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full ${getStatusColor(event.status)}`} />
                              {index < getTrackingHistory(selectedItem).length - 1 && (
                                <div className="w-px h-8 bg-border mt-2" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium">{event.status}</p>
                                <p className="text-sm text-muted-foreground">{event.date}</p>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">{event.location}</p>
                              <p className="text-sm">{event.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsTrackingDialogOpen(false)} className="flex-1">
                        Close
                      </Button>
                      <Button className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        View on Map
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ItemTracking;
