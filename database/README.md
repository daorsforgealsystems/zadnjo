# Database Setup Guide for DAORS Flow Motion

This guide will help you set up the Supabase database for the DAORS Flow Motion application.

## Prerequisites

1. A Supabase account and project
2. Access to the Supabase SQL Editor or CLI

## Setup Steps

### 1. Create the Database Schema

Run the following SQL files in order in your Supabase SQL Editor:

1. **schema.sql** - Creates all the necessary tables and indexes
2. **rls-policies.sql** - Sets up Row Level Security policies
3. **sample-data.sql** - (Optional) Adds sample data for testing

### 2. Environment Configuration

Create a `.env` file in the project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in your Supabase project settings under "API".

### 3. Authentication Setup

In your Supabase dashboard:

1. Go to **Authentication** → **Settings**
2. Enable **Email confirmations** if desired
3. Configure **Site URL** to your application URL (e.g., `http://localhost:8080` for development)

### 4. Storage Setup (Optional)

If you plan to store documents:

1. Go to **Storage** in your Supabase dashboard
2. Create a bucket named `documents`
3. Set appropriate policies for file access

## Database Schema Overview

### Tables Created

1. **users** - User profiles (extends Supabase auth.users)
   - Links to Supabase authentication
   - Stores role, username, and associated item IDs

2. **items** - Shipments/packages
   - Contains shipment details, status, location
   - Links to routes and users

3. **routes** - Delivery routes
   - Route information, driver assignment, progress
   - GPS tracking data

4. **anomalies** - Route anomalies and alerts
   - Speed violations, route deviations, etc.
   - Links to routes

5. **notifications** - System notifications
   - User-specific notifications
   - Status changes, alerts, system messages

6. **chat_messages** - Shipment chat functionality
   - Communication between users about specific shipments

### User Roles

The system supports four user roles:

- **ADMIN** - Full access to all features and data
- **MANAGER** - Access to dashboard, reports, route management
- **DRIVER** - Access to assigned routes and items
- **CLIENT** - Access to their associated shipments only

### Security Features

- **Row Level Security (RLS)** enabled on all tables
- Role-based access control
- Users can only access data they're authorized to see
- Secure functions for checking permissions

## Testing the Setup

### 1. Create Test Users

Use the application's signup form to create users with different roles:

```sql
-- After a user signs up, you can update their role:
UPDATE public.users 
SET role = 'ADMIN' 
WHERE email = 'admin@example.com';
```

### 2. Associate Items with Clients

```sql
-- Associate items with a client user
UPDATE public.users 
SET associated_item_ids = ARRAY['660e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002']
WHERE email = 'client@example.com';
```

### 3. Create Sample Notifications

```sql
-- Create sample notifications for a user
SELECT create_sample_notifications('user-uuid-here');
```

## Troubleshooting

### Common Issues

1. **"Could not find the table 'public.users'"**
   - Make sure you've run the `schema.sql` file
   - Check that the table was created successfully

2. **Permission Denied Errors**
   - Ensure RLS policies are set up correctly
   - Check that users have the correct roles assigned

3. **Authentication Issues**
   - Verify your Supabase URL and anon key are correct
   - Check that the user exists in both `auth.users` and `public.users`

### Checking Table Creation

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'items', 'routes', 'anomalies', 'notifications', 'chat_messages');
```

### Checking RLS Policies

```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Development vs Production

### Development
- Use the sample data for testing
- Enable debug logging in the application
- Consider disabling email confirmations for faster testing

### Production
- Remove or modify sample data
- Enable email confirmations
- Set up proper backup strategies
- Monitor performance and optimize queries as needed

## Support

If you encounter issues:

1. Check the Supabase logs in your dashboard
2. Verify your environment variables
3. Ensure all SQL files were executed successfully
4. Check the browser console for client-side errors

## Next Steps

After setting up the database:

1. Start the development server: `npm run dev`
2. Test user registration and login
3. Verify that different user roles see appropriate data
4. Test the real-time features (if implemented)
5. Configure any additional integrations (maps, notifications, etc.)