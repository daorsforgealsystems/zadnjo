-- Sample seed data for warehouses, items, and inventory levels
-- Run after running add-warehouse-inventory.sql

-- Warehouses
INSERT INTO public.warehouses (name, code, address, location, capacity, operating_hours, contact_info, is_active)
VALUES
  (
    'Main Distribution Center',
    'WH-001',
    '123 Logistics Way, City, State 12345',
    '{"lat": 44.8176, "lng": 20.4633}',
    '{"total_sqft": 50000, "used_sqft": 12000, "zones": []}',
    '{"mon": {"open": "08:00", "close": "18:00"}}',
    '{"phone": "+1 (555) 123-4567", "email": "warehouse@company.com", "manager": "John Smith"}',
    TRUE
  ),
  (
    'Regional Hub North',
    'WH-002',
    '456 Supply Rd, Town, State 23456',
    '{"lat": 45.2671, "lng": 19.8335}',
    '{"total_sqft": 30000, "used_sqft": 6000, "zones": []}',
    '{"mon": {"open": "08:00", "close": "18:00"}}',
    '{"phone": "+1 (555) 987-6543", "email": "north-hub@company.com", "manager": "Jane Doe"}',
    TRUE
  )
RETURNING id, code;

-- Inventory items
INSERT INTO public.inventory_items (sku, name, description, barcode, dimensions, weight_kg, value_usd)
VALUES
  ('SKU-1001', 'Laptop Pro 15"', 'High-end laptop', '1111111111111', '{"length": 35, "width": 24, "height": 2, "unit": "cm"}', 2.1, 1999.00),
  ('SKU-1002', 'Wireless Mouse', 'Ergonomic wireless mouse', '2222222222222', '{"length": 10, "width": 6, "height": 4, "unit": "cm"}', 0.2, 29.99),
  ('SKU-1003', 'Mechanical Keyboard', 'RGB mechanical keyboard', '3333333333333', '{"length": 45, "width": 15, "height": 4, "unit": "cm"}', 0.9, 89.99)
RETURNING id, sku;

-- Link the newly created warehouses and items into inventory_levels
-- Using subqueries to find IDs by code/sku for deterministic references

-- Laptop Pro in WH-001 and WH-002
INSERT INTO public.inventory_levels (item_id, warehouse_id, quantity, reserved_quantity, reorder_point, reorder_quantity, location_code)
SELECT i.id, w.id, 120, 10, 50, 100, 'A-12'
FROM public.inventory_items i, public.warehouses w
WHERE i.sku = 'SKU-1001' AND w.code = 'WH-001';

INSERT INTO public.inventory_levels (item_id, warehouse_id, quantity, reserved_quantity, reorder_point, reorder_quantity, location_code)
SELECT i.id, w.id, 40, 5, 30, 50, 'B-05'
FROM public.inventory_items i, public.warehouses w
WHERE i.sku = 'SKU-1001' AND w.code = 'WH-002';

-- Wireless Mouse in WH-001
INSERT INTO public.inventory_levels (item_id, warehouse_id, quantity, reserved_quantity, reorder_point, reorder_quantity, location_code)
SELECT i.id, w.id, 340, 20, 100, 200, 'C-05'
FROM public.inventory_items i, public.warehouses w
WHERE i.sku = 'SKU-1002' AND w.code = 'WH-001';

-- Mechanical Keyboard low stock in WH-001
INSERT INTO public.inventory_levels (item_id, warehouse_id, quantity, reserved_quantity, reorder_point, reorder_quantity, location_code)
SELECT i.id, w.id, 0, 0, 20, 40, 'B-01'
FROM public.inventory_items i, public.warehouses w
WHERE i.sku = 'SKU-1003' AND w.code = 'WH-001';

-- Example stock movements
INSERT INTO public.stock_movements (item_id, warehouse_id, movement_type, quantity, reference_type, notes)
SELECT i.id, w.id, 'inbound', 50, 'adjustment', 'Initial stock load'
FROM public.inventory_items i, public.warehouses w
WHERE i.sku = 'SKU-1001' AND w.code = 'WH-001';

INSERT INTO public.stock_movements (item_id, warehouse_id, movement_type, quantity, reference_type, notes)
SELECT i.id, w.id, 'outbound', 20, 'order', 'Order #12345'
FROM public.inventory_items i, public.warehouses w
WHERE i.sku = 'SKU-1002' AND w.code = 'WH-001';