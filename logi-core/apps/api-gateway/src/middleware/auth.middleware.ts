import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import winston from 'winston';

// Initialize Supabase client for JWT validation
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Configure logger for auth middleware
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'auth-middleware' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
    iat?: number;
    exp?: number;
  };
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Skip authentication for public routes
  if (req.path.startsWith('/public') || 
      req.path === '/health' || 
      req.path === '/readyz' || 
      req.path === '/discovery' ||
      req.path.startsWith('/api/v1/auth')) {
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    logger.warn('Missing authorization header', { 
      path: req.path, 
      ip: req.ip,
      method: req.method
    });
    return res.status(401).json({ 
      error: 'Missing Authorization header',
      code: 'MISSING_AUTH_HEADER'
    });
  }

  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    logger.warn('Invalid authorization header format', { 
      path: req.path, 
      ip: req.ip,
      method: req.method
    });
    return res.status(401).json({ 
      error: 'Invalid Authorization header format',
      code: 'INVALID_AUTH_FORMAT'
    });
  }

  try {
    // Verify the JWT token using Supabase's built-in validation
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error(error?.message || 'Invalid Supabase token');
    }

    // Extract user roles from user metadata or use default
    const roles = user.user_metadata?.roles || ['USER'];

    // Attach user info to request
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email || '',
      roles: roles,
      iat: user.created_at ? Math.floor(new Date(user.created_at).getTime() / 1000) : undefined,
      exp: user.last_sign_in_at ? Math.floor(new Date(user.last_sign_in_at).getTime() / 1000 + 3600) : undefined
    };

    logger.debug('User authenticated successfully with Supabase', {
      userId: user.id,
      email: user.email,
      roles: roles,
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    logger.warn('Invalid Supabase token', {
      path: req.path,
      ip: req.ip,
      method: req.method,
      error: (error as Error).message
    });

    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Role-based access control middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRoles = user.roles || [];
    const hasPermission = roles.some(role => userRoles.includes(role));
    
    if (!hasPermission) {
      logger.warn('Access denied - insufficient permissions', {
        userId: user.id,
        email: user.email,
        requiredRoles: roles,
        userRoles: userRoles,
        path: req.path,
        method: req.method
      });
      
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles
      });
    }

    next();
  };
};

// Permission-based access control middleware
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // In a real implementation, this would check user permissions in the database
    // For now, we'll use a simple mapping based on roles
    const permissions = getPermissionsForUser(user);
    
    if (!permissions.includes(permission)) {
      logger.warn('Access denied - insufficient permissions', {
        userId: user.id,
        email: user.email,
        requiredPermission: permission,
        userPermissions: permissions,
        path: req.path,
        method: req.method
      });
      
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredPermission: permission
      });
    }

    next();
  };
};

// Helper function to get permissions based on user roles
function getPermissionsForUser(user: { roles: string[] }): string[] {
  const permissions: string[] = [];
  
  if (user.roles.includes('ADMIN')) {
    permissions.push(
      'manage_users',
      'manage_system',
      'view_analytics',
      'create_orders',
      'edit_orders',
      'delete_orders',
      'view_reports',
      'export_data'
    );
  }
  
  if (user.roles.includes('MANAGER')) {
    permissions.push(
      'view_analytics',
      'create_orders',
      'edit_orders',
      'view_reports',
      'export_data'
    );
  }
  
  if (user.roles.includes('USER') || user.roles.includes('DRIVER') || user.roles.includes('CUSTOMER')) {
    permissions.push(
      'create_orders',
      'view_reports'
    );
  }
  
  return permissions;
}