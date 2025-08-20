import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ROLES, Role, User as AppUser } from '@/lib/types';
import { mapSupabaseUserToAppUser } from './authUtils';
import AuthContext, { AuthContextType } from './authCore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';


// mapSupabaseUserToAppUser moved to ./authUtils to keep this file exporting only components/hooks

// AuthContext and AuthContextType are defined in ./authCore to keep this file exporting only components/hooks

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<(AppUser & { email?: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore guest session if any
  useEffect(() => {
    const guest = localStorage.getItem('df_guest_session');
    if (guest === 'true') {
      setUser({ id: 'guest', username: 'guest', role: ROLES.GUEST });
      setLoading(false);
    }
  }, []);

  // Initialize from Supabase current session with timeout
  useEffect(() => {
    let isMounted = true;
    let initCompleted = false;
    
    // Set a timeout to prevent hanging indefinitely — don't reference `loading` here so deps can stay []
    const initTimeout = setTimeout(() => {
      if (isMounted && !initCompleted) {
        if (import.meta.env.DEV) {
          console.info('Auth initialization timed out, proceeding as guest');
        }
        // Ensure we mark loading false and provide a guest fallback
        setLoading(false);
        setUser({ id: 'timeout-guest', username: 'Guest User', role: ROLES.GUEST });
      }
    }, 15000); // 15s hard cap for init
    
    const initializeAuth = async () => {
      try {
        // Check if we're already in a guest session
        const guest = localStorage.getItem('df_guest_session');
        if (guest === 'true') {
          setUser({ id: 'guest', username: 'guest', role: ROLES.GUEST });
          setLoading(false);
          return;
        }

        // Try to get session with increased timeout and better error handling
        let sessionData = null;
        try {
          // Resolve to null on timeout instead of throwing
          const sessionResult = await Promise.race([
            supabase.auth.getSession().then(({ data }) => data?.session ?? null),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 15000))
          ]);
          sessionData = sessionResult;
        } catch (sessionError) {
          console.warn('Session fetch failed (non-fatal):', sessionError);
          // Continue with null session
        }
        
        if (!isMounted) return;
        
        setSession(sessionData);
        
        // Only try to get user if we have a session
        if (sessionData) {
          let userData = null;
          try {
            // Resolve to null on timeout instead of throwing
            const userResult = await Promise.race([
              supabase.auth.getUser().then(({ data }) => data?.user ?? null),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 15000))
            ]);
            userData = userResult;
          } catch (userError) {
            console.warn('User fetch failed:', userError);
            // Continue with null user data, will be handled below
          }
          
          if (!isMounted) return;
          
          setUser(mapSupabaseUserToAppUser(userData));
        } else {
          // No session, check if we should proceed as guest
          setUser({ id: 'no-session-guest', username: 'Guest User', role: ROLES.GUEST });
        }
      } catch (e) {
        console.warn('Auth initialization error:', e);
        // Non-fatal; fallback to guest/local state
        if (isMounted) {
          setUser({ id: 'error-guest', username: 'Guest User', role: ROLES.GUEST });
          
          // Try to recover by checking localStorage for any previous session info
          try {
            const storedSession = localStorage.getItem('daorsforge-auth-storage');
            if (storedSession) {
              console.log('Found stored session, attempting recovery...');
              // This might trigger the auth state change listener which will update the state
            }
          } catch (storageError) {
            console.warn('Failed to check localStorage:', storageError);
          }
        }
      } finally {
        if (isMounted) {
          initCompleted = true;
          setLoading(false);
          clearTimeout(initTimeout);
        }
      }
    };
    
    initializeAuth();
    
    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
    };
  }, []);

  // Listen to session changes
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      try {
        const { data: userData } = await supabase.auth.getUser();
        setUser(mapSupabaseUserToAppUser(userData?.user ?? null));
        // Clear guest flag if a real session exists
        if (newSession?.access_token) {
          localStorage.removeItem('df_guest_session');
        }
      } catch (_) {
        setUser(null);
      }
      setLoading(false);
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const isAuthenticated = useMemo(() => !!user && (user.role ? true : !!session), [user, session]);

  // React Query mutation for login (minimal wrapper)
  const loginMutation = useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      const { data: userData } = await supabase.auth.getUser();
      setUser(mapSupabaseUserToAppUser(userData?.user ?? null));
      localStorage.removeItem('df_guest_session');
    },
  });

  const login = async (email: string, password: string) => {
    try {
      await loginMutation.mutateAsync({ email, password });
      return { };
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
      return { error: { message: error?.message || 'Signup failed' } };
    }
  };

  const loginAsGuest = async () => {
    try {
      // Client-side ephemeral guest session
      localStorage.setItem('df_guest_session', 'true');
      setUser({ id: 'guest', username: 'guest', role: ROLES.GUEST });
      setSession(null);
      return {};
    } catch (err) {
      const error = err as { message?: string };
      return { error: { message: error?.message || 'Guest login failed' } };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('df_guest_session');
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  const hasRole = (roles: Role[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

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
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Render children even if loading, but you can gate routes/components using useAuth().loading where needed */}
      {children}
    </AuthContext.Provider>
  );
}

// `useAuth` is exported from `src/context/useAuth.ts` to keep this file component-only for fast refresh
