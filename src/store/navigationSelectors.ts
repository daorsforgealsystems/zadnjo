import type { RootState } from './index';

export const selectNavigationMenu = (state: RootState) => state.navigation.menu;
export const selectNavigationPermissions = (state: RootState) => state.navigation.permissions;
export const selectNavigationAnalytics = (state: RootState) => state.navigation.analytics;
export const selectNavigationBreadcrumbs = (state: RootState) => state.navigation.breadcrumbs;
export const selectNavigationBadges = (state: RootState) => state.navigation.badges;
export const selectNavigationLoading = (state: RootState) => state.navigation.loading;
export const selectNavigationError = (state: RootState) => state.navigation.error;