import React, { useRef, useEffect, useState, useMemo } from 'react';
import { LayoutComponent } from '@/types/layout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useLayout } from '@/components/providers/LayoutProvider';
import { useAnimationContext } from '@/components/providers/AnimationProvider';
import { calculateGridColumns, calculateGridItemSize, optimizeGridLayout } from '@/lib/layout/gridSystem';
import { animateBreakpointTransition } from '@/lib/animations/layoutAnimations';

interface ResponsiveGridProps {
  components: LayoutComponent[];
  gap?: number;
  minItemWidth?: number;
  maxColumns?: number;
  onComponentUpdate?: (components: LayoutComponent[]) => void;
  className?: string;
  renderComponent?: (component: LayoutComponent) => React.ReactNode;
}

// Component renderers for different types
const ComponentRenderers: Record<string, React.FC<{ component: LayoutComponent }>> = {
  widget: ({ component }) => (
    <div className="bg-card border border-border rounded-lg p-4 h-full">
      <h3 className="text-sm font-semibold text-card-foreground mb-2">
        {component.title || 'Widget'}
      </h3>
      <div className="text-muted-foreground text-sm">
        Widget content goes here...
      </div>
    </div>
  ),
  chart: ({ component }) => (
    <div className="bg-card border border-border rounded-lg p-4 h-full">
      <h3 className="text-sm font-semibold text-card-foreground mb-2">
        {component.title || 'Chart'}
      </h3>
      <div className="flex items-center justify-center h-32 bg-accent/50 rounded border-2 border-dashed border-muted-foreground/20">
        <span className="text-muted-foreground text-sm">Chart Placeholder</span>
      </div>
    </div>
  ),
  table: ({ component }) => (
    <div className="bg-card border border-border rounded-lg p-4 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-card-foreground mb-2">
        {component.title || 'Table'}
      </h3>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2">Column 1</th>
              <th className="text-left p-2">Column 2</th>
              <th className="text-left p-2">Column 3</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }, (_, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="p-2">Data {i + 1}</td>
                <td className="p-2">Value {i + 1}</td>
                <td className="p-2">Status</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ),
  custom: ({ component }) => (
    <div className="bg-card border border-border rounded-lg p-4 h-full">
      <h3 className="text-sm font-semibold text-card-foreground mb-2">
        {component.title || 'Custom Component'}
      </h3>
      <div className="text-muted-foreground text-sm">
        Custom component content...
      </div>
    </div>
  ),
};

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  components,
  gap: propGap,
  minItemWidth = 200,
  maxColumns,
  onComponentUpdate,
  className = '',
  renderComponent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  const { currentBreakpoint, gap: breakpointGap } = useResponsiveLayout();
  const { animateEntrance, createScrollAnimation } = useAnimationContext();
  
  // Use gap from props or breakpoint
  const gap = propGap || breakpointGap;

  // Calculate grid properties
  const gridColumns = useMemo(() => {
    if (containerWidth === 0) return 1;
    return calculateGridColumns(containerWidth, minItemWidth, gap, maxColumns || currentBreakpoint.columns);
  }, [containerWidth, minItemWidth, gap, maxColumns, currentBreakpoint.columns]);

  const itemSize = useMemo(() => {
    if (containerWidth === 0) return { width: minItemWidth, height: 200 };
    return calculateGridItemSize(containerWidth, gridColumns, gap);
  }, [containerWidth, gridColumns, gap, minItemWidth]);

  // Optimize component layout
  const optimizedComponents = useMemo(() => {
    if (containerWidth === 0) return components;
    
    return optimizeGridLayout(components, containerWidth, {
      columns: gridColumns,
      gap,
      minItemWidth,
    });
  }, [components, containerWidth, gridColumns, gap, minItemWidth]);

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      const newWidth = entry.contentRect.width;
      
      if (newWidth !== containerWidth) {
        setContainerWidth(newWidth);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerWidth]);

  // Update parent component when optimized layout changes
  useEffect(() => {
    if (onComponentUpdate && optimizedComponents !== components) {
      onComponentUpdate(optimizedComponents);
    }
  }, [optimizedComponents, onComponentUpdate, components]);

  // Animate breakpoint transitions
  useEffect(() => {
    if (containerRef.current) {
      const gridItems = containerRef.current.querySelectorAll('.grid-item');
      if (gridItems.length > 0) {
        animateBreakpointTransition(Array.from(gridItems) as HTMLElement[]);
      }
    }
  }, [currentBreakpoint.name, animateBreakpointTransition]);

  // Set up scroll animations for new items
  useEffect(() => {
    if (containerRef.current) {
      const gridItems = containerRef.current.querySelectorAll('.grid-item:not(.animated)');
      if (gridItems.length > 0) {
        const cleanup = createScrollAnimation(Array.from(gridItems) as HTMLElement[], {
          threshold: 0.1,
          stagger: 50,
        });

        // Mark items as animated
        gridItems.forEach(item => item.classList.add('animated'));

        return cleanup;
      }
    }
  }, [optimizedComponents.length, createScrollAnimation]);

  const renderGridItem = (component: LayoutComponent, index: number) => {
    const Renderer = ComponentRenderers[component.type] || ComponentRenderers.custom;
    
    return (
      <div
        key={component.id}
        className={`grid-item relative transition-all duration-300 ${
          component.resizable ? 'resize-both overflow-auto' : ''
        }`}
        style={{
          width: component.width || itemSize.width,
          height: component.height || itemSize.height,
          minWidth: component.minWidth || minItemWidth,
          minHeight: component.minHeight || 150,
          maxWidth: component.maxWidth || 'none',
          maxHeight: component.maxHeight || 'none',
        }}
      >
        {renderComponent ? renderComponent(component) : <Renderer component={component} />}
        
        {/* Resize handle for resizable components */}
        {component.resizable && (
          <div className="
            absolute bottom-0 right-0 w-4 h-4 cursor-se-resize
            bg-gradient-to-tl from-muted-foreground/30 to-transparent
            opacity-0 group-hover:opacity-100 transition-opacity
          " />
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`
        responsive-grid w-full
        ${className}
      `}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
        gap: `${gap}px`,
        alignItems: 'start',
      }}
    >
      {optimizedComponents.map((component, index) => renderGridItem(component, index))}
      
      {/* Empty state */}
      {optimizedComponents.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
          <div className="text-muted-foreground text-sm mb-2">No components to display</div>
          <p className="text-xs text-muted-foreground max-w-sm">
            Add components to see them arranged in the responsive grid layout
          </p>
        </div>
      )}
    </div>
  );
};