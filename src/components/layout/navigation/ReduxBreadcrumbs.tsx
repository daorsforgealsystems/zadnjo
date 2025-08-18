import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigationState } from '@/hooks/useNavigationState';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface ReduxBreadcrumbsProps {
  className?: string;
  maxItems?: number; // collapse in the middle if too long
}

export const ReduxBreadcrumbs: React.FC<ReduxBreadcrumbsProps> = ({ className, maxItems = 6 }) => {
  const { breadcrumbs } = useNavigationState();

  if (!breadcrumbs || breadcrumbs.length <= 1) return null;

  const items = breadcrumbs.map(b => ({ label: b.label, href: b.href }));

  // Middle ellipsis if exceeding maxItems
  let display: typeof items = items;
  if (items.length > maxItems) {
    display = [items[0], { label: '...', href: '#' }, ...items.slice(items.length - (maxItems - 2))];
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {display.map((item, idx) => {
          const isLast = idx === display.length - 1;
          if (item.label === '...') {
            return (
              <React.Fragment key={`ellipsis-${idx}`}>
                {idx !== 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  <BreadcrumbEllipsis />
                </BreadcrumbItem>
              </React.Fragment>
            );
          }
          return (
            <React.Fragment key={`${item.href}-${idx}`}>
              {idx !== 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default ReduxBreadcrumbs;