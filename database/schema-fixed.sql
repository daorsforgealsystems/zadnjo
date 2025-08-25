-- Drop existing tables in reverse order of dependency
DROP TABLE IF EXISTS anomalies;
DROP TABLE IF EXISTS route_waypoints;
DROP TABLE IF EXISTS item_documents;
DROP TABLE IF EXISTS item_history;
DROP TABLE IF EXISTS user_items;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS delivery_routes;
DROP TABLE IF EXISTS routes;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'CLIENT',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    pickup_address TEXT,
    delivery_address TEXT,
    pickup_lat DOUBLE PRECISION,
    pickup_lng DOUBLE PRECISION,
    delivery_lat DOUBLE PRECISION,
    delivery_lng DOUBLE PRECISION,
    estimated_pickup TIMESTAMPTZ,
    estimated_delivery TIMESTAMPTZ,
    actual_pickup TIMESTAMPTZ,
    actual_delivery TIMESTAMPTZ,
    notes TEXT,
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

-- Create delivery_routes table
CREATE TABLE delivery_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_name TEXT NOT NULL,
    order_id UUID REFERENCES orders(id),
    driver_id UUID REFERENCES users(id),
    vehicle_id TEXT,
    status TEXT NOT NULL DEFAULT 'planned', -- e.g., planned, active, completed, cancelled
    start_location_lat DOUBLE PRECISION,
    start_location_lng DOUBLE PRECISION,
    end_location_lat DOUBLE PRECISION,
    end_location_lng DOUBLE PRECISION,
    estimated_distance_km DOUBLE PRECISION,
    estimated_duration_minutes INTEGER,
    actual_distance_km DOUBLE PRECISION,
    actual_duration_minutes INTEGER,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
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
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_delivery_routes_order_id ON delivery_routes(order_id);
CREATE INDEX idx_delivery_routes_driver_id ON delivery_routes(driver_id);
CREATE INDEX idx_delivery_routes_status ON delivery_routes(status);
CREATE INDEX idx_user_items_user_id ON user_items(user_id);
CREATE INDEX idx_user_items_item_id ON user_items(item_id);
CREATE INDEX idx_item_history_item_id ON item_history(item_id);
CREATE INDEX idx_item_documents_item_id ON item_documents(item_id);
CREATE INDEX idx_routes_driver_id ON routes(driver_id);
CREATE INDEX idx_route_waypoints_route_id ON route_waypoints(route_id);
CREATE INDEX idx_anomalies_route_id ON anomalies(route_id);
CREATE INDEX idx_anomalies_item_id ON anomalies(item_id);