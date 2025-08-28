import { useMemo } from 'react';
import { useAuth } from '@/context/useAuth';
import { ROLES } from '@/lib/types';

export interface AuthStatus {
  // Basic states
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  isError: boolean;
  
  // User information
  user: ReturnType<typeof useAuth>['user'];
  userRole: string | null;
  userName: string | null;
  userEmail: string | null;
  
  // Permissions
  canManage: boolean;
  canDrive: boolean;
  canViewAll: boolean;
  isAdmin: boolean;
  
  // Error information
  error: string | null;
  canRetry: boolean;
  
  // Actions
  retry: (() => Promise<void>) | null;
  loginAsGuest: () => Promise<{ error?: { message: string } }>;
  signOut: () => Promise<void>;
}

/**
 * Enhanced hook that provides comprehensive authentication status
 * and common permission checks in a single, easy-to-use interface.
 */
export function useAuthStatus(): AuthStatus {
  const auth = useAuth();
  
  return useMemo(() => {
    const {
      loading,
      isAuthenticated,
      user,
      authState,
      initError,
      retryAuth,
      loginAsGuest,
      signOut,
      hasRole
    } = auth;

    // Basic states
    const isLoading = loading;
    const isGuest = authState === 'guest' || user?.role === ROLES.GUEST;
    const isError = authState === 'error';
    
    // User information
    const userRole = user?.role || null;
    const userName = user?.username || null;
    const userEmail = user?.email || null;
    
    // Permission checks
    const canManage = hasRole([ROLES.ADMIN, ROLES.MANAGER]);
    const canDrive = hasRole([ROLES.ADMIN, ROLES.MANAGER, ROLES.DRIVER]);
    const canViewAll = hasRole([ROLES.ADMIN, ROLES.MANAGER]);
    const isAdmin = hasRole([ROLES.ADMIN]);
    
    // Error information
    const error = initError || null;
    const canRetry = isError && !!retryAuth;
    
    return {
      // Basic states
      isLoading,
      isAuthenticated,
      isGuest,
      isError,
      
      // User information
      user,
      userRole,
      userName,
      userEmail,
      
      // Permissions
      canManage,
      canDrive,
      canViewAll,
      isAdmin,
      
      // Error information
      error,
      canRetry,
      
      // Actions
      retry: retryAuth || null,
      loginAsGuest,
      signOut,
    };
  }, [auth]);
}

export default useAuthStatus;