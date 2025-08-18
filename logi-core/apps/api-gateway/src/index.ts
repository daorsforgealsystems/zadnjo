import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 100 });
app.use(limiter);

// Simple JWT auth middleware (RBAC-ready)
app.use((req, res, next) => {
  if (req.path.startsWith('/public') || req.path === '/health' || req.path === '/readyz') return next();
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  const token = auth.replace('Bearer ', '');
  try {
    // Use the UserInfo interface we defined
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as UserInfo;
    // Attach roles/claims
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Service targets (env-configurable)
const targets = {
  user: process.env.USER_SERVICE_URL || 'http://localhost:4001',
  inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:8000',
  orders: process.env.ORDER_SERVICE_URL || 'http://localhost:4003',
  routing: process.env.ROUTING_SERVICE_URL || 'http://localhost:4004',
  geo: process.env.GEO_SERVICE_URL || 'http://localhost:4005',
  notify: process.env.NOTIFY_SERVICE_URL || 'http://localhost:4006'
};

// Define interfaces for type safety
interface UserInfo {
  sub?: string;
  id?: string;
  roles?: string[];
  [key: string]: any;
}

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: UserInfo;
    }
  }
}

// Define ProxyRequest interface for the proxy request object
interface ProxyRequest {
  setHeader(name: string, value: string): void;
  getHeader(name: string): string | undefined;
  removeHeader(name: string): void;
  // Add other properties as needed
}

// Define options interface for proxy middleware
interface ProxyOptions {
  target: string;
  changeOrigin?: boolean;
  pathRewrite?: Record<string, string>;
  [key: string]: any;
}

// Basic proxy routes with identity propagation
function withIdentity(target: string) {
  const proxy = createProxyMiddleware({
    target,
    changeOrigin: true,
  });
  
  // Use the correct type for the proxy object
  if (typeof proxy === 'function') {
    const handler = proxy as RequestHandler & {
      on(event: string, callback: (proxyReq: ProxyRequest, req: express.Request, res: express.Response, options: ProxyOptions) => void): void;
    };
    
    handler.on('proxyReq', (proxyReq: ProxyRequest, req: express.Request) => {
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.sub || req.user.id || 'unknown');
        proxyReq.setHeader('x-user-roles', Array.isArray(req.user.roles) ? req.user.roles.join(',') : '');
      }
    });
    
    return handler;
  }
  
  return proxy as RequestHandler;
}

app.use('/api/v1/users', withIdentity(targets.user));

// Proxy for /preferences/layout/no-session-guest to user service
app.use('/preferences/layout/no-session-guest', createProxyMiddleware({
  target: targets.user,
  changeOrigin: true,
  pathRewrite: {
    '^/preferences/layout/no-session-guest': '/preferences/layout/no-session-guest',
  },
}));
app.use('/api/v1/inventory', withIdentity(targets.inventory));
app.use('/api/v1/orders', withIdentity(targets.orders));
app.use('/api/v1/routes', withIdentity(targets.routing));
app.use('/api/v1/tracking', withIdentity(targets.geo));
app.use('/api/v1/notifications', withIdentity(targets.notify));

// Readiness probe - checks downstream services
app.get('/readyz', async (_req, res) => {
  try {
    const { default: axios } = await import('axios');
    const endpoints: Record<string, string> = {
      user: `${targets.user}/health`,
      inventory: `${targets.inventory}/health`,
      orders: `${targets.orders}/health`,
      routing: `${targets.routing}/health`,
      geo: `${targets.geo}/health`,
      notify: `${targets.notify}/health`,
    };

    const results: Record<string, string> = {};
    await Promise.all(
      Object.entries(endpoints).map(async ([name, url]) => {
        try {
          const r = await axios.get(url, { timeout: 1200 });
          results[name] = r.data?.status || 'ok';
        } catch {
          results[name] = 'down';
        }
      })
    );
    res.json({ status: 'ok', services: results });
  } catch (e) {
    res.status(500).json({ status: 'error', error: (e as Error).message });
  }
});

app.listen(port, () => {
  console.log(`API Gateway listening on ${port}`);
});