import { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { useAuth } from '@/context/AuthContext';
import { NavigationItem } from '@/lib/api/navigation-api';

export const useNavigationGuard = () => {
  const { state, actions } = useNavigation();
  const { user } = useAuth();
  
  const {
    menu,
    permissions,
    breadcrumbs,
    loading,
    error,
    badges,
    routeGuard
  } = state;

  const {
    checkRouteAccess,
    trackPageView,
    trackSearch,
    trackComponentInteraction,
    canPerformAction,
    isComponentRestricted,
    getNavigationItem,
    getFlatMenu,
    updateBadge
  } = actions;

  // Route access checking
  const canNavigateTo = useCallback(async (route: string): Promise<boolean> => {
    try {
      return await checkRouteAccess(route);
    } catch (error) {
      console.error('Error checking route access:', error);
      return false;
    }
  }, [checkRouteAccess]);

  // Navigation helpers
  const getActiveMenuItem = useCallback((currentPath: string): NavigationItem | null => {
    return getNavigationItem(currentPath);
  }, [getNavigationItem]);

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

    return findParent(menu, childId);
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

    return findPath(menu, targetId) || [];
  }, [menu]);

  // Permission checks
  const hasPermission = useCallback((action: string): boolean => {
    return canPerformAction(action);
  }, [canPerformAction]);

  const canAccessComponent = useCallback((componentId: string): boolean => {
    return !isComponentRestricted(componentId);
  }, [isComponentRestricted]);

  // Activity tracking
  const trackNavigation = useCallback(async (
    page: string,
    timeSpent?: number,
    metadata?: any
  ) => {
    try {
      await trackPageView(page, timeSpent);
      
      // Track additional navigation metadata if provided
      if (metadata) {
        await trackComponentInteraction('navigation', 'page_change', {
          page,
          ...metadata
        });
      }
    } catch (error) {
      console.error('Error tracking navigation:', error);
    }
  }, [trackPageView, trackComponentInteraction]);

  const trackSearchActivity = useCallback(async (
    query: string,
    resultCount: number
  ) => {
    try {
      await trackSearch(query, resultCount);
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }, [trackSearch]);

  // Badge management
  const setBadgeCount = useCallback(async (itemId: string, count: number) => {
    try {
      await updateBadge(itemId, count);
    } catch (error) {
      console.error('Error updating badge:', error);
    }
  }, [updateBadge]);

  const incrementBadge = useCallback(async (itemId: string, increment: number = 1) => {
    const currentCount = badges[itemId] || 0;
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
    if (!filter) return menu;

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

    return filterItems(menu);
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

    return sortItems(menu);
  }, [menu]);

  // Route guard for React Router
  const createRouteGuard = useCallback(() => {
    return {
      canActivate: async (to: string): Promise<boolean> => {
        if (!user) return false;
        return await canNavigateTo(to);
      },
      
      beforeEach: async (to: string, from: string) => {
        // Track navigation
        await trackNavigation(to, undefined, { from });
        
        // Update breadcrumbs would be handled by NavigationProvider
        
        return true;
      },
      
      afterEach: (to: string) => {
        // Clear any temporary states
        // Could be used for cleanup after navigation
      }
    };
  }, [user, canNavigateTo, trackNavigation]);

  // Quick actions and shortcuts
  const getQuickActions = useCallback(() => {
    // Filter menu items that are marked as quick actions or favorites
    const flatMenu = getFlatMenu();
    return flatMenu.filter(item => 
      item.id.includes('quick') || 
      item.badge !== undefined ||
      permissions.actions.includes(`quick_${item.id}`)
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
    if (state.analytics?.mostUsedRoutes) {
      const recentItems = state.analytics.mostUsedRoutes
        .slice(0, 5)
        .map(route => getNavigationItem(route.path))
        .filter((item): item is NavigationItem => item !== null);
      
      setRecentNavigation(recentItems);
    }
  }, [state.analytics, getNavigationItem]);

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
    trackComponentInteraction,

    // Badge management
    setBadgeCount,
    incrementBadge,
    clearBadge,

    // Route guarding
    createRouteGuard,
    routeGuard,
  };
};