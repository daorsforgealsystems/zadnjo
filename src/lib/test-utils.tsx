import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { AuthProvider } from '@/context/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';

// Mock implementations for testing
const mockQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={mockQueryClient}>
          <ThemeProvider defaultTheme="light" storageKey="test-theme">
            <AuthProvider>
              {children}
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data generators
export const mockUser = {
  id: 'test-user-id',
  username: 'testuser',
  role: 'CLIENT' as const,
  avatarUrl: 'https://example.com/avatar.jpg',
  associatedItemIds: ['item-1', 'item-2'],
};

export const mockItem = {
  id: 'test-item-1',
  name: 'Test Package',
  status: 'In Transit' as const,
  location: 'Test Location',
  coordinates: { lat: 44.8176, lng: 20.4633 },
  history: [
    { status: 'Picked up', timestamp: '2024-01-15T08:00:00Z' },
    { status: 'In Transit', timestamp: '2024-01-15T10:30:00Z' }
  ],
  documents: [],
  routeId: 'route-1'
};

export const mockRoute = {
  id: 'test-route-1',
  from: 'Belgrade, Serbia',
  to: 'Munich, Germany',
  status: 'Active' as const,
  progress: 65,
  eta: '2024-01-17T18:00:00Z',
  driver: 'Test Driver',
  predictedEta: {
    time: '2024-01-17T17:45:00Z',
    confidence: 92
  },
  anomalies: [],
  currentPosition: { lat: 45.2671, lng: 19.8335 },
  speed: 85,
  lastMoved: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  plannedRoute: [
    { lat: 44.8176, lng: 20.4633 },
    { lat: 45.2671, lng: 19.8335 },
  ]
};

export const mockNotification = {
  id: 'test-notification-1',
  title: 'Test Notification',
  message: 'This is a test notification',
  type: 'info' as const,
  read: false,
  timestamp: new Date().toISOString(),
  userId: 'test-user-id'
};

// Test helpers
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key]);
    },
  };
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };