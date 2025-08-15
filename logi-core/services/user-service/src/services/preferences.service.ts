import { Injectable } from '@nestjs/common';
import { 
  LayoutPreferences, 
  NavigationPreferences, 
  LayoutTemplate,
  UserRole,
  ComponentConfig
} from '../interfaces/preferences.interface';

@Injectable()
export class PreferencesService {
  // In-memory storage for development - in production, use a database
  private layoutPreferences = new Map<string, LayoutPreferences>();
  private navigationPreferences = new Map<string, NavigationPreferences>();
  private layoutTemplates = new Map<string, LayoutTemplate>();

  constructor() {
    this.initializeDefaultTemplates();
  }

  // Layout Preferences
  async getLayoutPreferences(userId: string): Promise<LayoutPreferences> {
    const existing = this.layoutPreferences.get(userId);
    if (existing) {
      return existing;
    }

    const defaultPrefs: LayoutPreferences = {
      id: `layout_${userId}`,
      userId,
      theme: 'light',
      primaryColor: '#3b82f6',
      sidebarWidth: 256,
      sidebarCollapsed: false,
      gridGap: 24,
      animationsEnabled: true,
      compactMode: false,
      customCss: '',
      components: this.getDefaultComponents(),
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1280
      },
      headerConfig: {
        height: 64,
        sticky: true,
        showSearch: true,
        showNotifications: true,
        showUserMenu: true
      },
      footerConfig: {
        visible: true,
        sticky: false,
        variant: 'default'
      },
      updatedAt: new Date()
    };

    this.layoutPreferences.set(userId, defaultPrefs);
    return defaultPrefs;
  }

  async updateLayoutPreferences(
    userId: string,
    preferences: Partial<LayoutPreferences>
  ): Promise<LayoutPreferences> {
    const existing = await this.getLayoutPreferences(userId);
    const updated: LayoutPreferences = {
      ...existing,
      ...preferences,
      updatedAt: new Date()
    };

    this.layoutPreferences.set(userId, updated);
    return updated;
  }

  // Navigation Preferences
  async getNavigationPreferences(userId: string): Promise<NavigationPreferences> {
    const existing = this.navigationPreferences.get(userId);
    if (existing) {
      return existing;
    }

    const defaultPrefs: NavigationPreferences = {
      id: `nav_${userId}`,
      userId,
      favoriteMenuItems: [],
      hiddenMenuItems: [],
      menuItemOrder: this.getDefaultMenuOrder(),
      quickActions: this.getDefaultQuickActions(),
      breadcrumbsEnabled: true,
      searchHistory: [],
      recentlyVisited: [],
      customMenuItems: [],
      mobileMenuStyle: 'slide',
      updatedAt: new Date()
    };

    this.navigationPreferences.set(userId, defaultPrefs);
    return defaultPrefs;
  }

  async updateNavigationPreferences(
    userId: string,
    preferences: Partial<NavigationPreferences>
  ): Promise<NavigationPreferences> {
    const existing = await this.getNavigationPreferences(userId);
    const updated: NavigationPreferences = {
      ...existing,
      ...preferences,
      updatedAt: new Date()
    };

    this.navigationPreferences.set(userId, updated);
    return updated;
  }

  // Layout Templates
  async getLayoutTemplates(role?: UserRole): Promise<LayoutTemplate[]> {
    const allTemplates = Array.from(this.layoutTemplates.values());
    
    if (role) {
      return allTemplates.filter(template => 
        template.allowedRoles.includes(role) || template.isPublic
      );
    }

    return allTemplates.filter(template => template.isPublic);
  }

  async createLayoutTemplate(templateData: Omit<LayoutTemplate, 'id'>): Promise<LayoutTemplate> {
    const template: LayoutTemplate = {
      ...templateData,
      id: `template_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.layoutTemplates.set(template.id, template);
    return template;
  }

  async updateLayoutTemplate(
    templateId: string,
    updates: Partial<LayoutTemplate>
  ): Promise<LayoutTemplate> {
    const existing = this.layoutTemplates.get(templateId);
    if (!existing) {
      throw new Error('Template not found');
    }

    const updated: LayoutTemplate = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };

    this.layoutTemplates.set(templateId, updated);
    return updated;
  }

  async deleteLayoutTemplate(templateId: string): Promise<void> {
    this.layoutTemplates.delete(templateId);
  }

  async applyLayoutTemplate(templateId: string, userId: string): Promise<LayoutPreferences> {
    const template = this.layoutTemplates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const preferences: Partial<LayoutPreferences> = {
      components: template.components,
      theme: template.config.theme,
      primaryColor: template.config.primaryColor,
      sidebarWidth: template.config.sidebarWidth,
      gridGap: template.config.gridGap,
      headerConfig: template.config.headerConfig,
      footerConfig: template.config.footerConfig
    };

    return this.updateLayoutPreferences(userId, preferences);
  }

  // User Custom Layouts
  async saveUserCustomLayout(
    userId: string,
    layoutData: {
      name: string;
      description?: string;
      components: any[];
      gridConfig: any;
    }
  ): Promise<LayoutTemplate> {
    const userPrefs = await this.getLayoutPreferences(userId);
    
    const template: Omit<LayoutTemplate, 'id'> = {
      name: layoutData.name,
      description: layoutData.description || '',
      preview: '', // Could generate preview image
      category: 'custom',
      isPublic: false,
      allowedRoles: ['USER'], // Based on user role
      authorId: userId,
      components: layoutData.components,
      config: {
        theme: userPrefs.theme,
        primaryColor: userPrefs.primaryColor,
        sidebarWidth: userPrefs.sidebarWidth,
        gridGap: userPrefs.gridGap,
        headerConfig: userPrefs.headerConfig,
        footerConfig: userPrefs.footerConfig
      }
    };

    return this.createLayoutTemplate(template);
  }

  // Dashboard Components
  async getDashboardComponents(userId: string): Promise<ComponentConfig[]> {
    const prefs = await this.getLayoutPreferences(userId);
    return prefs.components || [];
  }

  async updateDashboardComponents(userId: string, components: ComponentConfig[]): Promise<ComponentConfig[]> {
    await this.updateLayoutPreferences(userId, { components });
    return components;
  }

  // Reset Preferences
  async resetUserPreferences(userId: string, type?: 'layout' | 'navigation' | 'all'): Promise<void> {
    if (type === 'layout' || type === 'all') {
      this.layoutPreferences.delete(userId);
    }
    
    if (type === 'navigation' || type === 'all') {
      this.navigationPreferences.delete(userId);
    }
  }

  // Export/Import
  async exportUserPreferences(userId: string) {
    const layout = await this.getLayoutPreferences(userId);
    const navigation = await this.getNavigationPreferences(userId);

    return {
      version: '1.0.0',
      exportedAt: new Date(),
      userId,
      preferences: {
        layout,
        navigation
      }
    };
  }

  async importUserPreferences(userId: string, data: any) {
    if (data.preferences?.layout) {
      const { id, userId: _, ...layoutPrefs } = data.preferences.layout;
      await this.updateLayoutPreferences(userId, layoutPrefs);
    }

    if (data.preferences?.navigation) {
      const { id, userId: _, ...navPrefs } = data.preferences.navigation;
      await this.updateNavigationPreferences(userId, navPrefs);
    }

    return {
      layout: await this.getLayoutPreferences(userId),
      navigation: await this.getNavigationPreferences(userId)
    };
  }

  // Helper methods
  private getDefaultComponents(): ComponentConfig[] {
    return [
      {
        id: 'metrics-overview',
        type: 'metrics',
        title: 'Key Metrics',
        position: { x: 0, y: 0, w: 12, h: 4 },
        config: {
          metrics: ['totalOrders', 'revenue', 'activeVehicles', 'deliveryRate']
        }
      },
      {
        id: 'recent-orders',
        type: 'table',
        title: 'Recent Orders',
        position: { x: 0, y: 4, w: 8, h: 6 },
        config: {
          dataSource: 'orders',
          limit: 10
        }
      },
      {
        id: 'fleet-status',
        type: 'map',
        title: 'Fleet Status',
        position: { x: 8, y: 4, w: 4, h: 6 },
        config: {
          showVehicles: true,
          showRoutes: true
        }
      },
      {
        id: 'performance-chart',
        type: 'chart',
        title: 'Performance Trends',
        position: { x: 0, y: 10, w: 6, h: 6 },
        config: {
          chartType: 'line',
          dataSource: 'performance',
          timeRange: '7d'
        }
      },
      {
        id: 'alerts-panel',
        type: 'alerts',
        title: 'System Alerts',
        position: { x: 6, y: 10, w: 6, h: 6 },
        config: {
          severity: ['high', 'medium'],
          autoRefresh: true
        }
      }
    ];
  }

  private getDefaultMenuOrder(): string[] {
    return [
      'dashboard',
      'orders',
      'vehicles',
      'routes',
      'inventory',
      'analytics',
      'settings'
    ];
  }

  private getDefaultQuickActions(): Array<{ id: string; label: string; icon: string; action: string }> {
    return [
      { id: 'new-order', label: 'New Order', icon: 'Plus', action: '/orders/new' },
      { id: 'track-shipment', label: 'Track Shipment', icon: 'Search', action: '/tracking' },
      { id: 'fleet-overview', label: 'Fleet Status', icon: 'Truck', action: '/fleet' },
      { id: 'reports', label: 'Generate Report', icon: 'FileText', action: '/reports' }
    ];
  }

  private initializeDefaultTemplates(): void {
    const dashboardTemplate: LayoutTemplate = {
      id: 'default-dashboard',
      name: 'Standard Dashboard',
      description: 'Default dashboard layout for logistics management',
      preview: '',
      category: 'default',
      isPublic: true,
      allowedRoles: ['ADMIN', 'MANAGER', 'USER'],
      authorId: 'system',
      components: this.getDefaultComponents(),
      config: {
        theme: 'light',
        primaryColor: '#3b82f6',
        sidebarWidth: 256,
        gridGap: 24,
        headerConfig: {
          height: 64,
          sticky: true,
          showSearch: true,
          showNotifications: true,
          showUserMenu: true
        },
        footerConfig: {
          visible: true,
          sticky: false,
          variant: 'default'
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const analyticsTemplate: LayoutTemplate = {
      id: 'analytics-focused',
      name: 'Analytics Focused',
      description: 'Layout optimized for data analysis and reporting',
      preview: '',
      category: 'analytics',
      isPublic: true,
      allowedRoles: ['ADMIN', 'MANAGER'],
      authorId: 'system',
      components: [
        {
          id: 'performance-overview',
          type: 'metrics',
          title: 'Performance Overview',
          position: { x: 0, y: 0, w: 12, h: 3 },
          config: { metrics: ['efficiency', 'revenue', 'costs', 'satisfaction'] }
        },
        {
          id: 'analytics-chart',
          type: 'chart',
          title: 'Detailed Analytics',
          position: { x: 0, y: 3, w: 8, h: 8 },
          config: { chartType: 'mixed', timeRange: '30d' }
        },
        {
          id: 'kpi-summary',
          type: 'kpi',
          title: 'KPI Summary',
          position: { x: 8, y: 3, w: 4, h: 8 },
          config: { kpis: ['onTime', 'costPerMile', 'utilization'] }
        }
      ],
      config: {
        theme: 'light',
        primaryColor: '#8b5cf6',
        sidebarWidth: 200,
        gridGap: 20,
        headerConfig: {
          height: 60,
          sticky: true,
          showSearch: true,
          showNotifications: false,
          showUserMenu: true
        },
        footerConfig: {
          visible: false,
          sticky: false,
          variant: 'minimal'
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.layoutTemplates.set(dashboardTemplate.id, dashboardTemplate);
    this.layoutTemplates.set(analyticsTemplate.id, analyticsTemplate);
  }
}