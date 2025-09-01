#!/bin/bash

# Comprehensive Monorepo Setup Script for Logi-Core Project
# This script sets up, builds, and runs the full-stack application

set -e  # Exit on any error

echo "🚀 Starting Logi-Core Monorepo Setup..."

# Function to run command in directory
run_in_dir() {
    local dir=$1
    local cmd=$2
    echo "📁 In $dir: $cmd"
    (cd "$dir" && eval "$cmd")
}

# 1. Setup and Installation
echo "📦 Step 1: Installing dependencies for all components..."

# Frontend (root)
echo "🔧 Installing frontend dependencies..."
npm install

# Services
services=(
    "logi-core/services/geolocation-service"
    "logi-core/services/user-service"
    "logi-core/services/notification-service"
    "logi-core/services/order-service"
    "logi-core/services/routing-service"
    "logi-core/services/shared"
    "logi-core/apps/api-gateway"
)

for service in "${services[@]}"; do
    if [ -f "$service/package.json" ]; then
        echo "🔧 Installing dependencies for $service..."
        run_in_dir "$service" "npm install"
    fi
done

# Python service
echo "🐍 Installing Python dependencies for inventory-service..."
run_in_dir "logi-core/services/inventory-service" "pip install -r requirements.txt"

# 2. Initial Build
echo "🔨 Step 2: Building all components..."

# Frontend build
echo "🏗️ Building frontend..."
npm run build

# Services build
for service in "${services[@]}"; do
    if [ -f "$service/package.json" ]; then
        echo "🏗️ Building $service..."
        run_in_dir "$service" "npm run build"
    fi
done

# Python doesn't need build step typically

# 3. Verification Build (optional, but good practice)
echo "✅ Step 3: Verification - Rebuilding frontend..."
npm run build

# 4. Start Development Servers
echo "🌐 Step 4: Starting development servers..."

# Start frontend dev server in background
echo "🚀 Starting frontend dev server..."
npm run dev &
FRONTEND_PID=$!

# Start service dev servers in background
declare -A service_pids

for service in "${services[@]}"; do
    if [ -f "$service/package.json" ]; then
        echo "🚀 Starting $service dev server..."
        run_in_dir "$service" "npm run dev" &
        service_pids[$service]=$!
    fi
done

# Python service
echo "🐍 Starting inventory-service..."
run_in_dir "logi-core/services/inventory-service" "python main.py" &
INVENTORY_PID=$!

echo "🎉 All services started!"
echo "📋 PIDs:"
echo "  Frontend: $FRONTEND_PID"
for service in "${!service_pids[@]}"; do
    echo "  $service: ${service_pids[$service]}"
done
echo "  Inventory: $INVENTORY_PID"

echo "💡 To stop all servers, run: kill $FRONTEND_PID $INVENTORY_PID ${service_pids[*]}"

# Wait for user interrupt
trap "echo '🛑 Stopping all servers...'; kill $FRONTEND_PID $INVENTORY_PID ${service_pids[*]} 2>/dev/null; exit" INT
wait