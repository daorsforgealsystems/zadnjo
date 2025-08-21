#!/bin/bash

# Netlify Deployment Script for DAORS Flow Motion

set -e

echo "🚀 Starting Netlify deployment for DAORS Flow Motion..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI is not installed. Installing..."
    npm install -g netlify-cli
fi

# Check if user is logged in to Netlify
if ! netlify status &> /dev/null; then
    echo "🔐 Please log in to Netlify..."
    netlify login
fi

# Build the application
echo "🏗️  Building the application..."
npm run build:netlify

# Deploy to Netlify
echo "📤 Deploying to Netlify..."
netlify deploy --prod --dir=dist --site=ecde7505-1be4-4e1d-b477-3a48a2518e6a

echo "✅ Deployment completed successfully!"
echo "🌐 Your application is now live at: https://daorsflow.netlify.app"
echo ""
echo "To view deployment logs, run: netlify logs"
echo "To open the site, run: netlify open:site"