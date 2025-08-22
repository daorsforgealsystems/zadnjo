import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ComponentConfig } from '@/lib/api/preferences-api';
import { cn } from '@/lib/utils';

interface DynamicGridSystemProps {
  components: ComponentConfig[];
  renderComponent: (component: ComponentConfig) => React.ReactNode;
  gridGap: number;
  animationsEnabled: boolean;
  breakpoints: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  customizing: boolean;
  onComponentsChange: (components: ComponentConfig[]) => void;
}

export const DynamicGridSystem: React.FC<DynamicGridSystemProps> = ({
  components,
  renderComponent,
  gridGap,
  animationsEnabled,
  breakpoints,
  customizing,
  onComponentsChange
}) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((id: string) => {
    setDraggingId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  const handleResizeStart = useCallback((id: string) => {
    setResizingId(id);
  }, []);

  const handleResizeEnd = useCallback(() => {
    setResizingId(null);
  }, []);

  const handlePositionChange = useCallback((id: string, newPosition: { x: number; y: number; w: number; h: number }) => {
    const updatedComponents = components.map(comp => 
      comp.id === id ? { ...comp, position: newPosition } : comp
    );
    onComponentsChange(updatedComponents);
  }, [components, onComponentsChange]);

  const calculateGridColumns = useCallback(() => {
    return 12; // Default 12-column grid
  }, []);

  const getComponentStyle = useCallback((component: ComponentConfig) => {
    const { position } = component;
    return {
      gridColumn: `${position.x + 1} / span ${position.w}`,
      gridRow: `${position.y + 1} / span ${position.h}`,
    };
  }, []);

  const MotionDiv = animationsEnabled ? motion.div : 'div';

  return (
    <div 
      ref={containerRef}
      className="p-6 h-full overflow-auto relative"
      style={{ gap: `${gridGap}px` }}
    >
      <div 
        className="grid w-full"
        style={{ 
          gridTemplateColumns: `repeat(${calculateGridColumns()}, minmax(0, 1fr))`,
          gap: `${gridGap}px`,
          gridAutoRows: 'minmax(100px, auto)'
        }}
      >
        {components.map((component) => (
          <MotionDiv
            key={component.id}
            className={cn(
              'relative transition-all duration-200',
              !component.visible && 'hidden',
              draggingId === component.id && 'z-50 opacity-75',
              resizingId === component.id && 'z-50',
              customizing && 'cursor-move hover:shadow-lg'
            )}
            style={getComponentStyle(component)}
            {...(animationsEnabled ? {
              initial: { opacity: 0, scale: 0.9 },
              animate: { opacity: 1, scale: 1 },
              exit: { opacity: 0, scale: 0.9 },
              transition: { duration: 0.2 }
            } : {})}
            draggable={customizing}
            onDragStart={() => customizing && handleDragStart(component.id)}
            onDragEnd={() => customizing && handleDragEnd()}
          >
            {renderComponent(component)}
            
            {/* Resize handles (only shown in customization mode) */}
            {customizing && component.resizable && (
              <>
                { }
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Resize"
                  className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-primary/50 rounded-tl"
                  onMouseDown={() => handleResizeStart(component.id)}
                  onMouseUp={handleResizeEnd}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleResizeStart(component.id)}
                />
                { }
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Resize"
                  className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize bg-primary/30"
                  onMouseDown={() => handleResizeStart(component.id)}
                  onMouseUp={handleResizeEnd}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleResizeStart(component.id)}
                />
                { }
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Resize"
                  className="absolute top-0 bottom-0 right-0 w-2 cursor-e-resize bg-primary/30"
                  onMouseDown={() => handleResizeStart(component.id)}
                  onMouseUp={handleResizeEnd}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleResizeStart(component.id)}
                />
              </>
            )}
          </MotionDiv>
        ))}
      </div>
      
      {/* Grid overlay (only shown in customization mode) */}
      {customizing && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)`,
            backgroundSize: `calc((100% - ${gridGap * (calculateGridColumns() - 1)}px) / ${calculateGridColumns()} + ${gridGap}px) 100px`,
            top: '24px',
            left: '24px',
            right: '24px',
            bottom: '24px'
          }}
        />
      )}
    </div>
  );
};