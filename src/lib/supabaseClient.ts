import { createClient } from '@supabase/supabase-js'
import { config } from './config'

// Create a more resilient Supabase client with timeout and error handling
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
        // Add timeout to fetch requests
        const [url, options] = args as [string, RequestInit];
        return fetch(url, {
          ...options,
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
      }
    }
  }
);

console.log('Supabase client initialized successfully');

export const supabase = supabaseInstance;
