-- 001_init.sql
-- Raw SQL migrations for core tables (subset)

CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location GEOGRAPHY(POINT),
  capacity JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY,
  sku VARCHAR(50) UNIQUE NOT NULL,
  dimensions JSONB NOT NULL,
  weight_kg DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY,
  item_id UUID REFERENCES items(id),
  warehouse_id UUID REFERENCES warehouses(id),
  quantity INTEGER NOT NULL,
  location_code VARCHAR(20)
);