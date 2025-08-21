# Netlify Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Flow Motion logistics platform to Netlify with optimized backend integration.

## Architecture

### Frontend (Netlify)
- **Hosting**: Netlify CDN with global edge locations
- **Build**: Vite with TypeScript and React
- **Functions**: Serverless functions for lightweight operations
- **Edge Functions**: Geolocation-based routing and optimization

### Backend Integration
- **API Gateway**: LogiCore API Gateway with microservices
- **Proxy Configuration**: Intelligent routing based on environment
- **Circuit Breakers**: Resilient service communication
- **Health Monitoring**: Comprehensive health checks

## Deployment Process

### 1. Environment Setup

#### Required Environment Variables (Netlify Dashboard)
```bash
# API Configuration
VITE_API_BASE_URL=/api
VITE_SUPABASE_URL=https://aysikssfvptxeclfymlk.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_MOCK_DATA=false
VITE_LOG_LEVEL=warn
VITE_ENABLE_ANIMATIONS=true
VITE_ENABLE_CUSTOMIZATION=true
VITE_ENABLE_REAL_TIME=true

# Performance Settings
VITE_ANIMATION_DURATION=300
VITE_DEBOUNCE_DELAY=1000
VITE_AUTO_SAVE_INTERVAL=30000

# Security
VITE_ENABLE_CSP=true
VITE_ENABLE_HSTS=true

# Geolocation
VITE_ENABLE_GEO_ROUTING=true
VITE_DEFAULT_REGION=eu-central
```

### 2. Build Configuration

The `netlify.toml` file is configured with:
- **Node.js 24**: Updated from 18 to match package.json requirements
- **Build Command**: `npm run build:netlify`
- **Environment-specific API URLs**: Production, staging, and development
- **Security Headers**: CSP, HSTS, and other security measures
- **Caching Strategy**: Optimized for static assets
- **Build Plugins**: Custom optimization and validation

### 3. Netlify Functions

#### Available Functions

1. **Health Check** (`/.netlify/functions/health-check`)
   - Monitors frontend and backend health
   - Returns comprehensive status information
   - Used for monitoring and alerting

2. **Cache Warmer** (`/.netlify/functions/cache-warmer`)
   - Pre-warms critical API endpoints
   - Reduces cold start latency
   - Triggered after successful deployments

3. **Analytics** (`/.netlify/functions/analytics`)
   - Lightweight analytics event processing
   - Client-side event collection
   - Privacy-focused implementation

#### Function Development
```bash
# Install dependencies
cd netlify/functions
npm install

# Local development
netlify dev
```

### 4. Edge Functions

#### Geo Router (`/.netlify/edge-functions/geo-router`)
- **Purpose**: Route API requests to regional endpoints based on user location
- **Features**:
  - Automatic country detection
  - Regional API endpoint selection
  - Request proxying with geo headers
  - Fallback to default endpoint

#### Supported Regions
- **US/Canada**: `us-api.daorsflow.com`
- **Europe**: `eu-api.daorsflow.com`
- **Asia-Pacific**: `asia-api.daorsflow.com`
- **Balkans**: `balkans-api.daorsflow.com`
- **Default**: `api.daorsflow.com`

### 5. Backend Deployment

#### API Gateway Configuration
The LogiCore API Gateway should be deployed with:

```bash
# Environment Variables for API Gateway
PORT=8080
JWT_SECRET=your_jwt_secret_here
LOG_LEVEL=info

# Service URLs
USER_SERVICE_URL=http://user-service:4001
INVENTORY_SERVICE_URL=http://inventory-service:8000
ORDER_SERVICE_URL=http://order-service:4003
ROUTING_SERVICE_URL=http://routing-service:4004
GEO_SERVICE_URL=http://geo-service:4005
NOTIFY_SERVICE_URL=http://notify-service:4006

# Circuit Breaker Configuration
CIRCUIT_BREAKER_TIMEOUT=3000
CIRCUIT_BREAKER_ERROR_THRESHOLD=50
CIRCUIT_BREAKER_RESET_TIMEOUT=10000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Deployment Options

1. **Docker Compose** (Development)
```bash
cd logi-core
docker-compose up -d
```

2. **Kubernetes** (Production)
```bash
cd logi-core/k8s
kubectl apply -f base/
```

3. **Cloud Run** (Google Cloud)
```bash
# Build and deploy API Gateway
gcloud run deploy api-gateway \
  --source=logi-core/apps/api-gateway \
  --platform=managed \
  --region=europe-west1 \
  --allow-unauthenticated
```

### 6. Monitoring and Observability

#### Health Checks
- **Frontend**: `https://daorsflow.netlify.app/.netlify/functions/health-check`
- **Backend**: `https://api.daorsflow.com/health`
- **Readiness**: `https://api.daorsflow.com/readyz`

#### Metrics
- **API Gateway**: `https://api.daorsflow.com/metrics`
- **Build Manifest**: `https://daorsflow.netlify.app/build-manifest.json`

#### Logging
- **Netlify Functions**: Available in Netlify dashboard
- **API Gateway**: Winston structured logging
- **Services**: Individual service logs

### 7. Security Considerations

#### Content Security Policy
Configured in `netlify.toml` with:
- Restricted script sources
- API endpoint allowlisting
- Supabase integration support

#### Environment Variables
- **Never commit secrets** to version control
- Use Netlify environment variables for sensitive data
- Rotate keys regularly

#### HTTPS and HSTS
- Automatic HTTPS via Netlify
- HSTS headers configured
- Secure cookie settings

### 8. Performance Optimization

#### Caching Strategy
- **Static Assets**: 1 year cache with immutable flag
- **API Responses**: No-cache for dynamic content
- **Edge Caching**: Geo-distributed via Netlify CDN

#### Build Optimization
- **Bundle Splitting**: Automatic via Vite
- **Tree Shaking**: Dead code elimination
- **Image Optimization**: Automatic compression
- **CSS/JS Minification**: Enabled in build processing

### 9. Troubleshooting

#### Common Issues

1. **Build Failures**
   - Check Node.js version (must be 24+)
   - Verify environment variables
   - Review build logs in Netlify dashboard

2. **API Connection Issues**
   - Verify backend URL configuration
   - Check CORS settings
   - Monitor circuit breaker status

3. **Function Errors**
   - Check function logs in Netlify dashboard
   - Verify function dependencies
   - Test locally with `netlify dev`

#### Debug Commands
```bash
# Test health check
curl https://daorsflow.netlify.app/.netlify/functions/health-check

# Test geo routing
curl https://daorsflow.netlify.app/.netlify/edge-functions/geo-router

# Check build manifest
curl https://daorsflow.netlify.app/build-manifest.json

# Local development
netlify dev --live
```

### 10. Deployment Checklist

- [ ] Environment variables configured in Netlify dashboard
- [ ] Backend services deployed and accessible
- [ ] DNS configured for custom domain (if applicable)
- [ ] SSL certificate active
- [ ] Health checks passing
- [ ] Functions deployed and working
- [ ] Edge functions active
- [ ] Monitoring configured
- [ ] Error reporting enabled
- [ ] Performance monitoring active

## Continuous Deployment

### GitHub Integration
1. Connect repository to Netlify
2. Configure build settings
3. Set up branch-based deployments
4. Enable deploy previews

### Build Triggers
- **Production**: `main` branch pushes
- **Staging**: `develop` branch pushes
- **Preview**: Pull request creation

### Post-Deployment
- Automatic cache warming
- Health check validation
- Performance monitoring activation
- Error reporting initialization

## Support and Maintenance

### Regular Tasks
- Monitor health check endpoints
- Review function logs
- Update dependencies
- Rotate secrets
- Performance optimization

### Scaling Considerations
- Function concurrency limits
- API rate limiting
- CDN cache optimization
- Database connection pooling

For additional support, refer to the main project documentation or contact the development team.