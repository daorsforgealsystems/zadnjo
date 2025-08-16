# Manual Deployment Instructions for Netlify

Since we encountered issues with the Netlify CLI, here are the step-by-step instructions to deploy manually:

## Step 1: Create a Netlify Account
1. Go to [https://app.netlify.com/signup](https://app.netlify.com/signup)
2. Sign up for an account (you can use GitHub, GitLab, Bitbucket, or email)

## Step 2: Create a New Site
1. After logging in, click "New site from Git"
2. Select "GitHub" as the provider
3. Authorize Netlify to access your GitHub account
4. Select the repository containing your code

## Step 3: Configure Build Settings
Netlify should automatically detect the settings, but verify:
- **Build command**: `npm run build:netlify`
- **Publish directory**: `dist`
- **Node version**: `18` or `LTS`

## Step 4: Set Environment Variables
In the "Environment variables" section, add these variables:

```
Key: VITE_SUPABASE_URL
Value: https://aysikssfvptxeclfymlk.supabase.co

Key: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5c2lrc3NmdnB0eGVjbGZ5bWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODUwODcsImV4cCI6MjA3MDA2MTA4N30.MlhXvs_XZgSJxltCwMxn50FP0hZgOZDR8Jtl4SEDkOI

Key: VITE_API_BASE_URL
Value: /api

Key: VITE_ENABLE_ANALYTICS
Value: true

Key: VITE_ENABLE_MOCK_DATA
Value: false

Key: VITE_LOG_LEVEL
Value: warn

Key: VITE_AUTH_PROVIDER
Value: supabase

Key: VITE_ENABLE_ANIMATIONS
Value: true

Key: VITE_ENABLE_CUSTOMIZATION
Value: true

Key: VITE_ENABLE_REAL_TIME
Value: true

Key: VITE_DEFAULT_THEME
Value: light

Key: VITE_DEFAULT_PRIMARY_COLOR
Value: #3b82f6

Key: VITE_ANIMATION_DURATION
Value: 300

Key: VITE_DEBOUNCE_DELAY
Value: 1000

Key: VITE_AUTO_SAVE_INTERVAL
Value: 30000

Key: VITE_DEPLOYMENT_ENV
Value: netlify

Key: VITE_APP_URL
Value: https://daorsflow.netlify.app
```

## Step 5: Configure Custom Domain
1. Go to "Site settings" → "Domain management"
2. Click "Add custom domain"
3. Enter: `daorsflow.netlify.app`
4. Follow the instructions to verify the domain

## Step 6: Deploy
1. Click "Deploy site"
2. Wait for the build to complete
3. Your site will be available at: `https://daorsflow.netlify.app`

## Alternative: Drag and Drop Deployment

If you prefer not to use Git integration:

1. Go to [https://app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag and drop the entire `dist` folder from your project
3. Netlify will deploy it instantly and give you a random URL
4. You can then set up a custom domain in the site settings

## Post-Deployment Checks

After deployment, verify:
1. The site loads correctly at `https://daorsflow.netlify.app`
2. All pages work (refreshing doesn't show 404)
3. Environment variables are properly loaded
4. API calls are working (if applicable)

## Troubleshooting

If you encounter issues:
1. Check the deployment logs in Netlify dashboard
2. Verify all environment variables are set correctly
3. Make sure the build command and publish directory are correct
4. Check that the `netlify.toml` file is in the root directory

## Success!

Once deployed, your DAORS Flow Motion application will be live at:
- **Primary URL**: https://daorsflow.netlify.app
- **Admin Dashboard**: https://daorsflow.netlify.app/admin
- **Customer Portal**: https://daorsflow.netlify.app/portal