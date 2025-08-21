# LogiCore Schema Migration Guide

This guide will help you add the missing frontend tables to your existing LogiCore database schema.

## 🚀 Quick Start

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project: https://aysikssfvptxeclfymlk.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Migration
1. Open the file `add-frontend-tables-to-logicore.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** to execute the migration

### Step 3: Verify Migration
After running the migration, you should see output showing:
- List of created tables
- Row counts for sample data
- Success confirmation

## 📋 What This Migration Does

### Tables Added:
- ✅ `items` - Frontend-style shipment tracking items
- ✅ `user_items` - Many-to-many relationship between users and items
- ✅ `item_history` - Historical tracking of item status changes
- ✅ `item_documents` - Document attachments for items
- ✅ `route_waypoints` - Waypoints for delivery routes
- ✅ `anomalies` - Anomaly detection and tracking
- ✅ `notifications` - User notifications system
- ✅ `chat_messages` - Chat functionality for shipments

### Features Added:
- 🔗 **Integration**: Tables reference existing LogiCore tables (users, delivery_routes, vehicles)
- 📊 **Indexes**: Performance indexes for all tables
- 🔄 **Triggers**: Auto-updating timestamps
- 📝 **Sample Data**: Basic sample data to test functionality

## 🔧 Integration Points

The new tables integrate with existing LogiCore tables:

```sql
-- Items reference delivery routes
items.route_id → delivery_routes.id

-- Anomalies reference vehicles and routes  
anomalies.vehicle_id → vehicles.id
anomalies.route_id → delivery_routes.id

-- All user references point to existing users table
notifications.user_id → users.id
chat_messages.user_id → users.id
```

## ✅ Testing the Migration

After running the migration, test these endpoints in your application:

1. **Dashboard Metrics** - Should load without errors
2. **Items List** - Should show sample items
3. **Notifications** - Should display system notifications
4. **Anomalies** - Should work with real data instead of mocks

## 🔄 Rollback (If Needed)

If you need to rollback the migration:

1. Open `rollback-frontend-tables.sql`
2. Copy and run in Supabase SQL Editor
3. **⚠️ WARNING**: This will delete all data in the new tables!

## 🐛 Troubleshooting

### Common Issues:

**Error: "relation already exists"**
- Solution: Tables already exist, migration is safe to ignore

**Error: "foreign key constraint"**
- Solution: Make sure LogiCore base tables exist (users, delivery_routes, vehicles)

**Error: "permission denied"**
- Solution: Make sure you're running as database owner/admin

### Verification Queries:

```sql
-- Check if tables exist
SELECT tablename FROM pg_tables 
WHERE tablename IN ('items', 'anomalies', 'notifications', 'chat_messages');

-- Check sample data
SELECT COUNT(*) FROM items;
SELECT COUNT(*) FROM notifications;
```

## 📞 Support

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify all LogiCore base tables exist
3. Ensure proper database permissions
4. Check Supabase logs for detailed error information

## 🎉 Success!

Once the migration is complete, your application should:
- ✅ Load the dashboard without "table not found" errors
- ✅ Display real data instead of mock data
- ✅ Support full frontend functionality
- ✅ Maintain compatibility with existing LogiCore services