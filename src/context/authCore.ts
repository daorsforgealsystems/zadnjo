import { createContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ROLES, Role, User as AppUser } from '@/lib/types';

export interface AuthContextType {
  // Session & user state
  session: Session | null;
  user: (AppUser & { email?: string }) | null;
  loading: boolean;
  isAuthenticated: boolean;

  // Actions
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

  // Authz helpers
  hasRole: (roles: Role[]) => boolean;
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
