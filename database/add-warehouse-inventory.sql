-- Warehouse and Inventory schema for Supabase (frontend source of truth)
-- Safe to run multiple times (IF NOT EXISTS where possible)

-- Enable extensions that might be required
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  address TEXT,
  -- Using JSONB for location to avoid PostGIS dependency in Supabase project
  location JSONB, -- { lat: number, lng: number }
  capacity JSONB NOT NULL, -- { total_sqft: number, used_sqft: number, zones: [] }
  operating_hours JSONB, -- { mon: {open, close}, ... }
  contact_info JSONB, -- { phone, email, manager }
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_warehouses_is_active ON warehouses(is_active);
CREATE INDEX IF NOT EXISTS idx_warehouses_name ON warehouses(name);

-- Inventory Items
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  barcode TEXT UNIQUE,
  dimensions JSONB, -- { length, width, height, unit }
  weight_kg NUMERIC(10,2),
  value_usd NUMERIC(12,2),
  hazmat_class TEXT,
  temperature_requirements JSONB, -- { min, max, unit }
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON inventory_items(name);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_items_barcode ON inventory_items(barcode);

-- Inventory Levels (per warehouse)
CREATE TABLE IF NOT EXISTS inventory_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_point INTEGER,
  reorder_quantity INTEGER,
  location_code TEXT, -- e.g., A01-R02-S03-B04
  last_counted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(item_id, warehouse_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_levels_item ON inventory_levels(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_levels_warehouse ON inventory_levels(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_levels_reorder ON inventory_levels((quantity <= COALESCE(reorder_point, -1)));

-- Stock Movements (audit trail)
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('inbound','outbound','transfer','adjustment','return')),
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  reference_type TEXT, -- 'order' | 'transfer' | 'adjustment' | 'return'
  reference_id UUID,
  from_location TEXT,
  to_location TEXT,
  notes TEXT,
  performed_by UUID, -- optional user id
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_wh ON stock_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at);

-- Helper function: adjust_inventory_level
-- If a level row exists -> update quantity by p_adjustment (not below 0)
-- If not exists -> insert with p_adjustment as starting quantity (>= 0)
CREATE OR REPLACE FUNCTION adjust_inventory_level(
  p_item_id UUID,
  p_warehouse_id UUID,
  p_adjustment INTEGER
) RETURNS VOID AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM inventory_levels
    WHERE item_id = p_item_id AND warehouse_id = p_warehouse_id
  ) INTO v_exists;

  IF v_exists THEN
    UPDATE inventory_levels
    SET quantity = GREATEST(quantity + p_adjustment, 0),
        updated_at = now()
    WHERE item_id = p_item_id AND warehouse_id = p_warehouse_id;
  ELSE
    INSERT INTO inventory_levels (item_id, warehouse_id, quantity, reserved_quantity)
    VALUES (p_item_id, p_warehouse_id, GREATEST(p_adjustment, 0), 0);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional view: low stock items (quantity <= reorder_point)
CREATE OR REPLACE VIEW low_stock_items AS
SELECT il.*, ii.*, w.*
FROM inventory_levels il
JOIN inventory_items ii ON ii.id = il.item_id
JOIN warehouses w ON w.id = il.warehouse_id
WHERE il.reorder_point IS NOT NULL AND il.quantity <= il.reorder_point;