import { Injectable } from '@nestjs/common';
import { 
  NavigationItem, 
  UserRole, 
  RoleBasedNavigation,
  NavigationAnalytics,
  UserActivity 
} from '../interfaces/preferences.interface';

@Injectable()
export class NavigationService {
  private roleNavigationMap = new Map<UserRole, RoleBasedNavigation>();
  private userActivities = new Map<string, UserActivity[]>();
  private navigationAnalytics = new Map<string, NavigationAnalytics>();

  constructor() {
    this.initializeRoleBasedNavigation();
  }

  // Get navigation menu for user role
  async getNavigationForRole(role: UserRole): Promise<NavigationItem[]> {
    const roleNav = this.roleNavigationMap.get(role);
    return roleNav?.menuStructure || this.getDefaultNavigation();
  }

  // Check if user can access route
  async canAccessRoute(userId: string, route: string, role: UserRole): Promise<boolean> {
    const roleNav = this.roleNavigationMap.get(role);
    if (!roleNav) return false;

    // Log navigation attempt
    await this.logUserActivity(userId, 'route_access', route);

    return roleNav.allowedRoutes.includes(route) || 
           roleNav.allowedRoutes.includes('*') ||
           this.isPublicRoute(route);
  }

  // Get available actions for user
  async getAvailableActions(role: UserRole): Promise<string[]> {
    const roleNav = this.roleNavigationMap.get(role);
    return roleNav?.availableActions || [];
  }

  // Get restricted components for user
  async getRestrictedComponents(role: UserRole): Promise<string[]> {
    const roleNav = this.roleNavigationMap.get(role);
    return roleNav?.restrictedComponents || [];
  }

  // Get default landing page for role
  async getDefaultLandingPage(role: UserRole): Promise<string> {
    const roleNav = this.roleNavigationMap.get(role);
    return roleNav?.defaultLandingPage || '/dashboard';
  }

  // Log user activity
  async logUserActivity(userId: string, action: string, target: string, metadata?: any): Promise<void> {
    const activity: UserActivity = {
      id: `activity_${Date.now()}_${Math.random()}`,
      userId,
      action,
      target,
      metadata: metadata || {},
      timestamp: new Date()
    };

    const userActivities = this.userActivities.get(userId) || [];
    userActivities.push(activity);

    // Keep only last 1000 activities per user
    if (userActivities.length > 1000) {
      userActivities.splice(0, userActivities.length - 1000);
    }

    this.userActivities.set(userId, userActivities);
  }

  // Generate navigation analytics
  async generateNavigationAnalytics(userId: string): Promise<NavigationAnalytics> {
    const activities = this.userActivities.get(userId) || [];
    
    // Most used routes
    const routeUsage = activities
      .filter(a => a.action === 'route_access')
      .reduce((acc, activity) => {
        const route = activity.target;
        if (!acc[route]) {
          acc[route] = { count: 0, totalTime: 0 };
        }
        acc[route].count++;
        acc[route].totalTime += activity.metadata?.timeSpent || 0;
        return acc;
      }, {} as Record<string, { count: number; totalTime: number }>);

    const mostUsedRoutes = Object.entries(routeUsage)
      .map(([path, data]) => ({
        path,
        count: data.count,
        averageTime: data.count > 0 ? data.totalTime / data.count : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Search queries
    const searchActivities = activities.filter(a => a.action === 'search');
    const searchQueries = searchActivities
      .reduce((acc, activity) => {
        const query = activity.target;
        if (!acc[query]) {
          acc[query] = { count: 0, results: 0 };
        }
        acc[query].count++;
        acc[query].results += activity.metadata?.resultCount || 0;
        return acc;
      }, {} as Record<string, { count: number; results: number }>);

    // Component interactions
    const componentActivities = activities.filter(a => a.action === 'component_interaction');
    const componentInteractions = componentActivities
      .reduce((acc, activity) => {
        const key = `${activity.target}_${activity.metadata?.interaction || 'click'}`;
        if (!acc[key]) {
          acc[key] = { componentId: activity.target, action: activity.metadata?.interaction || 'click', count: 0 };
        }
        acc[key].count++;
        return acc;
      }, {} as Record<string, { componentId: string; action: string; count: number }>);

    // Time spent by page
    const timeSpentByPage = activities
      .filter(a => a.action === 'page_view' && a.metadata?.timeSpent)
      .reduce((acc, activity) => {
        const page = activity.target;
        acc[page] = (acc[page] || 0) + activity.metadata.timeSpent;
        return acc;
      }, {} as Record<string, number>);

    // Device usage (mock data - would come from user agent analysis)
    const deviceUsage = {
      mobile: 30,
      tablet: 20,
      desktop: 50
    };

    const analytics: NavigationAnalytics = {
      userId,
      mostUsedRoutes,
      searchQueries: Object.entries(searchQueries).map(([query, data]) => ({
        query,
        count: data.count,
        results: data.results / data.count
      })),
      componentInteractions: Object.values(componentInteractions),
      timeSpentByPage,
      deviceUsage,
      generatedAt: new Date()
    };

    this.navigationAnalytics.set(userId, analytics);
    return analytics;
  }

  // Get navigation breadcrumbs
  async generateBreadcrumbs(route: string, role: UserRole): Promise<Array<{ label: string; href: string }>> {
    const navigation = await this.getNavigationForRole(role);
    const breadcrumbs: Array<{ label: string; href: string }> = [];

    const findRouteInNavigation = (items: NavigationItem[], currentPath: string): NavigationItem[] | null => {
      for (const item of items) {
        if (item.href === currentPath) {
          return [item];
        }
        if (item.children) {
          const found = findRouteInNavigation(item.children, currentPath);
          if (found) {
            return [item, ...found];
          }
        }
      }
      return null;
    };

    const routePath = findRouteInNavigation(navigation, route);
    if (routePath) {
      routePath.forEach(item => {
        breadcrumbs.push({
          label: item.label,
          href: item.href
        });
      });
    }

    return breadcrumbs;
  }

  // Update navigation item badge
  async updateNavigationBadge(itemId: string, count: number): Promise<void> {
    // In a real implementation, this would update the badge count
    // for a specific navigation item across all users who can see it
    console.log(`Updating badge for ${itemId}: ${count}`);
  }

  // Get user's navigation customization
  async getUserNavigationCustomization(userId: string): Promise<any> {
    // This would typically fetch from the preferences service
    return {
      pinnedItems: [],
      hiddenItems: [],
      customOrder: []
    };
  }

  private isPublicRoute(route: string): boolean {
    const publicRoutes = [
      '/login',
      '/register',
      '/forgot-password',
      '/health',
      '/api/health'
    ];
    return publicRoutes.includes(route);
  }

  private getDefaultNavigation(): NavigationItem[] {
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'LayoutDashboard',
        href: '/dashboard'
      },
      {
        id: 'orders',
        label: 'Orders',
        icon: 'Package',
        href: '/orders'
      }
    ];
  }

  private initializeRoleBasedNavigation(): void {
    // Admin Navigation
    const adminNav: RoleBasedNavigation = {
      role: 'ADMIN',
      allowedRoutes: ['*'], // Admin can access everything
      defaultLandingPage: '/admin/dashboard',
      restrictedComponents: [],
      availableActions: ['create', 'read', 'update', 'delete', 'manage_users', 'manage_system'],
      menuStructure: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: 'LayoutDashboard',
          href: '/dashboard'
        },
        {
          id: 'orders',
          label: 'Orders',
          icon: 'Package',
          href: '/orders',
          children: [
            { id: 'orders-list', label: 'All Orders', icon: 'List', href: '/orders' },
            { id: 'orders-create', label: 'Create Order', icon: 'Plus', href: '/orders/create' },
            { id: 'orders-tracking', label: 'Tracking', icon: 'MapPin', href: '/orders/tracking' }
          ]
        },
        {
          id: 'fleet',
          label: 'Fleet Management',
          icon: 'Truck',
          href: '/fleet',
          children: [
            { id: 'vehicles', label: 'Vehicles', icon: 'Car', href: '/vehicles' },
            { id: 'drivers', label: 'Drivers', icon: 'Users', href: '/drivers' },
            { id: 'maintenance', label: 'Maintenance', icon: 'Wrench', href: '/maintenance' }
          ]
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: 'BarChart3',
          href: '/analytics',
          children: [
            { id: 'reports', label: 'Reports', icon: 'FileText', href: '/reports' },
            { id: 'performance', label: 'Performance', icon: 'TrendingUp', href: '/performance' },
            { id: 'costs', label: 'Cost Analysis', icon: 'DollarSign', href: '/costs' }
          ]
        },
        {
          id: 'admin',
          label: 'Administration',
          icon: 'Settings',
          href: '/admin',
          children: [
            { id: 'users', label: 'Users', icon: 'Users', href: '/admin/users' },
            { id: 'roles', label: 'Roles & Permissions', icon: 'Shield', href: '/admin/roles' },
            { id: 'system', label: 'System Settings', icon: 'Cog', href: '/admin/system' }
          ]
        }
      ]
    };

    // Manager Navigation
    const managerNav: RoleBasedNavigation = {
      role: 'MANAGER',
      allowedRoutes: [
        '/dashboard', '/orders', '/fleet', '/analytics', '/reports',
        '/vehicles', '/drivers', '/maintenance', '/performance', '/costs'
      ],
      defaultLandingPage: '/dashboard',
      restrictedComponents: ['admin-panel', 'system-settings'],
      availableActions: ['create', 'read', 'update', 'manage_operations'],
      menuStructure: adminNav.menuStructure.filter(item => item.id !== 'admin')
    };

    // User Navigation
    const userNav: RoleBasedNavigation = {
      role: 'USER',
      allowedRoutes: [
        '/dashboard', '/orders', '/tracking', '/reports'
      ],
      defaultLandingPage: '/dashboard',
      restrictedComponents: ['admin-panel', 'system-settings', 'user-management', 'cost-analysis'],
      availableActions: ['create', 'read', 'update'],
      menuStructure: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: 'LayoutDashboard',
          href: '/dashboard'
        },
        {
          id: 'orders',
          label: 'Orders',
          icon: 'Package',
          href: '/orders',
          children: [
            { id: 'orders-list', label: 'My Orders', icon: 'List', href: '/orders' },
            { id: 'orders-create', label: 'Create Order', icon: 'Plus', href: '/orders/create' }
          ]
        },
        {
          id: 'tracking',
          label: 'Tracking',
          icon: 'MapPin',
          href: '/tracking'
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: 'FileText',
          href: '/reports'
        }
      ]
    };

    // Driver Navigation
    const driverNav: RoleBasedNavigation = {
      role: 'DRIVER',
      allowedRoutes: [
        '/driver-dashboard', '/routes', '/deliveries', '/vehicle-status'
      ],
      defaultLandingPage: '/driver-dashboard',
      restrictedComponents: ['admin-panel', 'analytics', 'fleet-management'],
      availableActions: ['read', 'update_status', 'update_location'],
      menuStructure: [
        {
          id: 'driver-dashboard',
          label: 'My Dashboard',
          icon: 'LayoutDashboard',
          href: '/driver-dashboard'
        },
        {
          id: 'routes',
          label: 'My Routes',
          icon: 'Route',
          href: '/routes'
        },
        {
          id: 'deliveries',
          label: 'Deliveries',
          icon: 'Package',
          href: '/deliveries'
        },
        {
          id: 'vehicle',
          label: 'Vehicle Status',
          icon: 'Truck',
          href: '/vehicle-status'
        }
      ]
    };

    // Customer Navigation
    const customerNav: RoleBasedNavigation = {
      role: 'CUSTOMER',
      allowedRoutes: [
        '/customer-portal', '/my-orders', '/tracking', '/support'
      ],
      defaultLandingPage: '/customer-portal',
      restrictedComponents: ['admin-panel', 'analytics', 'fleet-management', 'driver-tools'],
      availableActions: ['create_order', 'read', 'track_order'],
      menuStructure: [
        {
          id: 'portal',
          label: 'Portal',
          icon: 'Home',
          href: '/customer-portal'
        },
        {
          id: 'my-orders',
          label: 'My Orders',
          icon: 'Package',
          href: '/my-orders'
        },
        {
          id: 'tracking',
          label: 'Track Shipment',
          icon: 'MapPin',
          href: '/tracking'
        },
        {
          id: 'support',
          label: 'Support',
          icon: 'HelpCircle',
          href: '/support'
        }
      ]
    };

    this.roleNavigationMap.set('ADMIN', adminNav);
    this.roleNavigationMap.set('MANAGER', managerNav);
    this.roleNavigationMap.set('USER', userNav);
    this.roleNavigationMap.set('DRIVER', driverNav);
    this.roleNavigationMap.set('CUSTOMER', customerNav);
  }
}