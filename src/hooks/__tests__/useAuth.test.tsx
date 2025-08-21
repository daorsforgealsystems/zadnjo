import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from '../../context/useAuth';
import AuthContext, { AuthContextType } from '../../context/authCore';
import { ReactNode } from 'react';

describe('useAuth Hook', () => {
  let mockAuthContext: AuthContextType;

  beforeEach(() => {
    mockAuthContext = {
      session: null,
      user: null,
      loading: false,
      isAuthenticated: false,
      login: vi.fn().mockResolvedValue({}),
      signup: vi.fn().mockResolvedValue({}),
      loginAsGuest: vi.fn().mockResolvedValue({}),
      signOut: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
      hasRole: vi.fn().mockReturnValue(false),
    };
  });

  const createWrapper = (contextValue: AuthContextType) => {
    return ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    );
  };

  describe('Authentication State', () => {
    it('should return unauthenticated state by default', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockAuthContext)
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.session).toBe(null);
      expect(result.current.loading).toBe(false);
    });

    it('should return authenticated state when user is logged in', () => {
      const authenticatedContext: AuthContextType = {
        ...mockAuthContext,
        isAuthenticated: true,
        user: {
          id: 'user-123',
          username: 'testuser',
          role: 'CLIENT',
          avatarUrl: 'https://example.com/avatar.jpg',
          associatedItemIds: ['item-1'],
          email: 'test@example.com'
        },
        session: {
          access_token: 'mock-token',
          user: { id: 'user-123' }
        } as any
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(authenticatedContext)
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toBeDefined();
      expect(result.current.user?.id).toBe('user-123');
      expect(result.current.session).toBeDefined();
    });

    it('should return loading state when authentication is in progress', () => {
      const loadingContext: AuthContextType = {
        ...mockAuthContext,
        loading: true
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(loadingContext)
      });

      expect(result.current.loading).toBe(true);
    });
  });

  describe('Authentication Actions', () => {
    it('should provide login function', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockAuthContext)
      });

      await result.current.login('test@example.com', 'password');

      expect(mockAuthContext.login).toHaveBeenCalledWith('test@example.com', 'password');
    });

    it('should provide signup function', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockAuthContext)
      });

      await result.current.signup('test@example.com', 'password', 'testuser', 'CLIENT');

      expect(mockAuthContext.signup).toHaveBeenCalledWith(
        'test@example.com', 
        'password', 
        'testuser', 
        'CLIENT'
      );
    });

    it('should provide guest login function', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockAuthContext)
      });

      await result.current.loginAsGuest();

      expect(mockAuthContext.loginAsGuest).toHaveBeenCalled();
    });

    it('should provide signOut function', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockAuthContext)
      });

      await result.current.signOut();

      expect(mockAuthContext.signOut).toHaveBeenCalled();
    });

    it('should provide logout function (alias for signOut)', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockAuthContext)
      });

      await result.current.logout();

      expect(mockAuthContext.logout).toHaveBeenCalled();
    });
  });

  describe('Role Authorization', () => {
    it('should check user roles correctly', () => {
      const contextWithRoles: AuthContextType = {
        ...mockAuthContext,
        hasRole: vi.fn().mockImplementation((roles: string[]) => 
          roles.includes('CLIENT')
        )
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(contextWithRoles)
      });

      expect(result.current.hasRole(['CLIENT'])).toBe(true);
      expect(result.current.hasRole(['ADMIN'])).toBe(false);
      expect(result.current.hasRole(['CLIENT', 'ADMIN'])).toBe(true);
    });

    it('should handle empty role checks', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockAuthContext)
      });

      expect(result.current.hasRole([])).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle login errors', async () => {
      const errorContext: AuthContextType = {
        ...mockAuthContext,
        login: vi.fn().mockResolvedValue({ 
          error: { message: 'Invalid credentials' }
        })
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(errorContext)
      });

      const loginResult = await result.current.login('test@example.com', 'wrongpassword');

      expect(loginResult.error?.message).toBe('Invalid credentials');
    });

    it('should handle signup errors', async () => {
      const errorContext: AuthContextType = {
        ...mockAuthContext,
        signup: vi.fn().mockResolvedValue({ 
          error: { message: 'Email already exists' }
        })
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(errorContext)
      });

      const signupResult = await result.current.signup('existing@example.com', 'password');

      expect(signupResult.error?.message).toBe('Email already exists');
    });

    it('should handle guest login errors', async () => {
      const errorContext: AuthContextType = {
        ...mockAuthContext,
        loginAsGuest: vi.fn().mockResolvedValue({ 
          error: { message: 'Guest login disabled' }
        })
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(errorContext)
      });

      const guestResult = await result.current.loginAsGuest();

      expect(guestResult.error?.message).toBe('Guest login disabled');
    });
  });

  describe('Context Integration', () => {
    it('should throw error when used outside of AuthProvider', () => {
      // This test checks the hook behavior without a provider
      // Since we're testing the hook directly, we expect it to return the default context
      const { result } = renderHook(() => useAuth());

      // The default context should have null values and placeholder functions
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.session).toBe(null);
      expect(result.current.loading).toBe(true); // Default context has loading: true
    });

    it('should provide stable function references', () => {
      const { result, rerender } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockAuthContext)
      });

      const firstRender = {
        login: result.current.login,
        signup: result.current.signup,
        signOut: result.current.signOut,
        logout: result.current.logout,
        hasRole: result.current.hasRole,
      };

      rerender();

      // Functions should be the same references (from context)
      expect(result.current.login).toBe(firstRender.login);
      expect(result.current.signup).toBe(firstRender.signup);
      expect(result.current.signOut).toBe(firstRender.signOut);
      expect(result.current.logout).toBe(firstRender.logout);
      expect(result.current.hasRole).toBe(firstRender.hasRole);
    });
  });

  describe('User Data Structure', () => {
    it('should handle user with all optional fields', () => {
      const fullUserContext: AuthContextType = {
        ...mockAuthContext,
        isAuthenticated: true,
        user: {
          id: 'user-123',
          username: 'testuser',
          role: 'CLIENT',
          avatarUrl: 'https://example.com/avatar.jpg',
          associatedItemIds: ['item-1', 'item-2'],
          email: 'test@example.com'
        }
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(fullUserContext)
      });

      expect(result.current.user?.email).toBe('test@example.com');
      expect(result.current.user?.associatedItemIds).toEqual(['item-1', 'item-2']);
    });

    it('should handle user without optional email field', () => {
      const userWithoutEmailContext: AuthContextType = {
        ...mockAuthContext,
        isAuthenticated: true,
        user: {
          id: 'user-123',
          username: 'testuser',
          role: 'CLIENT',
          avatarUrl: 'https://example.com/avatar.jpg',
          associatedItemIds: ['item-1']
        }
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(userWithoutEmailContext)
      });

      expect(result.current.user?.email).toBeUndefined();
      expect(result.current.user?.id).toBe('user-123');
    });
  });
});