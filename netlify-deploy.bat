@echo off
echo 🚀 Starting Netlify deployment for DAORS Flow Motion...

REM Check if Netlify CLI is installed
netlify --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Netlify CLI is not installed. Installing...
    npm install -g netlify-cli
)

REM Check if user is logged in to Netlify
netlify status >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔐 Please log in to Netlify...
    netlify login
)

REM Build the application
echo 🏗️  Building the application...
npm run build:netlify

REM Deploy to Netlify
echo 📤 Deploying to Netlify...
netlify deploy --prod --dir=dist

echo ✅ Deployment completed successfully!
echo 🌐 Your application is now live at: https://daorsflow.netlify.app
echo.
echo To view deployment logs, run: netlify logs
echo To open the site, run: netlify open:site
pause