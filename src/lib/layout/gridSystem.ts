import { LayoutComponent, ResponsiveBreakpoint, GridSystemConfig } from '@/types/layout';

export const calculateGridColumns = (
  containerWidth: number,
  minItemWidth: number,
  gap: number = 24,
  maxColumns?: number
): number => {
  const availableWidth = containerWidth - gap;
  const itemWithGap = minItemWidth + gap;
  const calculatedColumns = Math.floor(availableWidth / itemWithGap);
  
  if (maxColumns) {
    return Math.min(calculatedColumns, maxColumns);
  }
  
  return Math.max(calculatedColumns, 1);
};

export const calculateGridItemSize = (
  containerWidth: number,
  columns: number,
  gap: number = 24
): { width: number; height: number } => {
  const totalGap = gap * (columns - 1);
  const availableWidth = containerWidth - totalGap;
  const itemWidth = Math.floor(availableWidth / columns);
  
  return {
    width: itemWidth,
    height: itemWidth, // Default to square items
  };
};

export const getGridPosition = (
  index: number,
  columns: number,
  itemWidth: number,
  itemHeight: number,
  gap: number = 24
): { x: number; y: number } => {
  const col = index % columns;
  const row = Math.floor(index / columns);
  
  return {
    x: col * (itemWidth + gap),
    y: row * (itemHeight + gap),
  };
};

export const optimizeGridLayout = (
  components: LayoutComponent[],
  containerWidth: number,
  config: GridSystemConfig
): LayoutComponent[] => {
  const { columns, gap, minItemWidth } = config;
  const actualColumns = calculateGridColumns(containerWidth, minItemWidth, gap, columns);
  const itemSize = calculateGridItemSize(containerWidth, actualColumns, gap);
  
  return components.map((component, index) => {
    const position = getGridPosition(index, actualColumns, itemSize.width, itemSize.height, gap);
    
    return {
      ...component,
      x: position.x,
      y: position.y,
      width: Math.max(component.width || itemSize.width, component.minWidth || 0),
      height: Math.max(component.height || itemSize.height, component.minHeight || 0),
    };
  });
};

export const validateGridBounds = (
  component: LayoutComponent,
  containerWidth: number,
  containerHeight: number
): LayoutComponent => {
  const maxX = containerWidth - component.width;
  const maxY = containerHeight - component.height;
  
  return {
    ...component,
    x: Math.max(0, Math.min(component.x, maxX)),
    y: Math.max(0, Math.min(component.y, maxY)),
  };
};

export const snapToGrid = (
  position: { x: number; y: number },
  gridSize: number = 24
): { x: number; y: number } => {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
};

export const checkCollision = (
  component1: LayoutComponent,
  component2: LayoutComponent
): boolean => {
  const right1 = component1.x + component1.width;
  const bottom1 = component1.y + component1.height;
  const right2 = component2.x + component2.width;
  const bottom2 = component2.y + component2.height;
  
  return !(
    right1 <= component2.x ||
    component1.x >= right2 ||
    bottom1 <= component2.y ||
    component1.y >= bottom2
  );
};

export const resolveCollisions = (
  components: LayoutComponent[]
): LayoutComponent[] => {
  const resolved: LayoutComponent[] = [];
  
  components.forEach(component => {
    let resolvedComponent = { ...component };
    let hasCollision = true;
    let attempts = 0;
    const maxAttempts = 100;
    
    while (hasCollision && attempts < maxAttempts) {
      hasCollision = resolved.some(existing => 
        checkCollision(resolvedComponent, existing)
      );
      
      if (hasCollision) {
        resolvedComponent.y += 24; // Move down by grid unit
      }
      
      attempts++;
    }
    
    resolved.push(resolvedComponent);
  });
  
  return resolved;
};