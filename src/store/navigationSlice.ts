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

export const loadNavigationState = createAsyncThunk(
  'navigation/loadState',
  async ({ userId, role }: { userId: string; role: UserRole }) => {
    return await NavigationAPI.getNavigationState(userId, role);
  }
);

export const checkRouteAccess = createAsyncThunk(
  'navigation/checkRouteAccess',
  async ({ userId, route, role }: { userId: string; route: string; role: UserRole }) => {
    return await NavigationAPI.checkRouteAccess(userId, route, role);
  }
);

export const refreshNavigationAnalytics = createAsyncThunk(
  'navigation/refreshAnalytics',
  async ({ userId }: { userId: string }) => {
    return await NavigationAPI.getNavigationAnalytics(userId);
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

export const { setBreadcrumbs, updateBadges, setCustomization, resetState } = navigationSlice.actions;
export default navigationSlice.reducer;