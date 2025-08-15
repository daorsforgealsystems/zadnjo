-- Row Level Security (RLS) Policies for DAORS Flow Motion
-- This file sets up security policies to control data access based on user roles

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM public.users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can access item
CREATE OR REPLACE FUNCTION can_access_item(item_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.users 
    WHERE id = auth.uid();
    
    -- Admins and managers can access all items
    IF user_role IN ('ADMIN', 'MANAGER') THEN
        RETURN TRUE;
    END IF;
    
    -- Clients can only access their associated items
    IF user_role = 'CLIENT' THEN
        RETURN EXISTS (
            SELECT 1 FROM public.user_items ui
            WHERE ui.user_id = auth.uid() AND ui.item_id = item_id
        );
    END IF;
    
    -- Drivers can access items on their routes
    IF user_role = 'DRIVER' THEN
        RETURN EXISTS (
            SELECT 1 FROM public.items i
            JOIN public.routes r ON i.route_id = r.id
            WHERE i.id = item_id AND r.driver_id = auth.uid()
        );
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS TABLE POLICIES
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.users WHERE id = auth.uid()));

-- Admins can read all users
CREATE POLICY "Admins can read all users" ON public.users
    FOR SELECT USING (get_user_role() = 'ADMIN');

-- Admins can update all users
CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (get_user_role() = 'ADMIN');
    
-- Allow user creation during signup
CREATE POLICY "Allow user creation during signup" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ITEMS TABLE POLICIES
-- Users can read items based on their role and access rights
CREATE POLICY "Users can read accessible items" ON public.items
    FOR SELECT USING (
        get_user_role() IN ('ADMIN', 'MANAGER') OR
        can_access_item(id)
    );

-- Admins and managers can create items
CREATE POLICY "Admins and managers can create items" ON public.items
    FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN', 'MANAGER'));

-- Admins and managers can update items
CREATE POLICY "Admins and managers can update items" ON public.items
    FOR UPDATE USING (get_user_role() IN ('ADMIN', 'MANAGER'));

-- Drivers can update items on their routes
CREATE POLICY "Drivers can update their route items" ON public.items
    FOR UPDATE USING (
        get_user_role() = 'DRIVER' AND
        EXISTS (
            SELECT 1 FROM public.routes r
            WHERE r.id = route_id AND r.driver_id = auth.uid()
        )
    );

-- ROUTES TABLE POLICIES
-- Users can read routes based on their role
CREATE POLICY "Users can read accessible routes" ON public.routes
    FOR SELECT USING (
        get_user_role() IN ('ADMIN', 'MANAGER') OR
        (get_user_role() = 'DRIVER' AND driver_id = auth.uid()) OR
        (get_user_role() = 'CLIENT' AND EXISTS (
            SELECT 1 FROM public.items i
            WHERE i.route_id = id AND can_access_item(i.id)
        ))
    );

-- Admins and managers can create routes
CREATE POLICY "Admins and managers can create routes" ON public.routes
    FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN', 'MANAGER'));

-- Admins and managers can update routes
CREATE POLICY "Admins and managers can update routes" ON public.routes
    FOR UPDATE USING (get_user_role() IN ('ADMIN', 'MANAGER'));

-- Drivers can update their own routes
CREATE POLICY "Drivers can update own routes" ON public.routes
    FOR UPDATE USING (
        get_user_role() = 'DRIVER' AND
        driver_id = auth.uid()
    );

-- ANOMALIES TABLE POLICIES
-- Users can read anomalies based on route access
CREATE POLICY "Users can read accessible anomalies" ON public.anomalies
    FOR SELECT USING (
        get_user_role() IN ('ADMIN', 'MANAGER') OR
        EXISTS (
            SELECT 1 FROM public.routes r
            WHERE r.id = route_id AND (
                (get_user_role() = 'DRIVER' AND r.driver_id = auth.uid()) OR
                (get_user_role() = 'CLIENT' AND EXISTS (
                    SELECT 1 FROM public.items i
                    WHERE i.route_id = r.id AND can_access_item(i.id)
                ))
            )
        )
    );

-- Admins and managers can create anomalies
CREATE POLICY "Admins and managers can create anomalies" ON public.anomalies
    FOR INSERT WITH CHECK (get_user_role() IN ('ADMIN', 'MANAGER'));

-- System can create anomalies (for automated detection)
CREATE POLICY "System can create anomalies" ON public.anomalies
    FOR INSERT WITH CHECK (true);

-- NOTIFICATIONS TABLE POLICIES
-- Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- System can create notifications for users
CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- CHAT MESSAGES TABLE POLICIES
-- Users can read chat messages for accessible shipments
CREATE POLICY "Users can read accessible chat messages" ON public.chat_messages
    FOR SELECT USING (can_access_item(shipment_id));

-- Users can create chat messages for accessible shipments
CREATE POLICY "Users can create chat messages" ON public.chat_messages
    FOR INSERT WITH CHECK (
        can_access_item(shipment_id) AND
        user_id = auth.uid()
    );

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to service role for system operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
