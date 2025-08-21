import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useNavigation } from '../useNavigation';
import { NavigationItem } from '../../types/navigation';
import { ReactNode } from 'react';

// Mock react-router-dom navigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('useNavigation Hook', () => {
  let mockNavigationItems: NavigationItem[];
  
  beforeEach(() => {
    mockNavigationItems = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        allowedRoles: ['CLIENT', 'ADMIN']
      },
      {
        id: 'inventory',
        label: 'Inventory',
        href: '/inventory',
        allowedRoles: ['ADMIN'],
        children: [
          {
            id: 'items',
            label: 'Items',
            href: '/inventory/items'
          },
          {
            id: 'categories',
            label: 'Categories',
            href: '/inventory/categories'
          }
        ]
      },
      {
        id: 'reports',
        label: 'Reports',
        href: '/reports'
        // No role restrictions
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/settings',
        allowedRoles: ['ADMIN']
      }
    ];
    
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const createWrapper = (initialPath: string = '/') => {
    return ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={[initialPath]}>
        {children}
      </MemoryRouter>
    );
  };

  describe('Role-based Filtering', () => {
    it('should filter navigation items based on user roles', () => {
      const { result } = renderHook(
        () => useNavigation({ 
          userRole: ['CLIENT'], 
          navigationItems: mockNavigationItems 
        }),
        { wrapper: createWrapper() }
      );

      const filteredItems = result.current.navigationItems;
      
      expect(filteredItems).toHaveLength(2); // Dashboard and Reports
      expect(filteredItems.find(item => item.id === 'dashboard')).toBeDefined();
      expect(filteredItems.find(item => item.id === 'reports')).toBeDefined();
      expect(filteredItems.find(item => item.id === 'inventory')).toBeUndefined();
      expect(filteredItems.find(item => item.id === 'settings')).toBeUndefined();
    });

    it('should show all items for ADMIN role', () => {
      const { result } = renderHook(
        () => useNavigation({ 
          userRole: ['ADMIN'], 
          navigationItems: mockNavigationItems 
        }),
        { wrapper: createWrapper() }
      );

      expect(result.current.navigationItems).toHaveLength(4);
    });

    it('should show items without role restrictions to all users', () => {
      const { result } = renderHook(
        () => useNavigation({ 
          userRole: [], 
          navigationItems: mockNavigationItems 
        }),
        { wrapper: createWrapper() }
      );

      const reportsItem = result.current.navigationItems.find(item => item.id === 'reports');
      expect(reportsItem).toBeDefined();
    });

    it('should filter children items based on roles', () => {
      const itemsWithChildRoles: NavigationItem[] = [
        {
          id: 'inventory',
          label: 'Inventory',
          href: '/inventory',
          children: [
            {
              id: 'items',
              label: 'Items',
              href: '/inventory/items',
              allowedRoles: ['ADMIN']
            },
            {
              id: 'public-items',
              label: 'Public Items',
              href: '/inventory/public'
              // No role restriction
            }
          ]
        }
      ];

      const { result } = renderHook(
        () => useNavigation({ 
          userRole: ['CLIENT'], 
          navigationItems: itemsWithChildRoles 
        }),
        { wrapper: createWrapper() }
      );

      const inventoryItem = result.current.navigationItems[0];
      expect(inventoryItem.children).toHaveLength(1);
      expect(inventoryItem.children?.[0].id).toBe('public-items');
    });
  });

  describe('Current Item Detection', () => {
    it('should detect current item based on pathname', () => {
      const { result } = renderHook(
        () => useNavigation({ 
          userRole: ['CLIENT'], 
          navigationItems: mockNavigationItems 
        }),
        { wrapper: createWrapper('/dashboard') }
      );

      expect(result.current.currentItem?.id).toBe('dashboard');
    });

    it('should detect current child item', () => {
      const { result } = renderHook(
        () => useNavigation({ 
          userRole: ['ADMIN'], 
          navigationItems: mockNavigationItems 
        }),
        { wrapper: createWrapper('/inventory/items') }
      );

      expect(result.current.currentItem?.id).toBe('items');
    });

    it('should return null for non-matching paths', () => {
      const { result } = renderHook(
        () => useNavigation({ 
          navigationItems: mockNavigationItems 
        }),
        { wrapper: createWrapper('/unknown-path') }
      );

      expect(result.current.currentItem).toBe(null);
    });
  });

  describe('Breadcrumb Generation', () => {
    it('should generate breadcrumbs for root items', () => {
      const { result } = renderHook(
        () => useNavigation({ 
          userRole: ['CLIENT'], 
          navigationItems: mockNavigationItems 
        }),
        { wrapper: createWrapper('/dashboard') }
      );

      expect(result.current.breadcrumbs).toHaveLength(1);
      expect(result.current.breadcrumbs[0].id).toBe('dashboard');
    });

    it('should generate breadcrumbs for nested items', () => {
      const { result } = renderHook(
        () => useNavigation({ 
          userRole: ['ADMIN'], 
          navigationItems: mockNavigationItems 
        }),
        { wrapper: createWrapper('/inventory/items') }
      );

      expect(result.current.breadcrumbs).toHaveLength(2);
      expect(result.current.breadcrumbs[0].id).toBe('inventory');
      expect(result.current.breadcrumbs[1].id).toBe('items');
    });

    it('should return empty breadcrumbs for unknown paths', () => {
      const { result } = renderHook(
        () => useNavigation({ 
          navigationItems: mockNavigationItems 
        }),
        { wrapper: createWrapper('/unknown') }
      );

      expect(result.current.breadcrumbs).toHaveLength(0);
    });
  });

  describe('Navigation Actions', () => {
    it('should navigate to item href', async () => {
      const { result } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper: createWrapper() }
      );

      const dashboardItem = mockNavigationItems[0];
      
      act(() => {
        result.current.navigateTo(dashboardItem);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should call item onClick if provided', async () => {
      const mockOnClick = vi.fn();
      const itemWithOnClick: NavigationItem = {
        id: 'action',
        label: 'Action',
        onClick: mockOnClick
      };

      const { result } = renderHook(
        () => useNavigation({ navigationItems: [itemWithOnClick] }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.navigateTo(itemWithOnClick);
      });

      expect(mockOnClick).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should prioritize onClick over href', async () => {
      const mockOnClick = vi.fn();
      const itemWithBoth: NavigationItem = {
        id: 'both',
        label: 'Both',
        href: '/test',
        onClick: mockOnClick
      };

      const { result } = renderHook(
        () => useNavigation({ navigationItems: [itemWithBoth] }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.navigateTo(itemWithBoth);
      });

      expect(mockOnClick).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Search Functionality', () => {
    it('should perform search on navigation items', async () => {
      const { result } = renderHook(
        () => useNavigation({ 
          userRole: ['ADMIN'], 
          navigationItems: mockNavigationItems 
        }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.performSearch('inventory');
      });

      await waitFor(() => {
        expect(result.current.searchResults).toHaveLength(3); // Inventory + 2 children
        expect(result.current.isSearching).toBe(false);
      });
    });

    it('should search in nested items with parent context', async () => {
      const { result } = renderHook(
        () => useNavigation({ 
          userRole: ['ADMIN'], 
          navigationItems: mockNavigationItems 
        }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.performSearch('items');
      });

      await waitFor(() => {
        const searchResults = result.current.searchResults;
        expect(searchResults.length).toBeGreaterThan(0);
        const itemResult = searchResults.find(r => r.id === 'items');
        expect(itemResult?.label).toContain('Inventory > Items');
      });
    });

    it('should clear search results for empty query', async () => {
      const { result } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper: createWrapper() }
      );

      // First perform a search
      act(() => {
        result.current.performSearch('dashboard');
      });

      // Then clear with empty query
      act(() => {
        result.current.performSearch('');
      });

      await waitFor(() => {
        expect(result.current.searchResults).toHaveLength(0);
        expect(result.current.isSearching).toBe(false);
        expect(result.current.searchQuery).toBe('');
      });
    });

    it('should clear search on navigation', async () => {
      const { result, rerender } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper: createWrapper('/dashboard') }
      );

      // Perform search
      act(() => {
        result.current.performSearch('test');
      });

      // Change location
      rerender({ wrapper: createWrapper('/reports') });

      await waitFor(() => {
        expect(result.current.searchQuery).toBe('');
        expect(result.current.searchResults).toHaveLength(0);
      });
    });

    it('should handle case-insensitive search', async () => {
      const { result } = renderHook(
        () => useNavigation({ 
          userRole: ['CLIENT'], 
          navigationItems: mockNavigationItems 
        }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.performSearch('DASHBOARD');
      });

      await waitFor(() => {
        expect(result.current.searchResults.length).toBeGreaterThan(0);
        expect(result.current.searchResults[0].id).toBe('dashboard');
      });
    });
  });

  describe('Active State Detection', () => {
    it('should detect active state for current item', () => {
      const { result } = renderHook(
        () => useNavigation({ 
          userRole: ['CLIENT'], 
          navigationItems: mockNavigationItems 
        }),
        { wrapper: createWrapper('/dashboard') }
      );

      const dashboardItem = mockNavigationItems[0];
      expect(result.current.isActive(dashboardItem)).toBe(true);
    });

    it('should detect active state for parent with active child', () => {
      const { result } = renderHook(
        () => useNavigation({ 
          userRole: ['ADMIN'], 
          navigationItems: mockNavigationItems 
        }),
        { wrapper: createWrapper('/inventory/items') }
      );

      const inventoryItem = mockNavigationItems[1];
      expect(result.current.isActive(inventoryItem)).toBe(true);
    });

    it('should return false for inactive items', () => {
      const { result } = renderHook(
        () => useNavigation({ 
          userRole: ['ADMIN'], 
          navigationItems: mockNavigationItems 
        }),
        { wrapper: createWrapper('/dashboard') }
      );

      const settingsItem = mockNavigationItems[3];
      expect(result.current.isActive(settingsItem)).toBe(false);
    });
  });

  describe('Expanded State Detection', () => {
    it('should detect expanded state for items with active children', () => {
      const { result } = renderHook(
        () => useNavigation({ 
          userRole: ['ADMIN'], 
          navigationItems: mockNavigationItems 
        }),
        { wrapper: createWrapper('/inventory/items') }
      );

      const inventoryItem = mockNavigationItems[1];
      expect(result.current.isExpanded(inventoryItem)).toBe(true);
    });

    it('should return false for items without children', () => {
      const { result } = renderHook(
        () => useNavigation({ 
          userRole: ['CLIENT'], 
          navigationItems: mockNavigationItems 
        }),
        { wrapper: createWrapper('/dashboard') }
      );

      const dashboardItem = mockNavigationItems[0];
      expect(result.current.isExpanded(dashboardItem)).toBe(false);
    });
  });

  describe('Navigation Analytics', () => {
    it('should track navigation events', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const { result } = renderHook(
        () => useNavigation({ 
          userRole: ['CLIENT'], 
          navigationItems: mockNavigationItems 
        }),
        { wrapper: createWrapper() }
      );

      const dashboardItem = mockNavigationItems[0];
      
      act(() => {
        result.current.trackNavigation(dashboardItem);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Navigation tracked:', 
        expect.objectContaining({
          item: 'dashboard',
          label: 'Dashboard',
          href: '/dashboard',
          userRole: ['CLIENT']
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Item Categorization', () => {
    it('should separate parent items from standalone items', () => {
      const { result } = renderHook(
        () => useNavigation({ 
          userRole: ['ADMIN'], 
          navigationItems: mockNavigationItems 
        }),
        { wrapper: createWrapper() }
      );

      expect(result.current.parentItems).toHaveLength(1); // Only Inventory has children
      expect(result.current.standaloneItems).toHaveLength(3); // Dashboard, Reports, Settings
      expect(result.current.parentItems[0].id).toBe('inventory');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty navigation items', () => {
      const { result } = renderHook(
        () => useNavigation({ navigationItems: [] }),
        { wrapper: createWrapper() }
      );

      expect(result.current.navigationItems).toHaveLength(0);
      expect(result.current.parentItems).toHaveLength(0);
      expect(result.current.standaloneItems).toHaveLength(0);
    });

    it('should handle navigation without roles specified', () => {
      const { result } = renderHook(
        () => useNavigation({ navigationItems: mockNavigationItems }),
        { wrapper: createWrapper() }
      );

      // Should only show items without role restrictions
      expect(result.current.navigationItems).toHaveLength(1); // Only Reports
    });

    it('should handle multiple matching roles', () => {
      const { result } = renderHook(
        () => useNavigation({ 
          userRole: ['CLIENT', 'ADMIN'], 
          navigationItems: mockNavigationItems 
        }),
        { wrapper: createWrapper() }
      );

      expect(result.current.navigationItems).toHaveLength(4); // All items
    });

    it('should handle deeply nested navigation items', () => {
      const deeplyNestedItems: NavigationItem[] = [
        {
          id: 'level1',
          label: 'Level 1',
          href: '/level1',
          children: [
            {
              id: 'level2',
              label: 'Level 2',
              href: '/level1/level2',
              children: [
                {
                  id: 'level3',
                  label: 'Level 3',
                  href: '/level1/level2/level3'
                }
              ]
            }
          ]
        }
      ];

      const { result } = renderHook(
        () => useNavigation({ navigationItems: deeplyNestedItems }),
        { wrapper: createWrapper('/level1/level2/level3') }
      );

      expect(result.current.breadcrumbs).toHaveLength(3);
      expect(result.current.currentItem?.id).toBe('level3');
    });
  });
});