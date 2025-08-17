# Flow Motion Deployment Guide

This document outlines the deployment options and procedures for the Flow Motion logistics platform.

## Deployment Options

Flow Motion can be deployed in several ways:

1. **Docker Compose**: Simplest option for small-scale deployments
2. **Kubernetes**: Recommended for production environments
3. **Hybrid**: Frontend on Netlify/Vercel, backend on Kubernetes

## Prerequisites

- Docker and Docker Compose (for Docker deployment)
- Kubernetes cluster (for Kubernetes deployment)
- Node.js 20+ and npm 10+ (for manual deployment)
- PostgreSQL database
- Domain name and SSL certificates

## Environment Variables

Create appropriate `.env` files based on the provided templates:

- `.env.example` → `.env` (development)
- `.env.example` → `.env.production` (production)

Key environment variables:

```
# Core
NODE_ENV=production
PORT=3000

# Database
POSTGRES_USER=logistics
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=logistics
DATABASE_URL=postgres://logistics:your_secure_password@postgres:5432/logistics

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=24h

# Services
API_GATEWAY_URL=https://api.yourdomain.com
USER_SERVICE_URL=http://user-service:4001
INVENTORY_SERVICE_URL=http://inventory-service:8000
ORDER_SERVICE_URL=http://order-service:4003
ROUTING_SERVICE_URL=http://routing-service:4004
GEO_SERVICE_URL=http://geolocation-service:4005
NOTIFY_SERVICE_URL=http://notification-service:4006

# Supabase (if used)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Docker Compose Deployment

The simplest way to deploy the entire stack:

1. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your production values
   ```

2. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

3. Initialize the database (first time only):
   ```bash
   docker-compose exec postgres psql -U logistics -d logistics -f /docker-entrypoint-initdb.d/schema.sql
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:8080

## Kubernetes Deployment

For production environments, Kubernetes is recommended:

1. Configure Kubernetes secrets:
   ```bash
   kubectl create secret generic flow-motion-secrets \
     --from-literal=POSTGRES_PASSWORD=your_secure_password \
     --from-literal=JWT_SECRET=your_jwt_secret_key
   ```

2. Deploy using Kustomize:
   ```bash
   # Development
   kubectl apply -k logi-core/k8s/overlays/dev

   # Production
   kubectl apply -k logi-core/k8s/overlays/prod
   ```

3. Configure Ingress for external access:
   ```bash
   kubectl apply -f logi-core/k8s/ingress.yaml
   ```

## Netlify Deployment (Frontend Only)

For deploying just the frontend on Netlify:

1. Configure Netlify environment variables in the Netlify dashboard or `netlify.toml`

2. Deploy using the Netlify CLI:
   ```bash
   npm run build:netlify
   netlify deploy --prod
   ```

   Or use the provided script:
   ```bash
   ./netlify-deploy.sh
   ```

## Database Migrations

When updating the database schema:

1. Create a new migration:
   ```bash
   cd database
   # Create migration file manually in migrations folder
   ```

2. Apply migrations:
   ```bash
   # For Docker Compose
   docker-compose exec postgres psql -U logistics -d logistics -f /docker-entrypoint-initdb.d/migrations/YYYYMMDD_migration_name.sql

   # For Kubernetes
   kubectl exec -it $(kubectl get pods -l app=postgres -o jsonpath="{.items[0].metadata.name}") -- \
     psql -U logistics -d logistics -f /docker-entrypoint-initdb.d/migrations/YYYYMMDD_migration_name.sql
   ```

## SSL Configuration

For production deployments, configure SSL:

1. With Docker Compose:
   - Update the nginx.conf file
   - Mount SSL certificates into the container

2. With Kubernetes:
   - Use cert-manager for automatic certificate management
   - Configure TLS in the Ingress resource

## Monitoring and Logging

Set up monitoring and logging:

1. Prometheus and Grafana for metrics
2. ELK Stack or Loki for logging
3. Configure health checks for all services

## Backup and Disaster Recovery

Implement regular backups:

1. Database backups:
   ```bash
   # For Docker Compose
   docker-compose exec postgres pg_dump -U logistics -d logistics > backup_$(date +%Y%m%d).sql

   # For Kubernetes
   kubectl exec -it $(kubectl get pods -l app=postgres -o jsonpath="{.items[0].metadata.name}") -- \
     pg_dump -U logistics -d logistics > backup_$(date +%Y%m%d).sql
   ```

2. Configure automated backup schedules
3. Test restoration procedures regularly

## Scaling Considerations

For high-traffic deployments:

1. Scale stateless services horizontally
2. Use a database cluster with replication
3. Implement caching with Redis
4. Configure auto-scaling in Kubernetes

## Troubleshooting

Common issues and solutions:

1. **Connection issues between services**:
   - Check network policies
   - Verify service discovery configuration
   - Ensure correct environment variables

2. **Database connection failures**:
   - Check credentials
   - Verify network connectivity
   - Check database logs

3. **Frontend not loading**:
   - Check API Gateway connectivity
   - Verify CORS configuration
   - Check browser console for errors

## Deployment Checklist

Before going live:

- [ ] Environment variables configured correctly
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Security hardening completed
- [ ] Load testing performed
- [ ] Monitoring and alerting configured
- [ ] Backup procedures tested
- [ ] Documentation updated