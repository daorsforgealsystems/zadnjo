import { useState, useCallback, useRef, useEffect } from 'react';
import { LayoutComponent, DragDropState } from '@/types/layout';
import { snapToGrid, validateGridBounds } from '@/lib/layout/gridSystem';
import { animateDragStart, animateDragEnd, animateDropPreview } from '@/lib/animations/layoutAnimations';

interface UseDragDropOptions {
  snapToGrid?: boolean;
  gridSize?: number;
  containerRef?: React.RefObject<HTMLElement>;
  onDragStart?: (component: LayoutComponent) => void;
  onDragEnd?: (component: LayoutComponent, newPosition: { x: number; y: number }) => void;
  onDrop?: (component: LayoutComponent, dropTarget?: string) => void;
}

export const useDragDrop = (options: UseDragDropOptions = {}) => {
  const {
    snapToGrid: enableSnapping = true,
    gridSize = 24,
    containerRef,
    onDragStart,
    onDragEnd,
    onDrop,
  } = options;

  const [dragState, setDragState] = useState<DragDropState>({
    isDragging: false,
    draggedItem: null,
    dropTarget: null,
    previewPosition: null,
  });

  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef<{ x: number; y: number } | null>(null);
  const activeElement = useRef<HTMLElement | null>(null);

  // Handle drag start
  const handleDragStart = useCallback((
    event: React.DragEvent | React.MouseEvent,
    component: LayoutComponent,
    element: HTMLElement
  ) => {
    event.preventDefault?.();
    
    const clientX = 'clientX' in event ? event.clientX : (event as any).touches[0]?.clientX || 0;
    const clientY = 'clientY' in event ? event.clientY : (event as any).touches[0]?.clientY || 0;
    
    const rect = element.getBoundingClientRect();
    const containerRect = containerRef?.current?.getBoundingClientRect();
    
    if (!containerRect) return;

    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;
    
    dragStartPos.current = { x: clientX, y: clientY };
    dragOffset.current = { offsetX, offsetY };
    activeElement.current = element;

    setDragState({
      isDragging: true,
      draggedItem: component,
      dropTarget: null,
      previewPosition: null,
    });

    // Animate drag start
    animateDragStart(element);
    
    onDragStart?.(component);

    // Add global mouse/touch listeners
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchmove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);
  }, [containerRef, onDragStart]);

  // Handle drag move
  const handleDragMove = useCallback((event: MouseEvent | TouchEvent) => {
    if (!dragState.isDragging || !dragStartPos.current || !dragOffset.current || !activeElement.current) {
      return;
    }

    event.preventDefault();
    
    const clientX = 'clientX' in event ? event.clientX : (event as any).touches[0]?.clientX || 0;
    const clientY = 'clientY' in event ? event.clientY : (event as any).touches[0]?.clientY || 0;

    const containerRect = containerRef?.current?.getBoundingClientRect();
    if (!containerRect) return;

    // Calculate new position relative to container
    let newX = clientX - containerRect.left - dragOffset.current.offsetX;
    let newY = clientY - containerRect.top - dragOffset.current.offsetY;

    // Snap to grid if enabled
    if (enableSnapping) {
      const snapped = snapToGrid({ x: newX, y: newY }, gridSize);
      newX = snapped.x;
      newY = snapped.y;
    }

    // Validate bounds
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    const elementRect = activeElement.current.getBoundingClientRect();
    
    newX = Math.max(0, Math.min(newX, containerWidth - elementRect.width));
    newY = Math.max(0, Math.min(newY, containerHeight - elementRect.height));

    setDragState(prev => ({
      ...prev,
      previewPosition: { x: newX, y: newY },
    }));

    // Update element position
    animateDropPreview(activeElement.current, { x: newX, y: newY });
  }, [dragState.isDragging, enableSnapping, gridSize, containerRef]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!dragState.isDragging || !dragState.draggedItem || !activeElement.current) {
      return;
    }

    const finalPosition = dragState.previewPosition || { x: dragState.draggedItem.x, y: dragState.draggedItem.y };
    
    // Animate drag end
    animateDragEnd(activeElement.current);

    onDragEnd?.(dragState.draggedItem, finalPosition);
    onDrop?.(dragState.draggedItem, dragState.dropTarget || undefined);

    // Clean up
    setDragState({
      isDragging: false,
      draggedItem: null,
      dropTarget: null,
      previewPosition: null,
    });

    dragStartPos.current = null;
    dragOffset.current = null;
    activeElement.current = null;

    // Remove global listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchend', handleDragEnd);
  }, [dragState, onDragEnd, onDrop, handleDragMove]);

  // Handle drop zone enter
  const handleDropZoneEnter = useCallback((dropTarget: string) => {
    if (dragState.isDragging) {
      setDragState(prev => ({
        ...prev,
        dropTarget,
      }));
    }
  }, [dragState.isDragging]);

  // Handle drop zone leave
  const handleDropZoneLeave = useCallback(() => {
    if (dragState.isDragging) {
      setDragState(prev => ({
        ...prev,
        dropTarget: null,
      }));
    }
  }, [dragState.isDragging]);

  // Create draggable props
  const getDraggableProps = useCallback((component: LayoutComponent) => ({
    draggable: true,
    onMouseDown: (event: React.MouseEvent<HTMLElement>) => {
      handleDragStart(event, component, event.currentTarget);
    },
    onTouchStart: (event: React.TouchEvent<HTMLElement>) => {
      handleDragStart(event as any, component, event.currentTarget);
    },
    onDragStart: (event: React.DragEvent) => {
      event.preventDefault(); // Prevent default HTML5 drag
    },
    style: {
      cursor: dragState.isDragging ? 'grabbing' : 'grab',
      userSelect: 'none' as const,
      touchAction: 'none' as const,
    },
  }), [dragState.isDragging, handleDragStart]);

  // Create drop zone props
  const getDropZoneProps = useCallback((dropTarget: string) => ({
    onMouseEnter: () => handleDropZoneEnter(dropTarget),
    onMouseLeave: handleDropZoneLeave,
    'data-drop-target': dropTarget,
    className: `drop-zone ${dragState.dropTarget === dropTarget ? 'drop-zone-active' : ''}`,
  }), [dragState.dropTarget, handleDropZoneEnter, handleDropZoneLeave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchend', handleDragEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  return {
    dragState,
    getDraggableProps,
    getDropZoneProps,
    handleDragStart,
    handleDragEnd,
    handleDropZoneEnter,
    handleDropZoneLeave,
  };
};