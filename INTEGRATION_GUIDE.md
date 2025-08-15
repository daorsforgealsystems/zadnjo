# Integration Guide: Advanced Navigation & Layout System

## 🚀 Quick Start Integration

### Step 1: Install Dependencies

```bash
npm install @hello-pangea/dnd animejs
npm install @types/animejs --save-dev
```

### Step 2: Wrap Your App with Providers

```tsx
// src/App.tsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LayoutProvider } from '@/components/providers/LayoutProvider';
import { AuthProvider } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LayoutProvider>
          <DashboardLayout>
            {/* Your app content */}
          </DashboardLayout>
        </LayoutProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

### Step 3: Create Main Layout Component

```tsx
// src/components/layout/DashboardLayout.tsx
import React, { useState } from 'react';
import { ResponsiveNavbar } from '@/components/layout/navigation/ResponsiveNavbar';
import { CollapsibleSidebar } from '@/components/layout/navigation/CollapsibleSidebar';
import { MobileNavigation } from '@/components/layout/navigation/MobileNavigation';
import { StickyHeader } from '@/components/layout/headers/StickyHeader';
import { InteractiveBackground } from '@/components/ui/react-bits/InteractiveBackground';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isMobile } = useResponsiveLayout();

  return (
    <div className="min-h-screen bg-background">
      {/* Interactive Background */}
      <InteractiveBackground
        variant="dots"
        intensity="low"
        className="fixed inset-0 pointer-events-none"
      />

      {/* Mobile Navigation */}
      <MobileNavigation />

      {/* Sticky Header */}
      <StickyHeader threshold={20} showProgress>
        <ResponsiveNavbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          config={{
            title: "DaorsForge",
            subtitle: "AI Logistics Platform",
            search: { enabled: true },
            userMenu: { showNotifications: true },
          }}
        />
      </StickyHeader>

      {/* Sidebar */}
      <CollapsibleSidebar
        isOpen={sidebarOpen && !isMobile}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <main className={`transition-all duration-300 pt-16 ${
        !isMobile && sidebarOpen ? 'ml-64' : !isMobile ? 'ml-16' : 'ml-0'
      }`}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
```

## 🎯 Component Integration Examples

### 1. Using Responsive Grid

```tsx
import React from 'react';
import { ResponsiveGrid } from '@/components/layout/grid/ResponsiveGrid';
import { useLayout } from '@/components/providers/LayoutProvider';

const DashboardPage: React.FC = () => {
  const { state, actions } = useLayout();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      <ResponsiveGrid
        components={state.components}
        gap={24}
        minItemWidth={250}
        onComponentUpdate={actions.reorderComponents}
      />
    </div>
  );
};
```

### 2. Adding Drag-and-Drop Layout Editor

```tsx
import React, { useState } from 'react';
import { DragDropLayout } from '@/components/layout/grid/DragDropLayout';
import { Button } from '@/components/ui/button';
import { useLayout } from '@/components/providers/LayoutProvider';

const LayoutEditor: React.FC = () => {
  const { state, actions } = useLayout();
  const [editMode, setEditMode] = useState(false);

  const handleAddComponent = () => {
    const newComponent = {
      id: `component-${Date.now()}`,
      type: 'widget' as const,
      position: { x: 0, y: 0, width: 1, height: 1 },
      isDraggable: true,
    };
    actions.addComponent(newComponent);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Layout Editor</h2>
        <Button
          onClick={() => setEditMode(!editMode)}
          variant={editMode ? 'default' : 'outline'}
        >
          {editMode ? 'Exit Edit Mode' : 'Edit Layout'}
        </Button>
      </div>

      {editMode ? (
        <DragDropLayout
          components={state.components}
          onComponentsChange={actions.reorderComponents}
          onAddComponent={handleAddComponent}
          onRemoveComponent={actions.removeComponent}
        />
      ) : (
        <ResponsiveGrid
          components={state.components}
          onComponentUpdate={actions.reorderComponents}
        />
      )}
    </div>
  );
};
```

### 3. Custom Animated Components

```tsx
import React from 'react';
import { AnimatedButton } from '@/components/ui/animated/AnimatedButton';
import { InteractiveBackground } from '@/components/ui/react-bits/InteractiveBackground';

const AnimatedPage: React.FC = () => {
  return (
    <InteractiveBackground variant="particles" intensity="medium">
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">Animated Components</h1>
        
        <div className="flex gap-4">
          <AnimatedButton animation="pulse" trigger="hover">
            Pulse Animation
          </AnimatedButton>
          
          <AnimatedButton animation="bounce" trigger="click" ripple>
            Bounce with Ripple
          </AnimatedButton>
          
          <AnimatedButton animation="glow" trigger="hover" intensity="strong">
            Glow Effect
          </AnimatedButton>
        </div>
      </div>
    </InteractiveBackground>
  );
};
```

## 🎨 Customization Guide

### 1. Custom Animation Presets

```tsx
// src/lib/animations/customAnimations.ts
import { AnimationConfig } from '@/types/animations';

export const customAnimationPresets = {
  slideInLeft: {
    duration: 400,
    easing: 'easeOutBack',
    translateX: [-100, 0],
    opacity: [0, 1],
  },
  
  fadeInUp: {
    duration: 600,
    easing: 'easeOutQuart',
    translateY: [30, 0],
    opacity: [0, 1],
  },
  
  scaleIn: {
    duration: 300,
    easing: 'easeOutBack',
    scale: [0.8, 1],
    opacity: [0, 1],
  },
};

// Usage in components
import { useAnimations } from '@/hooks/useAnimations';
import { customAnimationPresets } from '@/lib/animations/customAnimations';

const MyComponent = () => {
  const { createAnimation } = useAnimations();
  
  useEffect(() => {
    if (elementRef.current) {
      createAnimation('custom-entrance', elementRef.current, customAnimationPresets.slideInLeft);
    }
  }, []);
};
```

### 2. Custom Navigation Items

```tsx
// src/config/navigation.ts
import { NavigationItem } from '@/types/navigation';
import { ROLES } from '@/lib/types';

export const customNavigationItems: NavigationItem[] = [
  {
    id: 'custom-dashboard',
    label: 'Custom Dashboard',
    icon: CustomIcon,
    href: '/custom-dashboard',
    allowedRoles: [ROLES.ADMIN, ROLES.MANAGER],
  },
  {
    id: 'advanced-analytics',
    label: 'Advanced Analytics',
    icon: AnalyticsIcon,
    allowedRoles: [ROLES.ADMIN],
    children: [
      {
        id: 'predictive-analysis',
        label: 'Predictive Analysis',
        icon: PredictiveIcon,
        href: '/analytics/predictive',
        allowedRoles: [ROLES.ADMIN],
      },
    ],
  },
];
```

### 3. Custom Layout Templates

```tsx
// src/config/layoutTemplates.ts
import { LayoutComponent } from '@/types/layout';

export const customLayoutTemplates = {
  logistics: [
    {
      id: 'shipment-overview',
      type: 'widget' as const,
      position: { x: 0, y: 0, width: 2, height: 1 },
      props: { title: 'Shipment Overview' },
    },
    {
      id: 'route-map',
      type: 'chart' as const,
      position: { x: 2, y: 0, width: 2, height: 2 },
      props: { chartType: 'map' },
    },
    {
      id: 'delivery-schedule',
      type: 'table' as const,
      position: { x: 0, y: 1, width: 2, height: 2 },
      props: { dataSource: 'deliveries' },
    },
  ],
  
  warehouse: [
    {
      id: 'inventory-levels',
      type: 'widget' as const,
      position: { x: 0, y: 0, width: 3, height: 1 },
      props: { title: 'Inventory Levels' },
    },
    {
      id: 'stock-movement',
      type: 'chart' as const,
      position: { x: 0, y: 1, width: 3, height: 2 },
      props: { chartType: 'line' },
    },
  ],
};
```

## 🔧 Advanced Configuration

### 1. Custom Breakpoints

```tsx
// src/config/breakpoints.ts
import { ResponsiveBreakpoint } from '@/types/layout';

export const customBreakpoints: ResponsiveBreakpoint[] = [
  { name: 'xs', minWidth: 0, columns: 1, containerPadding: '12px' },
  { name: 'sm', minWidth: 576, columns: 2, containerPadding: '16px' },
  { name: 'md', minWidth: 768, columns: 3, containerPadding: '20px' },
  { name: 'lg', minWidth: 992, columns: 4, containerPadding: '24px' },
  { name: 'xl', minWidth: 1200, columns: 6, containerPadding: '32px' },
  { name: '2xl', minWidth: 1400, columns: 8, containerPadding: '40px' },
];

// Usage
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

const MyComponent = () => {
  const layout = useResponsiveLayout({
    breakpoints: customBreakpoints,
  });
};
```

### 2. Animation Performance Optimization

```tsx
// src/config/animations.ts
export const animationConfig = {
  // Reduce animations on low-end devices
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  
  // Performance settings
  performance: {
    enableGPUAcceleration: true,
    debounceResize: 150,
    throttleScroll: 16,
  },
  
  // Default easing functions
  easing: {
    smooth: 'easeOutQuart',
    bounce: 'easeOutBack',
    elastic: 'easeOutElastic',
  },
};
```

## 📱 Mobile Optimization

### 1. Touch Gestures

```tsx
// Enable swipe gestures for mobile navigation
<MobileNavigation
  config={{
    swipeGestures: true,
    swipeThreshold: 50,
    bottomNavigation: true,
    collapsibleSections: true,
  }}
/>
```

### 2. Responsive Grid Behavior

```tsx
// Automatic mobile layout adjustments
<ResponsiveGrid
  components={components}
  mobileConfig={{
    stackVertically: true,
    hideOnMobile: ['secondary-widgets'],
    mobileOrder: ['primary', 'charts', 'tables'],
  }}
/>
```

## 🎯 Performance Best Practices

### 1. Lazy Loading Components

```tsx
import { lazy, Suspense } from 'react';

const DragDropLayout = lazy(() => import('@/components/layout/grid/DragDropLayout'));

const LayoutEditor = () => (
  <Suspense fallback={<div>Loading layout editor...</div>}>
    <DragDropLayout {...props} />
  </Suspense>
);
```

### 2. Animation Cleanup

```tsx
import { useAnimations } from '@/hooks/useAnimations';

const MyComponent = () => {
  const { createAnimation, cleanup } = useAnimations({
    autoCleanup: true, // Automatically cleanup on unmount
  });

  useEffect(() => {
    return cleanup; // Manual cleanup if needed
  }, [cleanup]);
};
```

### 3. Memoization

```tsx
import { memo, useMemo } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(() => {
    return processLargeDataset(data);
  }, [data]);

  return <div>{/* Render processed data */}</div>;
});
```

## 🔍 Troubleshooting

### Common Issues and Solutions

1. **Animations not working**
   - Ensure anime.js is properly installed
   - Check for CSS conflicts with transform properties
   - Verify animation targets exist in DOM

2. **Drag-and-drop not functioning**
   - Confirm @hello-pangea/dnd is installed
   - Check for conflicting event handlers
   - Ensure proper DragDropContext wrapping

3. **Responsive layout issues**
   - Verify breakpoint configuration
   - Check CSS grid support
   - Test on actual devices, not just browser dev tools

4. **Performance problems**
   - Enable animation performance monitoring
   - Use React DevTools Profiler
   - Consider reducing animation complexity on mobile

## 📚 API Reference

### Core Hooks

- `useResponsiveLayout()` - Responsive layout management
- `useAnimations()` - Animation control and management
- `useLayout()` - Layout state and actions
- `useBreadcrumbs()` - Dynamic breadcrumb generation

### Key Components

- `ResponsiveNavbar` - Main navigation bar
- `CollapsibleSidebar` - Role-based sidebar navigation
- `ResponsiveGrid` - Adaptive grid layout system
- `DragDropLayout` - Interactive layout editor
- `InteractiveBackground` - Animated background effects
- `AnimatedButton` - Enhanced button with animations

This integration guide provides everything needed to implement the advanced navigation and layout system in your DaorsForge logistics dashboard.