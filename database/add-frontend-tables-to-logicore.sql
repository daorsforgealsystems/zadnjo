-- Migration: Add Frontend Tables to LogiCore Schema
-- This script adds the missing frontend tables to the existing LogiCore schema
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. ADD ITEMS TABLE (Frontend-style items for shipment tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    current_location GEOGRAPHY(Point, 4326),
    origin GEOGRAPHY(Point, 4326),
    destination GEOGRAPHY(Point, 4326),
    route_id UUID REFERENCES delivery_routes(id), -- Reference LogiCore delivery_routes
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. ADD USER_ITEMS JOIN TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_items (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, item_id)
);

-- ============================================================================
-- 3. ADD ITEM HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS item_history (
    id BIGSERIAL PRIMARY KEY,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    location GEOGRAPHY(Point, 4326),
    notes TEXT
);

-- ============================================================================
-- 4. ADD ITEM DOCUMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS item_documents (
    id BIGSERIAL PRIMARY KEY,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    storage_path TEXT NOT NULL, -- Path in Supabase Storage
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 5. ADD ROUTE WAYPOINTS TABLE (Compatible with existing delivery_routes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS route_waypoints (
    id BIGSERIAL PRIMARY KEY,
    route_id UUID REFERENCES delivery_routes(id) ON DELETE CASCADE, -- Reference LogiCore delivery_routes
    item_id UUID REFERENCES items(id), -- Can be null if it's just a stop
    waypoint_order INTEGER NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    estimated_arrival TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' -- e.g., pending, completed
);

-- ============================================================================
-- 6. ADD ANOMALIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS anomalies (
    id BIGSERIAL PRIMARY KEY,
    route_id UUID REFERENCES delivery_routes(id) ON DELETE CASCADE, -- Reference LogiCore delivery_routes
    item_id UUID REFERENCES items(id),
    vehicle_id UUID REFERENCES vehicles(id), -- Reference LogiCore vehicles
    type TEXT NOT NULL, -- e.g., UNSCHEDULED_STOP, ROUTE_DEVIATION, SPEED_ANOMALY, TEMPERATURE_BREACH
    severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high
    description TEXT,
    timestamp TIMESTAMPTZ DEFAULT now(),
    reported_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- ============================================================================
-- 7. ADD NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    type TEXT NOT NULL, -- anomaly, status_change, system_message
    message TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    related_id UUID, -- e.g., item ID or route ID
    "read" BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 8. ADD CHAT MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    shipment_id UUID REFERENCES items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 9. ADD PERFORMANCE INDEXES
-- ============================================================================

-- Items table indexes
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_route_id ON items(route_id);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);

-- User items indexes
CREATE INDEX IF NOT EXISTS idx_user_items_user_id ON user_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_items_item_id ON user_items(item_id);

-- Item history indexes
CREATE INDEX IF NOT EXISTS idx_item_history_item_id ON item_history(item_id);
CREATE INDEX IF NOT EXISTS idx_item_history_timestamp ON item_history(timestamp);

-- Item documents indexes
CREATE INDEX IF NOT EXISTS idx_item_documents_item_id ON item_documents(item_id);

-- Route waypoints indexes
CREATE INDEX IF NOT EXISTS idx_route_waypoints_route_id ON route_waypoints(route_id);
CREATE INDEX IF NOT EXISTS idx_route_waypoints_item_id ON route_waypoints(item_id);
CREATE INDEX IF NOT EXISTS idx_route_waypoints_order ON route_waypoints(route_id, waypoint_order);

-- Anomalies indexes
CREATE INDEX IF NOT EXISTS idx_anomalies_route_id ON anomalies(route_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_item_id ON anomalies(item_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_vehicle_id ON anomalies(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_type ON anomalies(type);
CREATE INDEX IF NOT EXISTS idx_anomalies_timestamp ON anomalies(timestamp);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications("read");
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_shipment_id ON chat_messages(shipment_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);

-- ============================================================================
-- 10. ADD TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to items table
CREATE TRIGGER update_items_updated_at 
    BEFORE UPDATE ON items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. INSERT SAMPLE DATA (Optional)
-- ============================================================================

-- Sample items
INSERT INTO items (id, name, description, status, route_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Electronics Package', 'High-value electronics shipment', 'in_transit', NULL),
    ('550e8400-e29b-41d4-a716-446655440002', 'Medical Supplies', 'Urgent medical equipment delivery', 'processing', NULL),
    ('550e8400-e29b-41d4-a716-446655440003', 'Automotive Parts', 'Car parts for assembly line', 'delivered', NULL),
    ('550e8400-e29b-41d4-a716-446655440004', 'Food Products', 'Perishable food items', 'pending', NULL)
ON CONFLICT (id) DO NOTHING;

-- Sample notifications
INSERT INTO notifications (type, message, user_id, related_id, "read") VALUES
    ('system_message', 'System migration completed successfully', NULL, NULL, false),
    ('anomaly', 'Route deviation detected on delivery route', NULL, '550e8400-e29b-41d4-a716-446655440001', false),
    ('status_change', 'Item status updated to delivered', NULL, '550e8400-e29b-41d4-a716-446655440003', false)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables were created
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN (
    'items', 'user_items', 'item_history', 'item_documents', 
    'route_waypoints', 'anomalies', 'notifications', 'chat_messages'
)
ORDER BY tablename;

-- Show table counts
SELECT 
    'items' as table_name, COUNT(*) as row_count FROM items
UNION ALL
SELECT 'notifications' as table_name, COUNT(*) as row_count FROM notifications
UNION ALL
SELECT 'anomalies' as table_name, COUNT(*) as row_count FROM anomalies
UNION ALL
SELECT 'chat_messages' as table_name, COUNT(*) as row_count FROM chat_messages;

COMMENT ON TABLE items IS 'Frontend-style items for shipment tracking, integrated with LogiCore schema';
COMMENT ON TABLE anomalies IS 'Anomaly detection and tracking for routes and items';
COMMENT ON TABLE notifications IS 'User notifications for system events and alerts';
COMMENT ON TABLE chat_messages IS 'Chat messages for shipment communication';