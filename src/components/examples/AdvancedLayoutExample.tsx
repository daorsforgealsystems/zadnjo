// Complete example implementation of the advanced navigation and layout system
import React, { useState, useEffect } from 'react';
import { Plus, Settings, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

// Layout System Components
import { LayoutProvider, useLayout, layoutUtils } from '@/components/providers/LayoutProvider';
import { ResponsiveNavbar } from '@/components/layout/navigation/ResponsiveNavbar';
import { CollapsibleSidebar } from '@/components/layout/navigation/CollapsibleSidebar';
import { Breadcrumbs } from '@/components/layout/navigation/Breadcrumbs';
import { MobileNavigation } from '@/components/layout/navigation/MobileNavigation';
import { StickyHeader } from '@/components/layout/headers/StickyHeader';
import { StickyFooter } from '@/components/layout/footers/StickyFooter';
import { ResponsiveGrid } from '@/components/layout/grid/ResponsiveGrid';
import { DragDropLayout, ComponentTypeSelector } from '@/components/layout/grid/DragDropLayout';

// React-bits Inspired Components
import { InteractiveBackground } from '@/components/ui/react-bits/InteractiveBackground';
import { AnimatedButton, FloatingActionButton } from '@/components/ui/animated/AnimatedButton';

// Hooks
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAnimations } from '@/hooks/useAnimations';

// Types
import { LayoutComponent } from '@/types/layout';
import { BreadcrumbItem } from '@/types/navigation';

// Main Layout Component
export const AdvancedLayoutExample: React.FC = () => {
  return (
    <LayoutProvider>
      <DashboardLayoutContent />
    </LayoutProvider>
  );
};

// Dashboard Layout Content
const DashboardLayoutContent: React.FC = () => {
  const { state, actions } = useLayout();
  const { isMobile, currentBreakpoint } = useResponsiveLayout();
  const { animateEntrance } = useAnimations();

  const [showComponentSelector, setShowComponentSelector] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'view' | 'edit'>('view');

  // Custom breadcrumbs for this example
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/' },
    { label: 'Layout System', href: '/layout-system' },
    { label: 'Advanced Example', href: '/layout-system/advanced', isActive: true },
  ];

  // Handle adding new component
  const handleAddComponent = (type: LayoutComponent['type']) => {
    const newComponent: LayoutComponent = {
      id: `component-${Date.now()}`,
      type,
      position: {
        x: 0,
        y: Math.max(...state.components.map(c => c.position.y + c.position.height), 0),
        width: type === 'chart' ? 2 : 1,
        height: type === 'table' ? 2 : 1,
      },
      isDraggable: true,
      isResizable: false,
    };

    actions.addComponent(newComponent);
    setShowComponentSelector(false);
  };

  // Handle layout template selection
  const handleLoadTemplate = (templateType: 'dashboard' | 'analytics' | 'minimal') => {
    const template = layoutUtils.generateTemplate(templateType);
    actions.loadLayout({ components: template });
  };

  // Export current layout
  const handleExportLayout = () => {
    layoutUtils.exportLayout(state);
  };

  // Import layout from file
  const handleImportLayout = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      layoutUtils.importLayout(file)
        .then(layout => {
          actions.loadLayout(layout);
        })
        .catch(error => {
          console.error('Failed to import layout:', error);
        });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Interactive Background */}
      <InteractiveBackground
        variant="dots"
        intensity="low"
        className="fixed inset-0 pointer-events-none"
      />

      {/* Mobile Navigation */}
      <MobileNavigation
        config={{
          swipeGestures: true,
          bottomNavigation: true,
          collapsibleSections: true,
        }}
      />

      {/* Sticky Header with Navbar */}
      <StickyHeader threshold={20} showProgress>
        <ResponsiveNavbar
          onMenuToggle={actions.toggleSidebar}
          config={{
            title: "DaorsForge",
            subtitle: "Advanced Layout System",
            search: {
              enabled: true,
              placeholder: "Search components...",
              showSuggestions: true,
            },
            userMenu: {
              showNotifications: true,
              notificationCount: 3,
            },
            sticky: true,
          }}
        />
      </StickyHeader>

      {/* Collapsible Sidebar */}
      <CollapsibleSidebar
        isOpen={!state.sidebarCollapsed}
        onToggle={actions.toggleSidebar}
        alertsCount={2}
      />

      {/* Main Content Area */}
      <main
        className={`transition-all duration-300 pt-16 ${
          !isMobile && !state.sidebarCollapsed ? 'ml-64' : !isMobile ? 'ml-16' : 'ml-0'
        }`}
      >
        <div className="p-6 space-y-6">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbs} showHome />

          {/* Layout Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Layout Management</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Customize your dashboard layout with drag-and-drop components
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {currentBreakpoint.toUpperCase()}
                  </Badge>
                  <Badge variant={layoutMode === 'edit' ? 'default' : 'secondary'}>
                    {layoutMode === 'edit' ? 'Edit Mode' : 'View Mode'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <AnimatedButton
                  animation="pulse"
                  trigger="hover"
                  onClick={() => setLayoutMode(layoutMode === 'edit' ? 'view' : 'edit')}
                  variant={layoutMode === 'edit' ? 'default' : 'outline'}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {layoutMode === 'edit' ? 'Exit Edit Mode' : 'Edit Layout'}
                </AnimatedButton>

                <Dialog open={showComponentSelector} onOpenChange={setShowComponentSelector}>
                  <DialogTrigger asChild>
                    <AnimatedButton
                      animation="bounce"
                      trigger="hover"
                      variant="outline"
                      disabled={layoutMode !== 'edit'}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Component
                    </AnimatedButton>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Select Component Type</DialogTitle>
                    </DialogHeader>
                    <ComponentTypeSelector onSelect={handleAddComponent} />
                  </DialogContent>
                </Dialog>

                <AnimatedButton
                  animation="slide"
                  trigger="hover"
                  variant="outline"
                  onClick={handleExportLayout}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Layout
                </AnimatedButton>

                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportLayout}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <AnimatedButton
                    animation="slide"
                    trigger="hover"
                    variant="outline"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import Layout
                  </AnimatedButton>
                </div>

                {/* Template Buttons */}
                <div className="flex gap-1 ml-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleLoadTemplate('dashboard')}
                  >
                    Dashboard
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleLoadTemplate('analytics')}
                  >
                    Analytics
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleLoadTemplate('minimal')}
                  >
                    Minimal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Layout Content */}
          {layoutMode === 'edit' ? (
            <Card>
              <CardHeader>
                <CardTitle>Drag & Drop Layout Editor</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Drag components to reorder them. Click the settings icon to configure each component.
                </p>
              </CardHeader>
              <CardContent>
                <DragDropLayout
                  components={state.components}
                  onComponentsChange={actions.reorderComponents}
                  onAddComponent={() => setShowComponentSelector(true)}
                  onRemoveComponent={actions.removeComponent}
                  onEditComponent={(component) => {
                    console.log('Edit component:', component);
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <ResponsiveGrid
                components={state.components}
                gap={24}
                minItemWidth={250}
                onComponentUpdate={actions.reorderComponents}
              />
            </div>
          )}

          {/* Layout Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Layout Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {state.components.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Components</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {currentBreakpoint}
                  </div>
                  <div className="text-sm text-muted-foreground">Breakpoint</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {state.dragDropConfig.enabled ? 'On' : 'Off'}
                  </div>
                  <div className="text-sm text-muted-foreground">Drag & Drop</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">
                    {isMobile ? 'Mobile' : 'Desktop'}
                  </div>
                  <div className="text-sm text-muted-foreground">Device</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton
        position="bottom-right"
        animation="pulse"
        onClick={() => setShowComponentSelector(true)}
        className={layoutMode === 'edit' ? 'block' : 'hidden'}
      >
        <Plus className="h-6 w-6" />
      </FloatingActionButton>

      {/* Sticky Footer */}
      <StickyFooter
        config={{ bottom: 0 }}
        className={`${!isMobile && !state.sidebarCollapsed ? 'ml-64' : !isMobile ? 'ml-16' : 'ml-0'}`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="text-sm text-muted-foreground">
            DaorsForge AI Logistics © 2024
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Layout: {state.components.length} components</span>
            <span>Mode: {layoutMode}</span>
            <span>Breakpoint: {currentBreakpoint}</span>
          </div>
        </div>
      </StickyFooter>
    </div>
  );
};

// Usage Example Component
export const LayoutSystemDemo: React.FC = () => {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Navigation & Layout System Demo</CardTitle>
          <p className="text-muted-foreground">
            Experience the complete navigation and layout system with anime.js animations
            and React-bits inspired components.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Features Included:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Responsive navbar with search</li>
                  <li>• Collapsible role-based sidebar</li>
                  <li>• Mobile navigation with gestures</li>
                  <li>• Drag-and-drop layout system</li>
                  <li>• Sticky headers and footers</li>
                  <li>• Interactive backgrounds</li>
                  <li>• Smooth anime.js animations</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Technologies Used:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• React + TypeScript</li>
                  <li>• Anime.js for animations</li>
                  <li>• React-bits inspired components</li>
                  <li>• Tailwind CSS for styling</li>
                  <li>• React DnD for drag-and-drop</li>
                  <li>• Responsive design patterns</li>
                </ul>
              </div>
            </div>
            
            <AnimatedButton
              animation="glow"
              trigger="hover"
              intensity="strong"
              ripple
              onClick={() => setShowDemo(true)}
              className="w-full"
            >
              Launch Interactive Demo
            </AnimatedButton>
          </div>
        </CardContent>
      </Card>

      {showDemo && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="absolute top-4 right-4 z-50">
            <Button
              variant="outline"
              onClick={() => setShowDemo(false)}
            >
              Exit Demo
            </Button>
          </div>
          <AdvancedLayoutExample />
        </div>
      )}
    </div>
  );
};

export default AdvancedLayoutExample;