-- 001_init.sql
-- PostgreSQL + PostGIS migrations for core tables

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

-- Warehouses
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  location geography(Point, 4326), -- use ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography when inserting
  capacity TEXT NOT NULL
);

-- Items
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(50) NOT NULL,
  dimensions TEXT NOT NULL, -- JSON stored as text; use JSONB if you want typed JSON
  weight_kg NUMERIC(10,2),
  CONSTRAINT uq_items_sku UNIQUE (sku)
);

-- Inventory
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL,
  warehouse_id UUID NOT NULL,
  quantity INT NOT NULL,
  location_code VARCHAR(20),
  CONSTRAINT fk_inventory_item FOREIGN KEY (item_id) REFERENCES public.items(id),
  CONSTRAINT fk_inventory_warehouse FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id)
);

COMMIT;