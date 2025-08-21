-- Migration: Add Orders Table to Current Schema
-- This script adds the missing orders table and related tables to the existing schema
-- Run this in your Supabase SQL Editor to fix the "orders table not found" error

-- ============================================================================
-- 1. CREATE ORDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
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
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    
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

-- ============================================================================
-- 2. CREATE ORDER_ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_items (
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

-- ============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ============================================================================
-- 4. CREATE TRIGGERS FOR UPDATED_AT
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

-- ============================================================================
-- 5. INSERT SAMPLE DATA (Optional)
-- ============================================================================

-- Sample orders (only if no orders exist)
INSERT INTO orders (
    id, 
    order_number, 
    customer_name, 
    customer_email,
    status, 
    payment_status,
    shipping_address,
    billing_address,
    total_amount,
    currency,
    estimated_delivery,
    notes
) VALUES
    (
        '550e8400-e29b-41d4-a716-446655440010',
        'ORD-2024-1001',
        'John Doe',
        'john.doe@example.com',
        'delivered',
        'paid',
        '{"street": "123 Main St", "city": "Belgrade", "state": "Serbia", "postalCode": "11000", "country": "RS"}'::jsonb,
        '{"street": "123 Main St", "city": "Belgrade", "state": "Serbia", "postalCode": "11000", "country": "RS"}'::jsonb,
        299.99,
        'USD',
        now() + interval '3 days',
        'Express delivery requested'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440011',
        'ORD-2024-1002',
        'Jane Smith',
        'jane.smith@example.com',
        'shipped',
        'paid',
        '{"street": "456 Oak Ave", "city": "Novi Sad", "state": "Serbia", "postalCode": "21000", "country": "RS"}'::jsonb,
        '{"street": "456 Oak Ave", "city": "Novi Sad", "state": "Serbia", "postalCode": "21000", "country": "RS"}'::jsonb,
        149.50,
        'USD',
        now() + interval '5 days',
        'Standard shipping'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440012',
        'ORD-2024-1003',
        'Mike Johnson',
        'mike.johnson@example.com',
        'processing',
        'paid',
        '{"street": "789 Pine Rd", "city": "Niš", "state": "Serbia", "postalCode": "18000", "country": "RS"}'::jsonb,
        '{"street": "789 Pine Rd", "city": "Niš", "state": "Serbia", "postalCode": "18000", "country": "RS"}'::jsonb,
        75.25,
        'USD',
        now() + interval '7 days',
        'Fragile items - handle with care'
    )
ON CONFLICT (id) DO NOTHING;

-- Sample order items
INSERT INTO order_items (
    order_id,
    product_id,
    product_name,
    quantity,
    unit_price,
    total_price,
    weight,
    dimensions
) VALUES
    (
        '550e8400-e29b-41d4-a716-446655440010',
        'PROD-001',
        'Electronics Package',
        1,
        299.99,
        299.99,
        2.5,
        '{"length": 30, "width": 20, "height": 10, "unit": "cm"}'::jsonb
    ),
    (
        '550e8400-e29b-41d4-a716-446655440011',
        'PROD-002',
        'Medical Supplies',
        2,
        74.75,
        149.50,
        1.2,
        '{"length": 25, "width": 15, "height": 8, "unit": "cm"}'::jsonb
    ),
    (
        '550e8400-e29b-41d4-a716-446655440012',
        'PROD-003',
        'Automotive Parts',
        1,
        75.25,
        75.25,
        5.0,
        '{"length": 40, "width": 30, "height": 15, "unit": "cm"}'::jsonb
    )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. VERIFICATION QUERIES
-- ============================================================================

-- Verify tables were created
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename;

-- Show table counts
SELECT 
    'orders' as table_name, COUNT(*) as row_count FROM orders
UNION ALL
SELECT 'order_items' as table_name, COUNT(*) as row_count FROM order_items;

-- Test a simple query that was failing
SELECT 
    COUNT(*) as total_orders,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value
FROM orders 
WHERE created_at >= (now() - interval '1 month');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE orders IS 'Orders table for e-commerce and logistics integration';
COMMENT ON TABLE order_items IS 'Individual items within orders for detailed tracking';

-- Success message
SELECT 'Orders table migration completed successfully!' as status;