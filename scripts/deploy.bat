@echo off
echo 🚀 Starting deployment of logistics platform...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ⚠️  Please update the .env file with your configuration before running the application again.
)

REM Build and start services
echo 🏗️  Building and starting services...
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

REM Wait for services to be healthy
echo ⏳ Waiting for services to be healthy...
timeout /t 10 /nobreak >nul

REM Check if services are running
echo 🔍 Checking service status...
docker-compose ps

REM Run database migrations if needed
echo 🗄️  Running database migrations...
docker-compose exec postgres psql -U logistics -d logistics -c "SELECT version();"

echo ✅ Deployment completed successfully!
echo 🌐 Frontend is available at: http://localhost:3000
echo 🔌 API Gateway is available at: http://localhost:8080
echo 📊 Service health check: http://localhost:8080/health
echo.
echo To view logs, run: docker-compose logs -f [service-name]
echo To stop services, run: docker-compose down
pause