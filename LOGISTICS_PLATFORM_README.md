# DaorsForge AI Logistics Platform

A comprehensive logistics and fleet management SaaS platform built with TypeScript, React, and modern web technologies.

## Overview

DaorsForge AI Logistics is a full-featured platform designed to streamline logistics operations, fleet management, order processing, and customer interactions. The platform provides real-time tracking, analytics, and automation tools for logistics companies.

## Features

### Dashboard Pages

- **Main Dashboard (/)** - Overview with metrics and charts
- **Enhanced Dashboard (/enhanced-dashboard)** - Advanced analytics with widgets
- **Customer Portal (/portal)** - Client dashboard with shipment tracking
- **Driver Dashboard (/driver-dashboard)** - Vehicle tracking and dispatch
- **Manager Dashboard (/manager-dashboard)** - Fleet management and order overview
- **Admin Dashboard (/admin-dashboard)** - System-wide administration

### Core Functionality

- **Order Management (/order-management)** - Centralized order processing
- **Shipment Tracking (/shipment-tracking)** - Real-time shipment status updates
- **Vehicle Tracking (/vehicle-tracking)** - GPS tracking of vehicles
- **Invoice Generation (/invoice-generation)** - Automated invoice creation
- **Payment Processing (/payment-processing)** - Secure payment gateway integration
- **Document Management (/document-management)** - File storage and sharing
- **Report Generation (/report-generation)** - Customizable reports
- **Chatbot (/chatbot)** - AI-driven customer service

## Technology Stack

### Frontend

- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **React Router** - Routing and navigation
- **React Query** - Data fetching and caching
- **Framer Motion** - Animations
- **Tailwind CSS** - Utility-first CSS
- **Recharts** - Data visualization
- **Leaflet** - Interactive maps
- **Anime.js** - Advanced animations

### Backend

- **Supabase** - Backend as a Service
- **PostgreSQL** - Database
- **Node.js** - Microservices
- **Express** - API framework

### Third-Party Integrations

- **Mapping** - Leaflet with OpenStreetMap and OSRM
- **Payments** - Stripe, PayPal
- **File Storage** - Supabase Storage
- **AI/ML** - OpenAI for chatbot functionality

## Architecture

The platform follows a modular architecture with clear separation of concerns:

### Frontend Architecture

```
src/
├── assets/                 # Static assets
├── components/             # Reusable UI components
│   ├── ui/                 # Base UI components
│   ├── layout/             # Layout components
│   ├── charts/             # Chart components
│   ├── maps/               # Map components
│   ├── forms/              # Form components
│   ├── tables/             # Table components
│   ├── modals/             # Modal components
│   └── widgets/            # Dashboard widgets
├── context/                # React Context providers
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and services
│   ├── api/                # API client and services
│   ├── utils/              # Utility functions
│   └── validators/         # Form validators
├── pages/                  # Page components
│   ├── dashboard/          # Dashboard pages
│   ├── auth/               # Authentication pages
│   ├── portal/             # Customer portal pages
│   ├── admin/              # Admin pages
│   ├── manager/            # Manager pages
│   ├── driver/             # Driver pages
│   ├── orders/             # Order management pages
│   ├── shipments/          # Shipment tracking pages
│   ├── vehicles/           # Vehicle tracking pages
│   ├── invoices/           # Invoice generation pages
│   ├── payments/           # Payment processing pages
│   ├── documents/          # Document management pages
│   ├── reports/            # Report generation pages
│   └── chatbot/            # Chatbot pages
└── types/                  # TypeScript type definitions
```

### Backend Architecture

The backend is organized as a set of microservices:

```
logi-core/
├── services/               # Microservices
│   ├── user-service/       # User management service
│   ├── order-service/      # Order management service
│   ├── inventory-service/  # Inventory management service
│   ├── routing-service/    # Route optimization service
│   ├── geolocation-service/# Geolocation tracking service
│   ├── notification-service/# Notification service
│   ├── payment-service/    # Payment processing service
│   ├── document-service/   # Document management service
│   ├── report-service/     # Report generation service
│   └── chatbot-service/    # AI chatbot service
└── db/                     # Database migrations and schemas
```

## State Management

The application uses a combination of state management approaches:

1. **React Query** for server state management
   - Handles data fetching, caching, and synchronization
   - Provides loading, error, and success states
   - Manages data refetching and invalidation

2. **React Context** for global application state
   - Authentication state
   - Theme preferences
   - Language settings
   - Global notifications

3. **Local Component State** for UI state
   - Form inputs
   - Modal visibility
   - Pagination state
   - Filter selections

## Authentication & Authorization

The application uses Supabase for authentication and authorization:

1. **Authentication**
   - Email/password authentication
   - Social login (Google, GitHub)
   - Magic link authentication
   - JWT token management

2. **Authorization**
   - Role-based access control (ADMIN, MANAGER, DRIVER, CLIENT, GUEST)
   - Protected routes with role requirements
   - Feature-level permissions

## API Endpoints

The platform uses a RESTful API structure:

### Authentication Endpoints

```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET /api/auth/me
```

### User Management Endpoints

```
GET /api/users
GET /api/users/:id
POST /api/users
PUT /api/users/:id
DELETE /api/users/:id
```

### Order Management Endpoints

```
GET /api/orders
GET /api/orders/:id
POST /api/orders
PUT /api/orders/:id
DELETE /api/orders/:id
GET /api/orders/:id/history
```

### Shipment Tracking Endpoints

```
GET /api/shipments
GET /api/shipments/:id
POST /api/shipments
PUT /api/shipments/:id
DELETE /api/shipments/:id
GET /api/shipments/:id/history
GET /api/shipments/:id/location
```

### Vehicle Tracking Endpoints

```
GET /api/vehicles
GET /api/vehicles/:id
POST /api/vehicles
PUT /api/vehicles/:id
DELETE /api/vehicles/:id
GET /api/vehicles/:id/location
GET /api/vehicles/:id/history
```

### Invoice Generation Endpoints

```
GET /api/invoices
GET /api/invoices/:id
POST /api/invoices
PUT /api/invoices/:id
DELETE /api/invoices/:id
GET /api/invoices/:id/pdf
```

### Payment Processing Endpoints

```
GET /api/payments
GET /api/payments/:id
POST /api/payments
PUT /api/payments/:id
GET /api/payments/methods
POST /api/payments/process
```

### Document Management Endpoints

```
GET /api/documents
GET /api/documents/:id
POST /api/documents
DELETE /api/documents/:id
GET /api/documents/:id/download
```

### Report Generation Endpoints

```
GET /api/reports/templates
GET /api/reports/saved
POST /api/reports/generate
GET /api/reports/:id
DELETE /api/reports/:id
```

### Chatbot Endpoints

```
POST /api/chatbot/message
GET /api/chatbot/history
```

### Dashboard Endpoints

```
GET /api/dashboard/metrics
GET /api/dashboard/shipment-status
GET /api/dashboard/revenue
GET /api/dashboard/routes
GET /api/dashboard/alerts
```

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- PostgreSQL (or Supabase account)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/daors-flow-motion.git
   cd daors-flow-motion
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Edit the `.env` file with your Supabase credentials and other configuration.

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Deployment

The application can be deployed using the following strategy:

1. **Frontend**
   - Build with Vite
   - Deploy to Vercel, Netlify, or AWS S3 + CloudFront
   - Configure CI/CD pipeline for automated deployments

2. **Backend**
   - Deploy microservices to Kubernetes cluster
   - Use Docker containers for each service
   - Implement API Gateway for routing

3. **Database**
   - Use Supabase for PostgreSQL database
   - Implement database migrations for schema changes
   - Set up regular backups

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [React Query](https://tanstack.com/query/latest)
- [Leaflet](https://leafletjs.com/)
- [Recharts](https://recharts.org/)