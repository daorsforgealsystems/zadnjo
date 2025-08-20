/* eslint-disable react-refresh/only-export-components */
import * as React from 'react';
import type { NavigationItem } from '@/lib/api/navigation-api';

// Minimal shim to satisfy legacy imports. The project has migrated navigation
// to Redux; this shim provides the previous API surface shape but delegates
// to runtime errors if used directly. It is intended as a temporary bridge
// while other modules are updated to use the Redux-based hooks.

// Stronger shapes for permissions and analytics used by navigation helpers/hooks.
export type PermissionsMap = Record<string, boolean>;

export interface AnalyticsEvent {
  event: string;
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
  timestamp?: string; // ISO string
}

type NavigationActions = {
  checkRouteAccess: (route: string) => Promise<boolean>;
  trackPageView: (page: string, timeSpent?: number) => Promise<void>;
  trackSearch: (query: string, resultCount: number) => Promise<void>;
  trackComponentInteraction: (category: string, action: string, payload?: AnalyticsEvent | Record<string, unknown>) => Promise<void>;
  canPerformAction: (action: string) => boolean;
  isComponentRestricted: (id: string) => boolean;
  getNavigationItem: (path: string) => NavigationItem | null;
  getFlatMenu: () => NavigationItem[];
  updateBadge: (id: string, count: number) => Promise<void>;
};

type NavigationState = {
  menu: NavigationItem[];
  permissions: PermissionsMap | string[] | null;
  breadcrumbs: Array<{ label: string; href: string }>;
  loading: boolean;
  error: string | null;
  badges: Record<string, number>;
  routeGuard?: ((path: string) => boolean | Promise<boolean>) | undefined;
  analytics?: AnalyticsEvent | Record<string, unknown> | undefined;
};

const NavigationContext = React.createContext<{
  state: NavigationState;
  actions: NavigationActions;
 } | null>(null);

export const NavigationProvider = NavigationContext.Provider;

export const useNavigation = () => {
  const ctx = React.useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation must be used within NavigationProvider or replace with useNavigationState');
  }
  return ctx;
};

export default NavigationContext;
// This file has been removed as navigation has been fully migrated to Redux.
// Use useNavigationState() hook and Redux selectors instead.
// 
// Migration complete:
// - NavigationContext → Redux store (navigationSlice.ts)
// - useNavigation() → useNavigationState() hook
// - Manual breadcrumbs → Automatic via updateBreadcrumbsThunk
// - Context providers → Redux providers in store/index.ts