-- idempotent-ish demo seed function for warehouses + inventory
-- Creates warehouses/items if missing, then ensures inventory_levels rows exist, and records a couple of stock_movements

CREATE OR REPLACE FUNCTION seed_demo_warehouse_inventory()
RETURNS VOID AS $$
DECLARE
  wh1_id UUID;
  wh2_id UUID;
  sku1_id UUID;
  sku2_id UUID;
  sku3_id UUID;
BEGIN
  -- Warehouses
  INSERT INTO public.warehouses (name, code, address, location, capacity, operating_hours, contact_info, is_active)
  VALUES (
    'Main Distribution Center', 'WH-001', '123 Logistics Way, City, State 12345',
    '{"lat": 44.8176, "lng": 20.4633}', '{"total_sqft": 50000, "used_sqft": 12000, "zones": []}',
    '{"mon": {"open": "08:00", "close": "18:00"}}', '{"phone": "+1 (555) 123-4567", "email": "warehouse@company.com", "manager": "John Smith"}', TRUE
  ) ON CONFLICT (code) DO NOTHING;

  INSERT INTO public.warehouses (name, code, address, location, capacity, operating_hours, contact_info, is_active)
  VALUES (
    'Regional Hub North', 'WH-002', '456 Supply Rd, Town, State 23456',
    '{"lat": 45.2671, "lng": 19.8335}', '{"total_sqft": 30000, "used_sqft": 6000, "zones": []}',
    '{"mon": {"open": "08:00", "close": "18:00"}}', '{"phone": "+1 (555) 987-6543", "email": "north-hub@company.com", "manager": "Jane Doe"}', TRUE
  ) ON CONFLICT (code) DO NOTHING;

  SELECT id INTO wh1_id FROM public.warehouses WHERE code = 'WH-001' LIMIT 1;
  SELECT id INTO wh2_id FROM public.warehouses WHERE code = 'WH-002' LIMIT 1;

  -- Items
  INSERT INTO public.inventory_items (sku, name, description, barcode, dimensions, weight_kg, value_usd)
  VALUES ('SKU-1001', 'Laptop Pro 15"', 'High-end laptop', '1111111111111', '{"length": 35, "width": 24, "height": 2, "unit": "cm"}', 2.1, 1999.00)
  ON CONFLICT (sku) DO NOTHING;

  INSERT INTO public.inventory_items (sku, name, description, barcode, dimensions, weight_kg, value_usd)
  VALUES ('SKU-1002', 'Wireless Mouse', 'Ergonomic wireless mouse', '2222222222222', '{"length": 10, "width": 6, "height": 4, "unit": "cm"}', 0.2, 29.99)
  ON CONFLICT (sku) DO NOTHING;

  INSERT INTO public.inventory_items (sku, name, description, barcode, dimensions, weight_kg, value_usd)
  VALUES ('SKU-1003', 'Mechanical Keyboard', 'RGB mechanical keyboard', '3333333333333', '{"length": 45, "width": 15, "height": 4, "unit": "cm"}', 0.9, 89.99)
  ON CONFLICT (sku) DO NOTHING;

  SELECT id INTO sku1_id FROM public.inventory_items WHERE sku = 'SKU-1001' LIMIT 1;
  SELECT id INTO sku2_id FROM public.inventory_items WHERE sku = 'SKU-1002' LIMIT 1;
  SELECT id INTO sku3_id FROM public.inventory_items WHERE sku = 'SKU-1003' LIMIT 1;

  -- Ensure inventory levels (upsert-like behaviour)
  PERFORM 1 FROM public.inventory_levels WHERE item_id = sku1_id AND warehouse_id = wh1_id;
  IF NOT FOUND THEN
    INSERT INTO public.inventory_levels (item_id, warehouse_id, quantity, reserved_quantity, reorder_point, reorder_quantity, location_code)
    VALUES (sku1_id, wh1_id, 120, 10, 50, 100, 'A-12');
  END IF;

  PERFORM 1 FROM public.inventory_levels WHERE item_id = sku1_id AND warehouse_id = wh2_id;
  IF NOT FOUND THEN
    INSERT INTO public.inventory_levels (item_id, warehouse_id, quantity, reserved_quantity, reorder_point, reorder_quantity, location_code)
    VALUES (sku1_id, wh2_id, 40, 5, 30, 50, 'B-05');
  END IF;

  PERFORM 1 FROM public.inventory_levels WHERE item_id = sku2_id AND warehouse_id = wh1_id;
  IF NOT FOUND THEN
    INSERT INTO public.inventory_levels (item_id, warehouse_id, quantity, reserved_quantity, reorder_point, reorder_quantity, location_code)
    VALUES (sku2_id, wh1_id, 340, 20, 100, 200, 'C-05');
  END IF;

  PERFORM 1 FROM public.inventory_levels WHERE item_id = sku3_id AND warehouse_id = wh1_id;
  IF NOT FOUND THEN
    INSERT INTO public.inventory_levels (item_id, warehouse_id, quantity, reserved_quantity, reorder_point, reorder_quantity, location_code)
    VALUES (sku3_id, wh1_id, 0, 0, 20, 40, 'B-01');
  END IF;

  -- Example stock movements (insert if not exists by matching latest rows)
  INSERT INTO public.stock_movements (item_id, warehouse_id, movement_type, quantity, reference_type, notes)
  SELECT sku1_id, wh1_id, 'inbound', 50, 'adjustment', 'Seed: Initial stock load'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.stock_movements
    WHERE item_id = sku1_id AND warehouse_id = wh1_id AND movement_type = 'inbound' AND quantity = 50 AND notes LIKE 'Seed:%'
  );

  INSERT INTO public.stock_movements (item_id, warehouse_id, movement_type, quantity, reference_type, notes)
  SELECT sku2_id, wh1_id, 'outbound', 20, 'order', 'Seed: Order #12345'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.stock_movements
    WHERE item_id = sku2_id AND warehouse_id = wh1_id AND movement_type = 'outbound' AND quantity = 20 AND notes LIKE 'Seed:%'
  );

END;
$$ LANGUAGE plpgsql;