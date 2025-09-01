#!/bin/bash

# Backend Services Startup Script
# This script starts all backend services and database components

set -e

echo "🚀 Starting LogiCore Backend Services..."
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

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service
wait_for_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - Waiting for $service_name..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "Failed to start $service_name"
    return 1
}

# Function to start service in background
start_service() {
    local service_name=$1
    local command=$2
    local directory=$3
    
    print_status "Starting $service_name..."
    
    if [ -n "$directory" ]; then
        cd "$directory"
    fi
    
    # Start service in background
    nohup $command > "../logs/${service_name}.log" 2>&1 &
    local pid=$!
    echo $pid > "../logs/${service_name}.pid"
    
    # Save PID for later cleanup
    echo $pid >> "../logs/all-pids.txt"
    
    if [ -n "$directory" ]; then
        cd - > /dev/null
    fi
    
    print_success "$service_name started with PID: $pid"
}

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port $port is already in use"
        return 1
    fi
    return 0
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if Docker is available
if ! command_exists docker; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command_exists docker-compose; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Starting database services..."
cd database

# Start database services
docker-compose up -d postgres redis

# Wait for database to be ready
wait_for_service "PostgreSQL" "http://localhost:5432/health" || {
    print_error "Database failed to start"
    exit 1
}

wait_for_service "Redis" "http://localhost:6379/health" || {
    print_error "Redis failed to start"
    exit 1
}

print_success "Database services started successfully"

# Run database migrations if needed
print_status "Running database migrations..."
if [ -f "schema.sql" ]; then
    docker-compose exec -T postgres psql -U postgres -d logi_core -f schema.sql
    print_success "Database schema applied"
fi

cd ..

print_status "Starting application services..."

# Start API Gateway
if check_port 8080; then
    start_service "api-gateway" "npm run dev" "logi-core/apps/api-gateway"
else
    print_warning "API Gateway port 8080 is already in use, skipping..."
fi

# Start User Service
if check_port 4001; then
    start_service "user-service" "npm run dev" "logi-core/services/user-service"
else
    print_warning "User Service port 4001 is already in use, skipping..."
fi

# Start Inventory Service
if check_port 8000; then
    start_service "inventory-service" "uvicorn main:app --host 0.0.0.0 --port 8000 --reload" "logi-core/services/inventory-service"
else
    print_warning "Inventory Service port 8000 is already in use, skipping..."
fi

# Start Order Service
if check_port 4003; then
    start_service "order-service" "npm run dev" "logi-core/services/order-service"
else
    print_warning "Order Service port 4003 is already in use, skipping..."
fi

# Start Routing Service
if check_port 4004; then
    start_service "routing-service" "npm run dev" "logi-core/services/routing-service"
else
    print_warning "Routing Service port 4004 is already in use, skipping..."
fi

# Start Geolocation Service
if check_port 4005; then
    start_service "geolocation-service" "npm run dev" "logi-core/services/geolocation-service"
else
    print_warning "Geolocation Service port 4005 is already in use, skipping..."
fi

# Start Notification Service
if check_port 4006; then
    start_service "notification-service" "npm run dev" "logi-core/services/notification-service"
else
    print_warning "Notification Service port 4006 is already in use, skipping..."
fi

# Wait for all services to be ready
print_status "Waiting for all services to be ready..."

# Check API Gateway
wait_for_service "API Gateway" "http://localhost:8080/health" || {
    print_warning "API Gateway health check failed"
}

# Check User Service
wait_for_service "User Service" "http://localhost:4001/api/health" || {
    print_warning "User Service health check failed"
}

# Check Inventory Service
wait_for_service "Inventory Service" "http://localhost:8000/health" || {
    print_warning "Inventory Service health check failed"
}

# Check Order Service
wait_for_service "Order Service" "http://localhost:4003/health" || {
    print_warning "Order Service health check failed"
}

# Check Routing Service
wait_for_service "Routing Service" "http://localhost:4004/health" || {
    print_warning "Routing Service health check failed"
}

# Check Geolocation Service
wait_for_service "Geolocation Service" "http://localhost:4005/health" || {
    print_warning "Geolocation Service health check failed"
}

# Check Notification Service
wait_for_service "Notification Service" "http://localhost:4006/health" || {
    print_warning "Notification Service health check failed"
}

print_success "All backend services started successfully!"
echo "========================================="
echo "🎉 Backend Services Status:"
echo "   • API Gateway: http://localhost:8080"
echo "   • User Service: http://localhost:4001"
echo "   • Inventory Service: http://localhost:8000"
echo "   • Order Service: http://localhost:4003"
echo "   • Routing Service: http://localhost:4004"
echo "   • Geolocation Service: http://localhost:4005"
echo "   • Notification Service: http://localhost:4006"
echo "   • PostgreSQL: localhost:5432"
echo "   • Redis: localhost:6379"
echo ""
echo "📁 Logs are available in the logs/ directory"
echo "🛑 To stop all services, run: scripts/stop-backend.sh"
echo "========================================="

# Create stop script if it doesn't exist
if [ ! -f "scripts/stop-backend.sh" ]; then
    cat > scripts/stop-backend.sh << 'EOF'
#!/bin/bash
# Stop all backend services

echo "🛑 Stopping all backend services..."

# Kill all processes with saved PIDs
if [ -f "logs/all-pids.txt" ]; then
    while read pid; do
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid
            echo "Stopped process $pid"
        fi
    done < logs/all-pids.txt
    rm logs/all-pids.txt
fi

# Stop database services
cd database
docker-compose down
cd ..

echo "✅ All services stopped"
EOF
    chmod +x scripts/stop-backend.sh
    echo "📄 Created stop-backend.sh script"
fi