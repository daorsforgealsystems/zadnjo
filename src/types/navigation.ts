export interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  allowedRoles?: string[];
  children?: NavigationItem[];
}

export interface NavigationConfig {
  title?: string;
  subtitle?: string;
  search?: {
    enabled: boolean;
    placeholder?: string;
    showSuggestions?: boolean;
  };
  userMenu?: {
    showNotifications: boolean;
    notificationCount?: number;
  };
  sticky?: boolean;
}

export interface MobileNavigationConfig {
  swipeGestures: boolean;
  bottomNavigation: boolean;
  collapsibleSections: boolean;
  quickActions?: NavigationItem[];
}
