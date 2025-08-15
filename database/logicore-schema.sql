-- LogiCore Logistics Platform Database Schema
-- This schema extends the existing database with logistics-specific tables

-- ============================================
-- CORE LOGISTICS TABLES
-- ============================================

-- Warehouses table for multi-warehouse management
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    capacity JSONB NOT NULL DEFAULT '{"total_sqft": 0, "used_sqft": 0, "zones": []}'::jsonb,
    operating_hours JSONB DEFAULT '{"monday": {"open": "08:00", "close": "18:00"}}'::jsonb,
    contact_info JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory Items with enhanced tracking
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    barcode VARCHAR(100),
    dimensions JSONB NOT NULL DEFAULT '{"length": 0, "width": 0, "height": 0, "unit": "cm"}'::jsonb,
    weight_kg DECIMAL(10,3),
    value_usd DECIMAL(10,2),
    hazmat_class VARCHAR(20),
    temperature_requirements JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory levels per warehouse
CREATE TABLE IF NOT EXISTS inventory_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    reorder_point INTEGER,
    reorder_quantity INTEGER,
    location_code VARCHAR(50), -- Aisle-Rack-Shelf-Bin format: A01-R02-S03-B04
    last_counted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(item_id, warehouse_id)
);

-- Stock movements for audit trail
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES inventory_items(id),
    warehouse_id UUID REFERENCES warehouses(id),
    movement_type VARCHAR(50) NOT NULL, -- inbound, outbound, transfer, adjustment, return
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(50), -- order, transfer, adjustment, return
    reference_id UUID,
    from_location VARCHAR(50),
    to_location VARCHAR(50),
    notes TEXT,
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ORDER MANAGEMENT TABLES
-- ============================================

-- Enhanced orders table for e-commerce integration
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES users(id),
    source_platform VARCHAR(50), -- shopify, magento, woocommerce, manual
    external_order_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled
    order_type VARCHAR(30) DEFAULT 'standard', -- standard, express, same-day
    priority INTEGER DEFAULT 5, -- 1-10, 1 being highest
    
    -- Customer information
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    
    -- Addresses
    billing_address JSONB NOT NULL,
    shipping_address JSONB NOT NULL,
    
    -- Order details
    items JSONB NOT NULL, -- Array of {sku, quantity, price, warehouse_id}
    subtotal DECIMAL(10,2),
    shipping_cost DECIMAL(10,2),
    tax DECIMAL(10,2),
    total DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Delivery window
    delivery_window TSTZRANGE,
    delivery_instructions TEXT,
    
    -- Timestamps
    placed_at TIMESTAMPTZ DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order items for detailed tracking
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES inventory_items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    warehouse_id UUID REFERENCES warehouses(id),
    picked_quantity INTEGER DEFAULT 0,
    picked_at TIMESTAMPTZ,
    picked_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Shipments table
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_number VARCHAR(100) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    carrier VARCHAR(50), -- ups, fedex, dhl, usps, internal
    service_type VARCHAR(50), -- ground, air, express, same-day
    status VARCHAR(50) DEFAULT 'pending', -- pending, picked, packed, in_transit, delivered
    
    -- Package details
    packages JSONB, -- Array of package dimensions and weights
    total_weight_kg DECIMAL(10,3),
    
    -- Tracking
    current_location GEOGRAPHY(POINT, 4326),
    last_scan_location TEXT,
    last_scan_at TIMESTAMPTZ,
    
    -- Costs
    shipping_cost DECIMAL(10,2),
    insurance_cost DECIMAL(10,2),
    
    -- Timestamps
    picked_at TIMESTAMPTZ,
    packed_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    -- Proof of delivery
    pod_signature TEXT,
    pod_photo_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROUTE OPTIMIZATION TABLES
-- ============================================

-- Vehicles for fleet management
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50), -- van, truck, bike, car
    make VARCHAR(50),
    model VARCHAR(50),
    year INTEGER,
    license_plate VARCHAR(20) UNIQUE,
    vin VARCHAR(50),
    
    -- Capacity
    max_weight_kg DECIMAL(10,2),
    max_volume_m3 DECIMAL(10,2),
    fuel_type VARCHAR(30), -- gasoline, diesel, electric, hybrid
    
    -- Status
    status VARCHAR(30) DEFAULT 'available', -- available, in_use, maintenance, retired
    current_location GEOGRAPHY(POINT, 4326),
    current_driver_id UUID REFERENCES users(id),
    
    -- Maintenance
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    odometer_reading INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced routes table with optimization params
CREATE TABLE IF NOT EXISTS delivery_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_number VARCHAR(50) UNIQUE NOT NULL,
    driver_id UUID REFERENCES users(id),
    vehicle_id UUID REFERENCES vehicles(id),
    warehouse_id UUID REFERENCES warehouses(id),
    
    -- Route details
    status VARCHAR(30) DEFAULT 'planned', -- planned, optimizing, assigned, in_progress, completed
    route_date DATE NOT NULL,
    
    -- Optimization parameters
    optimization_params JSONB DEFAULT '{
        "algorithm": "nearest_neighbor",
        "constraints": {
            "max_distance_km": 200,
            "max_duration_hours": 8,
            "max_stops": 50
        }
    }'::jsonb,
    
    -- Route metrics
    total_distance_km DECIMAL(10,2),
    estimated_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    fuel_cost_estimate DECIMAL(10,2),
    
    -- Stops (ordered array)
    stops JSONB, -- Array of stop objects with order, location, delivery details
    optimized_path GEOGRAPHY(LINESTRING, 4326),
    
    -- Timestamps
    planned_start TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    planned_end TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    optimized_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Route stops for detailed tracking
CREATE TABLE IF NOT EXISTS route_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID REFERENCES delivery_routes(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES shipments(id),
    stop_sequence INTEGER NOT NULL,
    
    -- Location
    address TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    
    -- Timing
    planned_arrival TIMESTAMPTZ,
    arrival_window TSTZRANGE,
    actual_arrival TIMESTAMPTZ,
    actual_departure TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(30) DEFAULT 'pending', -- pending, skipped, completed, failed
    failure_reason TEXT,
    
    -- Proof of delivery
    signature_required BOOLEAN DEFAULT false,
    photo_required BOOLEAN DEFAULT false,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- REAL-TIME TRACKING TABLES
-- ============================================

-- GPS tracking data
CREATE TABLE IF NOT EXISTS gps_tracks (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id UUID REFERENCES vehicles(id),
    driver_id UUID REFERENCES users(id),
    route_id UUID REFERENCES delivery_routes(id),
    
    -- Location data
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    altitude_m DECIMAL(10,2),
    speed_kmh DECIMAL(5,2),
    heading_degrees DECIMAL(5,2),
    accuracy_m DECIMAL(5,2),
    
    -- Device info
    device_id VARCHAR(100),
    battery_level INTEGER,
    
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for GPS tracks (partitioned by date for performance)
CREATE INDEX idx_gps_tracks_vehicle_time ON gps_tracks(vehicle_id, recorded_at DESC);
CREATE INDEX idx_gps_tracks_route ON gps_tracks(route_id, recorded_at DESC);

-- Events and alerts
CREATE TABLE IF NOT EXISTS logistics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL, -- delay, accident, breakdown, traffic, weather
    severity VARCHAR(20), -- info, warning, critical
    
    -- Related entities
    route_id UUID REFERENCES delivery_routes(id),
    vehicle_id UUID REFERENCES vehicles(id),
    shipment_id UUID REFERENCES shipments(id),
    
    -- Event details
    title VARCHAR(200),
    description TEXT,
    location GEOGRAPHY(POINT, 4326),
    impact_minutes INTEGER, -- Estimated delay in minutes
    
    -- Resolution
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

-- ============================================
-- RETURNS MANAGEMENT TABLES
-- ============================================

-- Returns table
CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_number VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    customer_id UUID REFERENCES users(id),
    
    -- Return details
    status VARCHAR(30) DEFAULT 'requested', -- requested, approved, label_sent, in_transit, received, processed, refunded
    reason VARCHAR(100),
    reason_details TEXT,
    
    -- Items
    items JSONB NOT NULL, -- Array of {item_id, quantity, condition}
    
    -- Processing
    inspection_notes TEXT,
    restocking_fee DECIMAL(10,2),
    refund_amount DECIMAL(10,2),
    
    -- Shipping
    return_label_url TEXT,
    return_tracking_number VARCHAR(100),
    carrier VARCHAR(50),
    
    -- Timestamps
    requested_at TIMESTAMPTZ DEFAULT now(),
    approved_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- KPI AND ANALYTICS TABLES
-- ============================================

-- KPI metrics snapshot table
CREATE TABLE IF NOT EXISTS kpi_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- daily, weekly, monthly
    
    -- Operational Efficiency
    orders_processed INTEGER,
    average_fulfillment_hours DECIMAL(5,2),
    average_delivery_hours DECIMAL(5,2),
    on_time_delivery_rate DECIMAL(5,2),
    
    -- Inventory Metrics
    inventory_accuracy DECIMAL(5,2),
    stockout_events INTEGER,
    inventory_turnover_ratio DECIMAL(5,2),
    
    -- Route Optimization
    total_routes INTEGER,
    average_stops_per_route DECIMAL(5,2),
    average_route_efficiency DECIMAL(5,2), -- actual vs optimal distance
    fuel_cost_per_delivery DECIMAL(10,2),
    
    -- Financial
    revenue DECIMAL(12,2),
    shipping_revenue DECIMAL(12,2),
    shipping_costs DECIMAL(12,2),
    gross_margin DECIMAL(5,2),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(metric_date, metric_type)
);

-- ============================================
-- WEBHOOK AND INTEGRATION TABLES
-- ============================================

-- Webhook configurations for e-commerce platforms
CREATE TABLE IF NOT EXISTS webhook_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(50) NOT NULL, -- shopify, magento, woocommerce
    event_type VARCHAR(50) NOT NULL, -- order_created, order_updated, order_cancelled
    endpoint_url TEXT NOT NULL,
    secret_key TEXT,
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Webhook logs for debugging
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_config_id UUID REFERENCES webhook_configs(id),
    event_type VARCHAR(50),
    payload JSONB,
    response_status INTEGER,
    response_body TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Warehouse indexes
CREATE INDEX idx_warehouses_active ON warehouses(is_active);
CREATE INDEX idx_warehouses_location ON warehouses USING GIST(location);

-- Inventory indexes
CREATE INDEX idx_inventory_levels_warehouse ON inventory_levels(warehouse_id);
CREATE INDEX idx_inventory_levels_item ON inventory_levels(item_id);
CREATE INDEX idx_inventory_levels_low_stock ON inventory_levels(warehouse_id) WHERE quantity <= reorder_point;
CREATE INDEX idx_stock_movements_item ON stock_movements(item_id, created_at DESC);

-- Order indexes
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Shipment indexes
CREATE INDEX idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_order ON shipments(order_id);

-- Route indexes
CREATE INDEX idx_routes_date ON delivery_routes(route_date);
CREATE INDEX idx_routes_driver ON delivery_routes(driver_id);
CREATE INDEX idx_routes_status ON delivery_routes(status);
CREATE INDEX idx_route_stops_route ON route_stops(route_id, stop_sequence);

-- Vehicle indexes
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_location ON vehicles USING GIST(current_location);

-- Event indexes
CREATE INDEX idx_events_route ON logistics_events(route_id);
CREATE INDEX idx_events_unresolved ON logistics_events(resolved) WHERE resolved = false;

-- Returns indexes
CREATE INDEX idx_returns_order ON returns(order_id);
CREATE INDEX idx_returns_status ON returns(status);

-- KPI indexes
CREATE INDEX idx_kpi_date_type ON kpi_metrics(metric_date, metric_type);