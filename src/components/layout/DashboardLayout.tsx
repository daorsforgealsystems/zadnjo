import React, { useEffect, useState } from 'react';
import { LayoutProvider } from '@/components/providers/LayoutProvider';
import { ResponsiveNavbar } from '@/components/layout/navigation/ResponsiveNavbar';
import { CollapsibleSidebar } from '@/components/layout/navigation/CollapsibleSidebar';
import { MobileNavigation } from '@/components/layout/navigation/MobileNavigation';
import { StickyHeader } from '@/components/layout/headers/StickyHeader';
import { ResponsiveGrid } from '@/components/layout/grid/ResponsiveGrid';
import { InteractiveBackground } from '@/components/ui/react-bits/InteractiveBackground';
import { useLayout } from '@/components/providers/LayoutProvider';
import { generateTemplate } from '@/lib/layout/layoutUtils';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { createRouteGuardThunk, loadNavigationState, trackPageViewThunk, updateBreadcrumbsThunk } from '@/store/navigationSlice';
import ReduxBreadcrumbs from '@/components/layout/navigation/ReduxBreadcrumbs';
import type { UserRole } from '@/lib/api/navigation-api';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const DashboardContent: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { state, actions } = useLayout();
  const [alertsCount] = useState(3);
  const { user } = useAuth();
  const location = useLocation();
  const dispatch = useAppDispatch();

  // Define a type for user if not already defined
  type AuthUser = {
    id: string;
    role?: string;
    roles?: string[];
    [key: string]: unknown;
  };

  const typedUser = user as unknown as AuthUser | undefined;
  const userRole = (typedUser?.roles?.[0] || typedUser?.role || 'GUEST') as UserRole;

  useEffect(() => {
    if (typedUser?.id) {
      dispatch(loadNavigationState({ userId: typedUser.id, role: userRole }));
      dispatch(createRouteGuardThunk({ userId: typedUser.id, role: userRole }));
    }
  }, [typedUser, userRole, dispatch]);

  useEffect(() => {
    if (user?.id) {
      // Only track for non-guest users to prevent connection errors
      if (!user.id.includes('guest')) {
        dispatch(trackPageViewThunk({ userId: user.id, page: location.pathname }));
      }

      // Use the user's role if available, otherwise default to GUEST
      const typedUser = user as unknown as AuthUser;
      const userRoles = typedUser.roles;
      const role = (userRoles && userRoles.length > 0 ? userRoles[0] : typedUser.role || 'GUEST') as UserRole;

      // For guest users, we'll use the local breadcrumbs generation in the thunk
      // For authenticated users, the API call will be made
      dispatch(updateBreadcrumbsThunk({ route: location.pathname, role }));
    }
  }, [
    location.pathname,
    user,
    dispatch
  ]);

  const handleNavClick = (item: unknown) => {
    console.log('Navigation clicked:', item);
  };

  const components = generateTemplate('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      <InteractiveBackground variant="dots" intensity="low" />
      
      {/* Mobile Navigation */}
      <MobileNavigation
        config={{
          swipeGestures: true,
          bottomNavigation: true,
          collapsibleSections: true,
          items: [
            {
              id: 'dashboard',
              label: 'Dashboard',
              href: '/',
            },
            {
              id: 'live-map',
              label: 'Live Map',
              href: '/live-map',
            },
            {
              id: 'inventory',
              label: 'Inventory',
              href: '/inventory',
            },
            {
              id: 'fleet-tracking',
              label: 'Fleet Tracking',
              href: '/fleet-tracking',
            },
            {
              id: 'reports',
              label: 'Reports',
              href: '/reports',
            },
            {
              id: 'settings',
              label: 'Settings',
              href: '/settings',
            },
          ],
          quickActions: [],
        }}
        onItemClick={handleNavClick}
      />

      {/* Sticky Header */}
      <StickyHeader threshold={20} showProgress>
        <div className="flex flex-col gap-2">
          <ResponsiveNavbar
            onMenuToggle={actions.toggleSidebar}
            config={{
              title: "DaorsForge",
              subtitle: "AI Logistics Platform",
              search: {
                enabled: true,
                placeholder: "Search logistics...",
                showSuggestions: true,
              },
              userMenu: {
                showNotifications: true,
                notificationCount: alertsCount,
              },
              sticky: true,
            }}
          />
          {/* Redux-driven breadcrumbs */}
          <div className="px-4">
            <ReduxBreadcrumbs />
          </div>
        </div>
      </StickyHeader>

      {/* Sidebar */}
      <CollapsibleSidebar
        isOpen={state.sidebarOpen}
        onToggle={actions.toggleSidebar}
        onAlertsClick={() => console.log('Alerts clicked')}
        alertsCount={alertsCount}
      />

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          state.sidebarOpen ? 'ml-64' : 'ml-16'
        } pt-16 pb-16 md:pb-0`}
      >
        <div className="p-6">
          {children || (
            <div>
              <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
              <ResponsiveGrid
                components={components}
                gap={24}
                minItemWidth={200}
                className="mb-8"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <LayoutProvider>
      <DashboardContent>
        {children}
      </DashboardContent>
    </LayoutProvider>
  );
};
