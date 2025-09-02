# Comprehensive Guide to Deploying Modern Web Applications

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Configuration Management](#configuration-management)
5. [Security Best Practices](#security-best-practices)
6. [Deployment Scenarios](#deployment-scenarios)
   - [Netlify + Docker Hybrid Setup](#netlify--docker-hybrid-setup)
   - [AWS ECS/EKS](#aws-ecseks)
   - [Heroku with Docker](#heroku-with-docker)
   - [Google Cloud Platform](#google-cloud-platform)
   - [Azure Container Instances](#azure-container-instances)
7. [CI/CD Pipeline Configuration](#cicd-pipeline-configuration)
8. [Troubleshooting and Common Errors](#troubleshooting-and-common-errors)
9. [Scalability Optimizations](#scalability-optimizations)
10. [Monitoring and Maintenance](#monitoring-and-maintenance)
11. [Deployment Checklist](#deployment-checklist)

## Introduction

This comprehensive guide covers the deployment of modern web applications using a hybrid architecture combining Netlify for static frontend hosting and serverless functions with Docker for containerized backend services. The guide is based on the Flow Motion logistics platform architecture and provides detailed instructions for multiple cloud platforms.

### Architecture Overview

- **Frontend**: React/Vite application deployed on Netlify
- **Backend**: Microservices architecture with API Gateway
- **Database**: PostgreSQL with Redis caching
- **Deployment**: Hybrid Netlify + Docker containers
- **CI/CD**: GitHub Actions with Netlify integration

## Prerequisites

### System Requirements

- **Node.js**: 20.17.0 or higher
- **Docker**: 24.0+ with Docker Compose
- **Git**: 2.30+
- **NPM/Yarn**: Latest stable versions

### Cloud Platform Accounts

- **Netlify**: For frontend and serverless functions
- **AWS/Heroku/GCP/Azure**: For container orchestration
- **GitHub**: For source control and CI/CD

### Development Tools

```bash
# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Netlify CLI
npm install -g netlify-cli
```

### Network and Security

- Domain name with DNS management
- SSL certificates (Let's Encrypt or platform-provided)
- Firewall configuration
- VPN access for secure deployments

## Environment Setup

### Local Development Environment

1. **Clone the repository**
```bash
git clone https://github.com/your-org/flow-motion.git
cd flow-motion
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment configuration**
```bash
cp .env.example .env
# Edit .env with your local configuration
```

4. **Start local development**
```bash
# Start all services with Docker Compose
docker-compose up -d

# Or start frontend only
npm run dev
```

### Netlify Setup

1. **Connect repository**
```bash
netlify login
netlify init
```

2. **Configure build settings**
```bash
# netlify.toml
[build]
  command = "npm run build:netlify"
  publish = "dist"
  functions = "netlify/functions"
  edge_functions = "netlify/edge-functions"
```

3. **Environment variables**
```bash
netlify env:set VITE_API_BASE_URL "/api"
netlify env:set VITE_SUPABASE_URL "your_supabase_url"
netlify env:set VITE_SUPABASE_ANON_KEY "your_anon_key"
```

### Docker Environment

1. **Build images**
```bash
# Build all services
docker-compose build

# Build specific service
docker build -t flow-motion-api ./logi-core/apps/api-gateway
```

2. **Container networking**
```bash
# Create network
docker network create logi-network

# Run containers
docker-compose up -d
```

## Configuration Management

### Netlify Configuration Files

#### netlify.toml
```toml
[build]
  command = "npm run build:netlify"
  publish = "dist"
  functions = "netlify/functions"
  edge_functions = "netlify/edge-functions"

[build.environment]
  NODE_VERSION = "20"
  NPM_VERSION = "10"

[[redirects]]
  from = "/api/*"
  to = "https://api.yourdomain.com/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[edge_functions]]
  function = "geo-router"
  path = "/api/*"
```

#### _redirects
```
/api/*  https://api.yourdomain.com/:splat  200
/*      /index.html   200
```

### Docker Configuration

#### Dockerfile (Frontend)
```dockerfile
FROM node:20.17.0-alpine AS build
ARG VITE_BUILD_MODE=docker

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --mode $VITE_BUILD_MODE

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - api-gateway
    environment:
      - NODE_ENV=production
    networks:
      - logi-network

  api-gateway:
    build:
      context: ./logi-core/apps/api-gateway
    environment:
      - PORT=8080
      - JWT_SECRET=${JWT_SECRET:-dev-secret}
      - USER_SERVICE_URL=http://user-service:4001
    ports:
      - "8080:8080"
    depends_on:
      - user-service
    networks:
      - logi-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=logistics
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres123
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d logistics"]
      interval: 10s
      timeout: 5s
      retries: 10
    networks:
      - logi-network

volumes:
  postgres_data:

networks:
  logi-network:
    driver: bridge
```

## Security Best Practices

### Netlify Security

1. **Content Security Policy**
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://*.netlify.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.yourdomain.com wss://*.supabase.co"
```

2. **Environment Variables**
- Never commit secrets to version control
- Use Netlify's encrypted environment variables
- Rotate keys regularly

3. **Access Control**
```toml
# Restrict access to sensitive functions
[[edge_functions]]
  function = "auth-middleware"
  path = "/api/admin/*"
```

### Docker Security

1. **Image Security**
```dockerfile
# Use specific image versions
FROM node:20.17.0-alpine

# Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Minimize attack surface
RUN apk add --no-cache libc6-compat
```

2. **Container Runtime Security**
```yaml
services:
  api-gateway:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
```

3. **Network Security**
```yaml
networks:
  logi-network:
    driver: bridge
    internal: true
```

### API Security

1. **Authentication & Authorization**
```javascript
// Middleware for JWT validation
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

2. **Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
```

## Deployment Scenarios

### Netlify + Docker Hybrid Setup

1. **Frontend Deployment**
```bash
# Build and deploy to Netlify
npm run build:netlify
netlify deploy --prod --dir=dist
```

2. **Backend Container Deployment**
```bash
# Build and push Docker images
docker build -t your-registry/flow-motion-api:latest ./logi-core/apps/api-gateway
docker push your-registry/flow-motion-api:latest

# Deploy containers
docker-compose -f docker-compose.prod.yml up -d
```

3. **Integration Configuration**
```javascript
// netlify/functions/api-proxy.js
export async function handler(event, context) {
  const { path } = event;
  const apiUrl = process.env.API_BASE_URL;

  try {
    const response = await fetch(`${apiUrl}${path}`, {
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': event.headers.authorization
      },
      body: event.body
    });

    return {
      statusCode: response.status,
      body: await response.text(),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}
```

### AWS ECS/EKS

1. **ECS Deployment**
```json
{
  "family": "flow-motion-api",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "api-gateway",
      "image": "your-registry/flow-motion-api:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/flow-motion-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

2. **EKS Deployment**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flow-motion-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: flow-motion-api
  template:
    metadata:
      labels:
        app: flow-motion-api
    spec:
      containers:
      - name: api-gateway
        image: your-registry/flow-motion-api:latest
        ports:
        - containerPort: 8080
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Heroku with Docker

1. **Heroku Setup**
```bash
# Login to Heroku
heroku login

# Create app
heroku create flow-motion-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_jwt_secret
```

2. **Docker Deployment**
```bash
# Use Heroku's container registry
heroku container:login

# Build and push
heroku container:push web --app flow-motion-api

# Release
heroku container:release web --app flow-motion-api
```

3. **Heroku Configuration**
```yaml
# heroku.yml
build:
  docker:
    web: Dockerfile
run:
  web: npm start
```

### Google Cloud Platform

1. **Cloud Run Deployment**
```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/your-project/flow-motion-api

# Deploy to Cloud Run
gcloud run deploy flow-motion-api \
  --image gcr.io/your-project/flow-motion-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

2. **GKE Deployment**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flow-motion-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: flow-motion-api
  template:
    metadata:
      labels:
        app: flow-motion-api
    spec:
      containers:
      - name: api-gateway
        image: gcr.io/your-project/flow-motion-api:latest
        ports:
        - containerPort: 8080
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Azure Container Instances

1. **ACI Deployment**
```bash
# Create resource group
az group create --name flow-motion-rg --location eastus

# Create container instance
az container create \
  --resource-group flow-motion-rg \
  --name flow-motion-api \
  --image your-registry/flow-motion-api:latest \
  --cpu 1 \
  --memory 1 \
  --registry-login-server your-registry.azurecr.io \
  --registry-username your-username \
  --registry-password your-password \
  --ip-address public \
  --ports 8080 \
  --environment-variables NODE_ENV=production
```

2. **Azure Container Apps**
```bash
# Create container app environment
az containerapp env create \
  --name flow-motion-env \
  --resource-group flow-motion-rg \
  --location eastus

# Create container app
az containerapp create \
  --name flow-motion-api \
  --resource-group flow-motion-rg \
  --environment flow-motion-env \
  --image your-registry/flow-motion-api:latest \
  --target-port 8080 \
  --ingress external \
  --query properties.configuration.ingress.fqdn
```

## CI/CD Pipeline Configuration

### GitHub Actions + Netlify

1. **GitHub Actions Workflow**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  NODE_VERSION: 20

jobs:
  setup:
    runs-on: ubuntu-latest
    outputs:
      cache-key: ${{ steps.cache-key.outputs.key }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Generate cache key
        id: cache-key
        run: |
          echo "key=node-${{ env.NODE_VERSION }}-${{ hashFiles('**/package-lock.json') }}" >> $GITHUB_OUTPUT

  lint-and-typecheck:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: '**/package-lock.json'

      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.npm
          key: ${{ needs.setup.outputs.cache-key }}
          restore-keys: |
            node-${{ env.NODE_VERSION }}-

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

  test:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.npm
          key: ${{ needs.setup.outputs.cache-key }}

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test -- --run --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          file: ./coverage/coverage-final.json

  build:
    needs: setup
    runs-on: ubuntu-latest
    strategy:
      matrix:
        build-mode: [development, production]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.npm
          key: ${{ needs.setup.outputs.cache-key }}

      - name: Install dependencies
        run: npm ci

      - name: Cache Vite build
        uses: actions/cache@v3
        with:
          path: |
            .vite
            dist
          key: vite-${{ runner.os }}-${{ matrix.build-mode }}-${{ hashFiles('vite.config.ts', 'src/**') }}

      - name: Build
        run: |
          if [ "${{ matrix.build-mode }}" = "development" ]; then
            npm run build:dev
          else
            npm run build:netlify
          fi

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist-${{ matrix.build-mode }}
          path: dist/
          retention-days: 7

  deploy:
    needs: [lint-and-typecheck, test, build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download production build
        uses: actions/download-artifact@v4
        with:
          name: dist-production
          path: dist/

      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --dir=dist --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

2. **Netlify Build Hooks**
```javascript
// netlify/functions/build-hook.js
export async function handler(event, context) {
  const { body } = event;

  // Trigger backend deployment
  const backendDeployUrl = process.env.BACKEND_DEPLOY_HOOK;

  try {
    await fetch(backendDeployUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trigger: 'netlify-build',
        branch: 'main'
      })
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Backend deployment triggered' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to trigger backend deployment' })
    };
  }
}
```

## Troubleshooting and Common Errors

### Netlify Deployment Issues

1. **Build Failures**
```bash
# Check build logs
netlify logs

# Common solutions:
# - Verify Node.js version in netlify.toml
# - Check environment variables
# - Ensure build command is correct
# - Verify package.json scripts
```

2. **Function Timeout Errors**
```javascript
// Increase function timeout
export async function handler(event, context) {
  context.callbackWaitsForEmptyEventLoop = false;

  // Set timeout to 30 seconds
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Function timeout')), 29000)
  );

  try {
    const result = await Promise.race([
      yourFunction(),
      timeoutPromise
    ]);
    return result;
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
```

3. **CORS Issues**
```javascript
// netlify/functions/cors-proxy.js
export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Handle actual request
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'Success' })
  };
}
```

### Docker Container Issues

1. **Container Startup Failures**
```bash
# Check container logs
docker logs <container_name>

# Debug container
docker run -it --entrypoint /bin/sh your-image

# Common issues:
# - Missing environment variables
# - Port conflicts
# - Volume mount permissions
# - Health check failures
```

2. **Network Connectivity Problems**
```bash
# Test container networking
docker exec -it <container_name> curl http://localhost:8080/health

# Check network configuration
docker network inspect logi-network

# Solutions:
# - Verify service dependencies
# - Check firewall rules
# - Validate environment variables
```

3. **Resource Constraints**
```yaml
# Adjust resource limits
services:
  api-gateway:
    deploy:
      resources:
        limits:
          cpus: '0.50'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### Database Connection Issues

1. **PostgreSQL Connection Errors**
```bash
# Test database connection
docker exec -it postgres psql -U postgres -d logistics

# Check connection string
# DATABASE_URL=postgresql://user:password@host:port/database

# Common fixes:
# - Verify credentials
# - Check network connectivity
# - Validate SSL settings
# - Ensure database is running
```

2. **Migration Failures**
```bash
# Run migrations manually
docker-compose exec postgres psql -U logistics -d logistics -f /docker-entrypoint-initdb.d/schema.sql

# Check migration logs
docker-compose logs postgres
```

### Performance Issues

1. **Slow API Responses**
```javascript
// Add response caching
const cache = new Map();

const cacheMiddleware = (req, res, next) => {
  const key = req.originalUrl;
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
    return res.json(cached.data);
  }

  res.sendResponse = res.json;
  res.json = (data) => {
    cache.set(key, { data, timestamp: Date.now() });
    res.sendResponse(data);
  };

  next();
};
```

2. **Memory Leaks**
```javascript
// Monitor memory usage
const memUsage = process.memoryUsage();
console.log(`Memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`);

// Force garbage collection (if --expose-gc flag is set)
if (global.gc) {
  global.gc();
}
```

## Scalability Optimizations

### Frontend Optimizations

1. **Code Splitting**
```javascript
// Dynamic imports for route-based splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Component-based splitting
const HeavyComponent = lazy(() => import('./components/HeavyComponent'));
```

2. **Asset Optimization**
```javascript
// Vite configuration for optimization
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'moment']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

3. **Caching Strategies**
```toml
# Netlify caching configuration
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "public, max-age=300"
```

### Backend Optimizations

1. **Horizontal Scaling**
```yaml
# Kubernetes HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: flow-motion-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: flow-motion-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

2. **Load Balancing**
```javascript
// Express clustering
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  const app = express();
  // ... app configuration
  app.listen(8080);
}
```

3. **Database Optimization**
```sql
-- Create indexes for performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Query optimization
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE user_id = $1 AND created_at > $2
ORDER BY created_at DESC
LIMIT 10;
```

### Infrastructure Scaling

1. **CDN Configuration**
```toml
# Netlify CDN optimization
[build]
  command = "npm run build:netlify"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "https://api.yourdomain.com/:splat"
  status = 200
  headers = {X-Forwarded-For = "$forwarded_for"}
```

2. **Container Orchestration**
```yaml
# Docker Swarm scaling
version: '3.8'
services:
  api-gateway:
    image: flow-motion-api:latest
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
      resources:
        limits:
          cpus: '0.50'
          memory: 512M
    ports:
      - "8080:8080"
```

3. **Microservices Communication**
```javascript
// Circuit breaker pattern
const circuitBreaker = require('opossum');

const options = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
};

const breaker = circuitBreaker(asyncFunction, options);

breaker.fallback(() => 'Service temporarily unavailable');
```

## Monitoring and Maintenance

### Application Monitoring

1. **Health Checks**
```javascript
// Express health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/ready', (req, res) => {
  // Check database connectivity
  // Check external service availability
  res.status(200).json({ status: 'ready' });
});
```

2. **Logging**
```javascript
// Winston logger configuration
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

3. **Metrics Collection**
```javascript
// Prometheus metrics
const promClient = require('prom-client');
const register = new promClient.Registry();

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

register.registerMetric(httpRequestDuration);

// Middleware to collect metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  next();
});
```

### Infrastructure Monitoring

1. **Container Monitoring**
```yaml
# Docker health checks
services:
  api-gateway:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

2. **Resource Monitoring**
```bash
# Docker stats
docker stats

# Container resource usage
docker system df -v

# Network monitoring
docker network ls
docker network inspect logi-network
```

3. **Log Aggregation**
```yaml
# Docker logging drivers
services:
  api-gateway:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Maintenance Procedures

1. **Backup Strategy**
```bash
# Database backup
docker exec postgres pg_dump -U postgres logistics > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/logistics_$DATE.sql"

docker exec postgres pg_dump -U postgres logistics > $BACKUP_FILE

# Keep only last 7 days
find $BACKUP_DIR -name "logistics_*.sql" -mtime +7 -delete
```

2. **Update Procedures**
```bash
# Rolling updates with Docker Compose
docker-compose up -d --no-deps api-gateway

# Zero-downtime deployment
docker-compose up -d --scale api-gateway=2
docker-compose up -d --scale api-gateway=1
```

3. **Security Updates**
```bash
# Update Docker images
docker-compose pull

# Security scanning
docker scan your-image

# Dependency updates
npm audit fix
npm update
```

## Deployment Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Secrets properly secured
- [ ] Database migrations tested
- [ ] SSL certificates valid
- [ ] Domain DNS configured
- [ ] Build process verified
- [ ] Tests passing
- [ ] Security scan completed
- [ ] Performance benchmarks met

### Deployment Steps

- [ ] Code committed and pushed
- [ ] CI/CD pipeline triggered
- [ ] Frontend build successful
- [ ] Backend containers built
- [ ] Images pushed to registry
- [ ] Services deployed
- [ ] Health checks passing
- [ ] Load balancer configured
- [ ] DNS updated
- [ ] SSL certificates applied

### Post-Deployment

- [ ] Application accessible
- [ ] API endpoints responding
- [ ] Database connections working
- [ ] External integrations functional
- [ ] Monitoring alerts configured
- [ ] Logs accessible
- [ ] Performance monitoring active
- [ ] Backup procedures tested
- [ ] Rollback plan documented

### Security Verification

- [ ] HTTPS enabled
- [ ] Security headers applied
- [ ] CORS properly configured
- [ ] Authentication working
- [ ] Authorization enforced
- [ ] Rate limiting active
- [ ] Secrets not exposed
- [ ] Vulnerability scans passed

### Performance Validation

- [ ] Page load times acceptable
- [ ] API response times within limits
- [ ] Database queries optimized
- [ ] CDN working correctly
- [ ] Caching functioning
- [ ] Resource usage monitored
- [ ] Auto-scaling configured

This comprehensive guide provides everything needed to deploy modern web applications using Netlify and Docker across multiple cloud platforms. Regular updates and security patches should be applied to maintain optimal performance and security.