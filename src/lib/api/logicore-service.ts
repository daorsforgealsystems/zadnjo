// LogiCore API Service Layer

import { supabase } from '../supabaseClient';
import type {
  Warehouse,
  InventoryItem,
  InventoryLevel,
  StockMovement,
  Order,
  OrderItem,
  Shipment,
  Vehicle,
  DeliveryRoute,
  RouteStop,
  GPSTrack,
  LogisticsEvent,
  Return,
  KPIMetrics,
  ApiResponse,
  SearchFilters,
  DashboardStats,
  User
} from './logicore-types';

// ============================================
// WAREHOUSE MANAGEMENT SERVICE
// ============================================

export class WarehouseService {
  static async getWarehouses(): Promise<ApiResponse<Warehouse[]>> {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch warehouses'
      };
    }
  }

  static async getWarehouse(id: string): Promise<ApiResponse<Warehouse>> {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch warehouse'
      };
    }
  }

  static async createWarehouse(warehouse: Partial<Warehouse>): Promise<ApiResponse<Warehouse>> {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .insert(warehouse)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create warehouse'
      };
    }
  }

  static async updateWarehouse(id: string, updates: Partial<Warehouse>): Promise<ApiResponse<Warehouse>> {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update warehouse'
      };
    }
  }

  static async getWarehouseCapacity(id: string): Promise<ApiResponse<{ used: number; total: number; percentage: number }>> {
    try {
      const { data: warehouse, error: warehouseError } = await supabase
        .from('warehouses')
        .select('capacity')
        .eq('id', id)
        .single();

      if (warehouseError) throw warehouseError;

      const capacity = warehouse?.capacity as any;
      const percentage = (capacity.used_sqft / capacity.total_sqft) * 100;

      return {
        success: true,
        data: {
          used: capacity.used_sqft,
          total: capacity.total_sqft,
          percentage
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch warehouse capacity'
      };
    }
  }
}

// ============================================
// INVENTORY MANAGEMENT SERVICE
// ============================================

export class InventoryService {
  static async getInventoryItems(filters?: SearchFilters): Promise<ApiResponse<InventoryItem[]>> {
    try {
      let query = supabase.from('inventory_items').select('*');

      if (filters?.query) {
        query = query.or(`name.ilike.%${filters.query}%,sku.ilike.%${filters.query}%,barcode.ilike.%${filters.query}%`);
      }

      if (filters?.sortBy) {
        query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
      } else {
        query = query.order('name');
      }

      if (filters?.limit) {
        const offset = ((filters.page || 1) - 1) * filters.limit;
        query = query.range(offset, offset + filters.limit - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        pagination: filters?.limit ? {
          page: filters.page || 1,
          limit: filters.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / filters.limit)
        } : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch inventory items'
      };
    }
  }

  static async getInventoryLevels(warehouseId?: string): Promise<ApiResponse<InventoryLevel[]>> {
    try {
      let query = supabase
        .from('inventory_levels')
        .select(`
          *,
          item:inventory_items(*),
          warehouse:warehouses(*)
        `);

      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate available quantity
      const levelsWithAvailable = data?.map((level: any) => ({
        ...level,
        availableQuantity: level.quantity - level.reserved_quantity
      })) || [];

      return {
        success: true,
        data: levelsWithAvailable
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch inventory levels'
      };
    }
  }

  static async getLowStockItems(warehouseId?: string): Promise<ApiResponse<InventoryLevel[]>> {
    try {
      let query = supabase
        .from('inventory_levels')
        .select(`
          *,
          item:inventory_items(*),
          warehouse:warehouses(*)
        `)
        .lte('quantity', 'reorder_point');

      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch low stock items'
      };
    }
  }

  static async updateInventoryLevel(
    itemId: string,
    warehouseId: string,
    quantity: number
  ): Promise<ApiResponse<InventoryLevel>> {
    try {
      const { data, error } = await supabase
        .from('inventory_levels')
        .update({ quantity, updated_at: new Date().toISOString() })
        .eq('item_id', itemId)
        .eq('warehouse_id', warehouseId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update inventory level'
      };
    }
  }

  static async recordStockMovement(movement: Partial<StockMovement>): Promise<ApiResponse<StockMovement>> {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .insert(movement)
        .select()
        .single();

      if (error) throw error;

      // Update inventory level
      if (movement.itemId && movement.warehouseId && movement.quantity) {
        const adjustment = movement.movementType === 'inbound' ? movement.quantity : -movement.quantity;
        
        await supabase.rpc('adjust_inventory_level', {
          p_item_id: movement.itemId,
          p_warehouse_id: movement.warehouseId,
          p_adjustment: adjustment
        });
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record stock movement'
      };
    }
  }

  static async scanBarcode(barcode: string): Promise<ApiResponse<InventoryItem>> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('barcode', barcode)
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Item not found'
      };
    }
  }
}

// ============================================
// ORDER MANAGEMENT SERVICE
// ============================================

export class OrderService {
  static async getOrders(filters?: SearchFilters): Promise<ApiResponse<Order[]>> {
    try {
      let query = supabase.from('orders').select('*');

      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters?.dateRange) {
        query = query
          .gte('placed_at', filters.dateRange.start.toISOString())
          .lte('placed_at', filters.dateRange.end.toISOString());
      }

      if (filters?.sortBy) {
        query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
      } else {
        query = query.order('placed_at', { ascending: false });
      }

      if (filters?.limit) {
        const offset = ((filters.page || 1) - 1) * filters.limit;
        query = query.range(offset, offset + filters.limit - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        pagination: filters?.limit ? {
          page: filters.page || 1,
          limit: filters.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / filters.limit)
        } : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch orders'
      };
    }
  }

  static async getOrder(id: string): Promise<ApiResponse<Order>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            *,
            item:inventory_items(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch order'
      };
    }
  }

  static async createOrder(order: Partial<Order>): Promise<ApiResponse<Order>> {
    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      const { data, error } = await supabase
        .from('orders')
        .insert({
          ...order,
          order_number: orderNumber,
          status: 'pending',
          placed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Create order items
      if (order.items && order.items.length > 0) {
        const orderItems = order.items.map(item => ({
          order_id: data.id,
          ...item
        }));

        await supabase.from('order_items').insert(orderItems);
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order'
      };
    }
  }

  static async updateOrderStatus(id: string, status: Order['status']): Promise<ApiResponse<Order>> {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Add timestamp based on status
      switch (status) {
        case 'confirmed':
          updates.confirmed_at = new Date().toISOString();
          break;
        case 'shipped':
          updates.shipped_at = new Date().toISOString();
          break;
        case 'delivered':
          updates.delivered_at = new Date().toISOString();
          break;
        case 'cancelled':
          updates.cancelled_at = new Date().toISOString();
          break;
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update order status'
      };
    }
  }

  static async assignOrderToWarehouse(orderId: string, warehouseId: string): Promise<ApiResponse<boolean>> {
    try {
      // Check inventory availability
      const { data: order } = await this.getOrder(orderId);
      if (!order) throw new Error('Order not found');

      // Check each item availability in the warehouse
      for (const item of order.items) {
        const { data: level } = await supabase
          .from('inventory_levels')
          .select('quantity, reserved_quantity')
          .eq('item_id', item.itemId)
          .eq('warehouse_id', warehouseId)
          .single();

        const available = (level?.quantity || 0) - (level?.reserved_quantity || 0);
        if (available < item.quantity) {
          throw new Error(`Insufficient inventory for item ${item.item?.name}`);
        }
      }

      // Reserve inventory
      for (const item of order.items) {
        await supabase.rpc('reserve_inventory', {
          p_item_id: item.itemId,
          p_warehouse_id: warehouseId,
          p_quantity: item.quantity
        });

        // Update order item with warehouse
        await supabase
          .from('order_items')
          .update({ warehouse_id: warehouseId })
          .eq('id', item.id);
      }

      return {
        success: true,
        data: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign order to warehouse'
      };
    }
  }
}

// ============================================
// SHIPMENT SERVICE
// ============================================

export class ShipmentService {
  static async createShipment(shipment: Partial<Shipment>): Promise<ApiResponse<Shipment>> {
    try {
      // Generate tracking number
      const trackingNumber = `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

      const { data, error } = await supabase
        .from('shipments')
        .insert({
          ...shipment,
          tracking_number: trackingNumber,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create shipment'
      };
    }
  }

  static async getShipment(trackingNumber: string): Promise<ApiResponse<Shipment>> {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          order:orders(*)
        `)
        .eq('tracking_number', trackingNumber)
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch shipment'
      };
    }
  }

  static async updateShipmentStatus(id: string, status: Shipment['status']): Promise<ApiResponse<Shipment>> {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Add timestamp based on status
      switch (status) {
        case 'picked':
          updates.picked_at = new Date().toISOString();
          break;
        case 'packed':
          updates.packed_at = new Date().toISOString();
          break;
        case 'in_transit':
          updates.shipped_at = new Date().toISOString();
          break;
        case 'delivered':
          updates.delivered_at = new Date().toISOString();
          break;
      }

      const { data, error } = await supabase
        .from('shipments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update shipment status'
      };
    }
  }

  static async trackShipment(trackingNumber: string): Promise<ApiResponse<Shipment>> {
    return this.getShipment(trackingNumber);
  }
}

// ============================================
// ROUTE OPTIMIZATION SERVICE
// ============================================

export class RouteService {
  static async createRoute(route: Partial<DeliveryRoute>): Promise<ApiResponse<DeliveryRoute>> {
    try {
      // Generate route number
      const routeNumber = `RT-${new Date().toISOString().split('T')[0]}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      const { data, error } = await supabase
        .from('delivery_routes')
        .insert({
          ...route,
          route_number: routeNumber,
          status: 'planned',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create route'
      };
    }
  }

  static async optimizeRoute(routeId: string): Promise<ApiResponse<DeliveryRoute>> {
    try {
      // Get route with stops
      const { data: route, error: routeError } = await supabase
        .from('delivery_routes')
        .select(`
          *,
          stops:route_stops(*)
        `)
        .eq('id', routeId)
        .single();

      if (routeError) throw routeError;

      // Simple nearest neighbor optimization
      const optimizedStops = this.nearestNeighborOptimization(route.stops);

      // Update stop sequences
      for (let i = 0; i < optimizedStops.length; i++) {
        await supabase
          .from('route_stops')
          .update({ stop_sequence: i + 1 })
          .eq('id', optimizedStops[i].id);
      }

      // Calculate route metrics
      const metrics = this.calculateRouteMetrics(optimizedStops);

      // Update route
      const { data, error } = await supabase
        .from('delivery_routes')
        .update({
          status: 'assigned',
          total_distance_km: metrics.totalDistance,
          estimated_duration_minutes: metrics.estimatedDuration,
          optimized_at: new Date().toISOString()
        })
        .eq('id', routeId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to optimize route'
      };
    }
  }

  private static nearestNeighborOptimization(stops: RouteStop[]): RouteStop[] {
    if (stops.length <= 2) return stops;

    const optimized: RouteStop[] = [];
    const remaining = [...stops];
    
    // Start with first stop
    optimized.push(remaining.shift()!);

    while (remaining.length > 0) {
      const lastStop = optimized[optimized.length - 1];
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      // Find nearest unvisited stop
      for (let i = 0; i < remaining.length; i++) {
        const distance = this.calculateDistance(
          lastStop.location,
          remaining[i].location
        );
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      optimized.push(remaining.splice(nearestIndex, 1)[0]);
    }

    return optimized;
  }

  private static calculateDistance(
    loc1: { lat: number; lng: number },
    loc2: { lat: number; lng: number }
  ): number {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private static calculateRouteMetrics(stops: RouteStop[]): {
    totalDistance: number;
    estimatedDuration: number;
  } {
    let totalDistance = 0;
    
    for (let i = 0; i < stops.length - 1; i++) {
      totalDistance += this.calculateDistance(
        stops[i].location,
        stops[i + 1].location
      );
    }

    // Estimate duration: 40 km/h average speed + 5 minutes per stop
    const estimatedDuration = (totalDistance / 40) * 60 + (stops.length * 5);

    return {
      totalDistance,
      estimatedDuration
    };
  }

  static async getDriverRoute(driverId: string): Promise<ApiResponse<DeliveryRoute>> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('delivery_routes')
        .select(`
          *,
          vehicle:vehicles(*),
          warehouse:warehouses(*),
          stops:route_stops(
            *,
            shipment:shipments(*)
          )
        `)
        .eq('driver_id', driverId)
        .eq('route_date', today)
        .in('status', ['assigned', 'in_progress'])
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'No active route found'
      };
    }
  }
}

// ============================================
// REAL-TIME TRACKING SERVICE
// ============================================

export class TrackingService {
  static async updateVehicleLocation(
    vehicleId: string,
    location: { lat: number; lng: number },
    additionalData?: Partial<GPSTrack>
  ): Promise<ApiResponse<GPSTrack>> {
    try {
      const trackData: Partial<GPSTrack> = {
        vehicleId,
        location,
        recordedAt: new Date(),
        ...additionalData
      };

      const { data, error } = await supabase
        .from('gps_tracks')
        .insert(trackData)
        .select()
        .single();

      if (error) throw error;

      // Update vehicle's current location
      await supabase
        .from('vehicles')
        .update({
          current_location: `POINT(${location.lng} ${location.lat})`
        })
        .eq('id', vehicleId);

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update vehicle location'
      };
    }
  }

  static async getVehicleLocations(): Promise<ApiResponse<Vehicle[]>> {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .in('status', ['in_use'])
        .not('current_location', 'is', null);

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch vehicle locations'
      };
    }
  }

  static async reportEvent(event: Partial<LogisticsEvent>): Promise<ApiResponse<LogisticsEvent>> {
    try {
      const { data, error } = await supabase
        .from('logistics_events')
        .insert({
          ...event,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification if critical
      if (event.severity === 'critical') {
        await this.sendEventNotification(data);
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to report event'
      };
    }
  }

  private static async sendEventNotification(event: LogisticsEvent): Promise<void> {
    // Implementation for sending notifications
    // This could integrate with push notifications, SMS, or email
    console.log('Critical event notification:', event);
  }

  static async subscribeToShipmentUpdates(
    trackingNumber: string,
    callback: (shipment: Shipment) => void
  ) {
    const channel = supabase
      .channel(`shipment-${trackingNumber}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments',
          filter: `tracking_number=eq.${trackingNumber}`
        },
        (payload) => {
          callback(payload.new as Shipment);
        }
      )
      .subscribe();

    return channel;
  }
}

// ============================================
// RETURNS MANAGEMENT SERVICE
// ============================================

export class ReturnsService {
  static async createReturn(returnData: Partial<Return>): Promise<ApiResponse<Return>> {
    try {
      // Generate return number
      const returnNumber = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      const { data, error } = await supabase
        .from('returns')
        .insert({
          ...returnData,
          return_number: returnNumber,
          status: 'requested',
          requested_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create return'
      };
    }
  }

  static async approveReturn(id: string): Promise<ApiResponse<Return>> {
    try {
      const { data, error } = await supabase
        .from('returns')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Generate return label
      await this.generateReturnLabel(data);

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve return'
      };
    }
  }

  private static async generateReturnLabel(returnData: Return): Promise<void> {
    // Implementation for generating return shipping label
    // This would integrate with shipping carrier APIs
    console.log('Generating return label for:', returnData.returnNumber);
  }

  static async processReturn(id: string, inspectionNotes: string): Promise<ApiResponse<Return>> {
    try {
      const { data, error } = await supabase
        .from('returns')
        .update({
          status: 'processed',
          inspection_notes: inspectionNotes,
          processed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Restock items if in good condition
      for (const item of data.items) {
        if (item.condition !== 'damaged') {
          await InventoryService.recordStockMovement({
            itemId: item.itemId,
            warehouseId: data.order?.items[0].warehouseId, // Get warehouse from original order
            movementType: 'return',
            quantity: item.quantity,
            referenceType: 'return',
            referenceId: data.id
          });
        }
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process return'
      };
    }
  }
}

// ============================================
// ANALYTICS AND KPI SERVICE
// ============================================

export class AnalyticsService {
  static async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      // Get various stats in parallel
      const [
        ordersResult,
        shipmentsResult,
        inventoryResult,
        routesResult,
        returnsResult,
        kpiResult
      ] = await Promise.all([
        // Total and pending orders
        supabase
          .from('orders')
          .select('status', { count: 'exact' }),
        
        // In transit shipments
        supabase
          .from('shipments')
          .select('status', { count: 'exact' })
          .in('status', ['in_transit', 'out_for_delivery']),
        
        // Inventory value and low stock
        supabase
          .from('inventory_levels')
          .select('quantity, reorder_point, item:inventory_items(value_usd)'),
        
        // Active routes
        supabase
          .from('delivery_routes')
          .select('status', { count: 'exact' })
          .eq('status', 'in_progress')
          .eq('route_date', new Date().toISOString().split('T')[0]),
        
        // Returns in progress
        supabase
          .from('returns')
          .select('status', { count: 'exact' })
          .not('status', 'in', ['refunded', 'cancelled']),
        
        // Latest KPI metrics
        supabase
          .from('kpi_metrics')
          .select('*')
          .eq('metric_type', 'daily')
          .order('metric_date', { ascending: false })
          .limit(1)
          .single()
      ]);

      // Process results
      const totalOrders = ordersResult.count || 0;
      const pendingOrders = ordersResult.data?.filter((o: any) => o.status === 'pending').length || 0;
      const inTransitShipments = shipmentsResult.count || 0;
      const activeRoutes = routesResult.count || 0;
      const returnsInProgress = returnsResult.count || 0;

      // Calculate inventory metrics
      let totalInventoryValue = 0;
      let lowStockItems = 0;
      
      if (inventoryResult.data) {
        for (const level of inventoryResult.data as any[]) {
          totalInventoryValue += (level.quantity * (level.item?.value_usd || 0));
          if (level.quantity <= level.reorder_point) {
            lowStockItems++;
          }
        }
      }

      // Get completed today
      const { count: completedToday } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('status', 'delivered')
        .gte('delivered_at', new Date().toISOString().split('T')[0]);

      // Calculate weekly revenue
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: weeklyOrders } = await supabase
        .from('orders')
        .select('total')
        .gte('placed_at', weekAgo.toISOString())
        .in('status', ['delivered', 'shipped', 'processing']);

      const weeklyRevenue = weeklyOrders?.reduce((sum: number, order: any) => sum + order.total, 0) || 0;

      // Get on-time delivery rate from KPI
      const onTimeDeliveryRate = (kpiResult.data as any)?.on_time_delivery_rate || 0;

      return {
        success: true,
        data: {
          totalOrders,
          pendingOrders,
          inTransitShipments,
          completedToday: completedToday || 0,
          activeRoutes,
          totalInventoryValue,
          lowStockItems,
          returnsInProgress,
          weeklyRevenue,
          onTimeDeliveryRate
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats'
      };
    }
  }

  static async getKPIMetrics(
    metricType: 'daily' | 'weekly' | 'monthly',
    dateRange?: { start: Date; end: Date }
  ): Promise<ApiResponse<KPIMetrics[]>> {
    try {
      let query = supabase
        .from('kpi_metrics')
        .select('*')
        .eq('metric_type', metricType);

      if (dateRange) {
        query = query
          .gte('metric_date', dateRange.start.toISOString().split('T')[0])
          .lte('metric_date', dateRange.end.toISOString().split('T')[0]);
      }

      query = query.order('metric_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch KPI metrics'
      };
    }
  }

  static async calculateDailyKPIs(): Promise<ApiResponse<KPIMetrics>> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate various KPIs
      const kpis = await this.calculateKPIsForDate(new Date());

      // Store in database
      const { data, error } = await supabase
        .from('kpi_metrics')
        .upsert({
          metric_date: today,
          metric_type: 'daily',
          ...kpis,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate daily KPIs'
      };
    }
  }

  private static async calculateKPIsForDate(date: Date): Promise<Partial<KPIMetrics>> {
    const dateStr = date.toISOString().split('T')[0];
    
    // Implementation would calculate actual KPIs
    // This is a simplified version
    return {
      ordersProcessed: 150,
      averageFulfillmentHours: 2.5,
      averageDeliveryHours: 24,
      onTimeDeliveryRate: 98.5,
      inventoryAccuracy: 99.2,
      stockoutEvents: 2,
      inventoryTurnoverRatio: 12.5,
      totalRoutes: 25,
      averageStopsPerRoute: 18,
      averageRouteEfficiency: 92,
      fuelCostPerDelivery: 3.50,
      revenue: 45000,
      shippingRevenue: 5000,
      shippingCosts: 3500,
      grossMargin: 35
    };
  }
}

// ============================================
// WEBHOOK SERVICE
// ============================================

export class WebhookService {
  static async processShopifyWebhook(payload: any): Promise<ApiResponse<Order>> {
    try {
      // Transform Shopify order to our format
      const order: Partial<Order> = {
        sourcePlatform: 'shopify',
        externalOrderId: payload.id.toString(),
        customerEmail: payload.email,
        status: 'pending',
        orderType: 'standard',
        priority: 5,
        
        billingAddress: {
          line1: payload.billing_address.address1,
          line2: payload.billing_address.address2,
          city: payload.billing_address.city,
          state: payload.billing_address.province,
          postalCode: payload.billing_address.zip,
          country: payload.billing_address.country
        },
        
        shippingAddress: {
          line1: payload.shipping_address.address1,
          line2: payload.shipping_address.address2,
          city: payload.shipping_address.city,
          state: payload.shipping_address.province,
          postalCode: payload.shipping_address.zip,
          country: payload.shipping_address.country
        },
        
        items: payload.line_items.map((item: any) => ({
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: parseFloat(item.price),
          totalPrice: parseFloat(item.price) * item.quantity
        })),
        
        subtotal: parseFloat(payload.subtotal_price),
        shippingCost: parseFloat(payload.total_shipping_price_set?.shop_money?.amount || 0),
        tax: parseFloat(payload.total_tax),
        total: parseFloat(payload.total_price),
        currency: payload.currency
      };

      // Create order
      return await OrderService.createOrder(order);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process Shopify webhook'
      };
    }
  }
}
      