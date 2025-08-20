import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { NavigationAnalytics, NavigationItem, UserRole } from '@/lib/api/navigation-api';
import { NavigationAPI } from '@/lib/api/navigation-api';

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
    return await NavigationAPI.checkRouteAccess(userId, route, role);
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
          // permissions may be nested (permissions.permissions) or already the shape we need
          if (permissions && (permissions as any).permissions) {
            state.permissions = (permissions as any).permissions;
          } else if (permissions) {
            state.permissions = permissions as any;
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