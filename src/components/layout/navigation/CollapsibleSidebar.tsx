import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  BarChart3, 
  Package, 
  Truck, 
  Users, 
  Settings, 
  Bell, 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MapPin,
  FileText,
  CreditCard,
  HelpCircle
} from 'lucide-react';
import { NavigationItem } from '@/types/navigation';
import { useAnimationContext } from '@/components/providers/AnimationProvider';
import { useNavigation } from '@/hooks/useNavigation';
import { animateSidebarToggle, animateDropdown } from '@/lib/animations/navigationAnimations';

interface CollapsibleSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onAlertsClick?: () => void;
  alertsCount?: number;
  userRole?: string[];
  className?: string;
}

// Default navigation items for logistics platform
const defaultNavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/',
    allowedRoles: ['admin', 'manager', 'driver', 'customer'],
  },
  {
    id: 'tracking',
    label: 'Tracking',
    icon: MapPin,
    allowedRoles: ['admin', 'manager', 'driver', 'customer'],
    children: [
      {
        id: 'live-tracking',
        label: 'Live Tracking',
        href: '/tracking/live',
        allowedRoles: ['admin', 'manager', 'driver'],
      },
      {
        id: 'shipment-history',
        label: 'Shipment History',
        href: '/tracking/history',
        allowedRoles: ['admin', 'manager', 'customer'],
      },
    ],
  },
  {
    id: 'fleet',
    label: 'Fleet Management',
    icon: Truck,
    allowedRoles: ['admin', 'manager'],
    children: [
      {
        id: 'vehicles',
        label: 'Vehicles',
        href: '/fleet/vehicles',
        allowedRoles: ['admin', 'manager'],
      },
      {
        id: 'drivers',
        label: 'Drivers',
        href: '/fleet/drivers',
        allowedRoles: ['admin', 'manager'],
      },
      {
        id: 'maintenance',
        label: 'Maintenance',
        href: '/fleet/maintenance',
        allowedRoles: ['admin', 'manager'],
      },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    href: '/inventory',
    allowedRoles: ['admin', 'manager'],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    allowedRoles: ['admin', 'manager'],
    children: [
      {
        id: 'reports',
        label: 'Reports',
        href: '/analytics/reports',
        allowedRoles: ['admin', 'manager'],
      },
      {
        id: 'performance',
        label: 'Performance',
        href: '/analytics/performance',
        allowedRoles: ['admin', 'manager'],
      },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    href: '/customers',
    allowedRoles: ['admin', 'manager'],
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileText,
    href: '/documents',
    allowedRoles: ['admin', 'manager', 'driver'],
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: CreditCard,
    allowedRoles: ['admin', 'manager'],
    children: [
      {
        id: 'invoices',
        label: 'Invoices',
        href: '/billing/invoices',
        allowedRoles: ['admin', 'manager'],
      },
      {
        id: 'payments',
        label: 'Payments',
        href: '/billing/payments',
        allowedRoles: ['admin', 'manager'],
      },
    ],
  },
];

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  isOpen,
  onToggle,
  onAlertsClick,
  alertsCount = 0,
  userRole = ['admin'],
  className = '',
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const sidebarRef = useRef<HTMLElement>(null);
  const { createAnimation } = useAnimationContext();
  
  const { 
    navigationItems, 
    navigateTo, 
    isActive, 
    isExpanded,
    trackNavigation 
  } = useNavigation({
    userRole,
    navigationItems: defaultNavigationItems,
  });

  // Animate sidebar toggle
  useEffect(() => {
    if (sidebarRef.current) {
      animateSidebarToggle(sidebarRef.current, isOpen);
    }
  }, [isOpen]);

  // Handle navigation item click
  const handleItemClick = (item: NavigationItem, event: React.MouseEvent) => {
    event.preventDefault();
    
    if (item.children && item.children.length > 0) {
      // Toggle expansion for items with children
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
    } else {
      // Navigate for leaf items
      navigateTo(item);
      trackNavigation(item);
    }
  };

  // Render navigation item
  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const IconComponent = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isItemExpanded = expandedItems.has(item.id);
    const isItemActive = isActive(item);
    
    return (
      <div key={item.id} className="relative">
        <button
          onClick={(e) => handleItemClick(item, e)}
          className={`
            w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium
            transition-all duration-200 group relative
            ${level > 0 ? 'ml-4 pl-6' : ''}
            ${isItemActive 
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }
          `}
          title={!isOpen ? item.label : undefined}
          data-animate-child={!isOpen}
        >
          {IconComponent && (
            <IconComponent 
              className={`w-[18px] h-[18px] flex-shrink-0 ${!isOpen && level === 0 ? 'mx-auto' : ''}`}
            />
          )}
          
          {(isOpen || level > 0) && (
            <>
              <span className="flex-1 text-left truncate">
                {item.label}
              </span>
              
              {hasChildren && (
                <ChevronDown 
                  className={`w-4 h-4 transform transition-transform duration-200 ${
                    isItemExpanded ? 'rotate-180' : ''
                  }`}
                />
              )}
            </>
          )}

          {!isOpen && level === 0 && (
            <div className="
              absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground
              text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible
              transition-all duration-200 z-50 whitespace-nowrap
            ">
              {item.label}
            </div>
          )}
        </button>

        {/* Children items */}
        {hasChildren && isItemExpanded && (isOpen || level > 0) && (
          <div className="mt-1 space-y-1 overflow-hidden">
            {item.children?.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      ref={sidebarRef}
      className={`
        fixed left-0 top-16 h-[calc(100vh-4rem)] z-40
        bg-background border-r border-border
        transition-all duration-300 overflow-hidden
        ${isOpen ? 'w-64' : 'w-16'}
        ${className}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {isOpen && (
            <h2 className="font-semibold text-sm text-foreground" data-animate-child>
              Navigation
            </h2>
          )}
          
          <button
            onClick={onToggle}
            className="
              p-1.5 rounded-md hover:bg-accent transition-colors
              focus:outline-none focus:ring-2 focus:ring-primary/20
            "
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigationItems.map(item => renderNavigationItem(item))}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-border p-3 space-y-1">
          {/* Alerts button */}
          {onAlertsClick && (
            <button
              onClick={onAlertsClick}
              className="
                w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium
                text-muted-foreground hover:text-foreground hover:bg-accent
                transition-colors duration-200 group relative
              "
              title={!isOpen ? 'Alerts' : undefined}
            >
              <div className="relative flex-shrink-0">
                <Bell className="w-[18px] h-[18px]" />
                {alertsCount > 0 && (
                  <span className="
                    absolute -top-1 -right-1 bg-destructive text-destructive-foreground
                    text-xs rounded-full h-4 w-4 flex items-center justify-center
                    animate-pulse
                  ">
                    {alertsCount > 9 ? '9+' : alertsCount}
                  </span>
                )}
              </div>
              
              {isOpen && (
                <span className="flex-1 text-left" data-animate-child>
                  Alerts
                  {alertsCount > 0 && (
                    <span className="ml-2 text-destructive">
                      ({alertsCount})
                    </span>
                  )}
                </span>
              )}

              {!isOpen && (
                <div className="
                  absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground
                  text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible
                  transition-all duration-200 z-50 whitespace-nowrap
                ">
                  Alerts {alertsCount > 0 && `(${alertsCount})`}
                </div>
              )}
            </button>
          )}

          {/* Settings */}
          <button
            className="
              w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium
              text-muted-foreground hover:text-foreground hover:bg-accent
              transition-colors duration-200 group relative
            "
            title={!isOpen ? 'Settings' : undefined}
          >
            <Settings className="w-[18px] h-[18px] flex-shrink-0" />
            
            {isOpen && (
              <span className="flex-1 text-left" data-animate-child>
                Settings
              </span>
            )}

            {!isOpen && (
              <div className="
                absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground
                text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible
                transition-all duration-200 z-50 whitespace-nowrap
              ">
                Settings
              </div>
            )}
          </button>

          {/* Help */}
          <button
            className="
              w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium
              text-muted-foreground hover:text-foreground hover:bg-accent
              transition-colors duration-200 group relative
            "
            title={!isOpen ? 'Help' : undefined}
          >
            <HelpCircle className="w-[18px] h-[18px] flex-shrink-0" />
            
            {isOpen && (
              <span className="flex-1 text-left" data-animate-child>
                Help & Support
              </span>
            )}

            {!isOpen && (
              <div className="
                absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground
                text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible
                transition-all duration-200 z-50 whitespace-nowrap
              ">
                Help & Support
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};