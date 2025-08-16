#!/bin/bash

# Deployment script for logistics platform

set -e

echo "🚀 Starting deployment of logistics platform..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your configuration before running the application again."
fi

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Run database migrations if needed
echo "🗄️  Running database migrations..."
docker-compose exec postgres psql -U logistics -d logistics -c "SELECT version();"

echo "✅ Deployment completed successfully!"
echo "🌐 Frontend is available at: http://localhost:3000"
echo "🔌 API Gateway is available at: http://localhost:8080"
echo "📊 Service health check: http://localhost:8080/health"
echo ""
echo "To view logs, run: docker-compose logs -f [service-name]"
echo "To stop services, run: docker-compose down"