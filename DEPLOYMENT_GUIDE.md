# Logistics Platform Deployment Guide

This guide will help you deploy the logistics platform using Docker and Docker Compose.

## Prerequisites

Before deploying the application, you need to install the following:

### 1. Docker
- **Windows**: Download Docker Desktop from [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
- **Mac**: Download Docker Desktop from [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
- **Linux**: Follow the installation guide for your distribution at [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)

### 2. Docker Compose
Docker Compose is included with Docker Desktop on Windows and Mac. For Linux, follow the installation guide at [https://docs.docker.com/compose/install/](https://docs.docker.com/compose/install/)

## Deployment Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd zadnjo
```

### 2. Configure Environment Variables
Create a `.env` file based on the `.env.example` file:
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```
# API Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_MOCK_DATA=false
VITE_LOG_LEVEL=info

# Database Configuration
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_secure_jwt_secret
```

### 3. Deploy the Application

#### For Windows Users:
```cmd
deploy.bat
```

#### For Linux/Mac Users:
```bash
chmod +x deploy.sh
./deploy.sh
```

#### Manual Deployment:
```bash
# Build and start services
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be healthy
sleep 10

# Check service status
docker-compose ps
```

### 4. Access the Application

Once deployed, you can access the application at:
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Service Health Check**: http://localhost:8080/health

## Service URLs

The following services will be available:
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- User Service: http://localhost:4001
- Inventory Service: http://localhost:8000
- Order Service: http://localhost:4003
- Routing Service: http://localhost:4004
- Geolocation Service: http://localhost:4005
- Notification Service: http://localhost:4006
- PostgreSQL Database: localhost:5432

## Management Commands

### View Logs
```bash
# View all logs
docker-compose logs

# View logs for a specific service
docker-compose logs -f [service-name]

# Example: View API Gateway logs
docker-compose logs -f api-gateway
```

### Stop Services
```bash
docker-compose down
```

### Restart Services
```bash
docker-compose restart
```

### Rebuild Services
```bash
docker-compose build --no-cache
docker-compose up -d
```

## Troubleshooting

### Port Conflicts
If you encounter port conflicts, make sure the following ports are available:
- 3000 (Frontend)
- 8080 (API Gateway)
- 4001 (User Service)
- 8000 (Inventory Service)
- 4003 (Order Service)
- 4004 (Routing Service)
- 4005 (Geolocation Service)
- 4006 (Notification Service)
- 5432 (PostgreSQL)

### Docker Issues
1. Make sure Docker is running
2. Check Docker Desktop settings
3. Restart Docker if needed

### Database Issues
1. Check PostgreSQL logs: `docker-compose logs postgres`
2. Verify database connection: `docker-compose exec postgres psql -U logistics -d logistics`

### Service Health Issues
1. Check service health: `curl http://localhost:8080/readyz`
2. View individual service logs
3. Restart unhealthy services: `docker-compose restart [service-name]`

## Production Deployment

For production deployment, consider the following:

### 1. Security
- Change default passwords and secrets
- Use HTTPS/TLS certificates
- Implement proper firewall rules
- Use non-root users in containers

### 2. Scaling
- Use Docker Swarm or Kubernetes for orchestration
- Implement load balancing
- Set up monitoring and logging

### 3. Database
- Use managed database service (e.g., AWS RDS, Google Cloud SQL)
- Implement regular backups
- Set up replication for high availability

### 4. Environment Variables
- Use secure secret management (e.g., HashiCorp Vault, AWS Secrets Manager)
- Set different values for production environment

## Support

If you encounter any issues during deployment, please check the logs and refer to the troubleshooting section. For additional support, contact the development team.