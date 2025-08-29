---
description: Repository Information Overview
alwaysApply: true
---

# Repository Information Overview

## Repository Summary
This repository contains a logistics management platform with a React frontend and a microservices backend architecture. The system is designed to handle various logistics operations including order management, inventory tracking, routing, geolocation, and user management.

## Repository Structure
- **src/**: Frontend React application built with TypeScript, Vite, and Tailwind CSS
- **logi-core/**: Backend microservices architecture with multiple services
- **public/**: Static assets for the frontend
- **scripts/**: Utility scripts for deployment and validation
- **netlify/**: Netlify deployment configuration and functions

### Main Repository Components
- **Frontend**: React/TypeScript application with Vite, Redux, and Tailwind CSS
- **Backend**: Microservices architecture with Node.js and Python services
- **Database**: PostgreSQL database for data storage
- **Deployment**: Docker containerization and Netlify configuration

## Projects

### Frontend (React Application)
**Configuration File**: package.json

#### Language & Runtime
**Language**: TypeScript
**Version**: ESNext (TypeScript 5.9.2)
**Build System**: Vite 7.1.3
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- React 18.2.0
- Redux Toolkit 2.8.2
- React Router 6.22.3
- Tailwind CSS 4.1.12
- Radix UI Components
- Leaflet/React-Leaflet for maps
- i18next for internationalization
- Framer Motion for animations

**Development Dependencies**:
- Vitest for testing
- ESLint for linting
- TypeScript ESLint
- Testing Library (React, DOM, Jest-DOM)

#### Build & Installation
```bash
npm install
npm run dev     # Development server
npm run build   # Production build
npm run test    # Run tests
```

#### Docker
**Dockerfile**: Dockerfile
**Image**: Node 20 Alpine for build, Nginx Alpine for serving
**Configuration**: Multi-stage build process with Nginx for serving static files

#### Testing
**Framework**: Vitest with Testing Library
**Test Location**: src/**/__tests__/ and *.test.tsx files
**Configuration**: vitest.config.ts
**Run Command**:
```bash
npm run test
npm run test:coverage
```

### Backend (Microservices)
**Configuration File**: logi-core/package.json

#### Language & Runtime
**Language**: TypeScript (Node.js) and Python
**Version**: Node.js 20+, Python 3.11
**Build System**: TypeScript compiler, NestJS
**Package Manager**: npm, pip

#### Dependencies
**Main Dependencies**:
- NestJS for Node.js services
- FastAPI for Python services
- OpenTelemetry for distributed tracing
- RabbitMQ for message queuing
- Redis for caching
- Consul for service discovery

#### Build & Installation
```bash
cd logi-core
npm install
```

#### Docker
**Dockerfile**: Multiple Dockerfiles in each service directory
**Configuration**: docker-compose.yml for orchestrating all services

#### Services
- **api-gateway**: API Gateway service (Node.js/NestJS)
- **user-service**: User management service (Node.js/NestJS)
- **inventory-service**: Inventory management service (Python/FastAPI)
- **order-service**: Order management service (Node.js/NestJS)
- **routing-service**: Route optimization service (Node.js/NestJS)
- **geolocation-service**: Geolocation tracking service (Node.js/NestJS)
- **notification-service**: Notification service (Node.js/NestJS)

### Infrastructure
**Configuration File**: docker-compose.yml, logi-core/docker-compose.yml

#### Key Resources
**Main Files**:
- docker-compose.yml: Main Docker Compose configuration
- logi-core/k8s/: Kubernetes configuration files
- logi-core/infra/terraform/: Terraform infrastructure as code

#### Usage & Operations
```bash
docker-compose up -d  # Start all services
```

#### Database
**Type**: PostgreSQL 15
**Configuration**: Configured in docker-compose.yml
**Schema**: logi-core/db/schema.sql and migrations---
description: Repository Information Overview
alwaysApply: true
---

# Repository Information Overview

## Repository Summary
This repository contains a logistics management platform with a React frontend and a microservices backend architecture. The system is designed to handle various logistics operations including order management, inventory tracking, routing, geolocation, and user management.

## Repository Structure
- **src/**: Frontend React application built with TypeScript, Vite, and Tailwind CSS
- **logi-core/**: Backend microservices architecture with multiple services
- **public/**: Static assets for the frontend
- **scripts/**: Utility scripts for deployment and validation
- **netlify/**: Netlify deployment configuration and functions
- **database/**: Database initialization scripts

### Main Repository Components
- **Frontend**: React/TypeScript SPA with Vite, Redux, and Tailwind CSS
- **Backend**: Microservices architecture with Node.js and Python services
- **API Gateway**: Central entry point for backend services
- **Database**: PostgreSQL database for data storage
- **Deployment**: Docker containerization and Netlify configuration

## Projects

### Frontend (React Application)
**Configuration File**: package.json

#### Language & Runtime
**Language**: TypeScript
**Version**: ESNext (TypeScript 5.9)
**Build System**: Vite 7.1
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- React 18.2
- Redux Toolkit 2.8
- React Router 6.22
- Tailwind CSS 4.1
- Radix UI Components
- Leaflet/React-Leaflet for maps
- i18next for internationalization
- Framer Motion for animations
- Supabase for backend integration

#### Build & Installation
```bash
npm install
npm run dev     # Development
npm run build   # Production build
npm run preview # Preview build
```

#### Docker
**Dockerfile**: Dockerfile
**Image**: Node 20 Alpine for build, Nginx Alpine for serving
**Configuration**: Multi-stage build with Nginx for static file serving

#### Testing
**Framework**: Vitest with React Testing Library
**Test Location**: src/**/__tests__/
**Naming Convention**: *.test.tsx
**Configuration**: vitest.config.ts
**Run Command**:
```bash
npm run test
npm run test:coverage
```

### Backend (Microservices)
**Configuration File**: logi-core/package.json

#### Language & Runtime
**Language**: TypeScript (Node.js) and Python
**Version**: Node.js 20+, Python 3.11
**Build System**: TypeScript compiler, NestJS
**Package Manager**: npm, pip

#### Dependencies
**Main Dependencies**:
- NestJS for Node.js services
- FastAPI for Python services
- OpenTelemetry for distributed tracing
- Winston for logging
- Redis for caching
- RabbitMQ for messaging
- Consul for service discovery

#### Build & Installation
```bash
cd logi-core
npm install
# For individual services
cd services/user-service
npm run build
npm run start
```

#### Docker
**Dockerfile**: Multiple Dockerfiles in each service directory
**Image**: Node 20 for TypeScript services, Python 3.11 for FastAPI services
**Configuration**: Docker Compose for orchestration

#### Services
- **api-gateway**: Central entry point for all services
- **user-service**: User authentication and management
- **inventory-service**: Inventory tracking (Python/FastAPI)
- **order-service**: Order processing and management
- **routing-service**: Route optimization
- **geolocation-service**: Location tracking
- **notification-service**: Notifications and alerts

### Infrastructure
**Type**: Kubernetes and Terraform configurations

#### Specification & Tools
**Type**: Infrastructure as Code
**Required Tools**: Kubernetes, Terraform, Docker

#### Key Resources
**Main Files**:
- docker-compose.yml: Local development environment
- k8s/: Kubernetes manifests with Kustomize
- infra/terraform/: Terraform modules for cloud deployment

#### Usage & Operations
```bash
# Start local development environment
docker-compose up -d
# Deploy to Kubernetes
kubectl apply -k k8s/overlays/dev
```

#### Deployment Options
- **Docker Compose**: Local development
- **Kubernetes**: Production deployment
- **Netlify**: Frontend deployment

#### Target Framework
**targetFramework**: Vitest