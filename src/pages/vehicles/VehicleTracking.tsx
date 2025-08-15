import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Filter, RefreshCw, Truck, MapPin, AlertTriangle } from 'lucide-react';

// Components
import MapView from '@/components/MapView';
import EnhancedTable from '@/components/EnhancedTable';
import AlertsPanel from '@/components/AlertsPanel';

// Types
interface Vehicle {
  id: string;
  registrationNumber: string;
  type: string;
  status: 'available' | 'in_transit' | 'maintenance' | 'out_of_service';
  driver: {
    id: string;
    name: string;
    phone: string;
  };
  currentLocation: {
    lat: number;
    lng: number;
    lastUpdated: string;
  };
  speed: number;
  fuelLevel: number;
  destination?: string;
  eta?: string;
}

interface VehicleHistory {
  timestamp: string;
  location: {
    lat: number;
    lng: number;
  };
  speed: number;
  fuelLevel: number;
  event?: string;
}

// Mock API functions
const getVehicles = async (filters: any): Promise<Vehicle[]> => {
  // In a real app, this would call an API with the filters
  console.log('Fetching vehicles with filters:', filters);
  
  // Mock data
  return [
    {
      id: 'v1',
      registrationNumber: 'BG-123-AB',
      type: 'Truck',
      status: 'in_transit',
      driver: {
        id: 'd1',
        name: 'Milan Petrović',
        phone: '+381 60 123 4567',
      },
      currentLocation: {
        lat: 44.08,
        lng: 19.22,
        lastUpdated: '2023-06-03T14:22:00Z',
      },
      speed: 72,
      fuelLevel: 65,
      destination: 'Sarajevo, Bosnia',
      eta: '2023-06-03T18:30:00Z',
    },
    {
      id: 'v2',
      registrationNumber: 'ZG-456-CD',
      type: 'Van',
      status: 'in_transit',
      driver: {
        id: 'd2',
        name: 'Ana Kovačić',
        phone: '+385 91 234 5678',
      },
      currentLocation: {
        lat: 45.55,
        lng: 15.68,
        lastUpdated: '2023-06-03T13:45:00Z',
      },
      speed: 0,
      fuelLevel: 42,
      destination: 'Ljubljana, Slovenia',
      eta: '2023-06-03T20:15:00Z',
    },
    {
      id: 'v3',
      registrationNumber: 'SA-789-EF',
      type: 'Truck',
      status: 'available',
      driver: {
        id: 'd3',
        name: 'Emir Hadžić',
        phone: '+387 61 345 6789',
      },
      currentLocation: {
        lat: 43.85,
        lng: 18.43,
        lastUpdated: '2023-06-03T12:30:00Z',
      },
      speed: 0,
      fuelLevel: 85,
    },
    {
      id: 'v4',
      registrationNumber: 'LJ-012-GH',
      type: 'Van',
      status: 'maintenance',
      driver: {
        id: 'd4',
        name: 'Janez Novak',
        phone: '+386 40 456 7890',
      },
      currentLocation: {
        lat: 46.05,
        lng: 14.51,
        lastUpdated: '2023-06-02T16:45:00Z',
      },
      speed: 0,
      fuelLevel: 10,
    },
  ];
};

const getVehicleHistory = async (vehicleId: string): Promise<VehicleHistory[]> => {
  // In a real app, this would call an API with the vehicleId
  console.log('Fetching history for vehicle:', vehicleId);
  
  // Mock data
  return [
    {
      timestamp: '2023-06-03T14:22:00Z',
      location: { lat: 44.08, lng: 19.22 },
      speed: 72,
      fuelLevel: 65,
    },
    {
      timestamp: '2023-06-03T14:00:00Z',
      location: { lat: 44.12, lng: 19.15 },
      speed: 68,
      fuelLevel: 67,
    },
    {
      timestamp: '2023-06-03T13:30:00Z',
      location: { lat: 44.18, lng: 19.05 },
      speed: 75,
      fuelLevel: 70,
      event: 'Rest stop',
    },
    {
      timestamp: '2023-06-03T13:00:00Z',
      location: { lat: 44.25, lng: 18.95 },
      speed: 65,
      fuelLevel: 72,
    },
    {
      timestamp: '2023-06-03T12:30:00Z',
      location: { lat: 44.32, lng: 18.85 },
      speed: 70,
      fuelLevel: 75,
    },
  ];
};

// Vehicle status badge component
const StatusBadge: React.FC<{ status: Vehicle['status'] }> = ({ status }) => {
  const statusConfig = {
    'available': { color: 'bg-green-100 text-green-800', label: 'Available' },
    'in_transit': { color: 'bg-blue-100 text-blue-800', label: 'In Transit' },
    'maintenance': { color: 'bg-yellow-100 text-yellow-800', label: 'Maintenance' },
    'out_of_service': { color: 'bg-red-100 text-red-800', label: 'Out of Service' },
  };

  const config = statusConfig[status];

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

// Main component
const VehicleTracking: React.FC = () => {
  // State
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    driver: '',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Queries
  const { data: vehicles = [], isLoading: isLoadingVehicles, refetch: refetchVehicles } = useQuery({
    queryKey: ['vehicles', filters],
    queryFn: () => getVehicles(filters),
  });

  const { data: vehicleHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['vehicleHistory', selectedVehicleId],
    queryFn: () => getVehicleHistory(selectedVehicleId!),
    enabled: !!selectedVehicleId,
  });

  // Get the selected vehicle
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  // Auto-refresh vehicles every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchVehicles();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchVehicles]);

  // Table columns
  const vehicleColumns = [
    { 
      header: 'Vehicle', 
      accessorKey: 'registrationNumber',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <Truck className="h-4 w-4 mr-2" />
          <span>{row.original.registrationNumber}</span>
        </div>
      )
    },
    { 
      header: 'Type', 
      accessorKey: 'type' 
    },
    { 
      header: 'Status', 
      accessorKey: 'status',
      cell: ({ row }: any) => <StatusBadge status={row.original.status} />
    },
    { 
      header: 'Driver', 
      accessorKey: 'driver',
      cell: ({ row }: any) => row.original.driver?.name || 'N/A'
    },
    { 
      header: 'Speed', 
      accessorKey: 'speed',
      cell: ({ row }: any) => `${row.original.speed} km/h`
    },
    { 
      header: 'Fuel', 
      accessorKey: 'fuelLevel',
      cell: ({ row }: any) => (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${
              row.original.fuelLevel > 60 ? 'bg-green-600' : 
              row.original.fuelLevel > 30 ? 'bg-yellow-400' : 'bg-red-600'
            }`}
            style={{ width: `${row.original.fuelLevel}%` }}
          ></div>
        </div>
      )
    },
  ];

  // Animation variants
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

  return (
    <div className="p-6">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6"
      >
        <motion.div variants={itemVariants} className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Vehicle Tracking</h1>
            <p className="text-muted-foreground">Monitor your fleet in real-time with GPS tracking</p>
          </div>
          <div className="flex space-x-2">
            <button 
              className="btn btn-outline flex items-center gap-2"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <button 
              className="btn btn-outline flex items-center gap-2"
              onClick={() => refetchVehicles()}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        {isFilterOpen && (
          <motion.div 
            variants={itemVariants}
            className="bg-card p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="in_transit">In Transit</option>
                <option value="maintenance">Maintenance</option>
                <option value="out_of_service">Out of Service</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vehicle Type</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="all">All Types</option>
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Driver</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-md"
                value={filters.driver}
                onChange={(e) => setFilters({ ...filters, driver: e.target.value })}
                placeholder="Search by driver name"
              />
            </div>
          </motion.div>
        )}

        {/* Main content */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Live GPS Tracking</h2>
            <div className="h-[500px] relative">
              <MapView 
                vehicles={vehicles.map(v => ({
                  id: v.id,
                  position: v.currentLocation,
                  status: v.status,
                  info: {
                    registration: v.registrationNumber,
                    driver: v.driver?.name,
                    speed: v.speed,
                    destination: v.destination,
                  }
                }))}
                selectedVehicleId={selectedVehicleId}
                onSelectVehicle={setSelectedVehicleId}
                vehicleHistory={selectedVehicleId ? vehicleHistory.map(h => ({
                  position: h.location,
                  timestamp: h.timestamp
                })) : []}
              />
              
              {/* Loading overlay */}
              {isLoadingVehicles && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded">
                  <div className="bg-white p-4 rounded-lg shadow flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span>Loading vehicles...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle list and details */}
          <div className="space-y-6">
            {/* Vehicle list */}
            <div className="bg-card p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Vehicles</h2>
              <EnhancedTable 
                data={vehicles}
                columns={vehicleColumns}
                pagination={{ pageSize: 5 }}
                onRowClick={(row) => setSelectedVehicleId(row.id)}
                isRowSelected={(row) => row.id === selectedVehicleId}
                isLoading={isLoadingVehicles}
              />
            </div>

            {/* Vehicle details or alerts */}
            {selectedVehicle ? (
              <div className="bg-card p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Vehicle Details</h2>
                
                {isLoadingHistory ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">{selectedVehicle.registrationNumber}</h3>
                      <StatusBadge status={selectedVehicle.status} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Driver</p>
                        <p className="font-medium">{selectedVehicle.driver?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{selectedVehicle.driver?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Speed</p>
                        <p className="font-medium">{selectedVehicle.speed} km/h</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Fuel Level</p>
                        <p className="font-medium">{selectedVehicle.fuelLevel}%</p>
                      </div>
                    </div>
                    
                    {selectedVehicle.destination && (
                      <div>
                        <p className="text-sm text-muted-foreground">Destination</p>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <p className="font-medium">{selectedVehicle.destination}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedVehicle.eta && (
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated Arrival</p>
                        <p className="font-medium">
                          {new Date(selectedVehicle.eta).toLocaleString()}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="font-medium">
                        {new Date(selectedVehicle.currentLocation.lastUpdated).toLocaleString()}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Recent Activity</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {vehicleHistory.map((history, index) => (
                          <div 
                            key={index}
                            className="text-sm p-2 rounded bg-muted/50"
                          >
                            <div className="flex justify-between">
                              <span>{new Date(history.timestamp).toLocaleTimeString()}</span>
                              <span>{history.speed} km/h</span>
                            </div>
                            {history.event && (
                              <div className="mt-1 text-primary font-medium">
                                {history.event}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-card p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Alerts</h2>
                <AlertsPanel 
                  alerts={[
                    {
                      id: 'a1',
                      title: 'Unscheduled Stop',
                      description: 'Vehicle ZG-456-CD stopped for 15 minutes outside scheduled rest area',
                      timestamp: '2023-06-03T13:45:00Z',
                      severity: 'warning',
                      vehicleId: 'v2'
                    },
                    {
                      id: 'a2',
                      title: 'Low Fuel',
                      description: 'Vehicle LJ-012-GH fuel level below 15%',
                      timestamp: '2023-06-02T16:30:00Z',
                      severity: 'error',
                      vehicleId: 'v4'
                    }
                  ]}
                  onAlertClick={(alert) => setSelectedVehicleId(alert.vehicleId)}
                />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VehicleTracking;