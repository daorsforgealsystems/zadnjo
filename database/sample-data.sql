-- Sample Data for DAORS Flow Motion
-- This file contains sample data for testing the application
-- Note: This should be run after users are created through the application signup process

-- Sample routes
INSERT INTO public.routes (id, from_location, to_location, status, progress, eta, driver, predicted_eta, current_position, speed, planned_route) VALUES
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Belgrade, Serbia',
    'Zagreb, Croatia',
    'in_transit',
    65,
    NOW() + INTERVAL '3 hours',
    'john_driver',
    '{"time": "2024-01-15T18:30:00Z", "confidence": 85}',
    '{"lat": 44.8176, "lng": 20.4633}',
    75.5,
    '[{"lat": 44.8176, "lng": 20.4633}, {"lat": 45.0, "lng": 19.5}, {"lat": 45.8150, "lng": 15.9819}]'
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'Novi Sad, Serbia',
    'Budapest, Hungary',
    'planned',
    0,
    NOW() + INTERVAL '6 hours',
    'jane_driver',
    '{"time": "2024-01-15T21:00:00Z", "confidence": 92}',
    '{"lat": 45.2671, "lng": 19.8335}',
    0,
    '[{"lat": 45.2671, "lng": 19.8335}, {"lat": 46.0, "lng": 19.0}, {"lat": 47.4979, "lng": 19.0402}]'
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'Sarajevo, Bosnia',
    'Split, Croatia',
    'completed',
    100,
    NOW() - INTERVAL '2 hours',
    'mike_driver',
    '{"time": "2024-01-15T13:00:00Z", "confidence": 95}',
    '{"lat": 43.5081, "lng": 16.4402}',
    0,
    '[{"lat": 43.8563, "lng": 18.4131}, {"lat": 43.7, "lng": 17.5}, {"lat": 43.5081, "lng": 16.4402}]'
);

-- Sample items (shipments)
INSERT INTO public.items (id, name, status, location, coordinates, history, documents, route_id, predicted_eta) VALUES
(
    '660e8400-e29b-41d4-a716-446655440001',
    'Electronics Package #1001',
    'in_transit',
    'Belgrade, Serbia',
    '{"lat": 44.8176, "lng": 20.4633}',
    '[
        {"status": "picked_up", "timestamp": "2024-01-15T08:00:00Z"},
        {"status": "in_transit", "timestamp": "2024-01-15T09:30:00Z"},
        {"status": "customs_cleared", "timestamp": "2024-01-15T12:00:00Z"}
    ]',
    '[
        {"name": "Invoice", "url": "/documents/invoice_1001.pdf"},
        {"name": "Customs Declaration", "url": "/documents/customs_1001.pdf"}
    ]',
    '550e8400-e29b-41d4-a716-446655440001',
    '{"time": "2024-01-15T18:30:00Z", "confidence": 85}'
),
(
    '660e8400-e29b-41d4-a716-446655440002',
    'Medical Supplies #2001',
    'pending',
    'Novi Sad, Serbia',
    '{"lat": 45.2671, "lng": 19.8335}',
    '[
        {"status": "order_received", "timestamp": "2024-01-15T07:00:00Z"},
        {"status": "pending", "timestamp": "2024-01-15T07:30:00Z"}
    ]',
    '[
        {"name": "Medical Certificate", "url": "/documents/medical_2001.pdf"},
        {"name": "Temperature Log", "url": "/documents/temp_2001.pdf"}
    ]',
    '550e8400-e29b-41d4-a716-446655440002',
    '{"time": "2024-01-15T21:00:00Z", "confidence": 92}'
),
(
    '660e8400-e29b-41d4-a716-446655440003',
    'Automotive Parts #3001',
    'delivered',
    'Split, Croatia',
    '{"lat": 43.5081, "lng": 16.4402}',
    '[
        {"status": "picked_up", "timestamp": "2024-01-15T06:00:00Z"},
        {"status": "in_transit", "timestamp": "2024-01-15T07:00:00Z"},
        {"status": "delivered", "timestamp": "2024-01-15T13:00:00Z"}
    ]',
    '[
        {"name": "Parts List", "url": "/documents/parts_3001.pdf"},
        {"name": "Quality Certificate", "url": "/documents/quality_3001.pdf"}
    ]',
    '550e8400-e29b-41d4-a716-446655440003',
    '{"time": "2024-01-15T13:00:00Z", "confidence": 95}'
),
(
    '660e8400-e29b-41d4-a716-446655440004',
    'Textile Shipment #4001',
    'in_transit',
    'Belgrade, Serbia',
    '{"lat": 44.8176, "lng": 20.4633}',
    '[
        {"status": "picked_up", "timestamp": "2024-01-15T08:30:00Z"},
        {"status": "in_transit", "timestamp": "2024-01-15T10:00:00Z"}
    ]',
    '[
        {"name": "Textile Certificate", "url": "/documents/textile_4001.pdf"}
    ]',
    '550e8400-e29b-41d4-a716-446655440001',
    '{"time": "2024-01-15T18:30:00Z", "confidence": 85}'
);

-- Sample anomalies
INSERT INTO public.anomalies (type, timestamp, severity, description, vehicle_id, route_id) VALUES
(
    'SPEED_ANOMALY',
    NOW() - INTERVAL '2 hours',
    'medium',
    'Vehicle exceeded speed limit on highway section',
    'VH-001',
    '550e8400-e29b-41d4-a716-446655440001'
),
(
    'UNSCHEDULED_STOP',
    NOW() - INTERVAL '1 hour',
    'low',
    'Driver took unscheduled break at rest area',
    'VH-001',
    '550e8400-e29b-41d4-a716-446655440001'
),
(
    'ROUTE_DEVIATION',
    NOW() - INTERVAL '30 minutes',
    'high',
    'Vehicle deviated from planned route due to road closure',
    'VH-002',
    '550e8400-e29b-41d4-a716-446655440002'
);

-- Note: Users, notifications, and chat messages will be created through the application
-- as they require proper authentication context

-- Function to create sample notifications for a user (call after user signup)
CREATE OR REPLACE FUNCTION create_sample_notifications(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.notifications (type, message, user_id, related_id) VALUES
    (
        'status_change',
        'Your shipment Electronics Package #1001 is now in transit',
        user_uuid,
        '660e8400-e29b-41d4-a716-446655440001'
    ),
    (
        'anomaly',
        'Speed anomaly detected on route Belgrade → Zagreb',
        user_uuid,
        '550e8400-e29b-41d4-a716-446655440001'
    ),
    (
        'system_message',
        'Welcome to DAORS Flow Motion! Your account has been successfully created.',
        user_uuid,
        NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Function to create sample chat messages for a shipment (call after user signup)
CREATE OR REPLACE FUNCTION create_sample_chat_messages(user_uuid UUID, user_name TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.chat_messages (shipment_id, user_id, username, message) VALUES
    (
        '660e8400-e29b-41d4-a716-446655440001',
        user_uuid,
        user_name,
        'Hello, I would like to get an update on my shipment status.'
    ),
    (
        '660e8400-e29b-41d4-a716-446655440001',
        user_uuid,
        'support_agent',
        'Your shipment is currently in transit and on schedule. Expected delivery is at 18:30 today.'
    );
END;
$$ LANGUAGE plpgsql;