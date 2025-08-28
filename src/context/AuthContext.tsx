import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ROLES, Role, User as AppUser } from '@/lib/types';
import { mapSupabaseUserToAppUser } from './authUtils';
import AuthContext, { AuthContextType } from './authCore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

// Auth initialization states for better UX
type AuthState = 'initializing' | 'authenticated' | 'guest' | 'error';

// Consistent guest user object
const GUEST_USER: AppUser & { email?: string } = {
  id: 'guest',
  username: 'Guest User',
  role: ROLES.GUEST,
  associatedItemIds: []
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<(AppUser & { email?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>('initializing');
  const [initError, setInitError] = useState<string | null>(null);

  // Helper to set guest mode consistently
  const setGuestMode = useCallback(() => {
    setUser(GUEST_USER);
    setSession(null);
    setAuthState('guest');
    setLoading(false);
    localStorage.setItem('df_guest_session', 'true');
  }, []);

  // Helper to clear auth state
  const clearAuthState = useCallback(() => {
    setUser(null);
    setSession(null);
    setAuthState('initializing');
    setInitError(null);
    localStorage.removeItem('df_guest_session');
  }, []);

  // Initialize authentication with improved error handling
  useEffect(() => {
    let isMounted = true;
    let initTimeout: NodeJS.Timeout;
    
    const initializeAuth = async () => {
      try {
        // Check for existing guest session first
        const isGuestSession = localStorage.getItem('df_guest_session') === 'true';
        if (isGuestSession) {
          if (isMounted) {
            setGuestMode();
          }
          return;
        }

        // Set a reasonable timeout for initialization
        initTimeout = setTimeout(() => {
          if (isMounted && loading) {
            console.warn('Auth initialization timed out, falling back to guest mode');
            setInitError('Authentication service is taking too long to respond');
            setGuestMode();
          }
        }, 10000); // Reduced to 10s for better UX

        // Try to get current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (sessionError) {
          console.warn('Session fetch error:', sessionError);
          setInitError('Failed to restore previous session');
          setGuestMode();
          return;
        }

        const currentSession = sessionData?.session;
        setSession(currentSession);

        if (currentSession) {
          // We have a session, get user data
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (!isMounted) return;
          
          if (userError || !userData?.user) {
            console.warn('User fetch error:', userError);
            setInitError('Failed to load user information');
            setGuestMode();
            return;
          }

          const appUser = mapSupabaseUserToAppUser(userData.user);
          setUser(appUser);
          setAuthState('authenticated');
          setLoading(false);
        } else {
          // No session, proceed as guest
          setGuestMode();
        }
        
        clearTimeout(initTimeout);
      } catch (error) {
        console.error('Auth initialization failed:', error);
        if (isMounted) {
          setInitError('Authentication system encountered an error');
          setAuthState('error');
          setLoading(false);
        }
      }
    };
    
    initializeAuth();
    
    return () => {
      isMounted = false;
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
    };
  }, [loading, setGuestMode]);

  // Listen to session changes with improved handling
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state change:', event, !!newSession);
      
      setSession(newSession);
      
      if (newSession) {
        // User signed in
        try {
          const { data: userData, error } = await supabase.auth.getUser();
          if (error || !userData?.user) {
            console.warn('Failed to get user data after auth change:', error);
            setGuestMode();
            return;
          }
          
          const appUser = mapSupabaseUserToAppUser(userData.user);
          setUser(appUser);
          setAuthState('authenticated');
          setLoading(false);
          setInitError(null);
          
          // Clear guest session flag
          localStorage.removeItem('df_guest_session');
        } catch (error) {
          console.error('Error handling auth state change:', error);
          setGuestMode();
        }
      } else {
        // User signed out or session expired
        if (event === 'SIGNED_OUT') {
          clearAuthState();
          setGuestMode();
        }
      }
    });
    
    return () => {
      data.subscription.unsubscribe();
    };
  }, [setGuestMode, clearAuthState]);

  // Computed values
  const isAuthenticated = useMemo(() => {
    return authState === 'authenticated' && !!user && !!session;
  }, [authState, user, session]);

  // Enhanced login with better error handling
  const loginMutation = useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      setInitError(null);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      // Clear any cached data and refresh
      await queryClient.invalidateQueries();
      setAuthState('authenticated');
      setInitError(null);
    },
    onError: (error: any) => {
      console.error('Login failed:', error);
      setInitError(error?.message || 'Login failed');
    }
  });

  const login = async (email: string, password: string) => {
    try {
      await loginMutation.mutateAsync({ email, password });
      return {};
    } catch (err) {
      const error = err as { message?: string };
      return { error: { message: error?.message || 'Login failed' } };
    }
  };

  const signup = async (
    email: string,
    password: string,
    username?: string,
    role: Role = ROLES.CLIENT
  ) => {
    try {
      setInitError(null);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, role },
        },
      });
      if (error) return { error: { message: error.message } };
      return {};
    } catch (err) {
      const error = err as { message?: string };
      const errorMessage = error?.message || 'Signup failed';
      setInitError(errorMessage);
      return { error: { message: errorMessage } };
    }
  };

  const loginAsGuest = async () => {
    try {
      setGuestMode();
      setInitError(null);
      return {};
    } catch (err) {
      const error = err as { message?: string };
      const errorMessage = error?.message || 'Guest login failed';
      setInitError(errorMessage);
      return { error: { message: errorMessage } };
    }
  };

  const signOut = async () => {
    try {
      clearAuthState();
      await supabase.auth.signOut();
      setGuestMode();
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if signOut fails, clear local state
      clearAuthState();
      setGuestMode();
    }
  };

  const hasRole = (roles: Role[]) => {
    if (!user || authState !== 'authenticated') return false;
    return roles.includes(user.role);
  };

  // Retry authentication (useful for error recovery)
  const retryAuth = useCallback(async () => {
    setLoading(true);
    setInitError(null);
    setAuthState('initializing');
    
    try {
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error || !sessionData?.session) {
        setGuestMode();
        return;
      }
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        setGuestMode();
        return;
      }
      
      const appUser = mapSupabaseUserToAppUser(userData.user);
      setUser(appUser);
      setSession(sessionData.session);
      setAuthState('authenticated');
      setLoading(false);
    } catch (error) {
      console.error('Auth retry failed:', error);
      setInitError('Failed to reconnect to authentication service');
      setAuthState('error');
      setLoading(false);
    }
  }, [setGuestMode]);

  const value: AuthContextType = {
    session,
    user,
    loading,
    isAuthenticated,
    login,
    signup,
    loginAsGuest,
    signOut,
    // alias for components expecting `logout`
    logout: signOut,
    hasRole,
    // Additional properties for enhanced UX
    authState,
    initError,
    retryAuth,
  } as AuthContextType & {
    authState: AuthState;
    initError: string | null;
    retryAuth: () => Promise<void>;
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Render children even if loading, but you can gate routes/components using useAuth().loading where needed */}
      {children}
    </AuthContext.Provider>
  );
}

// `useAuth` is exported from `src/context/useAuth.ts` to keep this file component-only for fast refresh
