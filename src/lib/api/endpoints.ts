// Service Endpoints Configuration
// Centralized configuration for all microservice endpoints

import { config } from '@/lib/config';

export const endpoints = {
  // Main API Gateway
  api: config.api.baseUrl,
  
  // Microservices
  userService: config.services.userService,
  inventoryService: config.services.inventoryService,
  routingService: config.services.routingService,
  geolocationService: config.services.geolocationService,
  notificationService: config.services.notificationService,
  
  // Supabase
  supabase: {
    url: config.supabase.url,
    anonKey: config.supabase.anonKey,
  },
} as const;

// Service health check endpoints
export const healthEndpoints = {
  userService: `${config.services.userService}/health`,
  inventoryService: `${config.services.inventoryService}/health`,
  routingService: `${config.services.routingService}/health`,
  geolocationService: `${config.services.geolocationService}/health`,
  notificationService: `${config.services.notificationService}/health`,
} as const;

// Validate all service endpoints are configured
export const validateEndpoints = (): void => {
  const requiredEndpoints = [
    'userService',
    'inventoryService', 
    'routingService',
    'geolocationService',
    'notificationService'
  ] as const;

  const missing: string[] = [];
  
  requiredEndpoints.forEach(service => {
    const endpoint = config.services[service];
    if (!endpoint || endpoint.includes('undefined')) {
      missing.push(service);
    }
  });

  if (missing.length > 0) {
    console.warn(`Missing or invalid service endpoints: ${missing.join(', ')}`);
    if (import.meta.env.PROD) {
      throw new Error(`Production requires all service endpoints to be configured: ${missing.join(', ')}`);
    }
  }
};

// Check if running in development mode with mock services
export const shouldUseMockData = (): boolean => {
  return config.development.enableMockData || config.development.mockApi;
};

// Get service base URL with fallbacks
export const getServiceUrl = (serviceName: keyof typeof config.services): string => {
  const url = config.services[serviceName];
  if (!url || url.includes('undefined')) {
    console.warn(`Service ${serviceName} URL not configured, using mock data`);
    return 'mock://localhost';
  }
  return url;
};

// Initialize endpoint validation
validateEndpoints();