-- Migration: Authentication Tables
-- Version: 002
-- Description: Add authentication and session management tables

-- Create refresh_tokens table for JWT refresh token management
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_used_at TIMESTAMPTZ
);

-- Create password_reset_tokens table for password reset functionality
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    used_at TIMESTAMPTZ
);

-- Create user_sessions table for session tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_activity_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Create user_permissions table for fine-grained permissions
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_key TEXT NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT true,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, permission_key)
);

-- Create roles table for role-based access control
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_roles table for many-to-many relationship between users and roles
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, role_id)
);

-- Create role_permissions table for role-based permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_key TEXT NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT true,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (role_id, permission_key)
);

-- Insert default roles
INSERT INTO roles (id, name, description) VALUES
    ('role_admin', 'ADMIN', 'System administrator with full access'),
    ('role_manager', 'MANAGER', 'Manager with operational access'),
    ('role_user', 'USER', 'Regular user with basic access'),
    ('role_driver', 'DRIVER', 'Driver with delivery access'),
    ('role_customer', 'CUSTOMER', 'Customer with limited access')
ON CONFLICT (id) DO NOTHING;

-- Assign default roles to existing users
INSERT INTO user_roles (user_id, role_id) 
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.role = r.name 
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_key ON user_permissions(permission_key);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_key ON role_permissions(permission_key);

-- Add comments for documentation
COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for session management';
COMMENT ON TABLE password_reset_tokens IS 'Tokens for password reset functionality';
COMMENT ON TABLE user_sessions IS 'User session tracking';
COMMENT ON TABLE user_permissions IS 'Fine-grained user permissions';
COMMENT ON TABLE roles IS 'User roles for RBAC';
COMMENT ON TABLE user_roles IS 'Many-to-many relationship between users and roles';
COMMENT ON TABLE role_permissions IS 'Permissions assigned to roles';

-- Verify migration
SELECT 'Migration 002 completed successfully' as status;