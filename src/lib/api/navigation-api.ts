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
    const response = await apiClient.get(`/navigation/menu/${role}`);
    return response.data;
  }

  // Route Access Control
  static async checkRouteAccess(
    userId: string,
    route: string,
    role: UserRole
  ): Promise<{ hasAccess: boolean; route: string; userId: string; role: UserRole }> {
    const response = await apiClient.get('/navigation/access-check', {
      params: { userId, route, role }
    });
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
    const response = await apiClient.post('/navigation/bulk-access-check', {
      userId,
      role,
      routes
    });
    return response.data;
  }

  // Permissions and Actions
  static async getAvailableActions(role: UserRole): Promise<{ role: UserRole; actions: string[] }> {
    const response = await apiClient.get(`/navigation/actions/${role}`);
    return response.data;
  }

  static async getRestrictedComponents(role: UserRole): Promise<{ role: UserRole; restrictedComponents: string[] }> {
    const response = await apiClient.get(`/navigation/restricted-components/${role}`);
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
    const response = await apiClient.get(`/navigation/permissions/${role}`);
    return response.data;
  }

  // Landing Page
  static async getDefaultLandingPage(role: UserRole): Promise<{ role: UserRole; landingPage: string }> {
    const response = await apiClient.get(`/navigation/landing-page/${role}`);
    return response.data;
  }

  // Activity Tracking
  static async logActivity(
    userId: string,
    action: string,
    target: string,
    metadata?: any
  ): Promise<{ success: boolean }> {
    const response = await apiClient.post(`/navigation/activity/${userId}`, {
      action,
      target,
      metadata
    });
    return response.data;
  }

  // Analytics
  static async getNavigationAnalytics(userId: string): Promise<NavigationAnalytics> {
    const response = await apiClient.get(`/navigation/analytics/${userId}`);
    return response.data;
  }

  // Breadcrumbs
  static async getBreadcrumbs(
    route: string,
    role: UserRole
  ): Promise<{ route: string; breadcrumbs: Array<{ label: string; href: string }> }> {
    const response = await apiClient.get('/navigation/breadcrumbs', {
      params: { route, role }
    });
    return response.data;
  }

  // Navigation Customization
  static async getUserNavigationCustomization(userId: string): Promise<any> {
    const response = await apiClient.get(`/navigation/customization/${userId}`);
    return response.data;
  }

  static async updateNavigationBadge(
    itemId: string,
    count: number
  ): Promise<{ itemId: string; count: number; updated: boolean }> {
    const response = await apiClient.post(`/navigation/badge/${itemId}`, { count });
    return response.data;
  }

  // Convenience Methods for Common Operations
  static async trackPageView(userId: string, page: string, timeSpent?: number): Promise<void> {
    await this.logActivity(userId, 'page_view', page, { timeSpent });
  }

  static async trackSearch(userId: string, query: string, resultCount: number): Promise<void> {
    await this.logActivity(userId, 'search', query, { resultCount });
  }

  static async trackComponentInteraction(
    userId: string,
    componentId: string,
    interaction: string
  ): Promise<void> {
    await this.logActivity(userId, 'component_interaction', componentId, { interaction });
  }

  static async trackRouteNavigation(
    userId: string,
    route: string,
    timeSpent?: number
  ): Promise<void> {
    await this.logActivity(userId, 'route_access', route, { timeSpent });
  }

  // Navigation State Management
  static async getNavigationState(userId: string, role: UserRole): Promise<{
    menu: NavigationItem[];
    permissions: any;
    customization: any;
    analytics: NavigationAnalytics;
  }> {
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

  // Route Guards Helper
  static async createRouteGuard(userId: string, role: UserRole) {
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