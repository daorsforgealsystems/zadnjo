import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { NavigationAPI, NavigationItem, NavigationAnalytics, UserRole } from '@/lib/api/navigation-api';
import { useAuth } from './AuthContext';
import { useLocation } from 'react-router-dom';

interface NavigationState {
  menu: NavigationItem[];
  permissions: {
    actions: string[];
    restrictedComponents: string[];
    landingPage: string;
  };
  analytics: NavigationAnalytics | null;
  breadcrumbs: Array<{ label: string; href: string }>;
  loading: boolean;
  error: string | null;
  badges: Record<string, number>;
  customization: any;
  routeGuard: any;
}

type NavigationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MENU'; payload: NavigationItem[] }
  | { type: 'SET_PERMISSIONS'; payload: any }
  | { type: 'SET_ANALYTICS'; payload: NavigationAnalytics }
  | { type: 'SET_BREADCRUMBS'; payload: Array<{ label: string; href: string }> }
  | { type: 'UPDATE_BADGES'; payload: Record<string, number> }
  | { type: 'SET_CUSTOMIZATION'; payload: any }
  | { type: 'SET_ROUTE_GUARD'; payload: any }
  | { type: 'RESET_STATE' };

const initialState: NavigationState = {
  menu: [],
  permissions: {
    actions: [],
    restrictedComponents: [],
    landingPage: '/dashboard',
  },
  analytics: null,
  breadcrumbs: [],
  loading: false,
  error: null,
  badges: {},
  customization: {},
  routeGuard: null,
};

function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_MENU':
      return { ...state, menu: action.payload };
    case 'SET_PERMISSIONS':
      return { ...state, permissions: action.payload };
    case 'SET_ANALYTICS':
      return { ...state, analytics: action.payload };
    case 'SET_BREADCRUMBS':
      return { ...state, breadcrumbs: action.payload };
    case 'UPDATE_BADGES':
      return { ...state, badges: { ...state.badges, ...action.payload } };
    case 'SET_CUSTOMIZATION':
      return { ...state, customization: action.payload };
    case 'SET_ROUTE_GUARD':
      return { ...state, routeGuard: action.payload };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

interface NavigationContextType {
  state: NavigationState;
  actions: {
    loadNavigationData: () => Promise<void>;
    checkRouteAccess: (route: string) => Promise<boolean>;
    trackPageView: (page: string, timeSpent?: number) => Promise<void>;
    trackSearch: (query: string, resultCount: number) => Promise<void>;
    trackComponentInteraction: (componentId: string, interaction: string) => Promise<void>;
    updateBreadcrumbs: (route: string) => Promise<void>;
    updateBadge: (itemId: string, count: number) => Promise<void>;
    refreshAnalytics: () => Promise<void>;
    canPerformAction: (action: string) => boolean;
    isComponentRestricted: (componentId: string) => boolean;
    getNavigationItem: (href: string) => NavigationItem | null;
    getFlatMenu: () => NavigationItem[];
  };
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(navigationReducer, initialState);
  const { user } = useAuth();
  const location = useLocation();

  // Track page navigation
  useEffect(() => {
    if (user?.id) {
      trackPageView(location.pathname);
      updateBreadcrumbs(location.pathname);
    }
  }, [location.pathname, user?.id]);

  // Load navigation data on mount or user change
  useEffect(() => {
    if (user?.id && user.roles?.[0]) {
      loadNavigationData();
    } else {
      dispatch({ type: 'RESET_STATE' });
    }
  }, [user?.id, user?.roles]);

  const loadNavigationData = useCallback(async () => {
    if (!user?.id || !user.roles?.[0]) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const navigationState = await NavigationAPI.getNavigationState(
        user.id,
        user.roles[0] as UserRole
      );

      dispatch({ type: 'SET_MENU', payload: navigationState.menu });
      dispatch({ type: 'SET_PERMISSIONS', payload: navigationState.permissions.permissions });
      dispatch({ type: 'SET_ANALYTICS', payload: navigationState.analytics });
      dispatch({ type: 'SET_CUSTOMIZATION', payload: navigationState.customization });

      // Create route guard
      const routeGuard = await NavigationAPI.createRouteGuard(
        user.id,
        user.roles[0] as UserRole
      );
      dispatch({ type: 'SET_ROUTE_GUARD', payload: routeGuard });

      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load navigation data' });
      console.error('Error loading navigation data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user?.id, user?.roles]);

  const checkRouteAccess = useCallback(async (route: string): Promise<boolean> => {
    if (!user?.id || !user.roles?.[0]) return false;

    try {
      const result = await NavigationAPI.checkRouteAccess(
        user.id,
        route,
        user.roles[0] as UserRole
      );
      return result.hasAccess;
    } catch (error) {
      console.error('Error checking route access:', error);
      return false;
    }
  }, [user?.id, user?.roles]);

  const trackPageView = useCallback(async (page: string, timeSpent?: number) => {
    if (!user?.id) return;

    try {
      await NavigationAPI.trackPageView(user.id, page, timeSpent);
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }, [user?.id]);

  const trackSearch = useCallback(async (query: string, resultCount: number) => {
    if (!user?.id) return;

    try {
      await NavigationAPI.trackSearch(user.id, query, resultCount);
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }, [user?.id]);

  const trackComponentInteraction = useCallback(async (componentId: string, interaction: string) => {
    if (!user?.id) return;

    try {
      await NavigationAPI.trackComponentInteraction(user.id, componentId, interaction);
    } catch (error) {
      console.error('Error tracking component interaction:', error);
    }
  }, [user?.id]);

  const updateBreadcrumbs = useCallback(async (route: string) => {
    if (!user?.roles?.[0]) return;

    try {
      const result = await NavigationAPI.getBreadcrumbs(route, user.roles[0] as UserRole);
      dispatch({ type: 'SET_BREADCRUMBS', payload: result.breadcrumbs });
    } catch (error) {
      console.error('Error updating breadcrumbs:', error);
    }
  }, [user?.roles]);

  const updateBadge = useCallback(async (itemId: string, count: number) => {
    try {
      await NavigationAPI.updateNavigationBadge(itemId, count);
      dispatch({ type: 'UPDATE_BADGES', payload: { [itemId]: count } });
    } catch (error) {
      console.error('Error updating badge:', error);
    }
  }, []);

  const refreshAnalytics = useCallback(async () => {
    if (!user?.id) return;

    try {
      const analytics = await NavigationAPI.getNavigationAnalytics(user.id);
      dispatch({ type: 'SET_ANALYTICS', payload: analytics });
    } catch (error) {
      console.error('Error refreshing analytics:', error);
    }
  }, [user?.id]);

  // Permission helpers
  const canPerformAction = useCallback((action: string): boolean => {
    return state.permissions.actions.includes(action);
  }, [state.permissions.actions]);

  const isComponentRestricted = useCallback((componentId: string): boolean => {
    return state.permissions.restrictedComponents.includes(componentId);
  }, [state.permissions.restrictedComponents]);

  // Navigation helpers
  const getNavigationItem = useCallback((href: string): NavigationItem | null => {
    return NavigationAPI.findNavigationItem(state.menu, href);
  }, [state.menu]);

  const getFlatMenu = useCallback((): NavigationItem[] => {
    return NavigationAPI.flattenNavigationMenu(state.menu);
  }, [state.menu]);

  // Auto-refresh analytics periodically
  useEffect(() => {
    if (user?.id) {
      const interval = setInterval(refreshAnalytics, 5 * 60 * 1000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [user?.id, refreshAnalytics]);

  const contextValue: NavigationContextType = {
    state,
    actions: {
      loadNavigationData,
      checkRouteAccess,
      trackPageView,
      trackSearch,
      trackComponentInteraction,
      updateBreadcrumbs,
      updateBadge,
      refreshAnalytics,
      canPerformAction,
      isComponentRestricted,
      getNavigationItem,
      getFlatMenu,
    }
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};