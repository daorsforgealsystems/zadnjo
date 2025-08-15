import { apiClient } from './gateway';

export interface LayoutPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  gridGap: number;
  animationsEnabled: boolean;
  compactMode: boolean;
  customCss: string;
  components: ComponentConfig[];
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  headerConfig: HeaderConfig;
  footerConfig: FooterConfig;
  updatedAt: Date;
}

export interface ComponentConfig {
  id: string;
  type: string;
  title: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config: Record<string, any>;
  visible?: boolean;
  resizable?: boolean;
  draggable?: boolean;
}

export interface HeaderConfig {
  height: number;
  sticky: boolean;
  showSearch: boolean;
  showNotifications: boolean;
  showUserMenu: boolean;
  variant?: 'default' | 'glass' | 'solid' | 'gradient' | 'minimal';
  backgroundColor?: string;
  blur?: boolean;
  shadow?: boolean;
}

export interface FooterConfig {
  visible: boolean;
  sticky: boolean;
  variant: 'default' | 'minimal' | 'expanded' | 'gradient' | 'glass';
  backgroundColor?: string;
  showSocialLinks?: boolean;
  showNewsletter?: boolean;
  customContent?: any;
}

export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  category: 'default' | 'analytics' | 'operations' | 'custom';
  isPublic: boolean;
  allowedRoles: string[];
  authorId: string;
  components: ComponentConfig[];
  config: {
    theme: 'light' | 'dark';
    primaryColor: string;
    sidebarWidth: number;
    gridGap: number;
    headerConfig: HeaderConfig;
    footerConfig: FooterConfig;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class PreferencesAPI {
  // Layout Preferences
  static async getLayoutPreferences(userId: string): Promise<LayoutPreferences> {
    const response = await apiClient.get(`/preferences/layout/${userId}`);
    return response.data;
  }

  static async updateLayoutPreferences(
    userId: string,
    preferences: Partial<LayoutPreferences>
  ): Promise<LayoutPreferences> {
    const response = await apiClient.put(`/preferences/layout/${userId}`, preferences);
    return response.data;
  }

  // Navigation Preferences
  static async getNavigationPreferences(userId: string) {
    const response = await apiClient.get(`/preferences/navigation/${userId}`);
    return response.data;
  }

  static async updateNavigationPreferences(
    userId: string,
    preferences: any
  ) {
    const response = await apiClient.put(`/preferences/navigation/${userId}`, preferences);
    return response.data;
  }

  // Layout Templates
  static async getLayoutTemplates(role?: string): Promise<LayoutTemplate[]> {
    const response = await apiClient.get('/preferences/templates', {
      params: role ? { role } : {}
    });
    return response.data;
  }

  static async createLayoutTemplate(template: Omit<LayoutTemplate, 'id'>): Promise<LayoutTemplate> {
    const response = await apiClient.post('/preferences/templates', template);
    return response.data;
  }

  static async updateLayoutTemplate(
    templateId: string,
    template: Partial<LayoutTemplate>
  ): Promise<LayoutTemplate> {
    const response = await apiClient.put(`/preferences/templates/${templateId}`, template);
    return response.data;
  }

  static async deleteLayoutTemplate(templateId: string): Promise<void> {
    await apiClient.delete(`/preferences/templates/${templateId}`);
  }

  static async applyLayoutTemplate(templateId: string, userId: string): Promise<LayoutPreferences> {
    const response = await apiClient.post(`/preferences/templates/${templateId}/apply/${userId}`);
    return response.data;
  }

  // Dashboard Components
  static async getDashboardComponents(userId: string): Promise<ComponentConfig[]> {
    const response = await apiClient.get(`/preferences/components/${userId}`);
    return response.data;
  }

  static async updateDashboardComponents(
    userId: string,
    components: ComponentConfig[]
  ): Promise<ComponentConfig[]> {
    const response = await apiClient.put(`/preferences/components/${userId}`, components);
    return response.data;
  }

  // Utility Methods
  static async resetPreferences(
    userId: string,
    type?: 'layout' | 'navigation' | 'all'
  ): Promise<void> {
    await apiClient.post(`/preferences/reset/${userId}`, {}, {
      params: type ? { type } : {}
    });
  }

  static async exportPreferences(userId: string) {
    const response = await apiClient.get(`/preferences/export/${userId}`);
    return response.data;
  }

  static async importPreferences(userId: string, preferencesData: any) {
    const response = await apiClient.post(`/preferences/import/${userId}`, preferencesData);
    return response.data;
  }

  static async saveCustomLayout(
    userId: string,
    layoutData: {
      name: string;
      description?: string;
      components: ComponentConfig[];
      gridConfig: any;
    }
  ): Promise<LayoutTemplate> {
    const response = await apiClient.post(`/preferences/layout/${userId}/save-custom`, layoutData);
    return response.data;
  }

  // Theme and Color Helpers
  static async updateTheme(userId: string, theme: 'light' | 'dark' | 'auto'): Promise<LayoutPreferences> {
    return this.updateLayoutPreferences(userId, { theme });
  }

  static async updatePrimaryColor(userId: string, color: string): Promise<LayoutPreferences> {
    return this.updateLayoutPreferences(userId, { primaryColor: color });
  }

  static async updateSidebarSettings(
    userId: string,
    settings: { width?: number; collapsed?: boolean }
  ): Promise<LayoutPreferences> {
    return this.updateLayoutPreferences(userId, {
      sidebarWidth: settings.width,
      sidebarCollapsed: settings.collapsed
    });
  }

  static async toggleAnimations(userId: string, enabled: boolean): Promise<LayoutPreferences> {
    return this.updateLayoutPreferences(userId, { animationsEnabled: enabled });
  }

  static async updateGridSettings(
    userId: string,
    settings: { gap?: number; compactMode?: boolean }
  ): Promise<LayoutPreferences> {
    return this.updateLayoutPreferences(userId, {
      gridGap: settings.gap,
      compactMode: settings.compactMode
    });
  }
}