---
description: Repository Information Overview
alwaysApply: true
---

# Repository Information Overview

## Repository Summary
This repository contains a logistics platform with a React frontend (Flow Motion) and a microservices backend (LogiCore). The frontend is built with Vite, React, TypeScript, and Tailwind CSS, while the backend consists of multiple microservices using various technologies.

## Repository Structure
- **Frontend (Root)**: React application built with Vite, TypeScript, and Tailwind CSS
- **logi-core/**: Backend monorepo containing microservices and infrastructure
- **jules-scratch/**: Testing and verification scripts
- **database/**: Database-related files and migrations

### Main Repository Components
- **Frontend**: Modern web application with rich UI components and animations
- **LogiCore Backend**: Microservices architecture with API Gateway and specialized services
- **Infrastructure**: Kubernetes and Terraform configurations for deployment

## Projects

### Frontend (Flow Motion)
**Configuration File**: package.json, vite.config.ts

#### Language & Runtime
**Language**: TypeScript
**Version**: TypeScript 5.9.x
**Build System**: Vite 5.4.x
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- React 18.3.x
- React Router 7.8.x
- Tailwind CSS 3.4.x
- shadcn/ui (Radix UI components)
- i18next (Internationalization)
- Supabase (Backend as a Service)
- Framer Motion (Animations)
- Leaflet (Maps)

**Development Dependencies**:
- Jest 30.0.x (Testing)
- ESLint 9.33.x (Linting)
- TypeScript 5.9.x

#### Build & Installation
```bash
npm install
npm run dev    # Development server
npm run build  # Production build
```

#### Testing
**Framework**: Jest with React Testing Library
**Test Location**: src/**/__tests__/
**Configuration**: jest.config.cjs
**Run Command**:
```bash
npm test
```

### LogiCore Backend
**Configuration File**: logi-core/package.json

#### Language & Runtime
**Language**: Multiple (Node.js, Python)
**Version**: Node.js 20+, Python 3.11+
**Build System**: npm workspaces
**Package Manager**: npm, pip

#### Services
- **API Gateway**: Node.js + Express
- **User Service**: NestJS
- **Inventory Service**: FastAPI (Python)
- **Geolocation Service**: Microservice for location tracking
- **Order Service**: Order management microservice
- **Routing Service**: Route optimization microservice
- **Notification Service**: Notification handling microservice

#### Docker
**Dockerfiles**: Present for each service
**Configuration**: Multi-stage builds for optimized containers
**Base Images**: Node 20-alpine, Python base images

#### Infrastructure
**Kubernetes**: Base manifests and development overlays
**Terraform**: GCP infrastructure configuration (GKE, Cloud SQL, Pub/Sub)
**Database**: SQL migrations for schema management

#### Development Setup
```bash
# API Gateway
cd logi-core/apps/api-gateway
npm install
npm run dev

# User Service
cd logi-core/services/user-service
npm install
npm run dev

# Inventory Service
cd logi-core/services/inventory-service
python -m venv .venv && .venv/Scripts/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```---
description: Repository Information Overview
alwaysApply: true
---

# Repository Information Overview

## Repository Summary
This repository contains a logistics platform with a React frontend (Flow Motion) and a microservices backend (LogiCore). The frontend is built with Vite, React, TypeScript, and Tailwind CSS, while the backend consists of multiple microservices using various technologies.

## Repository Structure
- **Frontend (Root)**: React application built with Vite, TypeScript, and Tailwind CSS
- **logi-core/**: Backend monorepo containing microservices and infrastructure
- **jules-scratch/**: Testing and verification scripts
- **database/**: Database-related files and migrations

### Main Repository Components
- **Frontend**: Modern web application with rich UI components and animations
- **LogiCore Backend**: Microservices architecture with API Gateway and specialized services
- **Infrastructure**: Kubernetes and Terraform configurations for deployment

## Projects

### Frontend (Flow Motion)
**Configuration File**: package.json, vite.config.ts

#### Language & Runtime
**Language**: TypeScript
**Version**: TypeScript 5.9.x
**Build System**: Vite 5.4.x
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- React 18.3.x
- React Router 7.8.x
- Tailwind CSS 3.4.x
- shadcn/ui (Radix UI components)
- i18next (Internationalization)
- Supabase (Backend as a Service)
- Framer Motion (Animations)
- Leaflet (Maps)

**Development Dependencies**:
- Jest 30.0.x (Testing)
- ESLint 9.33.x (Linting)
- TypeScript 5.9.x

#### Build & Installation
```bash
npm install
npm run dev    # Development server
npm run build  # Production build
```

#### Testing
**Framework**: Jest with React Testing Library
**Test Location**: src/**/__tests__/
**Configuration**: jest.config.cjs
**Run Command**:
```bash
npm test
```

### LogiCore Backend
**Configuration File**: logi-core/package.json

#### Language & Runtime
**Language**: Multiple (Node.js, Python)
**Version**: Node.js 20+, Python 3.11+
**Build System**: npm workspaces
**Package Manager**: npm, pip

#### Services
- **API Gateway**: Node.js + Express
- **User Service**: NestJS
- **Inventory Service**: FastAPI (Python)
- **Geolocation Service**: Microservice for location tracking
- **Order Service**: Order management microservice
- **Routing Service**: Route optimization microservice
- **Notification Service**: Notification handling microservice

#### Docker
**Dockerfiles**: Present for each service
**Configuration**: Multi-stage builds for optimized containers
**Base Images**: Node 20-alpine, Python base images

#### Infrastructure
**Kubernetes**: Base manifests and development overlays
**Terraform**: GCP infrastructure configuration (GKE, Cloud SQL, Pub/Sub)
**Database**: SQL migrations for schema management

#### Development Setup
```bash
# API Gateway
cd logi-core/apps/api-gateway
npm install
npm run dev

# User Service
cd logi-core/services/user-service
npm install
npm run dev

# Inventory Service
cd logi-core/services/inventory-service
python -m venv .venv && .venv/Scripts/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```