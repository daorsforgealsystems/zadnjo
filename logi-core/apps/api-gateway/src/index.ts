import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    // Attach roles/claims
    (req as any).user = decoded;
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

// Basic proxy routes with identity propagation
const withIdentity = (target: string) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    onProxyReq: (proxyReq, req) => {
      const user = (req as any).user;
      if (user) {
        proxyReq.setHeader('x-user-id', user.sub || user.id || 'unknown');
        proxyReq.setHeader('x-user-roles', Array.isArray(user.roles) ? user.roles.join(',') : '');
      }
    },
  });

app.use('/api/v1/users', withIdentity(targets.user));
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