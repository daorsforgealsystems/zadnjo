import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { LayoutState, LayoutActions, LayoutComponent, ResponsiveBreakpoint } from '@/types/layout';
import { defaultBreakpoints, getCurrentBreakpoint } from '@/lib/layout/breakpoints';
import { generateComponentId } from '@/lib/layout/layoutUtils';
import { optimizeGridLayout, resolveCollisions } from '@/lib/layout/gridSystem';

interface LayoutContextType {
  state: LayoutState;
  actions: LayoutActions;
}

// Initial state
const initialState: LayoutState = {
  components: [],
  breakpoints: defaultBreakpoints,
  currentBreakpoint: defaultBreakpoints[0],
  sidebarOpen: true,
  mobileMenuOpen: false,
  layoutMode: 'grid',
  isDragging: false,
};

// Action types
type LayoutAction =
  | { type: 'ADD_COMPONENT'; payload: Omit<LayoutComponent, 'id'> }
  | { type: 'REMOVE_COMPONENT'; payload: string }
  | { type: 'UPDATE_COMPONENT'; payload: { id: string; updates: Partial<LayoutComponent> } }
  | { type: 'MOVE_COMPONENT'; payload: { id: string; position: { x: number; y: number } } }
  | { type: 'RESIZE_COMPONENT'; payload: { id: string; size: { width: number; height: number } } }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_MOBILE_MENU' }
  | { type: 'SET_LAYOUT_MODE'; payload: 'grid' | 'list' | 'masonry' }
  | { type: 'LOAD_LAYOUT'; payload: { components: LayoutComponent[] } }
  | { type: 'RESET_LAYOUT' }
  | { type: 'SET_CURRENT_BREAKPOINT'; payload: ResponsiveBreakpoint }
  | { type: 'SET_DRAGGING'; payload: boolean }
  | { type: 'OPTIMIZE_LAYOUT'; payload: { containerWidth: number } };

// Reducer
const layoutReducer = (state: LayoutState, action: LayoutAction): LayoutState => {
  switch (action.type) {
    case 'ADD_COMPONENT': {
      const newComponent: LayoutComponent = {
        ...action.payload,
        id: generateComponentId(),
      };
      
      // Resolve collisions with existing components
      const componentsWithNew = [...state.components, newComponent];
      const resolvedComponents = resolveCollisions(componentsWithNew);
      
      return {
        ...state,
        components: resolvedComponents,
      };
    }

    case 'REMOVE_COMPONENT': {
      return {
        ...state,
        components: state.components.filter(component => component.id !== action.payload),
      };
    }

    case 'UPDATE_COMPONENT': {
      return {
        ...state,
        components: state.components.map(component =>
          component.id === action.payload.id
            ? { ...component, ...action.payload.updates }
            : component
        ),
      };
    }

    case 'MOVE_COMPONENT': {
      return {
        ...state,
        components: state.components.map(component =>
          component.id === action.payload.id
            ? { ...component, ...action.payload.position }
            : component
        ),
      };
    }

    case 'RESIZE_COMPONENT': {
      return {
        ...state,
        components: state.components.map(component =>
          component.id === action.payload.id
            ? { ...component, ...action.payload.size }
            : component
        ),
      };
    }

    case 'TOGGLE_SIDEBAR': {
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen,
      };
    }

    case 'TOGGLE_MOBILE_MENU': {
      return {
        ...state,
        mobileMenuOpen: !state.mobileMenuOpen,
      };
    }

    case 'SET_LAYOUT_MODE': {
      return {
        ...state,
        layoutMode: action.payload,
      };
    }

    case 'LOAD_LAYOUT': {
      return {
        ...state,
        components: action.payload.components,
      };
    }

    case 'RESET_LAYOUT': {
      return {
        ...state,
        components: [],
      };
    }

    case 'SET_CURRENT_BREAKPOINT': {
      return {
        ...state,
        currentBreakpoint: action.payload,
      };
    }

    case 'SET_DRAGGING': {
      return {
        ...state,
        isDragging: action.payload,
      };
    }

    case 'OPTIMIZE_LAYOUT': {
      const optimizedComponents = optimizeGridLayout(
        state.components,
        action.payload.containerWidth,
        {
          columns: state.currentBreakpoint.columns,
          gap: state.currentBreakpoint.gap || 24,
          minItemWidth: 200,
        }
      );
      
      return {
        ...state,
        components: optimizedComponents,
      };
    }

    default:
      return state;
  }
};

// Context
const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

// Provider component
interface LayoutProviderProps {
  children: React.ReactNode;
  initialLayout?: Partial<LayoutState>;
  persistState?: boolean;
  storageKey?: string;
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({
  children,
  initialLayout,
  persistState = true,
  storageKey = 'layout-state',
}) => {
  // Load initial state from localStorage if persistence is enabled
  const getInitialState = (): LayoutState => {
    if (persistState && typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem(storageKey);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          return {
            ...initialState,
            ...initialLayout,
            ...parsed,
            // Always use current breakpoint from window size
            currentBreakpoint: getCurrentBreakpoint(window.innerWidth),
          };
        }
      } catch (error) {
        console.warn('Failed to load layout state from localStorage:', error);
      }
    }

    return {
      ...initialState,
      ...initialLayout,
      currentBreakpoint: typeof window !== 'undefined' 
        ? getCurrentBreakpoint(window.innerWidth)
        : initialState.currentBreakpoint,
    };
  };

  const [state, dispatch] = useReducer(layoutReducer, getInitialState());

  // Persist state to localStorage
  useEffect(() => {
    if (persistState && typeof window !== 'undefined') {
      try {
        const stateToSave = {
          components: state.components,
          sidebarOpen: state.sidebarOpen,
          layoutMode: state.layoutMode,
        };
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      } catch (error) {
        console.warn('Failed to save layout state to localStorage:', error);
      }
    }
  }, [state.components, state.sidebarOpen, state.layoutMode, persistState, storageKey]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newBreakpoint = getCurrentBreakpoint(window.innerWidth);
      if (newBreakpoint.name !== state.currentBreakpoint.name) {
        dispatch({ type: 'SET_CURRENT_BREAKPOINT', payload: newBreakpoint });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [state.currentBreakpoint.name]);

  // Actions
  const actions: LayoutActions = {
    addComponent: useCallback((component: Omit<LayoutComponent, 'id'>) => {
      dispatch({ type: 'ADD_COMPONENT', payload: component });
    }, []),

    removeComponent: useCallback((id: string) => {
      dispatch({ type: 'REMOVE_COMPONENT', payload: id });
    }, []),

    updateComponent: useCallback((id: string, updates: Partial<LayoutComponent>) => {
      dispatch({ type: 'UPDATE_COMPONENT', payload: { id, updates } });
    }, []),

    moveComponent: useCallback((id: string, position: { x: number; y: number }) => {
      dispatch({ type: 'MOVE_COMPONENT', payload: { id, position } });
    }, []),

    resizeComponent: useCallback((id: string, size: { width: number; height: number }) => {
      dispatch({ type: 'RESIZE_COMPONENT', payload: { id, size } });
    }, []),

    toggleSidebar: useCallback(() => {
      dispatch({ type: 'TOGGLE_SIDEBAR' });
    }, []),

    toggleMobileMenu: useCallback(() => {
      dispatch({ type: 'TOGGLE_MOBILE_MENU' });
    }, []),

    setLayoutMode: useCallback((mode: 'grid' | 'list' | 'masonry') => {
      dispatch({ type: 'SET_LAYOUT_MODE', payload: mode });
    }, []),

    loadLayout: useCallback((layout: { components: LayoutComponent[] }) => {
      dispatch({ type: 'LOAD_LAYOUT', payload: layout });
    }, []),

    resetLayout: useCallback(() => {
      dispatch({ type: 'RESET_LAYOUT' });
    }, []),
  };

  // Additional utility actions
  const utilityActions = {
    optimizeLayout: useCallback((containerWidth: number) => {
      dispatch({ type: 'OPTIMIZE_LAYOUT', payload: { containerWidth } });
    }, []),

    setDragging: useCallback((isDragging: boolean) => {
      dispatch({ type: 'SET_DRAGGING', payload: isDragging });
    }, []),
  };

  const contextValue: LayoutContextType = {
    state,
    actions: { ...actions, ...utilityActions },
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
};

// Custom hook to use the layout context
export const useLayout = (): LayoutContextType => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

// Higher-order component for consuming layout context
export const withLayout = <P extends object>(
  Component: React.ComponentType<P & { layout: LayoutContextType }>
): React.FC<P> => {
  const WithLayoutComponent: React.FC<P> = (props) => {
    const layout = useLayout();
    return <Component {...props} layout={layout} />;
  };

  WithLayoutComponent.displayName = `withLayout(${Component.displayName || Component.name})`;
  return WithLayoutComponent;
};