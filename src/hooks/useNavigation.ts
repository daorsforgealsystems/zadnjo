import { useState, useCallback, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavigationItem } from '@/types/navigation';

interface UseNavigationOptions {
  userRole?: string[];
  navigationItems?: NavigationItem[];
}

export const useNavigation = ({ userRole = [], navigationItems = [] }: UseNavigationOptions = {}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<NavigationItem[]>([]);

  // Filter navigation items based on user roles
  const filteredNavigationItems = useMemo(() => {
    const filterByRole = (items: NavigationItem[]): NavigationItem[] => {
      return items
        .filter(item => {
          if (!item.allowedRoles || item.allowedRoles.length === 0) {
            return true; // No role restriction
          }
          return item.allowedRoles.some(role => userRole.includes(role));
        })
        .map(item => ({
          ...item,
          children: item.children ? filterByRole(item.children) : undefined,
        }));
    };

    return filterByRole(navigationItems);
  }, [navigationItems, userRole]);

  // Get current active navigation item
  const currentItem = useMemo(() => {
    const findCurrentItem = (items: NavigationItem[], path: string): NavigationItem | null => {
      for (const item of items) {
        if (item.href === path) {
          return item;
        }
        if (item.children) {
          const childMatch = findCurrentItem(item.children, path);
          if (childMatch) {
            return childMatch;
          }
        }
      }
      return null;
    };

    return findCurrentItem(filteredNavigationItems, location.pathname);
  }, [filteredNavigationItems, location.pathname]);

  // Generate breadcrumb trail
  const breadcrumbs = useMemo(() => {
    const generateBreadcrumbs = (items: NavigationItem[], path: string, trail: NavigationItem[] = []): NavigationItem[] => {
      for (const item of items) {
        const currentTrail = [...trail, item];
        
        if (item.href === path) {
          return currentTrail;
        }
        
        if (item.children) {
          const childTrail = generateBreadcrumbs(item.children, path, currentTrail);
          if (childTrail.length > 0) {
            return childTrail;
          }
        }
      }
      return [];
    };

    return generateBreadcrumbs(filteredNavigationItems, location.pathname);
  }, [filteredNavigationItems, location.pathname]);

  // Handle navigation
  const navigateTo = useCallback((item: NavigationItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      navigate(item.href);
    }
  }, [navigate]);

  // Handle search
  const performSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setIsSearching(true);

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const searchInItems = (items: NavigationItem[]): NavigationItem[] => {
      const results: NavigationItem[] = [];
      
      const searchRecursive = (itemList: NavigationItem[], parentPath: NavigationItem[] = []) => {
        itemList.forEach(item => {
          const matchesQuery = item.label.toLowerCase().includes(query.toLowerCase()) ||
                              (item.href && item.href.toLowerCase().includes(query.toLowerCase()));
          
          if (matchesQuery) {
            results.push({
              ...item,
              // Add parent context for better search results
              label: parentPath.length > 0 
                ? `${parentPath.map(p => p.label).join(' > ')} > ${item.label}`
                : item.label,
            });
          }

          if (item.children) {
            searchRecursive(item.children, [...parentPath, item]);
          }
        });
      };

      searchRecursive(items);
      return results;
    };

    const results = searchInItems(filteredNavigationItems);
    setSearchResults(results);
    setIsSearching(false);
  }, [filteredNavigationItems]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  }, []);

  // Get navigation state helpers
  const isActive = useCallback((item: NavigationItem): boolean => {
    if (item.href === location.pathname) {
      return true;
    }
    
    // Check if current path is a child of this item
    if (item.children) {
      return item.children.some(child => isActive(child));
    }
    
    return false;
  }, [location.pathname]);

  const isExpanded = useCallback((item: NavigationItem): boolean => {
    if (!item.children) {
      return false;
    }
    
    // Expand if current item or any child is active
    return item.children.some(child => isActive(child));
  }, [isActive]);

  // Get parent items for mobile navigation
  const getParentItems = useMemo(() => {
    return filteredNavigationItems.filter(item => item.children && item.children.length > 0);
  }, [filteredNavigationItems]);

  // Get standalone items (no children)
  const getStandaloneItems = useMemo(() => {
    return filteredNavigationItems.filter(item => !item.children || item.children.length === 0);
  }, [filteredNavigationItems]);

  // Navigation analytics
  const trackNavigation = useCallback((item: NavigationItem) => {
    // This could be connected to analytics service
    console.log('Navigation tracked:', {
      item: item.id,
      label: item.label,
      href: item.href,
      timestamp: new Date().toISOString(),
      userRole,
    });
  }, [userRole]);

  // Auto-clear search results when location changes
  useEffect(() => {
    clearSearch();
  }, [location.pathname, clearSearch]);

  return {
    // Navigation data
    navigationItems: filteredNavigationItems,
    currentItem,
    breadcrumbs,
    parentItems: getParentItems,
    standaloneItems: getStandaloneItems,

    // Search functionality
    searchQuery,
    searchResults,
    isSearching,
    performSearch,
    clearSearch,

    // Navigation helpers
    navigateTo,
    isActive,
    isExpanded,
    trackNavigation,

    // Current location
    currentPath: location.pathname,
  };
};