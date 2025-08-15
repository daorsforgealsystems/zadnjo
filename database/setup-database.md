# Database Setup Instructions

## Quick Setup

1. **Go to your Supabase project**: https://aysikssfvptxeclfymlk.supabase.co
2. **Navigate to SQL Editor** in the left sidebar
3. **Execute the following SQL scripts in order:**

### Step 1: Create Tables
Copy and paste the content from `schema-fixed.sql` and run it.

### Step 2: Set up Row Level Security
Copy and paste the content from `rls-policies.sql` and run it.

### Step 3: (Optional) Add Sample Data
Copy and paste the content from `sample-data.sql` and run it.

## Verification

After running the scripts, you should see the following tables in your Supabase database:
- users
- routes
- items
- user_items
- item_history
- item_documents
- route_waypoints
- anomalies
- notifications
- chat_messages

## Test Signup

Once the database is set up, try signing up again. The error should be resolved.

## Troubleshooting

If you still get errors:
1. Check that all tables were created successfully
2. Verify that RLS policies are enabled
3. Make sure your Supabase URL and anon key are correct in the .env file
4. Check the browser console for more detailed error messages