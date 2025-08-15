// Animated breadcrumbs component for navigation path indication
import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnimations } from '@/hooks/useAnimations';
import { animateBreadcrumbTransition } from '@/lib/animations/navigationAnimations';
import { cn } from '@/lib/utils';
import { BreadcrumbItem } from '@/types/navigation';

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
  maxItems?: number;
  className?: string;
}

// Route to breadcrumb mapping
const routeToBreadcrumb: Record<string, BreadcrumbItem[]> = {
  '/': [{ label: 'Dashboard', href: '/', isActive: true }],
  '/item-tracking': [
    { label: 'Dashboard', href: '/' },
    { label: 'Item Tracking', href: '/item-tracking', isActive: true },
  ],
  '/live-map': [
    { label: 'Dashboard', href: '/' },
    { label: 'Live Map', href: '/live-map', isActive: true },
  ],
  '/route-optimization': [
    { label: 'Dashboard', href: '/' },
    { label: 'Route Optimization', href: '/route-optimization', isActive: true },
  ],
  '/inventory': [
    { label: 'Dashboard', href: '/' },
    { label: 'Inventory', href: '/inventory', isActive: true },
  ],
  '/reports': [
    { label: 'Dashboard', href: '/' },
    { label: 'Analytics', href: '#' },
    { label: 'Reports', href: '/reports', isActive: true },
  ],
  '/settings': [
    { label: 'Dashboard', href: '/' },
    { label: 'Settings', href: '/settings', isActive: true },
  ],
  '/team': [
    { label: 'Dashboard', href: '/' },
    { label: 'Team', href: '/team', isActive: true },
  ],
  '/support': [
    { label: 'Dashboard', href: '/' },
    { label: 'Support', href: '/support', isActive: true },
  ],
  '/portal/profile': [
    { label: 'Dashboard', href: '/' },
    { label: 'Portal', href: '#' },
    { label: 'Profile', href: '/portal/profile', isActive: true },
  ],
  '/enhanced-dashboard': [
    { label: 'Dashboard', href: '/' },
    { label: 'Enhanced Dashboard', href: '/enhanced-dashboard', isActive: true },
  ],
  '/warehouse-management': [
    { label: 'Dashboard', href: '/' },
    { label: 'Warehouse Management', href: '/warehouse-management', isActive: true },
  ],
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  showHome = true,
  maxItems = 5,
  className,
}) => {
  const location = useLocation();
  const breadcrumbsRef = useRef<HTMLNavElement>(null);
  const { createAnimation } = useAnimations();

  // Generate breadcrumbs from current route if not provided
  const breadcrumbItems = items || routeToBreadcrumb[location.pathname] || [
    { label: 'Dashboard', href: '/', isActive: location.pathname === '/' },
  ];

  // Add home breadcrumb if requested and not already present
  const finalItems = showHome && breadcrumbItems[0]?.href !== '/'
    ? [{ label: 'Home', href: '/', icon: Home }, ...breadcrumbItems]
    : breadcrumbItems;

  // Limit items if maxItems is specified
  const displayItems = finalItems.length > maxItems
    ? [
        finalItems[0],
        { label: '...', href: '#' },
        ...finalItems.slice(-maxItems + 2),
      ]
    : finalItems;

  // Animate breadcrumbs on route change
  useEffect(() => {
    if (breadcrumbsRef.current) {
      const items = breadcrumbsRef.current.querySelectorAll('[data-breadcrumb-item]');
      animateBreadcrumbTransition(items as NodeListOf<HTMLElement>);
    }
  }, [location.pathname]);

  if (displayItems.length <= 1) {
    return null;
  }

  return (
    <nav
      ref={breadcrumbsRef}
      className={cn(
        'flex items-center space-x-1 text-sm text-muted-foreground',
        className
      )}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const IconComponent = item.icon;

          return (
            <li key={index} className="flex items-center" data-breadcrumb-item>
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
              )}
              
              {item.href && item.href !== '#' && !isLast ? (
                <Link
                  to={item.href}
                  className="flex items-center gap-1 hover:text-foreground transition-colors duration-200 hover:underline"
                >
                  {IconComponent && <IconComponent className="h-4 w-4" />}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    'flex items-center gap-1',
                    isLast ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                >
                  {IconComponent && <IconComponent className="h-4 w-4" />}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// Breadcrumb separator component
export const BreadcrumbSeparator: React.FC<{ className?: string }> = ({ className }) => (
  <ChevronRight className={cn('h-4 w-4 text-muted-foreground/50', className)} />
);

// Individual breadcrumb item component
export const BreadcrumbItem: React.FC<{
  children: React.ReactNode;
  href?: string;
  isActive?: boolean;
  className?: string;
}> = ({ children, href, isActive, className }) => {
  const content = (
    <span
      className={cn(
        'flex items-center gap-1 transition-colors duration-200',
        isActive
          ? 'text-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground hover:underline',
        className
      )}
    >
      {children}
    </span>
  );

  if (href && !isActive) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
};

// Breadcrumb container component
export const BreadcrumbContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <nav
    className={cn(
      'flex items-center space-x-1 text-sm text-muted-foreground',
      className
    )}
    aria-label="Breadcrumb"
  >
    <ol className="flex items-center space-x-1">{children}</ol>
  </nav>
);

// Hook for generating breadcrumbs from route
export const useBreadcrumbs = (customItems?: BreadcrumbItem[]) => {
  const location = useLocation();
  
  if (customItems) {
    return customItems;
  }

  // Generate breadcrumbs from pathname
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/', icon: Home },
  ];

  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    
    // Convert segment to readable label
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    breadcrumbs.push({
      label,
      href: currentPath,
      isActive: isLast,
    });
  });

  return breadcrumbs;
};