// Layout-related types
export interface LayoutComponent {
  id: string;
  type: 'widget' | 'chart' | 'table' | 'custom';
  title?: string;
  width: number;
  height: number;
  x: number;
  y: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizable?: boolean;
  draggable?: boolean;
  config?: Record<string, any>;
  props?: Record<string, unknown>;
}

export interface LayoutTemplate {
  id: string;
  name: string;
  components: LayoutComponent[];
  breakpoints?: ResponsiveBreakpoint[];
}

export interface ResponsiveBreakpoint {
  name: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  minWidth: number;
  columns: number;
  containerPadding: string;
  gap?: number;
}

export interface GridItem {
  id: string;
  component: React.ComponentType<unknown>;
  props?: Record<string, unknown>;
  gridArea?: string;
}

export interface DragDropConfig {
  enableGridSnapping?: boolean;
  showDropZones?: boolean;
  animationDuration?: number;
}

export interface LayoutState {
  components: LayoutComponent[];
  breakpoints: ResponsiveBreakpoint[];
  currentBreakpoint: ResponsiveBreakpoint;
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  layoutMode: 'grid' | 'list' | 'masonry';
  isDragging: boolean;
}

export interface LayoutActions {
  addComponent: (component: Omit<LayoutComponent, 'id'>) => void;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<LayoutComponent>) => void;
  moveComponent: (id: string, position: { x: number; y: number }) => void;
  resizeComponent: (id: string, size: { width: number; height: number }) => void;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  setLayoutMode: (mode: 'grid' | 'list' | 'masonry') => void;
  loadLayout: (layout: { components: LayoutComponent[] }) => void;
  resetLayout: () => void;
}

export interface GridSystemConfig {
  columns: number;
  gap: number;
  minItemWidth: number;
  maxColumns?: number;
  breakpoints?: ResponsiveBreakpoint[];
}

export interface DragDropState {
  isDragging: boolean;
  draggedItem: LayoutComponent | null;
  dropTarget: string | null;
  previewPosition: { x: number; y: number } | null;
}
