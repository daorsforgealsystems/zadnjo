@echo off
echo Starting Docker deployment for Logistics Platform...

echo.
echo Step 1: Stopping existing containers...
docker-compose --env-file .env.docker down

echo.
echo Step 2: Building Docker images...
docker-compose --env-file .env.docker build --no-cache

echo.
echo Step 3: Starting services...
docker-compose --env-file .env.docker up -d

echo.
echo Step 4: Checking service status...
timeout 10
docker-compose --env-file .env.docker ps

echo.
echo Deployment completed!
echo.
echo Services available at:
echo - Frontend: http://localhost:3000
echo - API Gateway: http://localhost:8080
echo - PostgreSQL: localhost:5432
echo.
echo To view logs: docker-compose --env-file .env.docker logs -f [service_name]
echo To stop all services: docker-compose --env-file .env.docker down

pause