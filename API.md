# Flow Motion API Documentation

This document provides an overview of the Flow Motion API endpoints and usage.

## API Gateway

All API requests are routed through the API Gateway at `http://localhost:8080` in development or your production domain in deployment.

## Authentication

### Login

```
POST /api/auth/login
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin"
  }
}
```

### Register

```
POST /api/auth/register
```

Request body:
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User",
  "company": "Logistics Inc."
}
```

### Authentication Headers

All authenticated requests should include the JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## User Service API

### Get Current User

```
GET /api/users/me
```

### Update User

```
PUT /api/users/:id
```

Request body:
```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

### List Users (Admin only)

```
GET /api/users
```

## Inventory Service API

### List Inventory Items

```
GET /api/inventory
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search term
- `status`: Filter by status
- `location`: Filter by warehouse location

### Get Inventory Item

```
GET /api/inventory/:id
```

### Create Inventory Item

```
POST /api/inventory
```

Request body:
```json
{
  "name": "Product Name",
  "sku": "SKU123",
  "quantity": 100,
  "location": "Warehouse A",
  "category": "Electronics",
  "attributes": {
    "weight": "1.5kg",
    "dimensions": "30x20x10cm"
  }
}
```

### Update Inventory Item

```
PUT /api/inventory/:id
```

### Delete Inventory Item

```
DELETE /api/inventory/:id
```

## Order Service API

### List Orders

```
GET /api/orders
```

Query parameters:
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status
- `customer`: Filter by customer ID
- `dateFrom`: Filter by date range start
- `dateTo`: Filter by date range end

### Get Order

```
GET /api/orders/:id
```

### Create Order

```
POST /api/orders
```

Request body:
```json
{
  "customer": "customer_id",
  "items": [
    {
      "inventory_id": "inventory_item_id",
      "quantity": 5
    }
  ],
  "shipping_address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zip": "12345",
    "country": "USA"
  },
  "shipping_method": "express",
  "notes": "Please deliver to the back entrance"
}
```

### Update Order Status

```
PATCH /api/orders/:id/status
```

Request body:
```json
{
  "status": "shipped",
  "notes": "Order shipped via FedEx"
}
```

## Geolocation Service API

### Track Vehicle

```
GET /api/geo/vehicles/:id
```

Response:
```json
{
  "vehicle_id": "v123",
  "timestamp": "2023-09-15T14:30:00Z",
  "location": {
    "lat": 37.7749,
    "lng": -122.4194
  },
  "speed": 45,
  "heading": 90,
  "status": "in_transit"
}
```

### Update Vehicle Location

```
POST /api/geo/vehicles/:id/location
```

Request body:
```json
{
  "lat": 37.7749,
  "lng": -122.4194,
  "speed": 45,
  "heading": 90,
  "status": "in_transit"
}
```

### Get Vehicle History

```
GET /api/geo/vehicles/:id/history
```

Query parameters:
- `from`: Start timestamp
- `to`: End timestamp
- `interval`: Data point interval in minutes

## Routing Service API

### Calculate Optimal Route

```
POST /api/routing/optimize
```

Request body:
```json
{
  "origin": {
    "lat": 37.7749,
    "lng": -122.4194
  },
  "destinations": [
    {
      "lat": 37.3382,
      "lng": -121.8863,
      "order_id": "order123"
    },
    {
      "lat": 37.4419,
      "lng": -122.1430,
      "order_id": "order456"
    }
  ],
  "vehicle_type": "truck_medium",
  "constraints": {
    "max_distance": 500,
    "max_stops": 15,
    "time_windows": [
      {
        "order_id": "order123",
        "start": "2023-09-15T09:00:00Z",
        "end": "2023-09-15T12:00:00Z"
      }
    ]
  }
}
```

## Notification Service API

### Send Notification

```
POST /api/notifications
```

Request body:
```json
{
  "recipient_id": "user123",
  "type": "order_status",
  "title": "Order Status Update",
  "message": "Your order #12345 has been shipped",
  "data": {
    "order_id": "12345",
    "status": "shipped"
  },
  "channels": ["email", "push", "sms"]
}
```

### Get User Notifications

```
GET /api/notifications
```

Query parameters:
- `read`: Filter by read status (true/false)
- `type`: Filter by notification type

### Mark Notification as Read

```
PATCH /api/notifications/:id
```

Request body:
```json
{
  "read": true
}
```

## Error Handling

All API endpoints return standard HTTP status codes:

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error responses follow this format:

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid input parameters",
    "details": {
      "field": "email",
      "issue": "Must be a valid email address"
    }
  }
}
```

## Rate Limiting

API requests are rate-limited to prevent abuse. The current limits are:

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1631234567
```

## Versioning

The API version is included in the URL path:

```
/api/v1/resource
```

The current version is v1. When breaking changes are introduced, a new version will be created while maintaining backward compatibility for a deprecation period.