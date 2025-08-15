import { LayoutComponent, LayoutTemplate } from '@/types/layout';
import { v4 as uuidv4 } from 'uuid';

export const generateComponentId = (): string => {
  return `component_${uuidv4()}`;
};

export const createLayoutComponent = (
  type: LayoutComponent['type'],
  overrides?: Partial<LayoutComponent>
): LayoutComponent => {
  const defaultComponent: LayoutComponent = {
    id: generateComponentId(),
    type,
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Component`,
    width: 300,
    height: 200,
    x: 0,
    y: 0,
    minWidth: 200,
    minHeight: 150,
    resizable: true,
    draggable: true,
    config: {},
  };

  return {
    ...defaultComponent,
    ...overrides,
  };
};

export const duplicateComponent = (component: LayoutComponent): LayoutComponent => {
  return {
    ...component,
    id: generateComponentId(),
    title: `${component.title} (Copy)`,
    x: component.x + 20,
    y: component.y + 20,
  };
};

export const layoutTemplates: Record<string, () => LayoutComponent[]> = {
  dashboard: () => [
    createLayoutComponent('chart', { 
      title: 'Revenue Overview', 
      width: 600, 
      height: 300,
      x: 0, 
      y: 0 
    }),
    createLayoutComponent('widget', { 
      title: 'Total Orders', 
      width: 300, 
      height: 150,
      x: 620, 
      y: 0 
    }),
    createLayoutComponent('widget', { 
      title: 'Active Shipments', 
      width: 300, 
      height: 150,
      x: 620, 
      y: 170 
    }),
    createLayoutComponent('table', { 
      title: 'Recent Activity', 
      width: 920, 
      height: 400,
      x: 0, 
      y: 320 
    }),
  ],
  
  analytics: () => [
    createLayoutComponent('chart', { 
      title: 'Performance Metrics', 
      width: 460, 
      height: 300,
      x: 0, 
      y: 0 
    }),
    createLayoutComponent('chart', { 
      title: 'Traffic Analysis', 
      width: 460, 
      height: 300,
      x: 480, 
      y: 0 
    }),
    createLayoutComponent('widget', { 
      title: 'Conversion Rate', 
      width: 300, 
      height: 200,
      x: 0, 
      y: 320 
    }),
    createLayoutComponent('widget', { 
      title: 'Bounce Rate', 
      width: 300, 
      height: 200,
      x: 320, 
      y: 320 
    }),
    createLayoutComponent('widget', { 
      title: 'Page Views', 
      width: 300, 
      height: 200,
      x: 640, 
      y: 320 
    }),
  ],

  monitoring: () => [
    createLayoutComponent('widget', { 
      title: 'System Status', 
      width: 240, 
      height: 120,
      x: 0, 
      y: 0 
    }),
    createLayoutComponent('widget', { 
      title: 'CPU Usage', 
      width: 240, 
      height: 120,
      x: 260, 
      y: 0 
    }),
    createLayoutComponent('widget', { 
      title: 'Memory Usage', 
      width: 240, 
      height: 120,
      x: 520, 
      y: 0 
    }),
    createLayoutComponent('widget', { 
      title: 'Network I/O', 
      width: 240, 
      height: 120,
      x: 780, 
      y: 0 
    }),
    createLayoutComponent('chart', { 
      title: 'Response Time', 
      width: 500, 
      height: 250,
      x: 0, 
      y: 140 
    }),
    createLayoutComponent('chart', { 
      title: 'Error Rate', 
      width: 500, 
      height: 250,
      x: 520, 
      y: 140 
    }),
  ],
};

export const generateTemplate = (templateName: string): LayoutComponent[] => {
  const generator = layoutTemplates[templateName];
  if (!generator) {
    throw new Error(`Template "${templateName}" not found`);
  }
  return generator();
};

export const saveLayoutAsTemplate = (
  name: string,
  components: LayoutComponent[]
): LayoutTemplate => {
  return {
    id: uuidv4(),
    name,
    components: components.map(component => ({
      ...component,
      id: generateComponentId(), // Generate new IDs for template
    })),
  };
};

export const exportLayout = (components: LayoutComponent[]): string => {
  return JSON.stringify({
    version: '1.0',
    timestamp: new Date().toISOString(),
    components,
  }, null, 2);
};

export const importLayout = (layoutData: string): LayoutComponent[] => {
  try {
    const parsed = JSON.parse(layoutData);
    if (!parsed.components || !Array.isArray(parsed.components)) {
      throw new Error('Invalid layout data format');
    }
    
    return parsed.components.map((component: any) => ({
      ...component,
      id: generateComponentId(), // Generate new IDs on import
    }));
  } catch (error) {
    throw new Error('Failed to parse layout data: ' + (error as Error).message);
  }
};

export const calculateLayoutBounds = (components: LayoutComponent[]): {
  width: number;
  height: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} => {
  if (components.length === 0) {
    return { width: 0, height: 0, minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  const minX = Math.min(...components.map(c => c.x));
  const minY = Math.min(...components.map(c => c.y));
  const maxX = Math.max(...components.map(c => c.x + c.width));
  const maxY = Math.max(...components.map(c => c.y + c.height));

  return {
    width: maxX - minX,
    height: maxY - minY,
    minX,
    minY,
    maxX,
    maxY,
  };
};