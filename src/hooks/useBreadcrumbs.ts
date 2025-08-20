import { useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import { BreadcrumbItem } from '@/types/navigation';

// Hook for generating breadcrumbs from route
export const useBreadcrumbs = (customItems?: BreadcrumbItem[]) => {
  const location = useLocation();

  if (customItems) return customItems;

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/', icon: Home },
  ];

  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;

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