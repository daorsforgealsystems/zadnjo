// Application configuration
export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },

  // Supabase Configuration - prefer NEXT_PUBLIC_* (Next.js) but keep VITE_* for backward compatibility
  supabase: {
    // Require explicit environment variables; avoid shipping real defaults
    url: (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string) || (import.meta.env.VITE_SUPABASE_URL as string),
    anonKey: (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) || (import.meta.env.VITE_SUPABASE_ANON_KEY as string),
  },

  // Application Settings
  app: {
    name: 'DAORS Flow Motion',
    version: '1.0.0',
    description: 'Advanced Logistics Management System',
    defaultTheme: 'dark' as const,
    defaultLanguage: 'en',
  },

  // Feature Flags
  features: {
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableNotifications: true,
    enableRealTimeUpdates: true,
    enableOfflineMode: false,
    enableDebugMode: import.meta.env.NODE_ENV === 'development',
  },

  // UI Configuration
  ui: {
    sidebarWidth: '16rem',
    headerHeight: '4rem',
    animationDuration: 300,
    toastDuration: 5000,
  },

  // Map Configuration
  map: {
    defaultCenter: { lat: 44.8176, lng: 20.4633 }, // Belgrade, Serbia
    defaultZoom: 10,
    maxZoom: 18,
    minZoom: 3,
  },

  // Performance Settings
  performance: {
    enablePerformanceMonitoring: import.meta.env.NODE_ENV === 'development',
    enableMemoryMonitoring: import.meta.env.NODE_ENV === 'development',
    chunkSize: 50, // For pagination
    debounceDelay: 300, // For search inputs
  },

  // Security Settings
  security: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // Development Settings
  development: {
    enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
    enableDevTools: import.meta.env.NODE_ENV === 'development',
    logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
  },
} as const;

// Type-safe environment variable access
export const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value || defaultValue || '';
};

// Validate required environment variables
export const validateConfig = (): void => {
  // Accept either NEXT_PUBLIC_* (Next.js) or VITE_* (Vite).
  // Only require that a Supabase URL and an ANON key exist (each may be provided under either prefix).
  const url = (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string) || (import.meta.env.VITE_SUPABASE_URL as string);
  const anonKey = (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) || (import.meta.env.VITE_SUPABASE_ANON_KEY as string);

  const missing: string[] = [];
  if (!url) missing.push('SUPABASE_URL (NEXT_PUBLIC_* or VITE_*)');
  if (!anonKey) missing.push('SUPABASE_ANON_KEY (NEXT_PUBLIC_* or VITE_*)');

  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing);
    // In production we should fail fast; in development continue using the defaults defined above.
    if (import.meta.env.PROD) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
};

// Initialize configuration validation
validateConfig();