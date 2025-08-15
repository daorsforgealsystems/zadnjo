// LogiCore Platform Type Definitions

// ============================================
// WAREHOUSE MANAGEMENT TYPES
// ============================================

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  capacity: {
    total_sqft: number;
    used_sqft: number;
    zones: WarehouseZone[];
  };
  operatingHours: Record<string, { open: string; close: string }>;
  contactInfo: {
    phone?: string;
    email?: string;
    manager?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WarehouseZone {
  id: string;
  name: string;
  type: 'receiving' | 'storage' | 'picking' | 'packing' | 'shipping';
  capacity: number;
  currentUsage: number;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  barcode?: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  weightKg: number;
  valueUsd?: number;
  hazmatClass?: string;
  temperatureRequirements?: {
    min?: number;
    max?: number;
    unit: 'C' | 'F';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryLevel {
  id: string;
  itemId: string;
  item?: InventoryItem;
  warehouseId: string;
  warehouse?: Warehouse;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  locationCode?: string; // A01-R02-S03-B04
  lastCountedAt?: Date;
}

export interface StockMovement {
  id: string;
  itemId: string;
  item?: InventoryItem;
  warehouseId: string;
  warehouse?: Warehouse;
  movementType: 'inbound' | 'outbound' | 'transfer' | 'adjustment' | 'return';
  quantity: number;
  referenceType?: 'order' | 'transfer' | 'adjustment' | 'return';
  referenceId?: string;
  fromLocation?: string;
  toLocation?: string;
  notes?: string;
  performedBy?: string;
  createdAt: Date;
}

// ============================================
// ORDER MANAGEMENT TYPES
// ============================================

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  sourcePlatform?: 'shopify' | 'magento' | 'woocommerce' | 'manual';
  externalOrderId?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderType: 'standard' | 'express' | 'same-day';
  priority: number; // 1-10

  // Customer info
  customerEmail?: string;
  customerPhone?: string;

  // Addresses
  billingAddress: Address;
  shippingAddress: Address;

  // Order details
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  currency: string;

  // Delivery
  deliveryWindow?: {
    start: Date;
    end: Date;
  };
  deliveryInstructions?: string;

  // Timestamps
  placedAt: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  itemId: string;
  item?: InventoryItem;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  warehouseId?: string;
  pickedQuantity: number;
  pickedAt?: Date;
  pickedBy?: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  orderId?: string;
  order?: Order;
  carrier: 'ups' | 'fedex' | 'dhl' | 'usps' | 'internal';
  serviceType: 'ground' | 'air' | 'express' | 'same-day';
  status: 'pending' | 'picked' | 'packed' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed';

  // Package details
  packages: Package[];
  totalWeightKg: number;

  // Tracking
  currentLocation?: {
    lat: number;
    lng: number;
  };
  lastScanLocation?: string;
  lastScanAt?: Date;
  estimatedDelivery?: Date;

  // Costs
  shippingCost?: number;
  insuranceCost?: number;

  // Timestamps
  pickedAt?: Date;
  packedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;

  // Proof of delivery
  podSignature?: string;
  podPhotoUrl?: string;
}

export interface Package {
  id: string;
  trackingNumber?: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  weightKg: number;
  contents?: string;
}

// ============================================
// ROUTE OPTIMIZATION TYPES
// ============================================

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  type: 'van' | 'truck' | 'bike' | 'car';
  make?: string;
  model?: string;
  year?: number;
  licensePlate: string;
  vin?: string;

  // Capacity
  maxWeightKg: number;
  maxVolumeM3: number;
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';

  // Status
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  currentLocation?: {
    lat: number;
    lng: number;
  };
  currentDriverId?: string;

  // Maintenance
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  odometerReading?: number;
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
  role: 'ADMIN' | 'MANAGER' | 'DRIVER' | 'CLIENT' | 'WAREHOUSE_STAFF' | 'GUEST';
  phone?: string;
  avatar?: string;
  createdAt: Date;
}

export interface DeliveryRoute {
  id: string;
  routeNumber: string;
  driverId?: string;
  driver?: User;
  vehicleId?: string;
  vehicle?: Vehicle;
  warehouseId?: string;
  warehouse?: Warehouse;

  // Route details
  status: 'planned' | 'optimizing' | 'assigned' | 'in_progress' | 'completed';
  routeDate: Date;

  // Optimization
  optimizationParams: {
    algorithm: 'nearest_neighbor' | 'genetic' | 'simulated_annealing';
    constraints: {
      maxDistanceKm?: number;
      maxDurationHours?: number;
      maxStops?: number;
    };
  };

  // Metrics
  totalDistanceKm?: number;
  estimatedDurationMinutes?: number;
  actualDurationMinutes?: number;
  fuelCostEstimate?: number;

  // Stops
  stops: RouteStop[];
  optimizedPath?: Array<{ lat: number; lng: number }>;

  // Timestamps
  plannedStart?: Date;
  actualStart?: Date;
  plannedEnd?: Date;
  actualEnd?: Date;
  optimizedAt?: Date;
}

export interface RouteStop {
  id: string;
  routeId: string;
  shipmentId?: string;
  shipment?: Shipment;
  stopSequence: number;

  // Location
  address: string;
  location: {
    lat: number;
    lng: number;
  };

  // Timing
  plannedArrival?: Date;
  arrivalWindow?: {
    start: Date;
    end: Date;
  };
  actualArrival?: Date;
  actualDeparture?: Date;

  // Status
  status: 'pending' | 'skipped' | 'completed' | 'failed';
  failureReason?: string;

  // Proof of delivery
  signatureRequired: boolean;
  photoRequired: boolean;
  notes?: string;
}

// ============================================
// REAL-TIME TRACKING TYPES
// ============================================

export interface GPSTrack {
  id: string;
  vehicleId?: string;
  driverId?: string;
  routeId?: string;

  // Location data
  location: {
    lat: number;
    lng: number;
  };
  altitudeM?: number;
  speedKmh?: number;
  headingDegrees?: number;
  accuracyM?: number;

  // Device info
  deviceId?: string;
  batteryLevel?: number;

  recordedAt: Date;
}

export interface LogisticsEvent {
  id: string;
  eventType: 'delay' | 'accident' | 'breakdown' | 'traffic' | 'weather' | 'delivery_failed';
  severity: 'info' | 'warning' | 'critical';

  // Related entities
  routeId?: string;
  vehicleId?: string;
  shipmentId?: string;

  // Event details
  title: string;
  description?: string;
  location?: {
    lat: number;
    lng: number;
  };
  impactMinutes?: number; // Estimated delay

  // Resolution
  resolved: boolean;
  resolvedAt?: Date;
  resolutionNotes?: string;

  createdAt: Date;
  createdBy?: string;
}

// ============================================
// RETURNS MANAGEMENT TYPES
// ============================================

export interface Return {
  id: string;
  returnNumber: string;
  orderId?: string;
  order?: Order;
  customerId?: string;

  // Return details
  status: 'requested' | 'approved' | 'label_sent' | 'in_transit' | 'received' | 'processed' | 'refunded';
  reason: string;
  reasonDetails?: string;

  // Items
  items: ReturnItem[];

  // Processing
  inspectionNotes?: string;
  restockingFee?: number;
  refundAmount?: number;

  // Shipping
  returnLabelUrl?: string;
  returnTrackingNumber?: string;
  carrier?: string;

  // Timestamps
  requestedAt: Date;
  approvedAt?: Date;
  receivedAt?: Date;
  processedAt?: Date;
  refundedAt?: Date;
}

export interface ReturnItem {
  itemId: string;
  item?: InventoryItem;
  quantity: number;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'damaged';
  reason?: string;
}

// ============================================
// KPI AND ANALYTICS TYPES
// ============================================

export interface KPIMetrics {
  id: string;
  metricDate: Date;
  metricType: 'daily' | 'weekly' | 'monthly';

  // Operational Efficiency
  ordersProcessed: number;
  averageFulfillmentHours: number;
  averageDeliveryHours: number;
  onTimeDeliveryRate: number;

  // Inventory Metrics
  inventoryAccuracy: number;
  stockoutEvents: number;
  inventoryTurnoverRatio: number;

  // Route Optimization
  totalRoutes: number;
  averageStopsPerRoute: number;
  averageRouteEfficiency: number; // actual vs optimal distance %
  fuelCostPerDelivery: number;

  // Financial
  revenue: number;
  shippingRevenue: number;
  shippingCosts: number;
  grossMargin: number;

  createdAt: Date;
}

// ============================================
// WEBHOOK AND INTEGRATION TYPES
// ============================================

export interface WebhookConfig {
  id: string;
  platform: 'shopify' | 'magento' | 'woocommerce';
  eventType: 'order_created' | 'order_updated' | 'order_cancelled';
  endpointUrl: string;
  secretKey?: string;
  isActive: boolean;
  lastTriggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookLog {
  id: string;
  webhookConfigId: string;
  eventType: string;
  payload: Record<string, unknown>;
  responseStatus?: number;
  responseBody?: string;
  processingTimeMs?: number;
  createdAt: Date;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BatchOperation {
  operation: 'create' | 'update' | 'delete';
  resource: string;
  data: Record<string, unknown>;
}

export interface BatchOperationResult {
  success: boolean;
  operations: Array<{
    index: number;
    success: boolean;
    error?: string;
    data?: Record<string, unknown>;
  }>;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: string;
  type: 'order' | 'shipment' | 'inventory' | 'alert' | 'system';
  title: string;
  message: string;
  userId?: string;
  relatedId?: string; // Order ID, Shipment ID, etc.
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
}

// ============================================
// SEARCH AND FILTER TYPES
// ============================================

export interface SearchFilters {
  query?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: string[];
  warehouses?: string[];
  carriers?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  inTransitShipments: number;
  completedToday: number;
  activeRoutes: number;
  totalInventoryValue: number;
  lowStockItems: number;
  returnsInProgress: number;
  weeklyRevenue: number;
  onTimeDeliveryRate: number;
}