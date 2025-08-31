-- Migration: Initial Schema Setup
-- Version: 001
-- Description: Create initial database schema for logistics application

-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'CLIENT',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    current_location GEOGRAPHY(Point, 4326),
    origin GEOGRAPHY(Point, 4326),
    destination GEOGRAPHY(Point, 4326),
    route_id UUID, -- Will reference routes when that table exists
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_items join table for many-to-many relationship
CREATE TABLE IF NOT EXISTS user_items (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, item_id)
);

-- Create item_history table
CREATE TABLE IF NOT EXISTS item_history (
    id BIGSERIAL PRIMARY KEY,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    location GEOGRAPHY(Point, 4326),
    notes TEXT
);

-- Create item_documents table
CREATE TABLE IF NOT EXISTS item_documents (
    id BIGSERIAL PRIMARY KEY,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    storage_path TEXT NOT NULL, -- Path in Supabase Storage
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Create routes table
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    driver_id UUID REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'planned', -- e.g., planned, in_progress, completed, cancelled
    estimated_departure TIMESTAMPTZ,
    estimated_arrival TIMESTAMPTZ,
    actual_departure TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create route_waypoints table
CREATE TABLE IF NOT EXISTS route_waypoints (
    id BIGSERIAL PRIMARY KEY,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id), -- Can be null if it's just a stop
    waypoint_order INTEGER NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    estimated_arrival TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' -- e.g., pending, completed
);

-- Create anomalies table
CREATE TABLE IF NOT EXISTS anomalies (
    id BIGSERIAL PRIMARY KEY,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id),
    type TEXT NOT NULL, -- e.g., delay, deviation, damage
    description TEXT,
    reported_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    related_id UUID, -- e.g., item ID or route ID
    "read" BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    shipment_id UUID REFERENCES items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_route_id ON items(route_id);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);

CREATE INDEX IF NOT EXISTS idx_user_items_user_id ON user_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_items_item_id ON user_items(item_id);

CREATE INDEX IF NOT EXISTS idx_item_history_item_id ON item_history(item_id);
CREATE INDEX IF NOT EXISTS idx_item_history_timestamp ON item_history(timestamp);

CREATE INDEX IF NOT EXISTS idx_item_documents_item_id ON item_documents(item_id);

CREATE INDEX IF NOT EXISTS idx_routes_driver_id ON routes(driver_id);
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);

CREATE INDEX IF NOT EXISTS idx_route_waypoints_route_id ON route_waypoints(route_id);
CREATE INDEX IF NOT EXISTS idx_route_waypoints_item_id ON route_waypoints(item_id);

CREATE INDEX IF NOT EXISTS idx_anomalies_route_id ON anomalies(route_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_item_id ON anomalies(item_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_type ON anomalies(type);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications("read");

CREATE INDEX IF NOT EXISTS idx_chat_messages_shipment_id ON chat_messages(shipment_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at 
    BEFORE UPDATE ON items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at 
    BEFORE UPDATE ON routes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user
INSERT INTO users (id, email, full_name, role) VALUES
    ('user_admin', 'admin@example.com', 'Admin User', 'ADMIN')
ON CONFLICT (id) DO NOTHING;

-- Insert sample data for testing
INSERT INTO items (id, name, description, status) VALUES
    ('item_1', 'Sample Package 1', 'Test shipment for development', 'pending'),
    ('item_2', 'Sample Package 2', 'Test shipment for development', 'in_transit'),
    ('item_3', 'Sample Package 3', 'Test shipment for development', 'delivered')
ON CONFLICT (id) DO NOTHING;

INSERT INTO routes (id, name, status) VALUES
    ('route_1', 'Main Delivery Route', 'planned'),
    ('route_2', 'Express Route', 'in_progress')
ON CONFLICT (id) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE users IS 'Application users with roles and permissions';
COMMENT ON TABLE items IS 'Shipment items being tracked';
COMMENT ON TABLE routes IS 'Delivery routes for shipments';
COMMENT ON TABLE anomalies IS 'Detected anomalies in routes or shipments';
COMMENT ON TABLE notifications IS 'User notifications for system events';
COMMENT ON TABLE chat_messages IS 'Chat messages for shipment communication';

-- Verify migration
SELECT 'Migration 001 completed successfully' as status;