export type UserRole = 'ADMIN' | 'MANAGER' | 'USER' | 'DRIVER' | 'CUSTOMER';

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

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  children?: NavigationItem[];
  badge?: number;
  roles?: UserRole[];
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: string;
  hotkey?: string;
  roles?: UserRole[];
}

export interface NavigationPreferences {
  id: string;
  userId: string;
  favoriteMenuItems: string[];
  hiddenMenuItems: string[];
  menuItemOrder: string[];
  quickActions: QuickAction[];
  breadcrumbsEnabled: boolean;
  searchHistory: string[];
  recentlyVisited: Array<{
    path: string;
    title: string;
    timestamp: Date;
  }>;
  customMenuItems: NavigationItem[];
  mobileMenuStyle: 'slide' | 'overlay' | 'push';
  updatedAt: Date;
}

export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  preview: string; // URL to preview image
  category: 'default' | 'analytics' | 'operations' | 'custom';
  isPublic: boolean;
  allowedRoles: UserRole[];
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
  usageCount?: number;
  rating?: number;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  target: string;
  metadata: Record<string, any>;
  timestamp: Date;
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

export interface LayoutCustomization {
  id: string;
  userId: string;
  name: string;
  description?: string;
  snapshot: {
    components: ComponentConfig[];
    layoutConfig: Partial<LayoutPreferences>;
  };
  isShared: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleBasedNavigation {
  role: UserRole;
  allowedRoutes: string[];
  defaultLandingPage: string;
  restrictedComponents: string[];
  availableActions: string[];
  menuStructure: NavigationItem[];
}

export interface ThemeConfiguration {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
  };
  fonts: {
    sans: string;
    serif: string;
    mono: string;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  isSystem: boolean;
  createdAt: Date;
}