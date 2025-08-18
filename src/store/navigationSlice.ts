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
  routeGuard: any;
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
  routeGuard: null,
};

// Load complete navigation state
export const loadNavigationState = createAsyncThunk(
  'navigation/loadState',
  async ({ userId, role }: { userId: string; role: UserRole }) => {
    return await NavigationAPI.getNavigationState(userId, role);
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

// Create and store route guard helper
export const createRouteGuardThunk = createAsyncThunk(
  'navigation/createRouteGuard',
  async (
    { userId, role }: { userId: string; role: UserRole },
    { dispatch }
  ) => {
    const guard = await NavigationAPI.createRouteGuard(userId, role);
    dispatch(setRouteGuard(guard));
    return true;
  }
);

// Update breadcrumbs based on current route/role
export const updateBreadcrumbsThunk = createAsyncThunk(
  'navigation/updateBreadcrumbs',
  async (
    { route, role }: { route: string; role: UserRole },
    { dispatch }
  ) => {
    const result = await NavigationAPI.getBreadcrumbs(route, role);
    dispatch(setBreadcrumbs(result.breadcrumbs));
    return result.breadcrumbs;
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
    await NavigationAPI.trackPageView(userId, page, timeSpent);
    return true;
  }
);

export const trackSearchThunk = createAsyncThunk(
  'navigation/trackSearch',
  async ({ userId, query, resultCount }: { userId: string; query: string; resultCount: number }) => {
    await NavigationAPI.trackSearch(userId, query, resultCount);
    return true;
  }
);

export const trackComponentInteractionThunk = createAsyncThunk(
  'navigation/trackComponentInteraction',
  async (
    { userId, componentId, interaction }: { userId: string; componentId: string; interaction: string }
  ) => {
    await NavigationAPI.trackComponentInteraction(userId, componentId, interaction);
    return true;
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
        state.permissions = permissions.permissions;
        state.customization = customization;
        state.analytics = analytics;
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