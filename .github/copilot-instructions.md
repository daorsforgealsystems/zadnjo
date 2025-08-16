# Copilot Instructions for DaorsForge AI Logistics Platform

## Overview
This repository contains the DaorsForge AI Logistics Platform, a comprehensive logistics and fleet management SaaS platform. The platform is built with modern web technologies, including React, TypeScript, and Tailwind CSS on the frontend, and a microservices-based backend using Node.js and Supabase.

## Architecture

### Frontend
- **Framework**: React with TypeScript
- **State Management**: React Query for server state, React Context for global state, and local component state for UI interactions.
- **Styling**: Tailwind CSS with utility-first design.
- **Key Directories**:
  - `src/components/`: Reusable UI components (e.g., layout, charts, forms).
  - `src/pages/`: Page-level components for dashboards, portals, and management tools.
  - `src/lib/`: Utility functions and API clients.
  - `src/context/`: React Context providers for global state.

### Backend
- **Microservices**: Located in `logi-core/services/`.
  - Examples: `user-service`, `order-service`, `inventory-service`.
- **API Gateway**: Centralized routing for microservices (`logi-core/apps/api-gateway`).
- **Database**: PostgreSQL with Supabase for authentication and storage.

### Deployment
- **Docker**: Services are containerized using Docker.
- **Docker Compose**: Orchestrates multi-container deployments.
- **Environment Variables**: Configured via `.env` file.

## Developer Workflows

### Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Access the application at `http://localhost:5173`.

### Testing
- **Unit Tests**: Run with Jest:
  ```bash
  npm run test
  ```
- **Watch Mode**:
  ```bash
  npm run test:watch
  ```
- **Coverage**:
  ```bash
  npm run test:coverage
  ```

### Linting
- Check for linting issues:
  ```bash
  npm run lint
  ```
- Auto-fix linting issues:
  ```bash
  npm run lint:fix
  ```

### Building
- Build for production:
  ```bash
  npm run build
  ```

### Deployment
- Use the `deploy.bat` script for Windows or `deploy.sh` for Unix-based systems.
- Example for Windows:
  ```bash
  deploy.bat
  ```

## Project-Specific Conventions

### API Integration
- Use `src/lib/api/` for API client functions.
- Example: `getOrders`, `createOrder` in `src/lib/api/orders.ts`.

### State Management
- Use React Query for server state (e.g., `useQuery`, `useMutation`).
- Use React Context for global state (e.g., authentication, theme).

### Component Structure
- Follow the modular structure in `src/components/`.
  - Example: `src/components/layout/` for layout components like `DashboardLayout`.

### Routing
- Use React Router for navigation.
- Define routes in `src/pages/`.

## Key Files
- `vite.config.ts`: Vite configuration for development and production builds.
- `tsconfig.json`: TypeScript configuration.
- `docker-compose.yml`: Docker Compose configuration for multi-container setup.
- `.env.example`: Template for environment variables.

## External Dependencies
- **Supabase**: Authentication and database.
- **Leaflet**: Interactive maps.
- **Recharts**: Data visualization.
- **Anime.js**: Advanced animations.

## Notes for AI Agents
- Focus on modularity and reusability when adding new components.
- Follow the established directory structure and naming conventions.
- Ensure all new features are covered by unit tests.
- Update documentation for any significant changes.
