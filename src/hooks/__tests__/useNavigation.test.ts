import { renderHook, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNavigation } from '../useNavigation';
import { NavigationItem } from '@/types/navigation';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/dashboard' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

// Test navigation items
const mockNavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    allowedRoles: ['ADMIN', 'CLIENT'],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    href: '/inventory',
    allowedRoles: ['ADMIN'],
  },
  {
    id: 'reports',
    label: 'Reports',
    href: '/reports',
    allowedRoles: ['ADMIN', 'MANAGER'],
    children: [
      {
        id: 'sales-report',
        label: 'Sales Report',
        href: '/reports/sales',
        allowedRoles: ['ADMIN', 'MANAGER'],
      },
      {
        id: 'inventory-report',
        label: 'Inventory Report', 
        href: '/reports/inventory',
        allowedRoles: ['ADMIN'],
      },
    ],
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/profile',
    // No role restrictions
  },
];

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('useNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.pathname = '/dashboard';
  });

  describe('Basic functionality', () => {
    it('should return navigation items when no role restrictions', () => {
      const { result } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper }
      );

      expect(result.current.navigationItems).toHaveLength(4);
      expect(result.current.currentPath).toBe('/dashboard');
    });

    it('should filter navigation items by user roles', () => {
      const { result } = renderHook(
        () => useNavigation({ 
          userRole: ['CLIENT'],
          navigationItems: mockNavigationItems 
        }),
        { wrapper }
      );

      // CLIENT should only see Dashboard and Profile (no role restriction)
      expect(result.current.navigationItems).toHaveLength(2);
      expect(result.current.navigationItems.map(item => item.id)).toEqual(['dashboard', 'profile']);
    });

    it('should filter nested navigation items by user roles', () => {
      const { result } = renderHook(
        () => useNavigation({ 
          userRole: ['MANAGER'],
          navigationItems: mockNavigationItems 
        }),
        { wrapper }
      );

      const reportsItem = result.current.navigationItems.find(item => item.id === 'reports');
      expect(reportsItem).toBeDefined();
      expect(reportsItem?.children).toHaveLength(1); // Only Sales Report, not Inventory Report
      expect(reportsItem?.children?.[0].id).toBe('sales-report');
    });

    it('should identify current active item', () => {
      mockLocation.pathname = '/dashboard';
      const { result } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper }
      );

      expect(result.current.currentItem?.id).toBe('dashboard');
    });

    it('should identify current active nested item', () => {
      mockLocation.pathname = '/reports/sales';
      const { result } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper }
      );

      expect(result.current.currentItem?.id).toBe('sales-report');
    });
  });

  describe('Breadcrumbs generation', () => {
    it('should generate breadcrumbs for top-level items', () => {
      mockLocation.pathname = '/dashboard';
      const { result } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper }
      );

      expect(result.current.breadcrumbs).toHaveLength(1);
      expect(result.current.breadcrumbs[0].id).toBe('dashboard');
    });

    it('should generate breadcrumbs for nested items', () => {
      mockLocation.pathname = '/reports/sales';
      const { result } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper }
      );

      expect(result.current.breadcrumbs).toHaveLength(2);
      expect(result.current.breadcrumbs[0].id).toBe('reports');
      expect(result.current.breadcrumbs[1].id).toBe('sales-report');
    });

    it('should return empty breadcrumbs for non-existent routes', () => {
      mockLocation.pathname = '/non-existent';
      const { result } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper }
      );

      expect(result.current.breadcrumbs).toHaveLength(0);
    });
  });

  describe('Navigation actions', () => {
    it('should navigate to item with href', () => {
      const { result } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper }
      );

      act(() => {
        result.current.navigateTo(mockNavigationItems[0]);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should call onClick handler when present', () => {
      const mockOnClick = vi.fn();
      const itemWithOnClick = {
        id: 'custom',
        label: 'Custom Action',
        onClick: mockOnClick,
      };

      const { result } = renderHook(
        () => useNavigation({ navigationItems: [itemWithOnClick] }),
        { wrapper }
      );

      act(() => {
        result.current.navigateTo(itemWithOnClick);
      });

      expect(mockOnClick).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Search functionality', () => {
    it('should perform basic search', async () => {
      const { result } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper }
      );

      await act(async () => {
        result.current.performSearch('dashboard');
      });

      expect(result.current.searchResults).toHaveLength(1);
      expect(result.current.searchResults[0].id).toBe('dashboard');
    });

    it('should search in nested items with parent context', async () => {
      const { result } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper }
      );

      await act(async () => {
        result.current.performSearch('sales');
      });

      expect(result.current.searchResults).toHaveLength(1);
      expect(result.current.searchResults[0].label).toContain('Reports > Sales Report');
    });

    it('should clear search results for empty query', async () => {
      const { result } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper }
      );

      // First perform a search
      await act(async () => {
        result.current.performSearch('dashboard');
      });
      expect(result.current.searchResults).toHaveLength(1);

      // Then clear with empty query
      await act(async () => {
        result.current.performSearch('');
      });
      expect(result.current.searchResults).toHaveLength(0);
    });

    it('should return no results for non-matching query', async () => {
      const { result } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper }
      );

      await act(async () => {
        result.current.performSearch('nonexistent');
      });

      expect(result.current.searchResults).toHaveLength(0);
    });

    it('should clear search when location changes', () => {
      const { result } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper }
      );

      // Setup search state
      act(() => {
        result.current.performSearch('dashboard');
      });
      expect(result.current.searchQuery).toBe('dashboard');

      // Change location
      mockLocation.pathname = '/profile';
      
      // Re-render hook to trigger useEffect
      const { result: newResult } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper }
      );

      expect(newResult.current.searchQuery).toBe('');
      expect(newResult.current.searchResults).toHaveLength(0);
    });
  });

  describe('Navigation state helpers', () => {
    it('should identify active items correctly', () => {
      mockLocation.pathname = '/dashboard';
      const { result } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper }
      );

      expect(result.current.isActive(mockNavigationItems[0])).toBe(true); // dashboard
      expect(result.current.isActive(mockNavigationItems[1])).toBe(false); // inventory
    });

    it('should identify parent items as active when child is active', () => {
      mockLocation.pathname = '/reports/sales';
      const { result } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper }
      );

      const reportsItem = mockNavigationItems[2];
      expect(result.current.isActive(reportsItem)).toBe(true);
    });

    it('should identify expanded parent items', () => {
      mockLocation.pathname = '/reports/sales';
      const { result } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper }
      );

      const reportsItem = mockNavigationItems[2];
      expect(result.current.isExpanded(reportsItem)).toBe(true);
    });

    it('should not expand items without children', () => {
      const { result } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper }
      );

      const dashboardItem = mockNavigationItems[0];
      expect(result.current.isExpanded(dashboardItem)).toBe(false);
    });
  });

  describe('Item categorization', () => {
    it('should identify parent items (with children)', () => {
      const { result } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper }
      );

      expect(result.current.parentItems).toHaveLength(1);
      expect(result.current.parentItems[0].id).toBe('reports');
    });

    it('should identify standalone items (without children)', () => {
      const { result } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper }
      );

      expect(result.current.standaloneItems).toHaveLength(3);
      const standaloneIds = result.current.standaloneItems.map(item => item.id);
      expect(standaloneIds).toEqual(['dashboard', 'inventory', 'profile']);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty navigation items', () => {
      const { result } = renderHook(
        () => useNavigation({ navigationItems: [] }),
        { wrapper }
      );

      expect(result.current.navigationItems).toHaveLength(0);
      expect(result.current.currentItem).toBeNull();
      expect(result.current.breadcrumbs).toHaveLength(0);
    });

    it('should handle undefined user roles', () => {
      const { result } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper }
      );

      // Should show items without role restrictions
      expect(result.current.navigationItems.length).toBeGreaterThan(0);
      const profileItem = result.current.navigationItems.find(item => item.id === 'profile');
      expect(profileItem).toBeDefined();
    });

    it('should handle navigation items without allowedRoles', () => {
      const itemsWithoutRoles: NavigationItem[] = [
        {
          id: 'public',
          label: 'Public Page',
          href: '/public',
        },
      ];

      const { result } = renderHook(
        () => useNavigation({ 
          userRole: ['CLIENT'],
          navigationItems: itemsWithoutRoles 
        }),
        { wrapper }
      );

      expect(result.current.navigationItems).toHaveLength(1);
      expect(result.current.navigationItems[0].id).toBe('public');
    });

    it('should track navigation when trackNavigation is called', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const { result } = renderHook(
        () => useNavigation({ 
          userRole: ['ADMIN'],
          navigationItems: mockNavigationItems 
        }),
        { wrapper }
      );

      act(() => {
        result.current.trackNavigation(mockNavigationItems[0]);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Navigation tracked:', expect.objectContaining({
        item: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        userRole: ['ADMIN'],
      }));

      consoleSpy.mockRestore();
    });
  });
});