# LogiCore Infrastructure Startup Script
# This script starts all required infrastructure services for the LogiCore platform

Write-Host "🚀 Starting LogiCore Infrastructure Services..." -ForegroundColor Green

# Check if Docker is running
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Start infrastructure services
Write-Host "📦 Starting infrastructure services with Docker Compose..." -ForegroundColor Yellow
docker-compose -f docker-compose.infrastructure.yml up -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service health
Write-Host "🔍 Checking service health..." -ForegroundColor Yellow

$services = @(
    @{ Name = "RabbitMQ"; Url = "http://localhost:15672"; Port = 5672 },
    @{ Name = "Redis"; Port = 6379 },
    @{ Name = "Consul"; Url = "http://localhost:8500"; Port = 8500 },
    @{ Name = "Jaeger"; Url = "http://localhost:16686"; Port = 14268 },
    @{ Name = "PostgreSQL"; Port = 5432 },
    @{ Name = "Prometheus"; Url = "http://localhost:9090"; Port = 9090 },
    @{ Name = "Grafana"; Url = "http://localhost:3001"; Port = 3000 }
)

foreach ($service in $services) {
    try {
        if ($service.Url) {
            $response = Invoke-WebRequest -Uri $service.Url -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $($service.Name) is healthy" -ForegroundColor Green
            }
        } else {
            # For services without HTTP endpoints, check if port is listening
            $connection = Test-NetConnection -ComputerName localhost -Port $service.Port -InformationLevel Quiet
            if ($connection) {
                Write-Host "✅ $($service.Name) is running" -ForegroundColor Green
            } else {
                Write-Host "⚠️  $($service.Name) may not be ready yet" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "⚠️  $($service.Name) is not ready yet (this is normal during startup)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 Infrastructure services are starting up!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Service URLs:" -ForegroundColor Cyan
Write-Host "   • RabbitMQ Management: http://localhost:15672 (admin/admin123)" -ForegroundColor White
Write-Host "   • Redis: localhost:6379 (password: redis123)" -ForegroundColor White
Write-Host "   • Consul UI: http://localhost:8500" -ForegroundColor White
Write-Host "   • Jaeger UI: http://localhost:16686" -ForegroundColor White
Write-Host "   • PostgreSQL: localhost:5432 (postgres/postgres123)" -ForegroundColor White
Write-Host "   • Prometheus: http://localhost:9090" -ForegroundColor White
Write-Host "   • Grafana: http://localhost:3001 (admin/admin123)" -ForegroundColor White
Write-Host ""
Write-Host "🔧 To stop all services, run:" -ForegroundColor Cyan
Write-Host "   docker-compose -f docker-compose.infrastructure.yml down" -ForegroundColor White
Write-Host ""
Write-Host "📊 To view logs, run:" -ForegroundColor Cyan
Write-Host "   docker-compose -f docker-compose.infrastructure.yml logs -f [service-name]" -ForegroundColor White
Write-Host ""
Write-Host "🚀 You can now start the LogiCore services!" -ForegroundColor Green