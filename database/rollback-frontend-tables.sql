-- Rollback Script: Remove Frontend Tables from LogiCore Schema
-- This script removes the frontend tables that were added to LogiCore schema
-- Use this if you need to rollback the migration

-- ============================================================================
-- WARNING: This will delete all data in these tables!
-- Make sure to backup your data before running this script
-- ============================================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS update_items_updated_at ON items;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS anomalies CASCADE;
DROP TABLE IF EXISTS route_waypoints CASCADE;
DROP TABLE IF EXISTS item_documents CASCADE;
DROP TABLE IF EXISTS item_history CASCADE;
DROP TABLE IF EXISTS user_items CASCADE;
DROP TABLE IF EXISTS items CASCADE;

-- Verify tables were removed
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