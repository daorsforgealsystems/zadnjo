import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import CircuitBreaker from 'opossum';
import compression from 'compression';
import winston from 'winston';
import { validationResult, body } from 'express-validator';

dotenv.config();

// Configure structured logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-gateway' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const app = express();
const port = process.env.PORT || 8080;

// Security and performance middleware
app.use(helmet());
app.use(cors());
app.use(compression()); // Add response compression
app.use(express.json({ limit: '10mb' }));

// Enhanced logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Rate limiting with environment configuration
const limiter = rateLimit({ 
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), 
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Request validation middleware
const validateRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Request validation failed', { 
      path: req.path, 
      errors: errors.array(),
      ip: req.ip 
    });
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

// Enhanced RBAC middleware
const checkRole = (roles: string[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userRoles = user.roles || [];
    const hasPermission = roles.some(role => userRoles.includes(role));
    
    if (!hasPermission) {
      logger.warn('Access denied - insufficient permissions', {
        userId: user.sub || user.id,
        requiredRoles: roles,
        userRoles: userRoles,
        path: req.path
      });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Enhanced JWT auth middleware with better logging
app.use((req, res, next) => {
  if (req.path.startsWith('/public') || req.path === '/health' || req.path === '/readyz') {
    return next();
  }
  
  const auth = req.headers.authorization;
  if (!auth) {
    logger.warn('Missing authorization header', { path: req.path, ip: req.ip });
    return res.status(401).json({ error: 'Missing Authorization header' });
  }
  
  const token = auth.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
    (req as any).user = decoded;
    
    logger.debug('User authenticated', { 
      userId: decoded.sub || decoded.id,
      roles: decoded.roles,
      path: req.path 
    });
    
    return next();
  } catch (error) {
    logger.warn('Invalid token', { 
      path: req.path, 
      ip: req.ip,
      error: (error as Error).message 
    });
    return res.status(401).json({ error: 'Invalid token' });
  }
});

app.get('/health', (_req, res) => {
  logger.info('Health check requested');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Service targets (env-configurable)
const targets = {
  user: process.env.USER_SERVICE_URL || 'http://localhost:4001',
  inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:8000',
  orders: process.env.ORDER_SERVICE_URL || 'http://localhost:4003',
  routing: process.env.ROUTING_SERVICE_URL || 'http://localhost:4004',
  geo: process.env.GEO_SERVICE_URL || 'http://localhost:4005',
  notify: process.env.NOTIFY_SERVICE_URL || 'http://localhost:4006'
};

// Circuit breaker configuration with environment variables
const circuitBreakerOptions = {
  timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '3000'),
  errorThresholdPercentage: parseInt(process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD || '50'),
  resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT || '10000'),
  rollingCountTimeout: 10000,
  rollingCountBuckets: 10
};

// Create circuit breakers for each service
const circuitBreakers: Record<string, CircuitBreaker> = {};

Object.entries(targets).forEach(([serviceName, serviceUrl]) => {
  const healthCheckFunction = async () => {
    const { default: axios } = await import('axios');
    const response = await axios.get(`${serviceUrl}/health`, { timeout: 2000 });
    return response.data;
  };

  const breaker = new CircuitBreaker(healthCheckFunction, {
    ...circuitBreakerOptions,
    name: `${serviceName}-service`
  });

  // Circuit breaker event handlers
  breaker.on('open', () => {
    logger.error(`Circuit breaker opened for ${serviceName} service`, { service: serviceName });
  });

  breaker.on('halfOpen', () => {
    logger.warn(`Circuit breaker half-open for ${serviceName} service`, { service: serviceName });
  });

  breaker.on('close', () => {
    logger.info(`Circuit breaker closed for ${serviceName} service`, { service: serviceName });
  });

  breaker.on('failure', (error: Error) => {
    logger.error(`Circuit breaker failure for ${serviceName} service`, { 
      service: serviceName, 
      error: error.message 
    });
  });

  circuitBreakers[serviceName] = breaker;
});

// Enhanced proxy routes with identity propagation and circuit breaker
function withIdentity(target: string, serviceName: string) {
  const proxy = createProxyMiddleware({
    target,
    changeOrigin: true,
    timeout: 5000,
    proxyTimeout: 5000,
    on: {
      error: (err: Error, req: any, res: any) => {
        logger.error(`Proxy error for ${serviceName}`, {
          service: serviceName,
          error: err.message,
          path: req.url,
          method: req.method
        });
        
        if (!res.headersSent) {
          res.status(503).json({
            error: 'Service temporarily unavailable',
            service: serviceName,
            timestamp: new Date().toISOString()
          });
        }
      },
      proxyReq: (proxyReq: any, req: any) => {
        const user = (req as any).user;
        if (user) {
          proxyReq.setHeader('x-user-id', user.sub || user.id || 'unknown');
          proxyReq.setHeader('x-user-roles', Array.isArray(user.roles) ? user.roles.join(',') : '');
          proxyReq.setHeader('x-request-id', req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
        }
        
        logger.debug(`Proxying request to ${serviceName}`, {
          service: serviceName,
          path: req.url,
          method: req.method,
          userId: user?.sub || user?.id
        });
      },
      proxyRes: (proxyRes: any, req: any) => {
        logger.debug(`Received response from ${serviceName}`, {
          service: serviceName,
          path: req.url,
          statusCode: proxyRes.statusCode,
          responseTime: Date.now() - (req as any).startTime
        });
      }
    }
  });

  // Middleware to check circuit breaker before proxying
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    (req as any).startTime = Date.now();
    
    const breaker = circuitBreakers[serviceName];
    if (breaker && breaker.opened) {
      logger.warn(`Circuit breaker is open for ${serviceName}, rejecting request`, {
        service: serviceName,
        path: req.url
      });
      
      return res.status(503).json({
        error: 'Service temporarily unavailable - circuit breaker open',
        service: serviceName,
        timestamp: new Date().toISOString()
      });
    }
    
    proxy(req, res, next);
  };
}

// Service routes with enhanced proxy and circuit breaker
app.use('/api/v1/users', withIdentity(targets.user, 'user'));

// Proxy for /preferences/layout/no-session-guest to user service (public endpoint)
const preferencesProxy = createProxyMiddleware({
  target: targets.user,
  changeOrigin: true,
  pathRewrite: {
    '^/preferences/layout/no-session-guest': '/preferences/layout/no-session-guest',
  },
  on: {
    error: (err: Error, req: any, res: any) => {
      logger.error('Proxy error for preferences endpoint', {
        error: err.message,
        path: req.url
      });
      if (!res.headersSent) {
        res.status(503).json({ error: 'Service temporarily unavailable' });
      }
    }
  }
});

app.use('/preferences/layout/no-session-guest', preferencesProxy);

app.use('/api/v1/inventory', withIdentity(targets.inventory, 'inventory'));
app.use('/api/v1/orders', withIdentity(targets.orders, 'orders'));
app.use('/api/v1/routes', withIdentity(targets.routing, 'routing'));
app.use('/api/v1/tracking', withIdentity(targets.geo, 'geo'));
app.use('/api/v1/notifications', withIdentity(targets.notify, 'notify'));

// Example of protected admin routes with validation
app.post('/api/v1/admin/users',
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('roles').isArray().withMessage('Roles must be an array'),
  validateRequest,
  checkRole(['admin', 'super-admin']),
  withIdentity(targets.user, 'user')
);

// Example of manager-level routes
app.get('/api/v1/reports/*',
  checkRole(['manager', 'admin', 'super-admin']),
  withIdentity(targets.orders, 'orders')
);

// Enhanced readiness probe with circuit breaker integration
app.get('/readyz', async (_req, res) => {
  try {
    const results: Record<string, any> = {};
    const overallHealthy = true;
    
    // Check each service using circuit breakers
    await Promise.all(
      Object.entries(circuitBreakers).map(async ([serviceName, breaker]) => {
        try {
          if (breaker.opened) {
            results[serviceName] = {
              status: 'circuit-open',
              healthy: false,
              circuitState: 'open'
            };
          } else {
            const healthData = await breaker.fire() as any;
            results[serviceName] = {
              status: healthData?.status || 'ok',
              healthy: true,
              circuitState: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed'
            };
          }
        } catch (error) {
          results[serviceName] = {
            status: 'down',
            healthy: false,
            error: (error as Error).message,
            circuitState: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed'
          };
        }
      })
    );

    const allHealthy = Object.values(results).every((result: any) => result.healthy);
    const responseStatus = allHealthy ? 200 : 503;
    
    logger.info('Readiness check completed', { 
      overallHealthy: allHealthy, 
      services: Object.keys(results).length 
    });

    res.status(responseStatus).json({
      status: allHealthy ? 'ready' : 'not-ready',
      timestamp: new Date().toISOString(),
      services: results,
      summary: {
        total: Object.keys(results).length,
        healthy: Object.values(results).filter((r: any) => r.healthy).length,
        unhealthy: Object.values(results).filter((r: any) => !r.healthy).length
      }
    });
  } catch (error) {
    logger.error('Readiness check failed', { error: (error as Error).message });
    res.status(500).json({ 
      status: 'error', 
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

// Add metrics endpoint for monitoring
app.get('/metrics', (_req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    circuitBreakers: Object.entries(circuitBreakers).reduce((acc, [name, breaker]) => {
      acc[name] = {
        state: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed',
        stats: breaker.stats
      };
      return acc;
    }, {} as Record<string, any>)
  };
  
  res.json(metrics);
});

// Global error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
const server = app.listen(port, () => {
  logger.info(`API Gateway started successfully`, {
    port,
    environment: process.env.NODE_ENV || 'development',
    services: Object.keys(targets)
  });
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close circuit breakers
    Object.entries(circuitBreakers).forEach(([name, breaker]) => {
      breaker.shutdown();
      logger.info(`Circuit breaker closed for ${name}`);
    });
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));