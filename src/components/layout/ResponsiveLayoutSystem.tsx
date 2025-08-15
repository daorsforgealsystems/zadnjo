import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ComponentConfig } from '@/lib/api/preferences-api';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutSystemProps {
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

export const ResponsiveLayoutSystem: React.FC<ResponsiveLayoutSystemProps> = ({
  components,
  renderComponent,
  gridGap,
  animationsEnabled,
  breakpoints,
  customizing,
  onComponentsChange
}) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDragStart = useCallback((id: string) => {
    setDraggingId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  const handlePositionChange = useCallback((id: string, newPosition: { x: number; y: number; w: number; h: number }) => {
    const updatedComponents = components.map(comp => 
      comp.id === id ? { ...comp, position: newPosition } : comp
    );
    onComponentsChange(updatedComponents);
  }, [components, onComponentsChange]);

  const calculateGridTemplateColumns = useCallback(() => {
    return `repeat(12, minmax(0, 1fr))`;
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
      className="p-6 h-full overflow-auto"
      style={{ gap: `${gridGap}px` }}
    >
      <div 
        className="grid w-full"
        style={{ 
          gridTemplateColumns: calculateGridTemplateColumns(),
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
          </MotionDiv>
        ))}
      </div>
    </div>
  );
};