import { createClient } from '@supabase/supabase-js'
import { config } from './config'

// Helper function to implement retry logic
const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3, retryDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Use a longer timeout for each retry attempt
      const timeoutMs = 15000 + (attempt * 5000); // 15s, 20s, 25s
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error;
      console.warn(`Supabase fetch attempt ${attempt + 1}/${maxRetries} failed for ${url}:`, error);
      
      // Don't wait on the last attempt
      if (attempt < maxRetries - 1) {
        // Exponential backoff
        const delay = retryDelay * Math.pow(1.5, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If we get here, all retries failed
  throw lastError;
};

// Create a more resilient Supabase client with timeout, retry and error handling
const supabaseInstance = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'daorsforge-auth-storage',
      flowType: 'implicit'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    global: {
      fetch: (...args) => {
        const [url, options] = args as [string, RequestInit];
        // Use our custom fetch with retry logic for auth-related endpoints
        if (url.includes('/auth/')) {
          return fetchWithRetry(url, options, 3, 1000);
        }
        
        // For non-auth endpoints, use standard fetch with timeout
        return fetch(url, {
          ...options,
          signal: createTimeoutSignal(15000) // 15 second timeout
        }).catch(error => {
          devWarn(`Supabase fetch error for ${url}:`, error);
          throw error;
        });
      }
    }
  }
);

console.log('Supabase client initialized successfully with retry mechanism');

export const supabase = supabaseInstance;
