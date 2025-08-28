
// Forge Constitution: Security boundary clarification
// This context provides client-side authentication and RBAC helpers for UX only.
// True authentication and authorization MUST be enforced server-side.
// Architectural justification: Modular, typed context for frontend state and actions.
// Trade-off: Improves user experience, but does NOT guarantee security or access control.
// Security assessment: Never rely solely on this for sensitive actions or data protection.

import { createContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ROLES, Role, User as AppUser } from '@/lib/types';


export interface AuthContextType {
  // Session & user state (client-side only)
  session: Session | null;
  user: (AppUser & { email?: string }) | null;
  loading: boolean;
  isAuthenticated: boolean;

  // Actions (client-side only)
  login: (email: string, password: string) => Promise<{ error?: { message: string } }>;
  signup: (
    email: string,
    password: string,
    username?: string,
    role?: Role
  ) => Promise<{ error?: { message: string } }>;
  loginAsGuest: () => Promise<{ error?: { message: string } }>;
  signOut: () => Promise<void>;
  // Backwards-compatible alias many components expect
  logout: () => Promise<void>;

  // Authz helpers (client-side only)
  hasRole: (roles: Role[]) => boolean;

  // Enhanced UX properties (optional for backward compatibility)
  authState?: 'initializing' | 'authenticated' | 'guest' | 'error';
  initError?: string | null;
  retryAuth?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => ({}),
  signup: async () => ({}),
  loginAsGuest: async () => ({ }),
  signOut: async () => {},
  logout: async () => {},
  hasRole: () => false,
});


export default AuthContext;
