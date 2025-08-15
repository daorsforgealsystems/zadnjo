-- This function encapsulates the entire guest login flow on the server-side
-- for maximum security and transactional integrity.
CREATE OR REPLACE FUNCTION handle_guest_login()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    guest_email TEXT;
    new_session JSON;
    user_profile RECORD;
BEGIN
    -- 1. Create the anonymous user in the auth schema
    -- Note: This is a conceptual representation. Direct user creation 
    -- from SQL is complex. This is often handled by a trusted Supabase client.
    -- For this example, we'll assume a helper function or direct insertion.
    guest_email := 'guest-' || gen_random_uuid() || '@example.com';
    
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (current_setting('app.instance_id')::UUID, gen_random_uuid(), 'authenticated', 'authenticated', guest_email, crypt('password', gen_salt('bf')), now(), '', now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
    RETURNING id INTO new_user_id;

    -- 2. Create the corresponding profile in the public schema
    INSERT INTO public.users (id, full_name, role, email)
    VALUES (new_user_id, 'Guest User', 'GUEST', guest_email)
    RETURNING * INTO user_profile;

    -- 3. Create a session for the new user (conceptual)
    -- In a real scenario, you would use a service role client to sign in the user
    -- and get a session. We will simulate this by returning the user profile.
    
    RETURN json_build_object(
        'user', json_build_object(
            'id', user_profile.id,
            'email', user_profile.email,
            'role', user_profile.role
        ),
        'session', '{}' -- Placeholder for session object
    );
EXCEPTION
    WHEN OTHERS THEN
        -- If anything fails, the transaction is rolled back.
        RAISE EXCEPTION 'Failed to create guest user transactionally.';
END;
$$;