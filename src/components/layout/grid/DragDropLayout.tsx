// Drag-and-drop layout system with anime.js animations
import React, { useRef, useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Plus, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAnimations } from '@/hooks/useAnimations';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import {
  animateComponentDrag,
  animateDragDropPlaceholder,
  animateGridReorder,
} from '@/lib/animations/layoutAnimations';
import { cn } from '@/lib/utils';
import { LayoutComponent } from '@/types/layout';

interface DragDropLayoutProps {
  components: LayoutComponent[];
  onComponentsChange: (components: LayoutComponent[]) => void;
  onAddComponent?: () => void;
  onRemoveComponent?: (componentId: string) => void;
  onEditComponent?: (component: LayoutComponent) => void;
  className?: string;
  disabled?: boolean;
}

export const DragDropLayout: React.FC<DragDropLayoutProps> = ({
  components,
  onComponentsChange,
  onAddComponent,
  onRemoveComponent,
  onEditComponent,
  className,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { createAnimation } = useAnimations();
  const { currentBreakpoint, getCurrentBreakpointInfo } = useResponsiveLayout();

  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dropPlaceholder, setDropPlaceholder] = useState<{
    index: number;
    height: number;
  } | null>(null);

  const breakpointInfo = getCurrentBreakpointInfo();

  // Handle drag start
  const handleDragStart = useCallback((start: any) => {
    setDraggedItem(start.draggableId);
    
    // Animate the dragged item
    const draggedElement = document.querySelector(`[data-rbd-draggable-id="${start.draggableId}"]`);
    if (draggedElement) {
      animateComponentDrag(draggedElement as HTMLElement, true);
    }
  }, []);

  // Handle drag update
  const handleDragUpdate = useCallback((update: any) => {
    if (!update.destination) {
      setDropPlaceholder(null);
      return;
    }

    const draggedElement = document.querySelector(`[data-rbd-draggable-id="${update.draggableId}"]`);
    if (draggedElement) {
      const rect = draggedElement.getBoundingClientRect();
      setDropPlaceholder({
        index: update.destination.index,
        height: rect.height,
      });
    }
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((result: DropResult) => {
    setDraggedItem(null);
    setDropPlaceholder(null);

    // Animate the dragged item back to normal
    const draggedElement = document.querySelector(`[data-rbd-draggable-id="${result.draggableId}"]`);
    if (draggedElement) {
      animateComponentDrag(draggedElement as HTMLElement, false);
    }

    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) {
      return;
    }

    // Reorder components
    const newComponents = Array.from(components);
    const [reorderedItem] = newComponents.splice(sourceIndex, 1);
    newComponents.splice(destinationIndex, 0, reorderedItem);

    // Update positions based on new order
    const updatedComponents = newComponents.map((component, index) => ({
      ...component,
      position: {
        ...component.position,
        y: Math.floor(index / breakpointInfo.columns),
        x: index % breakpointInfo.columns,
      },
    }));

    onComponentsChange(updatedComponents);

    // Animate the reorder
    if (containerRef.current) {
      const items = containerRef.current.querySelectorAll('[data-component-item]');
      const newPositions = updatedComponents.map((_, index) => ({
        x: (index % breakpointInfo.columns) * 280,
        y: Math.floor(index / breakpointInfo.columns) * 200,
      }));
      
      animateGridReorder(Array.from(items) as HTMLElement[], newPositions);
    }
  }, [components, onComponentsChange, breakpointInfo.columns]);

  // Render component content
  const renderComponentContent = (component: LayoutComponent) => {
    const commonProps = {
      className: "h-full w-full",
      ...component.props,
    };

    switch (component.type) {
      case 'widget':
        return (
          <div className="space-y-3">
            <div className="h-16 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
              <span className="text-sm font-medium text-primary">Widget</span>
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-muted rounded w-3/4"></div>
              <div className="h-2 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        );

      case 'chart':
        return (
          <div className="space-y-3">
            <div className="h-20 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Chart</span>
            </div>
            <div className="flex justify-between">
              <div className="h-2 bg-muted rounded w-1/4"></div>
              <div className="h-2 bg-muted rounded w-1/4"></div>
              <div className="h-2 bg-muted rounded w-1/4"></div>
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded flex items-center px-2">
              <span className="text-xs font-medium">Table Header</span>
            </div>
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-4 bg-muted/50 rounded"></div>
            ))}
          </div>
        );

      case 'form':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-1/3"></div>
              <div className="h-8 bg-muted/50 rounded border-2 border-dashed border-muted"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-1/2"></div>
              <div className="h-8 bg-muted/50 rounded border-2 border-dashed border-muted"></div>
            </div>
            <div className="h-8 bg-primary/20 rounded flex items-center justify-center">
              <span className="text-xs font-medium text-primary">Submit</span>
            </div>
          </div>
        );

      default:
        return (
          <div className="h-full flex items-center justify-center bg-muted/30 rounded-lg">
            <span className="text-sm text-muted-foreground">
              {component.type} Component
            </span>
          </div>
        );
    }
  };

  return (
    <div className={cn('drag-drop-layout', className)} ref={containerRef}>
      <DragDropContext
        onDragStart={handleDragStart}
        onDragUpdate={handleDragUpdate}
        onDragEnd={handleDragEnd}
      >
        <Droppable droppableId="layout-components" direction="vertical">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                'grid gap-4 transition-all duration-300',
                `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${breakpointInfo.columns}`,
                snapshot.isDraggingOver && 'bg-muted/20 rounded-lg p-2'
              )}
            >
              {components.map((component, index) => (
                <Draggable
                  key={component.id}
                  draggableId={component.id}
                  index={index}
                  isDragDisabled={disabled}
                >
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={cn(
                        'transition-all duration-200 hover:shadow-md',
                        snapshot.isDragging && 'shadow-lg rotate-2 scale-105',
                        draggedItem === component.id && 'opacity-50'
                      )}
                      data-component-item
                      data-component-id={component.id}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium capitalize">
                            {component.type}
                          </CardTitle>
                          <div className="flex items-center gap-1">
                            {onEditComponent && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                  >
                                    <Settings className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Component</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <p>Component configuration options would go here.</p>
                                    <Button
                                      onClick={() => onEditComponent(component)}
                                      className="w-full"
                                    >
                                      Save Changes
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                            {onRemoveComponent && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={() => onRemoveComponent(component.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                            >
                              <GripVertical className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {renderComponentContent(component)}
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              
              {/* Drop placeholder */}
              {dropPlaceholder && (
                <div
                  className="bg-primary/10 border-2 border-dashed border-primary rounded-lg transition-all duration-200"
                  style={{ height: dropPlaceholder.height }}
                />
              )}
              
              {provided.placeholder}
              
              {/* Add component button */}
              {onAddComponent && (
                <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent
                    className="flex items-center justify-center h-32"
                    onClick={onAddComponent}
                  >
                    <div className="text-center space-y-2">
                      <Plus className="h-8 w-8 mx-auto text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Add Component</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

// Component type selector
export const ComponentTypeSelector: React.FC<{
  onSelect: (type: LayoutComponent['type']) => void;
  className?: string;
}> = ({ onSelect, className }) => {
  const componentTypes: Array<{
    type: LayoutComponent['type'];
    label: string;
    description: string;
    icon: string;
  }> = [
    {
      type: 'widget',
      label: 'Widget',
      description: 'Display key metrics and KPIs',
      icon: '📊',
    },
    {
      type: 'chart',
      label: 'Chart',
      description: 'Visualize data with charts',
      icon: '📈',
    },
    {
      type: 'table',
      label: 'Table',
      description: 'Display tabular data',
      icon: '📋',
    },
    {
      type: 'form',
      label: 'Form',
      description: 'Input and data collection',
      icon: '📝',
    },
  ];

  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      {componentTypes.map((componentType) => (
        <Card
          key={componentType.type}
          className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
          onClick={() => onSelect(componentType.type)}
        >
          <CardContent className="p-4 text-center space-y-2">
            <div className="text-2xl">{componentType.icon}</div>
            <h3 className="font-medium">{componentType.label}</h3>
            <p className="text-xs text-muted-foreground">
              {componentType.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};