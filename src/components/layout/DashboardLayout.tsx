import React, { useState } from 'react';
import { LayoutProvider } from '@/components/providers/LayoutProvider';
import { ResponsiveNavbar } from '@/components/layout/navigation/ResponsiveNavbar';
import { CollapsibleSidebar } from '@/components/layout/navigation/CollapsibleSidebar';
import { MobileNavigation } from '@/components/layout/navigation/MobileNavigation';
import { StickyHeader } from '@/components/layout/headers/StickyHeader';
import { ResponsiveGrid } from '@/components/layout/grid/ResponsiveGrid';
import { InteractiveBackground } from '@/components/ui/react-bits/InteractiveBackground';
import { useLayout } from '@/components/providers/LayoutProvider';
import { generateTemplate } from '@/lib/layout/layoutUtils';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const DashboardContent: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { state, actions } = useLayout();
  const [alertsCount] = useState(3);

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
            {/* Lazy import to avoid heavy initial render if needed */}
            {React.createElement(require('@/components/layout/navigation/ReduxBreadcrumbs').ReduxBreadcrumbs)}
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
