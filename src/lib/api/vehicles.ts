import { supabase } from '../supabaseClient';

// Types
export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  status: 'available' | 'in_transit' | 'maintenance' | 'out_of_service';
  currentLocation?: GeoLocation;
  currentDriverId?: string;
  currentDriver?: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  fuelLevel: number;
  lastMaintenance: Date;
  nextMaintenanceDue: Date;
  assignedRouteId?: string;
  assignedRoute?: {
    id: string;
    from: string;
    to: string;
    eta: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: Date;
}

export interface VehicleHistory {
  id: string;
  vehicleId: string;
  location: GeoLocation;
  speed: number;
  fuelLevel: number;
  event?: string;
  timestamp: Date;
}

export interface VehicleFilters {
  status?: string;
  type?: string;
  driver?: string;
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Fetch vehicles with optional filtering
 */
export const getVehicles = async (filters?: VehicleFilters): Promise<Vehicle[]> => {
  let query = supabase.from('vehicles').select(`
    *,
    currentDriver:drivers(id, name, phone, email),
    assignedRoute:routes(id, from, to, eta)
  `);

  // Apply filters if provided
  if (filters) {
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    if (filters.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }
    
    if (filters.driver && filters.driver.trim() !== '') {
      query = query.eq('currentDriverId', filters.driver);
    }
    
    if (filters.search && filters.search.trim() !== '') {
      query = query.or(`
        registrationNumber.ilike.%${filters.search}%,
        make.ilike.%${filters.search}%,
        model.ilike.%${filters.search}%
      `);
    }
    
    if (filters.dateRange) {
      query = query.gte('updatedAt', filters.dateRange.start.toISOString())
                   .lte('updatedAt', filters.dateRange.end.toISOString());
    }
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }
  
  return data || [];
};

/**
 * Fetch a single vehicle by ID
 */
export const getVehicle = async (id: string): Promise<Vehicle> => {
  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      currentDriver:drivers(id, name, phone, email),
      assignedRoute:routes(id, from, to, eta)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching vehicle ${id}:`, error);
    throw error;
  }
  
  return data;
};

/**
 * Fetch vehicle location history
 */
export const getVehicleHistory = async (
  vehicleId: string, 
  limit: number = 100
): Promise<VehicleHistory[]> => {
  const { data, error } = await supabase
    .from('vehicle_history')
    .select('*')
    .eq('vehicleId', vehicleId)
    .order('timestamp', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error(`Error fetching history for vehicle ${vehicleId}:`, error);
    throw error;
  }
  
  return data || [];
};

/**
 * Update vehicle location
 */
export const updateVehicleLocation = async (
  vehicleId: string,
  location: GeoLocation,
  speed: number,
  fuelLevel: number
): Promise<void> => {
  // First update the vehicle's current location
  const { error: vehicleError } = await supabase
    .from('vehicles')
    .update({
      currentLocation: location,
      fuelLevel,
      updatedAt: new Date().toISOString()
    })
    .eq('id', vehicleId);
  
  if (vehicleError) {
    console.error(`Error updating vehicle ${vehicleId} location:`, vehicleError);
    throw vehicleError;
  }
  
  // Then add an entry to the history table
  const { error: historyError } = await supabase
    .from('vehicle_history')
    .insert({
      vehicleId,
      location,
      speed,
      fuelLevel,
      timestamp: new Date().toISOString()
    });
  
  if (historyError) {
    console.error(`Error adding history for vehicle ${vehicleId}:`, historyError);
    throw historyError;
  }
};

/**
 * Assign a driver to a vehicle
 */
export const assignDriverToVehicle = async (
  vehicleId: string,
  driverId: string
): Promise<void> => {
  const { error } = await supabase
    .from('vehicles')
    .update({
      currentDriverId: driverId,
      updatedAt: new Date().toISOString()
    })
    .eq('id', vehicleId);
  
  if (error) {
    console.error(`Error assigning driver ${driverId} to vehicle ${vehicleId}:`, error);
    throw error;
  }
};

/**
 * Update vehicle status
 */
export const updateVehicleStatus = async (
  vehicleId: string,
  status: Vehicle['status'],
  notes?: string
): Promise<void> => {
  const { error } = await supabase
    .from('vehicles')
    .update({
      status,
      updatedAt: new Date().toISOString()
    })
    .eq('id', vehicleId);
  
  if (error) {
    console.error(`Error updating status for vehicle ${vehicleId}:`, error);
    throw error;
  }
  
  // Add a status change event to the history
  if (notes) {
    const { error: historyError } = await supabase
      .from('vehicle_history')
      .insert({
        vehicleId,
        event: `Status changed to ${status}: ${notes}`,
        timestamp: new Date().toISOString()
      });
    
    if (historyError) {
      console.error(`Error adding status change history for vehicle ${vehicleId}:`, historyError);
      throw historyError;
    }
  }
};

/**
 * Schedule maintenance for a vehicle
 */
export const scheduleVehicleMaintenance = async (
  vehicleId: string,
  maintenanceDate: Date,
  description: string
): Promise<void> => {
  // Update the vehicle's maintenance info
  const { error: vehicleError } = await supabase
    .from('vehicles')
    .update({
      nextMaintenanceDue: maintenanceDate.toISOString(),
      updatedAt: new Date().toISOString()
    })
    .eq('id', vehicleId);
  
  if (vehicleError) {
    console.error(`Error scheduling maintenance for vehicle ${vehicleId}:`, vehicleError);
    throw vehicleError;
  }
  
  // Add a maintenance entry
  const { error: maintenanceError } = await supabase
    .from('maintenance')
    .insert({
      vehicleId,
      scheduledDate: maintenanceDate.toISOString(),
      description,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    });
  
  if (maintenanceError) {
    console.error(`Error creating maintenance record for vehicle ${vehicleId}:`, maintenanceError);
    throw maintenanceError;
  }
};

/**
 * Get vehicles with maintenance due soon
 */
export const getVehiclesWithMaintenanceDue = async (
  daysThreshold: number = 7
): Promise<Vehicle[]> => {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
  
  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      currentDriver:drivers(id, name, phone, email)
    `)
    .lte('nextMaintenanceDue', thresholdDate.toISOString());
  
  if (error) {
    console.error('Error fetching vehicles with maintenance due:', error);
    throw error;
  }
  
  return data || [];
};

/**
 * Get all drivers available for assignment
 */
export const getAvailableDrivers = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('status', 'available');
  
  if (error) {
    console.error('Error fetching available drivers:', error);
    throw error;
  }
  
  return data || [];
};

/**
 * Create a new vehicle
 */
export const createVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> => {
  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      ...vehicleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating vehicle:', error);
    throw error;
  }
  
  return data;
};

/**
 * Delete a vehicle
 */
export const deleteVehicle = async (vehicleId: string): Promise<void> => {
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', vehicleId);
  
  if (error) {
    console.error(`Error deleting vehicle ${vehicleId}:`, error);
    throw error;
  }
};

/**
 * Get vehicle statistics
 */
export const getVehicleStatistics = async (): Promise<any> => {
  // This would typically be a more complex query or a stored procedure
  // For now, we'll just return mock data
  
  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select('status')
    .order('status');
  
  if (error) {
    console.error('Error fetching vehicle statistics:', error);
    throw error;
  }
  
  // Count vehicles by status
  const statusCounts = vehicles.reduce((acc: Record<string, number>, vehicle) => {
    acc[vehicle.status] = (acc[vehicle.status] || 0) + 1;
    return acc;
  }, {});
  
  return {
    totalVehicles: vehicles.length,
    byStatus: statusCounts,
    fuelEfficiency: {
      average: 8.2, // L/100km
      best: 6.5,
      worst: 12.3
    },
    maintenanceStats: {
      completed: 145,
      scheduled: 12,
      overdue: 3
    },
    utilizationRate: 78 // percentage
  };
};

export default {
  getVehicles,
  getVehicle,
  getVehicleHistory,
  updateVehicleLocation,
  assignDriverToVehicle,
  updateVehicleStatus,
  scheduleVehicleMaintenance,
  getVehiclesWithMaintenanceDue,
  getAvailableDrivers,
  createVehicle,
  deleteVehicle,
  getVehicleStatistics
};