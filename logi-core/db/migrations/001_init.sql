-- 001_init.sql
-- T-SQL migrations for core tables (SQL Server)

-- Warehouses
IF NOT EXISTS (
  SELECT 1 FROM sys.tables t
  WHERE t.name = 'warehouses' AND t.schema_id = SCHEMA_ID('dbo')
)
BEGIN
  CREATE TABLE dbo.warehouses (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location GEOGRAPHY NULL, -- use geography::Point(lat, lon, 4326) when inserting
    capacity NVARCHAR(MAX) NOT NULL
  );
END;

-- Items
IF NOT EXISTS (
  SELECT 1 FROM sys.tables t
  WHERE t.name = 'items' AND t.schema_id = SCHEMA_ID('dbo')
)
BEGIN
  CREATE TABLE dbo.items (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    sku VARCHAR(50) NOT NULL,
    dimensions NVARCHAR(MAX) NOT NULL, -- JSON stored as text in SQL Server
    weight_kg DECIMAL(10,2) NULL,
    CONSTRAINT UQ_items_sku UNIQUE (sku)
  );
END;

-- Inventory
IF NOT EXISTS (
  SELECT 1 FROM sys.tables t
  WHERE t.name = 'inventory' AND t.schema_id = SCHEMA_ID('dbo')
)
BEGIN
  CREATE TABLE dbo.inventory (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    item_id UNIQUEIDENTIFIER NOT NULL,
    warehouse_id UNIQUEIDENTIFIER NOT NULL,
    quantity INT NOT NULL,
    location_code VARCHAR(20) NULL,
    CONSTRAINT FK_inventory_item FOREIGN KEY (item_id) REFERENCES dbo.items(id),
    CONSTRAINT FK_inventory_warehouse FOREIGN KEY (warehouse_id) REFERENCES dbo.warehouses(id)
  );
END;