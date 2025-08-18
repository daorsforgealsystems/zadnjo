import { apiClient } from './gateway';

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  children?: NavigationItem[];
  badge?: number;
  roles?: string[];
}

export interface NavigationAnalytics {
  userId: string;
  mostUsedRoutes: Array<{
    path: string;
    count: number;
    averageTime: number;
  }>;
  searchQueries: Array<{
    query: string;
    count: number;
    results: number;
  }>;
  componentInteractions: Array<{
    componentId: string;
    action: string;
    count: number;
  }>;
  timeSpentByPage: Record<string, number>;
  deviceUsage: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  generatedAt: Date;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'USER' | 'DRIVER' | 'CUSTOMER';

export class NavigationAPI {
  // Navigation Menu
  static async getNavigationMenu(role: UserRole): Promise<NavigationItem[]> {
    const response = await apiClient.get<NavigationItem[]>(`/navigation/menu/${role}`);
    return response.data;
  }

  // Route Access Control
  static async checkRouteAccess(
    userId: string,
    route: string,
    role: UserRole
  ): Promise<{ hasAccess: boolean; route: string; userId: string; role: UserRole }> {
    const response = await apiClient.get<{ hasAccess: boolean; route: string; userId: string; role: UserRole }>(
      '/navigation/access-check',
      { params: { userId, route, role } }
    );
    return response.data;
  }

  static async bulkRouteAccessCheck(
    userId: string,
    role: UserRole,
    routes: string[]
  ): Promise<{
    userId: string;
    role: UserRole;
    results: Array<{ route: string; hasAccess: boolean }>;
  }> {
    const response = await apiClient.post<{
      userId: string;
      role: UserRole;
      results: Array<{ route: string; hasAccess: boolean }>;
    }>('/navigation/bulk-access-check', {
      userId,
      role,
      routes
    });
    return response.data;
  }

  // Permissions and Actions
  static async getAvailableActions(role: UserRole): Promise<{ role: UserRole; actions: string[] }> {
    const response = await apiClient.get<{ role: UserRole; actions: string[] }>(`/navigation/actions/${role}`);
    return response.data;
  }

  static async getRestrictedComponents(role: UserRole): Promise<{ role: UserRole; restrictedComponents: string[] }> {
    const response = await apiClient.get<{ role: UserRole; restrictedComponents: string[] }>(`/navigation/restricted-components/${role}`);
    return response.data;
  }

  static async getNavigationPermissions(role: UserRole): Promise<{
    role: UserRole;
    permissions: {
      actions: string[];
      restrictedComponents: string[];
      landingPage: string;
      menuStructure: NavigationItem[];
    };
  }> {
    const response = await apiClient.get<{
      role: UserRole;
      permissions: {
        actions: string[];
        restrictedComponents: string[];
        landingPage: string;
        menuStructure: NavigationItem[];
      };
    }>(`/navigation/permissions/${role}`);
    return response.data;
  }

  // Landing Page
  static async getDefaultLandingPage(role: UserRole): Promise<{ role: UserRole; landingPage: string }> {
    const response = await apiClient.get<{ role: UserRole; landingPage: string }>(`/navigation/landing-page/${role}`);
    return response.data;
  }

  // Activity Tracking
  static async logActivity(
    userId: string,
    action: string,
    target: string,
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean }> {
    // Skip API calls for guest users to prevent connection errors
    if (userId.includes('guest')) {
      console.log('Skipping activity tracking for guest user');
      return { success: true };
    }
    
    try {
      const response = await apiClient.post<{ success: boolean }>(`/navigation/activity/${userId}`, {
        action,
        target,
        metadata
      });
      return response.data;
    } catch (error) {
      console.warn('Failed to log navigation activity:', error);
      return { success: false };
    }
  }

  // Analytics
  static async getNavigationAnalytics(userId: string): Promise<NavigationAnalytics> {
    const response = await apiClient.get<NavigationAnalytics>(`/navigation/analytics/${userId}`);
    return response.data;
  }

  // Breadcrumbs
  static async getBreadcrumbs(
    route: string,
    role: UserRole
  ): Promise<{ route: string; breadcrumbs: Array<{ label: string; href: string }> }> {
    // For guest users, directly use fallback breadcrumbs without API call
    if (role === 'GUEST') {
      const fallbackBreadcrumbs = this.generateFallbackBreadcrumbs(route, role);
      return { route, breadcrumbs: fallbackBreadcrumbs };
    }
    
    try {
      const response = await apiClient.get<{ route: string; breadcrumbs: Array<{ label: string; href: string }> }>(
        '/navigation/breadcrumbs',
        { params: { route, role } }
      );
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch breadcrumbs from API, using fallback:', error);
      
      // Fallback breadcrumbs based on route and role
      const fallbackBreadcrumbs = this.generateFallbackBreadcrumbs(route, role);
      return { route, breadcrumbs: fallbackBreadcrumbs };
    }
  }

  private static generateFallbackBreadcrumbs(route: string, role: UserRole): Array<{ label: string; href: string }> {
    const breadcrumbs: Array<{ label: string; href: string }> = [];
    
    // Always add Home
    breadcrumbs.push({ label: 'Home', href: '/' });
    
    // Parse route to generate breadcrumbs
    const routeParts = route.split('/').filter(Boolean);
    
    if (routeParts.length === 0) {
      return breadcrumbs;
    }
    
    // Add dashboard if first part is dashboard
    if (routeParts[0] === 'dashboard') {
      breadcrumbs.push({ label: 'Dashboard', href: '/dashboard' });
    }
    
    // Add other route parts
    let currentPath = '';
    for (let i = 0; i < routeParts.length; i++) {
      currentPath += '/' + routeParts[i];
      const label = routeParts[i].charAt(0).toUpperCase() + routeParts[i].slice(1);
      
      // Special handling for common routes
      if (routeParts[i] === 'orders') {
        breadcrumbs.push({ label: 'Orders', href: '/orders' });
      } else if (routeParts[i] === 'analytics') {
        breadcrumbs.push({ label: 'Analytics', href: '/analytics' });
      } else if (routeParts[i] === 'fleet') {
        breadcrumbs.push({ label: 'Fleet Management', href: '/fleet' });
      } else if (routeParts[i] === 'tracking') {
        breadcrumbs.push({ label: 'Tracking', href: '/tracking' });
      } else if (routeParts[i] === 'reports') {
        breadcrumbs.push({ label: 'Reports', href: '/reports' });
      } else if (routeParts[i] === 'admin') {
        breadcrumbs.push({ label: 'Administration', href: '/admin' });
      } else if (i === routeParts.length - 1) {
        // Last part is the current page
        breadcrumbs.push({ label, href: currentPath });
      }
    }
    
    return breadcrumbs;
  }

  // Navigation Customization
  static async getUserNavigationCustomization(userId: string): Promise<Record<string, unknown>> {
    const response = await apiClient.get<Record<string, unknown>>(`/navigation/customization/${userId}`);
    return response.data;
  }

  static async updateNavigationBadge(
    itemId: string,
    count: number
  ): Promise<{ itemId: string; count: number; updated: boolean }> {
    const response = await apiClient.post<{ itemId: string; count: number; updated: boolean }>(`/navigation/badge/${itemId}`, { count });
    return response.data;
  }

  // Convenience Methods for Common Operations
  static async trackPageView(userId: string, page: string, timeSpent?: number): Promise<void> {
    // Skip tracking for guest users
    if (userId.includes('guest')) return;
    await this.logActivity(userId, 'page_view', page, { timeSpent });
  }

  static async trackSearch(userId: string, query: string, resultCount: number): Promise<void> {
    // Skip tracking for guest users
    if (userId.includes('guest')) return;
    await this.logActivity(userId, 'search', query, { resultCount });
  }

  static async trackComponentInteraction(
    userId: string,
    componentId: string,
    interaction: string
  ): Promise<void> {
    // Skip tracking for guest users
    if (userId.includes('guest')) return;
    await this.logActivity(userId, 'component_interaction', componentId, { interaction });
  }

  static async trackRouteNavigation(
    userId: string,
    route: string,
    timeSpent?: number
  ): Promise<void> {
    // Skip tracking for guest users
    if (userId.includes('guest')) return;
    await this.logActivity(userId, 'route_access', route, { timeSpent });
  }

  // Navigation State Management
  static async getNavigationState(userId: string, role: UserRole): Promise<{
    menu: NavigationItem[];
    permissions: {
      role: UserRole;
      permissions: {
        actions: string[];
        restrictedComponents: string[];
        landingPage: string;
        menuStructure: NavigationItem[];
      };
    };
    customization: Record<string, unknown>;
    analytics: NavigationAnalytics;
  }> {
    // For guest users, return default navigation state without API calls
    if (userId.includes('guest') || role === 'GUEST') {
      return {
        menu: this.getDefaultGuestMenu(),
        permissions: {
          role: 'GUEST',
          permissions: {
            actions: [],
            restrictedComponents: [],
            landingPage: '/',
            menuStructure: this.getDefaultGuestMenu()
          }
        },
        customization: {},
        analytics: {
          userId,
          mostUsedRoutes: [],
          searchQueries: [],
          componentInteractions: [],
          timeSpentByPage: {},
          deviceUsage: { mobile: 0, tablet: 0, desktop: 0 },
          generatedAt: new Date()
        }
      };
    }
    
    const [menu, permissions, customization, analytics] = await Promise.all([
      this.getNavigationMenu(role),
      this.getNavigationPermissions(role),
      this.getUserNavigationCustomization(userId),
      this.getNavigationAnalytics(userId)
    ]);

    return {
      menu,
      permissions,
      customization,
      analytics
    };
  }
  
  // Helper method to provide default menu for guest users
  private static getDefaultGuestMenu(): NavigationItem[] {
    return [
      {
        id: 'home',
        label: 'Home',
        icon: 'home',
        href: '/'
      },
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'layout-dashboard',
        href: '/dashboard'
      },
      {
        id: 'login',
        label: 'Login',
        icon: 'log-in',
        href: '/login'
      }
    ];
  }

  // Route Guards Helper
  static async createRouteGuard(userId: string, role: UserRole): Promise<{
    canActivate: (route: string) => Promise<boolean>;
    getAllowedRoutes: () => string[];
    getRestrictedComponents: () => string[];
    getAvailableActions: () => string[];
  }> {
    const permissions = await this.getNavigationPermissions(role);
    const allowedRoutes = new Set(permissions.permissions.menuStructure.map(item => item.href));

    return {
      canActivate: async (route: string): Promise<boolean> => {
        const result = await this.checkRouteAccess(userId, route, role);
        return result.hasAccess;
      },
      getAllowedRoutes: () => Array.from(allowedRoutes),
      getRestrictedComponents: () => permissions.permissions.restrictedComponents,
      getAvailableActions: () => permissions.permissions.actions
    };
  }

  // Navigation Menu Helpers
  static flattenNavigationMenu(menu: NavigationItem[]): NavigationItem[] {
    const flattened: NavigationItem[] = [];
    
    const flatten = (items: NavigationItem[]) => {
      items.forEach(item => {
        flattened.push(item);
        if (item.children) {
          flatten(item.children);
        }
      });
    };
    
    flatten(menu);
    return flattened;
  }

  static findNavigationItem(menu: NavigationItem[], href: string): NavigationItem | null {
    for (const item of menu) {
      if (item.href === href) {
        return item;
      }
      if (item.children) {
        const found = this.findNavigationItem(item.children, href);
        if (found) return found;
      }
    }
    return null;
  }

  static generateNavigationPath(menu: NavigationItem[], targetHref: string): NavigationItem[] {
    const findPath = (items: NavigationItem[], target: string, path: NavigationItem[] = []): NavigationItem[] | null => {
      for (const item of items) {
        const currentPath = [...path, item];
        
        if (item.href === target) {
          return currentPath;
        }
        
        if (item.children) {
          const result = findPath(item.children, target, currentPath);
          if (result) return result;
        }
      }
      return null;
    };

    return findPath(menu, targetHref) || [];
  }

  // Badge Management
  static async updateMultipleBadges(badges: Array<{ itemId: string; count: number }>): Promise<void> {
    await Promise.all(
      badges.map(({ itemId, count }) => this.updateNavigationBadge(itemId, count))
    );
  }

  static async clearAllBadges(menuItems: string[]): Promise<void> {
    await this.updateMultipleBadges(
      menuItems.map(itemId => ({ itemId, count: 0 }))
    );
  }
}
