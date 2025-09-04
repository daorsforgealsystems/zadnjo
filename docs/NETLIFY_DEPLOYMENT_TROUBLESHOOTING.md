# Netlify Deployment Troubleshooting Guide

This guide provides comprehensive troubleshooting procedures for common Netlify deployment issues, along with diagnostic tools and resolution steps.

## Table of Contents

1. [Quick Diagnosis](#quick-diagnosis)
2. [Build Failures](#build-failures)
3. [Runtime Issues](#runtime-issues)
4. [Configuration Problems](#configuration-problems)
5. [Performance Issues](#performance-issues)
6. [Security Issues](#security-issues)
7. [Monitoring and Alerts](#monitoring-and-alerts)
8. [Emergency Procedures](#emergency-procedures)

## Quick Diagnosis

### Automated Diagnostic Script

Run the comprehensive diagnostic script:

```bash
# Quick diagnosis
npm run validate-deployment production quick

# Full diagnosis with all tests
npm run validate-deployment production full

# Check configuration only
npm run validate-netlify-config production
```

### Manual Checks

1. **Check Build Status**
   ```bash
   # View recent build logs
   npm run monitor-build report

   # Check build artifacts
   npm run analyze-build
   ```

2. **Verify Configuration**
   ```bash
   # Validate Netlify configuration
   npm run validate-netlify-config production

   # Check environment variables
   echo $NODE_ENV
   echo $VITE_API_BASE_URL
   ```

3. **Test Core Functionality**
   ```bash
   # Run smoke tests
   node scripts/validation/smoke-tests.sh production

   # Run integration tests
   node scripts/validation/integration-tests.sh production
   ```

## Build Failures

### Common Build Issues

#### 1. Node.js Version Mismatch

**Symptoms:**
- Build fails with "Node version not supported"
- Incompatible dependencies

**Diagnosis:**
```bash
# Check Node version in netlify.toml
grep "NODE_VERSION" netlify.toml

# Verify local Node version
node --version
```

**Resolution:**
```toml
[build.environment]
  NODE_VERSION = "20"
```

#### 2. Dependency Installation Failures

**Symptoms:**
- `npm install` fails
- Network timeouts
- Authentication errors

**Diagnosis:**
```bash
# Check npm logs
npm run build:netlify 2>&1 | grep -i error

# Verify package-lock.json
npm ls --depth=0
```

**Resolution:**
```bash
# Clear npm cache
npm cache clean --force

# Regenerate package-lock.json
rm package-lock.json
npm install

# Check for problematic dependencies
npm audit
```

#### 3. Build Tool Errors

**Symptoms:**
- Vite build fails
- TypeScript compilation errors
- Asset optimization failures

**Diagnosis:**
```bash
# Run build with verbose logging
DEBUG=vite:* npm run build:netlify

# Check TypeScript errors
npm run type-check

# Analyze build output
npm run analyze-build
```

**Resolution:**
```bash
# Fix TypeScript errors
npm run type-check

# Clear build cache
rm -rf node_modules/.vite dist

# Update dependencies
npm update
```

#### 4. Memory Issues

**Symptoms:**
- Build crashes with "out of memory"
- Slow builds
- Incomplete builds

**Diagnosis:**
```bash
# Check current memory settings
grep "NODE_OPTIONS" netlify.toml

# Monitor memory usage during build
node --max-old-space-size=4096 scripts/analyze-build.js
```

**Resolution:**
```toml
[build.environment]
  NODE_OPTIONS = "--max-old-space-size=4096"
```

### Build Analysis Tools

```bash
# Generate build report
npm run analyze-build

# Compare with previous build
npm run compare-builds dist previous-dist

# Monitor build performance
npm run monitor-build
```

## Runtime Issues

### Application Runtime Problems

#### 1. JavaScript Errors

**Symptoms:**
- Console errors in browser
- Application fails to load
- Features not working

**Diagnosis:**
```bash
# Check browser console for errors
# Look for CORS errors, 404s, or JavaScript exceptions

# Verify asset loading
curl -I https://your-site.netlify.app/static/js/main.js

# Check for missing environment variables
console.log(import.meta.env.VITE_API_BASE_URL);
```

**Resolution:**
```javascript
// Add error boundaries
import { ErrorBoundary } from 'react-error-boundary';

function logError(error, errorInfo) {
  // Send to error tracking service
  console.error('Application error:', error, errorInfo);
}
```

#### 2. API Connection Issues

**Symptoms:**
- API calls failing
- CORS errors
- Authentication problems

**Diagnosis:**
```bash
# Test API endpoints
curl -H "Origin: https://your-site.netlify.app" \
     https://api.yourdomain.com/health

# Check CORS headers
curl -I https://api.yourdomain.com/health

# Verify environment variables
echo $VITE_API_BASE_URL
```

**Resolution:**
```javascript
// Add proper error handling for API calls
const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
```

#### 3. Asset Loading Problems

**Symptoms:**
- Images not loading
- Fonts not rendering
- CSS not applying

**Diagnosis:**
```bash
# Check asset URLs
curl -I https://your-site.netlify.app/static/css/main.css

# Verify build output
ls -la dist/static/

# Check for broken links in HTML
grep "static/" dist/index.html
```

**Resolution:**
```javascript
// Add asset loading error handling
const loadAsset = (src) => {
  return new Promise((resolve, reject) => {
    const element = src.endsWith('.css')
      ? Object.assign(document.createElement('link'), { rel: 'stylesheet' })
      : new Image();

    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error(`Failed to load asset: ${src}`));
    element.src = src;
    document.head.appendChild(element);
  });
};
```

## Configuration Problems

### Netlify Configuration Issues

#### 1. Redirect Rules

**Symptoms:**
- 404 errors for expected routes
- Incorrect redirects

**Diagnosis:**
```bash
# Test redirect rules
curl -L https://your-site.netlify.app/api/test

# Check redirect configuration
grep "redirects" netlify.toml
```

**Resolution:**
```toml
[[redirects]]
  from = "/api/*"
  to = "https://api.yourdomain.com/:splat"
  status = 200
```

#### 2. Header Configuration

**Symptoms:**
- Security warnings
- CORS issues
- Missing security headers

**Diagnosis:**
```bash
# Check security headers
curl -I https://your-site.netlify.app

# Validate CSP
curl -I https://your-site.netlify.app | grep -i "content-security-policy"
```

**Resolution:**
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
    Content-Security-Policy = "default-src 'self'; script-src 'self' https://*.netlify.com"
```

#### 3. Environment Variables

**Symptoms:**
- Features not working
- API calls failing
- Missing configuration

**Diagnosis:**
```bash
# Check environment variables in build logs
# Verify Netlify environment variables in dashboard

# Test with local environment
VITE_API_BASE_URL=https://api.yourdomain.com npm run build:netlify
```

**Resolution:**
```toml
[build.environment]
  VITE_API_BASE_URL = "https://api.yourdomain.com"
  NODE_ENV = "production"
```

### Edge Functions Issues

**Symptoms:**
- API proxy not working
- Geo-routing failures
- Edge function timeouts

**Diagnosis:**
```bash
# Check edge function logs
# Verify function file exists
ls -la netlify/edge-functions/

# Test edge function
curl -H "X-Forwarded-Host: your-site.netlify.app" \
     https://your-site.netlify.app/api/test
```

**Resolution:**
```javascript
// netlify/edge-functions/geo-router.js
export default async (request, context) => {
  // Add proper error handling
  try {
    const response = await fetch(backendUrl, {
      method: request.method,
      headers: request.headers,
      signal: AbortSignal.timeout(30000)
    });
    return response;
  } catch (error) {
    return new Response('Service unavailable', { status: 503 });
  }
};
```

## Performance Issues

### Build Performance

#### 1. Slow Builds

**Symptoms:**
- Builds taking too long
- Timeout errors

**Diagnosis:**
```bash
# Analyze build performance
npm run analyze-build

# Check build timing
time npm run build:netlify

# Monitor resource usage
npm run monitor-build
```

**Resolution:**
```toml
[build.environment]
  NODE_OPTIONS = "--max-old-space-size=4096"
  NETLIFY_BUILD_THREADS = "2"
```

#### 2. Large Bundle Sizes

**Symptoms:**
- Slow page loads
- Large JavaScript bundles

**Diagnosis:**
```bash
# Analyze bundle sizes
npm run analyze-build

# Check for unused dependencies
npx webpack-bundle-analyzer dist/static/js/*.js
```

**Resolution:**
```javascript
// Implement code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

// Use dynamic imports for heavy components
const HeavyComponent = lazy(() => import('./components/HeavyComponent'));
```

### Runtime Performance

#### 1. Slow Page Loads

**Symptoms:**
- High Time to First Byte (TTFB)
- Slow Largest Contentful Paint (LCP)

**Diagnosis:**
```bash
# Check page load performance
curl -o /dev/null -s -w "%{time_total}\n" https://your-site.netlify.app

# Analyze with Lighthouse
npx lighthouse https://your-site.netlify.app --output=json
```

**Resolution:**
```javascript
// Implement caching strategies
const cache = new Map();

const fetchWithCache = async (url, ttl = 300000) => { // 5 minutes
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  const response = await fetch(url);
  const data = await response.json();

  cache.set(url, { data, timestamp: Date.now() });
  return data;
};
```

## Security Issues

### Common Security Problems

#### 1. CSP Violations

**Symptoms:**
- Console warnings about CSP
- Blocked resources

**Diagnosis:**
```bash
# Check CSP headers
curl -I https://your-site.netlify.app | grep -i "content-security-policy"

# Monitor console for CSP violations
# Check browser developer tools
```

**Resolution:**
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' https://*.netlify.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.yourdomain.com"
```

#### 2. Mixed Content

**Symptoms:**
- HTTP resources on HTTPS pages
- Browser security warnings

**Diagnosis:**
```bash
# Scan for mixed content
grep -r "http://" dist/ || echo "No mixed content found"

# Check external links
grep -r "http://" src/ || echo "No HTTP links in source"
```

**Resolution:**
```javascript
// Force HTTPS for all links
const forceHttps = (url) => {
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
};
```

## Monitoring and Alerts

### Setting Up Monitoring

```bash
# Monitor build status
npm run monitor-build

# Set up automated monitoring
crontab -e
# Add: */5 * * * * cd /path/to/project && npm run monitor-build >> build-monitor.log 2>&1
```

### Alert Configuration

```bash
# Configure alerts for build failures
export BUILD_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK"

# Monitor with custom thresholds
npm run monitor-build -- --alert-threshold=3
```

### Log Analysis

```bash
# Analyze recent build logs
tail -f build-logs/build-*.log

# Search for errors
grep -r "ERROR" build-logs/

# Generate performance reports
npm run analyze-build
```

## Emergency Procedures

### Immediate Actions for Critical Issues

#### 1. Stop the Bleeding

```bash
# Immediate rollback
npm run rollback-deployment latest immediate

# Or manual rollback via Netlify dashboard
# 1. Go to Netlify dashboard
# 2. Select site
# 3. Go to Deploys
# 4. Find working deploy
# 5. Click "Publish deploy"
```

#### 2. Communicate with Stakeholders

```bash
# Send status update
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🚨 Deployment issue detected - investigating"}' \
  "$SLACK_WEBHOOK_URL"
```

#### 3. Gather Diagnostic Information

```bash
# Collect system information
npm run validate-deployment production full > emergency-diagnostics.log

# Archive logs
tar -czf emergency-logs-$(date +%Y%m%d_%H%M%S).tar.gz build-logs/ validation-results/
```

### Recovery Steps

#### 1. Identify Root Cause

```bash
# Run diagnostics
npm run validate-netlify-config production
npm run analyze-build
npm run monitor-build report
```

#### 2. Apply Fix

```bash
# Fix identified issues
# Rebuild and redeploy
npm run build:netlify
npm run validate-deployment production standard
```

#### 3. Verify Fix

```bash
# Run comprehensive tests
npm run validate-deployment production full

# Monitor for 30 minutes
npm run monitor-build -- --duration=1800
```

#### 4. Gradual Rollout

```bash
# If using canary deployment
npm run rollback-deployment latest canary

# Monitor canary performance
npm run monitor-build -- --canary
```

### Post-Incident Review

1. **Document the Incident**
   ```bash
   # Create incident report
   cat > incident-report-$(date +%Y%m%d).md << EOF
   # Incident Report - $(date)

   ## Summary
   ## Timeline
   ## Root Cause
   ## Resolution
   ## Prevention Measures
   EOF
   ```

2. **Update Monitoring**
   ```bash
   # Add new alerts based on incident
   # Update monitoring thresholds
   # Implement additional checks
   ```

3. **Improve Processes**
   ```bash
   # Update deployment checklist
   # Add new validation steps
   # Update documentation
   ```

## Prevention Best Practices

### 1. Pre-Deployment Checks

```bash
# Always run validation before deployment
npm run validate-deployment production standard

# Check configuration
npm run validate-netlify-config production
```

### 2. Monitoring Setup

```bash
# Set up continuous monitoring
npm run monitor-build

# Configure alerts
export ALERT_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK"
```

### 3. Backup Strategy

```bash
# Regular backups
crontab -e
# Add: 0 2 * * * cd /path/to/project && npm run analyze-build && cp -r dist backup-$(date +%Y%m%d)
```

### 4. Documentation

- Keep deployment procedures updated
- Document known issues and solutions
- Maintain troubleshooting runbooks
- Update team knowledge base

This comprehensive troubleshooting guide should help you diagnose and resolve most Netlify deployment issues. Remember to always test changes in a staging environment before deploying to production.