#!/bin/bash

# Backend Services Stop Script
# This script stops all backend services and database components

set -e

echo "🛑 Stopping LogiCore Backend Services..."
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to kill process by PID
kill_process() {
    local pid=$1
    local service_name=$2
    
    if ps -p $pid > /dev/null 2>&1; then
        print_status "Stopping $service_name (PID: $pid)..."
        kill $pid
        
        # Wait for process to terminate
        local count=0
        while ps -p $pid > /dev/null 2>&1 && [ $count -lt 10 ]; do
            sleep 1
            count=$((count + 1))
        done
        
        # If process is still running, force kill
        if ps -p $pid > /dev/null 2>&1; then
            print_warning "Force killing $service_name (PID: $pid)..."
            kill -9 $pid
        fi
        
        print_success "$service_name stopped"
    else
        print_warning "$service_name (PID: $pid) not found"
    fi
}

# Function to stop service by port
stop_service_by_port() {
    local port=$1
    local service_name=$2
    
    local pid=$(lsof -ti :$port 2>/dev/null || true)
    
    if [ -n "$pid" ]; then
        kill_process "$pid" "$service_name"
    else
        print_warning "$service_name port $port not found"
    fi
}

# Function to stop Docker containers
stop_docker_containers() {
    local service_name=$1
    
    print_status "Stopping $service_name Docker containers..."
    
    if docker-compose ps -q | grep -q .; then
        docker-compose down
        print_success "$service_name containers stopped"
    else
        print_warning "No $service_name containers found"
    fi
}

# Stop application services
print_status "Stopping application services..."

# Stop API Gateway
stop_service_by_port 8080 "API Gateway"

# Stop User Service
stop_service_by_port 4001 "User Service"

# Stop Inventory Service
stop_service_by_port 8000 "Inventory Service"

# Stop Order Service
stop_service_by_port 4003 "Order Service"

# Stop Routing Service
stop_service_by_port 4004 "Routing Service"

# Stop Geolocation Service
stop_service_by_port 4005 "Geolocation Service"

# Stop Notification Service
stop_service_by_port 4006 "Notification Service"

# Stop database services
print_status "Stopping database services..."
cd database
stop_docker_containers "Database"
cd ..

# Clean up PID files and logs
print_status "Cleaning up temporary files..."

# Remove PID files
if [ -f "logs/all-pids.txt" ]; then
    rm -f logs/all-pids.txt
    print_success "Removed PID file"
fi

# Remove individual service PID files
for service in api-gateway user-service inventory-service order-service routing-service geolocation-service notification-service; do
    if [ -f "logs/${service}.pid" ]; then
        rm -f "logs/${service}.pid"
    fi
done

# Optional: Remove log files (comment out if you want to keep logs)
# print_status "Removing log files..."
# rm -rf logs/

print_success "All backend services stopped successfully!"
echo "========================================="
echo "🎉 Services stopped:"
echo "   • API Gateway"
echo "   • User Service"
echo "   • Inventory Service"
echo "   • Order Service"
echo "   • Routing Service"
echo "   • Geolocation Service"
echo "   • Notification Service"
echo "   • PostgreSQL"
echo "   • Redis"
echo ""
echo "🚀 To restart services, run: scripts/start-backend.sh"
echo "========================================="