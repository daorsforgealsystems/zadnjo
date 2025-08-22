import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from '../useAuth';
import AuthContext, { AuthContextType } from '../authCore';
import { ReactNode } from 'react';

// Mock auth context values
const mockAuthContextValue: AuthContextType = {
  session: null,
  user: null,
  loading: false,
  isAuthenticated: false,
  login: vi.fn(),
  signup: vi.fn(),
  loginAsGuest: vi.fn(),
  signOut: vi.fn(),
  logout: vi.fn(),
  hasRole: vi.fn(),
};

const mockAuthenticatedContext: AuthContextType = {
  session: {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh',
    expires_in: 3600,
    expires_at: Date.now() / 1000 + 3600,
    token_type: 'bearer',
    user: {
      id: 'user-123',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }
  },
  user: {
    id: 'user-123',
    username: 'testuser',
    role: 'CLIENT',
    avatarUrl: 'https://example.com/avatar.jpg',
    associatedItemIds: ['item-1', 'item-2'],
    email: 'test@example.com',
  },
  loading: false,
  isAuthenticated: true,
  login: vi.fn(),
  signup: vi.fn(),
  loginAsGuest: vi.fn(),
  signOut: vi.fn(),
  logout: vi.fn(),
  hasRole: vi.fn(),
};

const createWrapper = (contextValue: AuthContextType) => {
  return ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic hook functionality', () => {
    it('should return auth context when used within provider', () => {
      const wrapper = createWrapper(mockAuthContextValue);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current).toBe(mockAuthContextValue);
    });

    it('should return default values when used without provider', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.session).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should provide all required context properties', () => {
      const wrapper = createWrapper(mockAuthContextValue);
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Check all required properties exist
      expect(result.current).toHaveProperty('session');
      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('signup');
      expect(result.current).toHaveProperty('loginAsGuest');
      expect(result.current).toHaveProperty('signOut');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('hasRole');
    });
  });

  describe('Authentication state', () => {
    it('should reflect unauthenticated state correctly', () => {
      const wrapper = createWrapper(mockAuthContextValue);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.session).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should reflect authenticated state correctly', () => {
      const wrapper = createWrapper(mockAuthenticatedContext);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.session).toBeDefined();
      expect(result.current.user).toBeDefined();
      expect(result.current.user?.email).toBe('test@example.com');
      expect(result.current.user?.username).toBe('testuser');
      expect(result.current.user?.role).toBe('CLIENT');
    });

    it('should handle loading state correctly', () => {
      const loadingContext: AuthContextType = {
        ...mockAuthContextValue,
        loading: true,
      };
      
      const wrapper = createWrapper(loadingContext);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Authentication methods', () => {
    it('should provide login method', async () => {
      const mockLogin = vi.fn().mockResolvedValue({});
      const contextWithLogin: AuthContextType = {
        ...mockAuthContextValue,
        login: mockLogin,
      };
      
      const wrapper = createWrapper(contextWithLogin);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.login).toBe('function');
      
      await result.current.login('test@example.com', 'password123');
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should provide signup method', async () => {
      const mockSignup = vi.fn().mockResolvedValue({});
      const contextWithSignup: AuthContextType = {
        ...mockAuthContextValue,
        signup: mockSignup,
      };
      
      const wrapper = createWrapper(contextWithSignup);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.signup).toBe('function');
      
      await result.current.signup('test@example.com', 'password123', 'testuser', 'CLIENT');
      expect(mockSignup).toHaveBeenCalledWith('test@example.com', 'password123', 'testuser', 'CLIENT');
    });

    it('should provide guest login method', async () => {
      const mockLoginAsGuest = vi.fn().mockResolvedValue({});
      const contextWithGuestLogin: AuthContextType = {
        ...mockAuthContextValue,
        loginAsGuest: mockLoginAsGuest,
      };
      
      const wrapper = createWrapper(contextWithGuestLogin);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.loginAsGuest).toBe('function');
      
      await result.current.loginAsGuest();
      expect(mockLoginAsGuest).toHaveBeenCalled();
    });

    it('should provide signOut method', async () => {
      const mockSignOut = vi.fn().mockResolvedValue(undefined);
      const contextWithSignOut: AuthContextType = {
        ...mockAuthenticatedContext,
        signOut: mockSignOut,
      };
      
      const wrapper = createWrapper(contextWithSignOut);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.signOut).toBe('function');
      
      await result.current.signOut();
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should provide logout method as alias for signOut', async () => {
      const mockLogout = vi.fn().mockResolvedValue(undefined);
      const contextWithLogout: AuthContextType = {
        ...mockAuthenticatedContext,
        logout: mockLogout,
      };
      
      const wrapper = createWrapper(contextWithLogout);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.logout).toBe('function');
      
      await result.current.logout();
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('Role-based authorization', () => {
    it('should provide hasRole method', () => {
      const mockHasRole = vi.fn().mockReturnValue(true);
      const contextWithRole: AuthContextType = {
        ...mockAuthenticatedContext,
        hasRole: mockHasRole,
      };
      
      const wrapper = createWrapper(contextWithRole);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.hasRole).toBe('function');
      
      const hasAdminRole = result.current.hasRole(['ADMIN']);
      expect(mockHasRole).toHaveBeenCalledWith(['ADMIN']);
      expect(hasAdminRole).toBe(true);
    });

    it('should handle role checking for authenticated user', () => {
      const mockHasRole = vi.fn((roles: string[]) => {
        const userRole = 'CLIENT';
        return roles.includes(userRole);
      });
      
      const contextWithRole: AuthContextType = {
        ...mockAuthenticatedContext,
        hasRole: mockHasRole,
      };
      
      const wrapper = createWrapper(contextWithRole);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.hasRole(['CLIENT'])).toBe(true);
      expect(result.current.hasRole(['ADMIN'])).toBe(false);
      expect(result.current.hasRole(['CLIENT', 'ADMIN'])).toBe(true);
    });

    it('should handle role checking for unauthenticated user', () => {
      const mockHasRole = vi.fn().mockReturnValue(false);
      const contextWithRole: AuthContextType = {
        ...mockAuthContextValue,
        hasRole: mockHasRole,
      };
      
      const wrapper = createWrapper(contextWithRole);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.hasRole(['CLIENT'])).toBe(false);
      expect(result.current.hasRole(['ADMIN'])).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle login errors', async () => {
      const mockLogin = vi.fn().mockResolvedValue({
        error: { message: 'Invalid credentials' }
      });
      
      const contextWithError: AuthContextType = {
        ...mockAuthContextValue,
        login: mockLogin,
      };
      
      const wrapper = createWrapper(contextWithError);
      const { result } = renderHook(() => useAuth(), { wrapper });

      const loginResult = await result.current.login('test@example.com', 'wrongpassword');
      expect(loginResult.error?.message).toBe('Invalid credentials');
    });

    it('should handle signup errors', async () => {
      const mockSignup = vi.fn().mockResolvedValue({
        error: { message: 'Email already exists' }
      });
      
      const contextWithError: AuthContextType = {
        ...mockAuthContextValue,
        signup: mockSignup,
      };
      
      const wrapper = createWrapper(contextWithError);
      const { result } = renderHook(() => useAuth(), { wrapper });

      const signupResult = await result.current.signup('existing@example.com', 'password123');
      expect(signupResult.error?.message).toBe('Email already exists');
    });

    it('should handle guest login errors', async () => {
      const mockLoginAsGuest = vi.fn().mockResolvedValue({
        error: { message: 'Guest login disabled' }
      });
      
      const contextWithError: AuthContextType = {
        ...mockAuthContextValue,
        loginAsGuest: mockLoginAsGuest,
      };
      
      const wrapper = createWrapper(contextWithError);
      const { result } = renderHook(() => useAuth(), { wrapper });

      const guestResult = await result.current.loginAsGuest();
      expect(guestResult.error?.message).toBe('Guest login disabled');
    });
  });

  describe('User data handling', () => {
    it('should handle user with associated items', () => {
      const userWithItems: AuthContextType = {
        ...mockAuthenticatedContext,
        user: {
          ...mockAuthenticatedContext.user!,
          associatedItemIds: ['item-1', 'item-2', 'item-3'],
        },
      };
      
      const wrapper = createWrapper(userWithItems);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user?.associatedItemIds).toEqual(['item-1', 'item-2', 'item-3']);
      expect(result.current.user?.associatedItemIds).toHaveLength(3);
    });

    it('should handle user without avatar', () => {
      const userWithoutAvatar: AuthContextType = {
        ...mockAuthenticatedContext,
        user: {
          ...mockAuthenticatedContext.user!,
          avatarUrl: undefined,
        },
      };
      
      const wrapper = createWrapper(userWithoutAvatar);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user?.avatarUrl).toBeUndefined();
    });

    it('should handle user with different roles', () => {
      const adminUser: AuthContextType = {
        ...mockAuthenticatedContext,
        user: {
          ...mockAuthenticatedContext.user!,
          role: 'ADMIN',
        },
      };
      
      const wrapper = createWrapper(adminUser);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user?.role).toBe('ADMIN');
    });
  });

  describe('Session management', () => {
    it('should handle valid session data', () => {
      const wrapper = createWrapper(mockAuthenticatedContext);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.session?.access_token).toBe('mock-token');
      expect(result.current.session?.refresh_token).toBe('mock-refresh');
      expect(result.current.session?.token_type).toBe('bearer');
      expect(result.current.session?.user.email).toBe('test@example.com');
    });

    it('should handle expired session', () => {
      const expiredSession: AuthContextType = {
        ...mockAuthenticatedContext,
        session: {
          ...mockAuthenticatedContext.session!,
          expires_at: Date.now() / 1000 - 3600, // Expired 1 hour ago
        },
      };
      
      const wrapper = createWrapper(expiredSession);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.session?.expires_at).toBeLessThan(Date.now() / 1000);
    });

    it('should handle null session', () => {
      const wrapper = createWrapper(mockAuthContextValue);
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});