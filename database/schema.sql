-- Drop RLS policies first to avoid dependency issues
DROP POLICY IF EXISTS "Users can view routes they are involved in" ON routes;
DROP POLICY IF EXISTS "Users can view items they are associated with" ON items;
DROP POLICY IF EXISTS "Users can view chat messages for their items" ON chat_messages;
DROP POLICY IF EXISTS "Users can send chat messages for their items" ON chat_messages;
DROP POLICY IF EXISTS "Users can view their own items" ON user_items;
DROP POLICY IF EXISTS "Users can manage their own items" ON user_items;

-- Disable RLS on tables that might have it enabled
ALTER TABLE IF EXISTS routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;

-- Drop existing tables in reverse order of dependency
DROP TABLE IF EXISTS anomalies CASCADE;
DROP TABLE IF EXISTS route_waypoints CASCADE;
DROP TABLE IF EXISTS item_documents CASCADE;
DROP TABLE IF EXISTS item_history CASCADE;
DROP TABLE IF EXISTS user_items CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS route_stops CASCADE;
DROP TABLE IF EXISTS delivery_routes CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'CLIENT',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create orders table (matching add-orders-table.sql)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES users(id),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    
    -- Order status and details
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
    
    -- Addresses (stored as JSONB for flexibility)
    shipping_address JSONB NOT NULL DEFAULT '{}',
    billing_address JSONB NOT NULL DEFAULT '{}',
    
    -- Financial details
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Delivery information
    estimated_delivery TIMESTAMPTZ,
    actual_delivery TIMESTAMPTZ,
    
    -- References to other entities
    shipment_id UUID, -- Can reference items table for now
    invoice_id VARCHAR(100),
    
    -- Additional information
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create routes table (moved before items to fix foreign key reference)
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    driver_id UUID REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'planned', -- e.g., planned, in_progress, completed, cancelled
    estimated_departure TIMESTAMPTZ,
    estimated_arrival TIMESTAMPTZ,
    actual_departure TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create order_items table (matching add-orders-table.sql)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(100), -- External product ID
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Physical properties
    weight DECIMAL(10,3),
    dimensions JSONB, -- {length, width, height, unit}
    
    -- Additional information
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create vehicles table (from logicore-schema.sql)
CREATE TABLE vehicles (
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
    current_location_lat DOUBLE PRECISION,
    current_location_lng DOUBLE PRECISION,
    current_driver_id UUID REFERENCES users(id),
    
    -- Maintenance
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    odometer_reading INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create delivery_routes table (from logicore-schema.sql, adapted)
CREATE TABLE delivery_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_number VARCHAR(50) UNIQUE NOT NULL,
    driver_id UUID REFERENCES users(id),
    vehicle_id UUID REFERENCES vehicles(id),
    
    -- Route details
    status VARCHAR(30) DEFAULT 'planned', -- planned, optimizing, assigned, in_progress, completed
    route_date DATE NOT NULL,
    
    -- Route metrics
    total_distance_km DECIMAL(10,2),
    estimated_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    fuel_cost_estimate DECIMAL(10,2),
    
    -- Timestamps
    planned_start TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    planned_end TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create route_stops table (from logicore-schema.sql, adapted)
CREATE TABLE route_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID REFERENCES delivery_routes(id) ON DELETE CASCADE,
    stop_sequence INTEGER NOT NULL,
    
    -- Location
    address TEXT NOT NULL,
    location_lat DOUBLE PRECISION NOT NULL,
    location_lng DOUBLE PRECISION NOT NULL,
    
    -- Timing
    planned_arrival TIMESTAMPTZ,
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

-- Create items table
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    current_location_lat DOUBLE PRECISION,
    current_location_lng DOUBLE PRECISION,
    origin_lat DOUBLE PRECISION,
    origin_lng DOUBLE PRECISION,
    destination_lat DOUBLE PRECISION,
    destination_lng DOUBLE PRECISION,
    route_id UUID REFERENCES routes(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_items join table for many-to-many relationship
CREATE TABLE user_items (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, item_id)
);

-- Create item_history table
CREATE TABLE item_history (
    id BIGSERIAL PRIMARY KEY,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    notes TEXT
);

-- Create item_documents table
CREATE TABLE item_documents (
    id BIGSERIAL PRIMARY KEY,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    storage_path TEXT NOT NULL, -- Path in Supabase Storage
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Create route_waypoints table
CREATE TABLE route_waypoints (
    id BIGSERIAL PRIMARY KEY,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id), -- Can be null if it's just a stop
    waypoint_order INTEGER NOT NULL,
    location_lat DOUBLE PRECISION NOT NULL,
    location_lng DOUBLE PRECISION NOT NULL,
    estimated_arrival TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' -- e.g., pending, completed
);

-- Create anomalies table
CREATE TABLE anomalies (
    id BIGSERIAL PRIMARY KEY,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id),
    type TEXT NOT NULL, -- e.g., delay, deviation, damage
    description TEXT,
    reported_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- Create notifications table
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    related_id UUID, -- e.g., item ID or route ID
    "read" BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    shipment_id UUID REFERENCES items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance

-- Orders table indexes
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Vehicles indexes
CREATE INDEX idx_vehicles_vehicle_number ON vehicles(vehicle_number);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_current_driver_id ON vehicles(current_driver_id);

-- Delivery routes indexes
CREATE INDEX idx_delivery_routes_driver_id ON delivery_routes(driver_id);
CREATE INDEX idx_delivery_routes_vehicle_id ON delivery_routes(vehicle_id);
CREATE INDEX idx_delivery_routes_status ON delivery_routes(status);
CREATE INDEX idx_delivery_routes_route_date ON delivery_routes(route_date);

-- Route stops indexes
CREATE INDEX idx_route_stops_route_id ON route_stops(route_id);
CREATE INDEX idx_route_stops_sequence ON route_stops(route_id, stop_sequence);
CREATE INDEX idx_route_stops_status ON route_stops(status);

-- Original indexes
CREATE INDEX idx_user_items_user_id ON user_items(user_id);
CREATE INDEX idx_user_items_item_id ON user_items(item_id);
CREATE INDEX idx_item_history_item_id ON item_history(item_id);
CREATE INDEX idx_item_documents_item_id ON item_documents(item_id);
CREATE INDEX idx_routes_driver_id ON routes(driver_id);
CREATE INDEX idx_route_waypoints_route_id ON route_waypoints(route_id);
CREATE INDEX idx_anomalies_route_id ON anomalies(route_id);
CREATE INDEX idx_anomalies_item_id ON anomalies(item_id);

-- ============================================================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Create or replace the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to orders table
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to vehicles table
CREATE TRIGGER update_vehicles_updated_at 
    BEFORE UPDATE ON vehicles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to delivery_routes table
CREATE TRIGGER update_delivery_routes_updated_at 
    BEFORE UPDATE ON delivery_routes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to route_stops table
CREATE TRIGGER update_route_stops_updated_at 
    BEFORE UPDATE ON route_stops 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- IMPORTANT: APPLY RLS POLICIES AFTER RUNNING THIS SCHEMA
-- ============================================================================

/*
After successfully running this schema, you should also run the RLS policies:

1. Apply Row Level Security policies from: database/rls-policies.sql
   - This enables proper access control based on user roles
   - Protects sensitive data from unauthorized access

2. Optionally run sample data from: database/sample-data.sql
   - Provides demo data for testing the application
   
To apply these:
- In Supabase SQL Editor, run: database/rls-policies.sql
- For demo data, run: database/sample-data.sql

This ensures proper security and functionality of your logistics platform.
*/