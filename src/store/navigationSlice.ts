import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { NavigationAnalytics, NavigationItem, UserRole } from '@/lib/api/navigation-api';
import { NavigationAPI } from '@/lib/api/navigation-api';

// Typed shape for permissions returned by the API (or nested under { permissions: ... })
type NavigationPermissions = {
  actions: string[];
  restrictedComponents: string[];
  landingPage?: string;
  menuStructure?: Array<{ href: string }>; // optional when only actions/restrictedComponents provided
};

// Exact shape used in the Redux store
type StorePermissions = {
  actions: string[];
  restrictedComponents: string[];
  landingPage: string;
};

function isNavigationPermissions(obj: unknown): obj is NavigationPermissions {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return Array.isArray(o.actions) && Array.isArray(o.restrictedComponents);
}

function isWrappedPermissions(obj: unknown): obj is { permissions: NavigationPermissions } {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return 'permissions' in o && isNavigationPermissions(o.permissions);
}

function sanitizePermissions(p: Partial<NavigationPermissions> | undefined): StorePermissions {
  return {
    actions: Array.isArray(p?.actions) ? (p!.actions as string[]) : [],
    restrictedComponents: Array.isArray(p?.restrictedComponents) ? (p!.restrictedComponents as string[]) : [],
    landingPage: typeof p?.landingPage === 'string' ? (p!.landingPage as string) : '/dashboard',
  };
}

export interface NavigationState {
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
  routeGuard: {
    userId: string;
    role: UserRole;
    allowedRoutes: string[];
    restrictedComponents: string[];
    availableActions: string[];
    // Functions will be created outside the store
  };
}

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
  routeGuard: {
    userId: '',
    role: 'GUEST' as UserRole,
    allowedRoutes: ['*'],
    restrictedComponents: [],
    availableActions: []
  },
};

// Load complete navigation state
export const loadNavigationState = createAsyncThunk(
  'navigation/loadState',
  async ({ userId, role }: { userId: string; role: UserRole }) => {
    // For guest users, return a minimal navigation state to prevent API calls
    if (userId.includes('guest')) {
      return {
        menu: [],
        permissions: {
          actions: [],
          restrictedComponents: [],
          landingPage: '/dashboard',
          menuStructure: []
        },
        customization: {},
        analytics: {
          userId,
          mostUsedRoutes: [],
          searchQueries: [],
          componentInteractions: [],
          timeSpentByPage: {},
          deviceUsage: { mobile: 0, tablet: 0, desktop: 0 },
          generatedAt: new Date().toISOString()
        }
      };
    }
    
    try {
      return await NavigationAPI.getNavigationState(userId, role);
    } catch (error) {
      console.warn('Failed to load navigation state:', error);
      throw error;
    }
  }
);

// Check a single route access
export const checkRouteAccess = createAsyncThunk(
  'navigation/checkRouteAccess',
  async ({ userId, route, role }: { userId: string; route: string; role: UserRole }) => {
    const result = await NavigationAPI.checkRouteAccess(userId, route, role);
    return result.hasAccess; // Return boolean as documented
  }
);

// Refresh analytics
export const refreshNavigationAnalytics = createAsyncThunk(
  'navigation/refreshAnalytics',
  async ({ userId }: { userId: string }) => {
    return await NavigationAPI.getNavigationAnalytics(userId);
  }
);

// Create and store route guard data
export const createRouteGuardThunk = createAsyncThunk(
  'navigation/createRouteGuard',
  async (
    { userId, role }: { userId: string; role: UserRole },
    { dispatch }
  ) => {
    // For guest users, create a simple route guard data
    if (userId.includes('guest')) {
      const guestGuardData = {
        userId,
        role,
        allowedRoutes: ['*'],
        restrictedComponents: [],
        availableActions: []
      };
      dispatch(setRouteGuard(guestGuardData));
      return guestGuardData;
    }
    
    try {
      // Get permissions from API
      const permissions = await NavigationAPI.getNavigationPermissions(role);
      const allowedRoutes = permissions.permissions.menuStructure.map(item => item.href);
      
      // Create serializable guard data
      const guardData = {
        userId,
        role,
        allowedRoutes,
        restrictedComponents: permissions.permissions.restrictedComponents,
        availableActions: permissions.permissions.actions
      };
      
      dispatch(setRouteGuard(guardData));
      return guardData;
    } catch (error) {
      console.warn('Failed to create route guard:', error);
      // Create fallback guard data
      const fallbackGuardData = {
        userId,
        role,
        allowedRoutes: ['/dashboard', '/orders', '/profile'],
        restrictedComponents: [],
        availableActions: []
      };
      dispatch(setRouteGuard(fallbackGuardData));
      return fallbackGuardData;
    }
  }
);

// Update breadcrumbs based on current route/role
export const updateBreadcrumbsThunk = createAsyncThunk(
  'navigation/updateBreadcrumbs',
  async (
    { route, role }: { route: string; role: UserRole },
    { dispatch }
  ) => {
    try {
      // For guest users or error cases, generate simple breadcrumbs locally
      // without making API calls
      if (role === 'GUEST') {
        const simpleBreadcrumbs = [
          { label: 'Home', href: '/' }
        ];
        
        // Add current page to breadcrumbs
        const pageName = route.split('/').filter(Boolean).pop();
        if (pageName) {
          simpleBreadcrumbs.push({
            label: pageName.charAt(0).toUpperCase() + pageName.slice(1),
            href: route
          });
        }
        
        dispatch(setBreadcrumbs(simpleBreadcrumbs));
        return simpleBreadcrumbs;
      }
      
      // For authenticated users, use the API (which now also handles guest users as a fallback)
      const result = await NavigationAPI.getBreadcrumbs(route, role);
      dispatch(setBreadcrumbs(result.breadcrumbs));
      return result.breadcrumbs;
    } catch (error) {
      console.warn('Failed to update breadcrumbs:', error);
      // Fallback breadcrumbs
      const fallbackBreadcrumbs = [{ label: 'Home', href: '/' }];
      dispatch(setBreadcrumbs(fallbackBreadcrumbs));
      return fallbackBreadcrumbs;
    }
  }
);

// Update a single badge and mirror into store
export const updateBadgeThunk = createAsyncThunk(
  'navigation/updateBadge',
  async (
    { itemId, count }: { itemId: string; count: number },
    { dispatch }
  ) => {
    await NavigationAPI.updateNavigationBadge(itemId, count);
    dispatch(updateBadges({ [itemId]: count }));
    return { itemId, count };
  }
);

// Fire-and-forget tracking calls
export const trackPageViewThunk = createAsyncThunk(
  'navigation/trackPageView',
  async ({ userId, page, timeSpent }: { userId: string; page: string; timeSpent?: number }) => {
    // Skip tracking for guest users
    if (userId.includes('guest')) return true;
    
    try {
      await NavigationAPI.trackPageView(userId, page, timeSpent);
      return true;
    } catch (error) {
      console.warn('Failed to track page view:', error);
      return false;
    }
  }
);

export const trackSearchThunk = createAsyncThunk(
  'navigation/trackSearch',
  async ({ userId, query, resultCount }: { userId: string; query: string; resultCount: number }) => {
    // Skip tracking for guest users
    if (userId.includes('guest')) return true;
    
    try {
      await NavigationAPI.trackSearch(userId, query, resultCount);
      return true;
    } catch (error) {
      console.warn('Failed to track search:', error);
      return false;
    }
  }
);

export const trackComponentInteractionThunk = createAsyncThunk(
  'navigation/trackComponentInteraction',
  async (
    { userId, componentId, interaction }: { userId: string; componentId: string; interaction: string }
  ) => {
    // Skip tracking for guest users
    if (userId.includes('guest')) return true;
    
    try {
      await NavigationAPI.trackComponentInteraction(userId, componentId, interaction);
      return true;
    } catch (error) {
      console.warn('Failed to track component interaction:', error);
      return false;
    }
  }
);

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setBreadcrumbs(state, action: PayloadAction<Array<{ label: string; href: string }>>) {
      state.breadcrumbs = action.payload;
    },
    updateBadges(state, action: PayloadAction<Record<string, number>>) {
      state.badges = { ...state.badges, ...action.payload };
    },
    setCustomization(state, action: PayloadAction<any>) {
      state.customization = action.payload;
    },
    setRouteGuard(state, action: PayloadAction<any>) {
      state.routeGuard = action.payload;
    },
    resetState() {
      return initialState;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadNavigationState.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadNavigationState.fulfilled, (state, action) => {
        const { menu, permissions, customization, analytics } = action.payload;
          state.menu = menu;
          // permissions may be nested under { permissions } or already the shape we need
          if (permissions) {
            if (isWrappedPermissions(permissions)) {
              state.permissions = sanitizePermissions(permissions.permissions);
            } else if (isNavigationPermissions(permissions)) {
              state.permissions = sanitizePermissions(permissions);
            } else {
              // Unknown shape: try best-effort extraction or leave defaults
              // If there's a top-level 'permissions' field that didn't match the type guard,
              // attempt a shallow extraction to avoid runtime crashes.
              const p = (permissions as any)?.permissions ?? permissions as any;
              state.permissions = sanitizePermissions(p);
            }
          }
          state.customization = customization || state.customization;
          state.analytics = analytics || state.analytics;
        state.loading = false;
        state.error = null;
      })
      .addCase(loadNavigationState.rejected, (state) => {
        state.loading = false;
        state.error = 'Failed to load navigation data';
      })
      .addCase(checkRouteAccess.fulfilled, (state) => {
        // no state change; thunk returns a boolean for callers if needed
      })
      .addCase(refreshNavigationAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      });
  }
});

export const { setBreadcrumbs, updateBadges, setCustomization, setRouteGuard, resetState } = navigationSlice.actions;
export default navigationSlice.reducer;