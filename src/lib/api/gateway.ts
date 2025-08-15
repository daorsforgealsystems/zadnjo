// Lightweight typed clients for API Gateway services
// Uses fetch; plug in your auth token if needed

import { config } from '@/lib/config';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const USER_SERVICE_BASE = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:4001';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers || {});
  headers.set('Content-Type', 'application/json');
  // If you have an auth token, attach here:
  const token = localStorage.getItem('df_auth_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// Create axios-like client for user service
class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(method: string, path: string, data?: any, params?: Record<string, any>): Promise<{ data: T }> {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    // Add auth token if available
    const token = localStorage.getItem('df_auth_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Build URL with query parameters
    const url = new URL(`${this.baseURL}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const init: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      init.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url.toString(), init);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return { data: result };
    } catch (error) {
      console.error(`API Request failed: ${method} ${path}`, error);
      throw error;
    }
  }

  async get<T>(path: string, config?: { params?: Record<string, any> }): Promise<{ data: T }> {
    return this.request<T>('GET', path, undefined, config?.params);
  }

  async post<T>(path: string, data?: any, config?: { params?: Record<string, any> }): Promise<{ data: T }> {
    return this.request<T>('POST', path, data, config?.params);
  }

  async put<T>(path: string, data?: any, config?: { params?: Record<string, any> }): Promise<{ data: T }> {
    return this.request<T>('PUT', path, data, config?.params);
  }

  async patch<T>(path: string, data?: any, config?: { params?: Record<string, any> }): Promise<{ data: T }> {
    return this.request<T>('PATCH', path, data, config?.params);
  }

  async delete<T>(path: string, config?: { params?: Record<string, any> }): Promise<{ data: T }> {
    return this.request<T>('DELETE', path, undefined, config?.params);
  }
}

// Export the API client for user service endpoints
export const apiClient = new APIClient(USER_SERVICE_BASE);

// Types
export type OrderDto = { id: string; status: string; placed_at: string; total: number };
export type OptimizeRequest = { stops: Array<{ lat: number; lng: number }>; vehicles?: number };
export type OptimizeResponse = { id: string; vehicles: number; stops: Array<any>; eta: string };
export type VehicleDto = { id: string; lat: number; lng: number; speed: number; updatedAt: string };
export type NotificationDto = { id: string; channel: string; to?: string; title?: string; message?: string; createdAt: string };

// Orders
export const OrdersAPI = {
  list: () => http<{ success: boolean; data: OrderDto[] }>(`/api/v1/orders`),
  get: (id: string) => http<{ success: boolean; data: OrderDto }>(`/api/v1/orders/${id}`),
  create: (payload: Partial<OrderDto>) => http<{ success: boolean; data: OrderDto }>(`/api/v1/orders`, { method: 'POST', body: JSON.stringify(payload) }),
  updateStatus: (id: string, status: string) => http<{ success: boolean; data: OrderDto }>(`/api/v1/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// Routing
export const RoutingAPI = {
  optimize: (payload: OptimizeRequest) => http<{ success: boolean; data: OptimizeResponse }>(`/api/v1/routes/optimize`, { method: 'POST', body: JSON.stringify(payload) }),
};

// Geolocation
export const GeoAPI = {
  vehicles: () => http<{ success: boolean; data: VehicleDto[] }>(`/api/v1/tracking/vehicles`),
  positions: (vehicleId: string) => http<{ success: boolean; data: { vehicleId: string; track: Array<{ lat: number; lng: number; ts: string }> } }>(`/api/v1/tracking/positions/${vehicleId}`),
};

// Notifications
export const NotifyAPI = {
  list: () => http<{ success: boolean; data: NotificationDto[] }>(`/api/v1/notifications`),
  create: (payload: Partial<NotificationDto>) => http<{ success: boolean; data: NotificationDto }>(`/api/v1/notifications`, { method: 'POST', body: JSON.stringify(payload) }),
};