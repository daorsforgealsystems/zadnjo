import { useCallback, useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useNavigationState } from '@/hooks/useNavigationState';
import { useAuth } from '@/context/AuthContext';
import { NavigationItem, UserRole } from '@/lib/api/navigation-api';
import type { Role } from '@/lib/types';
import {
  checkRouteAccess,
  createRouteGuardThunk,
  updateBreadcrumbsThunk,
  updateBadgeThunk,
  trackPageViewThunk,
  trackSearchThunk,
  trackComponentInteractionThunk,
} from '@/store/navigationSlice';

export const useNavigationGuard = () => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  // Read navigation state from Redux
  const { menu, permissions, analytics, breadcrumbs, badges, loading, error } = useNavigationState();
  const routeGuard = useAppSelector(s => s.navigation.routeGuard);

  // Route access checking
  const mapRoleToUserRole = useCallback((r?: Role): UserRole => {
    switch (r) {
      case 'ADMIN':
        return 'ADMIN';
      case 'MANAGER':
        return 'MANAGER';
      case 'DRIVER':
        return 'DRIVER';
      case 'CLIENT':
        return 'CUSTOMER';
      case 'GUEST':
      default:
        return 'GUEST';
    }
  }, []);

  const canNavigateTo = useCallback(async (route: string): Promise<boolean> => {
    try {
      if (!user) return false;
      const res = await dispatch(checkRouteAccess({ userId: user.id, route, role: mapRoleToUserRole(user.role) }));
      return Boolean(res.payload);
    } catch (err) {
      console.error('Error checking route access:', err);
      return false;
    }
  }, [dispatch, user, mapRoleToUserRole]);

  // Navigation helpers
  const flattenMenu = useCallback((items: NavigationItem[] = []): NavigationItem[] => {
    return items.reduce<NavigationItem[]>((acc, it) => {
      acc.push(it);
      if (it.children) acc.push(...flattenMenu(it.children));
      return acc;
    }, []);
  }, []);

  const getFlatMenu = useCallback((): NavigationItem[] => flattenMenu(menu || []), [menu, flattenMenu]);

  const getActiveMenuItem = useCallback((currentPath: string): NavigationItem | null => {
    return getFlatMenu().find(i => i.href === currentPath) || null;
  }, [getFlatMenu]);

  const getMenuItemById = useCallback((id: string): NavigationItem | null => {
    const flatMenu = getFlatMenu();
    return flatMenu.find(item => item.id === id) || null;
  }, [getFlatMenu]);

  const getParentMenuItem = useCallback((childId: string): NavigationItem | null => {
    const findParent = (items: NavigationItem[], targetId: string): NavigationItem | null => {
      for (const item of items) {
        if (item.children?.some(child => child.id === targetId)) {
          return item;
        }
        if (item.children) {
          const parent = findParent(item.children, targetId);
          if (parent) return parent;
        }
      }
      return null;
    };

    return findParent(menu || [], childId);
  }, [menu]);

  const getMenuItemPath = useCallback((targetId: string): NavigationItem[] => {
    const findPath = (items: NavigationItem[], target: string, path: NavigationItem[] = []): NavigationItem[] | null => {
      for (const item of items) {
        const currentPath = [...path, item];

        if (item.id === target) {
          return currentPath;
        }

        if (item.children) {
          const result = findPath(item.children, target, currentPath);
          if (result) return result;
        }
      }
      return null;
    };

    return findPath(menu || [], targetId) || [];
  }, [menu]);

  // Permission checks
  const hasPermission = useCallback((action: string): boolean => {
    const available = routeGuard?.availableActions || permissions?.actions || [];
    return available.includes(action);
  }, [routeGuard, permissions]);

  const canAccessComponent = useCallback((componentId: string): boolean => {
    const restricted = routeGuard?.restrictedComponents || permissions?.restrictedComponents || [];
    return !restricted.includes(componentId);
  }, [routeGuard, permissions]);

  // Activity tracking
  const trackNavigation = useCallback(async (
    page: string,
    timeSpent?: number,
    metadata?: Record<string, unknown>
  ) => {
    try {
      if (!user) return;
      dispatch(trackPageViewThunk({ userId: user.id, page, timeSpent }));

      if (metadata) {
        dispatch(trackComponentInteractionThunk({ userId: user.id, componentId: 'navigation', interaction: JSON.stringify({ action: 'page_change', page, ...metadata }) }));
      }
    } catch (err) {
      console.error('Error tracking navigation:', err);
    }
  }, [dispatch, user]);

  const trackSearchActivity = useCallback(async (
    query: string,
    resultCount: number
  ) => {
    try {
      if (!user) return;
      dispatch(trackSearchThunk({ userId: user.id, query, resultCount }));
    } catch (err) {
      console.error('Error tracking search:', err);
    }
  }, [dispatch, user]);

  // Badge management
  const setBadgeCount = useCallback(async (itemId: string, count: number) => {
    try {
      await dispatch(updateBadgeThunk({ itemId, count }));
    } catch (err) {
      console.error('Error updating badge:', err);
    }
  }, [dispatch]);

  const incrementBadge = useCallback(async (itemId: string, increment: number = 1) => {
    const currentCount = (badges || {})[itemId] || 0;
    await setBadgeCount(itemId, currentCount + increment);
  }, [badges, setBadgeCount]);

  const clearBadge = useCallback(async (itemId: string) => {
    await setBadgeCount(itemId, 0);
  }, [setBadgeCount]);

  // Menu filtering and sorting
  const getFilteredMenu = useCallback((
    filter?: {
      includeOnly?: string[];
      exclude?: string[];
      roles?: string[];
      hasChildren?: boolean;
    }
  ): NavigationItem[] => {
    if (!filter) return menu || [];

    const filterItems = (items: NavigationItem[]): NavigationItem[] => {
      return items.filter(item => {
        // Include only specific items
        if (filter.includeOnly && !filter.includeOnly.includes(item.id)) {
          return false;
        }

        // Exclude specific items
        if (filter.exclude && filter.exclude.includes(item.id)) {
          return false;
        }

        // Filter by roles
        if (filter.roles && item.roles && !item.roles.some(role => filter.roles!.includes(role))) {
          return false;
        }

        // Filter by children presence
        if (filter.hasChildren !== undefined) {
          const hasChildren = !!(item.children && item.children.length > 0);
          if (filter.hasChildren !== hasChildren) {
            return false;
          }
        }

        return true;
      }).map(item => ({
        ...item,
        children: item.children ? filterItems(item.children) : undefined
      }));
    };

  return filterItems(menu || []);
  }, [menu]);

  const getSortedMenu = useCallback((
    sortBy: 'label' | 'order' | 'usage' = 'order'
  ): NavigationItem[] => {
    const sortItems = (items: NavigationItem[]): NavigationItem[] => {
      const sorted = [...items].sort((a, b) => {
        switch (sortBy) {
          case 'label':
            return a.label.localeCompare(b.label);
          case 'usage':
            // Would sort by usage analytics if available
            return 0;
          case 'order':
          default:
            return 0; // Maintain original order
        }
      });

      return sorted.map(item => ({
        ...item,
        children: item.children ? sortItems(item.children) : undefined
      }));
    };

  return sortItems(menu || []);
  }, [menu]);

  // Route guard for React Router
  const createRouteGuard = useCallback(() => {
    // Ensure routeGuard data is populated in the store
  if (user) dispatch(createRouteGuardThunk({ userId: user.id, role: mapRoleToUserRole(user.role) }));

    return {
      canActivate: async (to: string): Promise<boolean> => {
        if (!user) return false;
        return await canNavigateTo(to);
      },

      beforeEach: async (to: string, from: string) => {
        // Track navigation
        await trackNavigation(to, undefined, { from });

        // Update breadcrumbs via thunk
  if (user) dispatch(updateBreadcrumbsThunk({ route: to, role: mapRoleToUserRole(user.role) }));

        return true;
      },

      afterEach: (to: string) => {
        // Clear any temporary states
      }
    };
  }, [dispatch, user, canNavigateTo, trackNavigation, mapRoleToUserRole]);

  // Quick actions and shortcuts
  const getQuickActions = useCallback(() => {
    // Filter menu items that are marked as quick actions or favorites
    const flatMenu = getFlatMenu();
    return flatMenu.filter(item => 
      item.id.includes('quick') || 
      item.badge !== undefined ||
  (permissions && 'actions' in permissions && Array.isArray((permissions as unknown as { actions?: string[] }).actions) && (permissions as unknown as { actions?: string[] }).actions!.includes(`quick_${item.id}`))
    );
  }, [getFlatMenu, permissions]);

  // Navigation state helpers
  const isLoading = loading;
  const hasError = !!error;
  const isReady = !loading && !error && menu.length > 0;

  // Recent navigation
  const [recentNavigation, setRecentNavigation] = useState<NavigationItem[]>([]);

  useEffect(() => {
    // Update recent navigation from analytics
    if (analytics?.mostUsedRoutes) {
      const recentItems = analytics.mostUsedRoutes
        .slice(0, 5)
        .map((route: { path: string }) => getActiveMenuItem(route.path))
        .filter((item: NavigationItem | null): item is NavigationItem => item !== null);

      setRecentNavigation(recentItems);
    }
  }, [analytics, getActiveMenuItem]);

  return {
    // Navigation state
    menu,
    permissions,
    breadcrumbs,
    badges,
    isLoading,
    hasError,
    isReady,
    recentNavigation,

  // Route access
  canNavigateTo,
  canAccessComponent,
  hasPermission,

    // Navigation helpers
    getActiveMenuItem,
    getMenuItemById,
    getParentMenuItem,
    getMenuItemPath,
    getFlatMenu,

  // Menu filtering and sorting
  getFilteredMenu,
  getSortedMenu,
    getQuickActions,

    // Activity tracking
    trackNavigation,
    trackSearchActivity,
    trackComponentInteraction: async (componentId: string, interaction: string) => {
      if (!user) return;
      dispatch(trackComponentInteractionThunk({ userId: user.id, componentId, interaction }));
    },

    // Badge management
    setBadgeCount,
    incrementBadge,
    clearBadge,

  // Route guarding
  createRouteGuard,
  routeGuard,
  };
};