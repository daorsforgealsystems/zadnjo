# Netlify Deployment Guide for DAORS Flow Motion

## 🚀 Deploying to daorsflow.netlify.app

This guide will help you deploy the DAORS Flow Motion application to Netlify.

## Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Netlify CLI** (Optional): For command-line deployment

## Method 1: Deploy via Netlify Dashboard (Recommended)

### Step 1: Connect to GitHub

1. Log in to your Netlify account
2. Click "New site from Git"
3. Select "GitHub" as the provider
4. Authorize Netlify to access your GitHub account
5. Select the repository containing your DAORS Flow Motion code

### Step 2: Configure Build Settings

Netlify will automatically detect that this is a React/Vite application. Verify the following settings:

```
Build command: npm run build:netlify
Publish directory: dist
Node version: 18
```

### Step 3: Set Environment Variables

In the "Environment variables" section, add the following:

```
VITE_SUPABASE_URL = https://aysikssfvptxeclfymlk.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5c2lrc3NmdnB0eGVjbGZ5bWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODUwODcsImV4cCI6MjA3MDA2MTA4N30.MlhXvs_XZgSJxltCwMxn50FP0hZgOZDR8Jtl4SEDkOI

Note: this project also accepts NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (Next.js-style public env vars). If you're deploying a Next.js environment or using tools that expect NEXT_PUBLIC_ variables, set those too.
VITE_API_BASE_URL = /api
VITE_ENABLE_ANALYTICS = true
VITE_ENABLE_MOCK_DATA = false
VITE_LOG_LEVEL = warn
VITE_AUTH_PROVIDER = supabase
VITE_ENABLE_ANIMATIONS = true
VITE_ENABLE_CUSTOMIZATION = true
VITE_ENABLE_REAL_TIME = true
VITE_DEFAULT_THEME = light
VITE_DEFAULT_PRIMARY_COLOR = #3b82f6
VITE_ANIMATION_DURATION = 300
VITE_DEBOUNCE_DELAY = 1000
VITE_AUTO_SAVE_INTERVAL = 30000
VITE_DEPLOYMENT_ENV = netlify
VITE_APP_URL = https://daorsflow.netlify.app
```

### Step 4: Configure Custom Domain

1. Go to "Site settings" → "Domain management"
2. Add your custom domain: `daorsflow.netlify.app`
3. Follow the DNS configuration instructions provided by Netlify

### Step 5: Deploy

Click "Deploy site" to start the deployment process. Netlify will automatically build and deploy your application.

## Method 2: Deploy via Netlify CLI

### Site ID Information

Your Netlify site ID is: `ecde7505-1be4-4e1d-b477-3a48a2518e6a`

This ID is used to ensure deployments are targeted to the correct Netlify site. It's automatically included in the deployment scripts provided with this project.

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Login to Netlify

```bash
netlify login
```

### Step 3: Initialize Netlify

```bash
netlify init
```

Follow the prompts to:
- Link your repository
- Set up continuous deployment
- Configure build settings

### Step 4: Deploy Manually

```bash
# Build the application
npm run build:netlify

# Deploy to Netlify
netlify deploy --prod --dir=dist --site=ecde7505-1be4-4e1d-b477-3a48a2518e6a
```

## Method 3: Deploy via Git (Continuous Deployment)

### Step 1: Create netlify.toml

The `netlify.toml` file is already included in your project with the following configuration:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

# Redirect rules for SPA
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# API proxy configuration
[[redirects]]
  from = "/api/*"
  to = "https://your-api-gateway-url.com/api/:splat"
  status = 200
  force = true
```

### Step 2: Push to GitHub

Netlify will automatically deploy when you push to your connected GitHub branch:

```bash
git add .
git commit -m "Configure Netlify deployment"
git push origin main
```

## Post-Deployment Configuration

### 1. API Proxy Configuration

Update the `netlify.toml` file to point to your actual API gateway:

```toml
[[redirects]]
  from = "/api/*"
  to = "https://your-actual-api-gateway.com/api/:splat"
  status = 200
  force = true
```

### 2. Form Handling

If your application includes forms, configure form handling in Netlify:

```html
<form name="contact" netlify netlify-honeypot="bot-field" hidden>
  <input type="text" name="name" />
  <input type="email" name="email" />
  <textarea name="message"></textarea>
</form>
```

### 3. Environment Variables for Production

Make sure to update the environment variables in Netlify's dashboard with your production values:

- Update `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with your production Supabase credentials
- Update `VITE_API_BASE_URL` if your API is hosted elsewhere
- Set `VITE_ENABLE_ANALYTICS` to `true` for production analytics

### 4. Security Headers

The security headers are already configured in `netlify.toml` and `public/_headers`.

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Make sure all dependencies are in `package.json`
   - Check that the build command is correct: `npm run build:netlify`
   - Verify the Node version is set to 18

2. **Blank Page After Deployment**
   - Check that the `netlify.toml` has the correct redirect rules
   - Ensure the publish directory is set to `dist`
   - Verify that `public/_redirects` exists

3. **API Calls Not Working**
   - Update the API proxy configuration in `netlify.toml`
   - Check that environment variables are correctly set
   - Verify CORS settings on your API server

4. **Environment Variables Not Available**
   - Make sure variables are set in Netlify's dashboard
   - Check that variable names start with `VITE_` for frontend access
   - Restart the deployment after changing variables

### Deployment Logs

To view deployment logs:
1. Go to your Netlify dashboard
2. Select your site
3. Click on "Deploys" tab
4. Click on the specific deployment to view logs

### Local Testing

To test the build locally:

```bash
npm run build:netlify
npm run preview
```

## Monitoring and Analytics

### 1. Netlify Analytics

Enable Netlify Analytics in your site settings for detailed visitor analytics.

### 2. Error Tracking

Consider integrating error tracking services like Sentry or LogRocket:

```bash
npm install @sentry/react
```

### 3. Performance Monitoring

Use Netlify's built-in performance monitoring or integrate with external services.

## Rollback

If you need to rollback to a previous deployment:

1. Go to your Netlify dashboard
2. Select your site
3. Click on "Deploys" tab
4. Find the deployment you want to rollback to
5. Click "Publish deploy" to republish it

## Success!

Once deployed, your DAORS Flow Motion application will be available at:
- **Primary URL**: https://daorsflow.netlify.app
- **Admin Dashboard**: https://daorsflow.netlify.app/admin
- **Customer Portal**: https://daorsflow.netlify.app/portal

## Support

For additional support:
- Netlify Documentation: [docs.netlify.com](https://docs.netlify.com)
- Netlify Community: [community.netlify.com](https://community.netlify.com)
- Contact your development team for application-specific issues