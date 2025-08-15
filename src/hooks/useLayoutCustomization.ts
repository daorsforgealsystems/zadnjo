import { useCallback, useEffect, useState } from 'react';
import { useLayout } from '@/context/LayoutContext';
import { ComponentConfig } from '@/lib/api/preferences-api';

export const useLayoutCustomization = () => {
  const { state, actions } = useLayout();
  const [draggedItem, setDraggedItem] = useState<ComponentConfig | null>(null);
  const [dropZone, setDropZone] = useState<string | null>(null);
  
  const {
    preferences,
    loading,
    error,
    isCustomizing,
    hasUnsavedChanges
  } = state;

  const {
    updateComponents,
    updateGridSettings,
    updateSidebarSettings,
    updateTheme,
    updatePrimaryColor,
    toggleAnimations,
    startCustomizing,
    stopCustomizing,
    savePreferences,
    resetPreferences
  } = actions;

  // Component management
  const addComponent = useCallback((component: Omit<ComponentConfig, 'id'>) => {
    if (!preferences) return;

    const newComponent: ComponentConfig = {
      ...component,
      id: `component_${Date.now()}`,
    };

    const updatedComponents = [...preferences.components, newComponent];
    updateComponents(updatedComponents);
  }, [preferences, updateComponents]);

  const removeComponent = useCallback((componentId: string) => {
    if (!preferences) return;

    const updatedComponents = preferences.components.filter(
      comp => comp.id !== componentId
    );
    updateComponents(updatedComponents);
  }, [preferences, updateComponents]);

  const updateComponent = useCallback((
    componentId: string, 
    updates: Partial<ComponentConfig>
  ) => {
    if (!preferences) return;

    const updatedComponents = preferences.components.map(comp =>
      comp.id === componentId ? { ...comp, ...updates } : comp
    );
    updateComponents(updatedComponents);
  }, [preferences, updateComponents]);

  const moveComponent = useCallback((
    componentId: string,
    position: { x: number; y: number; w: number; h: number }
  ) => {
    updateComponent(componentId, { position });
  }, [updateComponent]);

  const resizeComponent = useCallback((
    componentId: string,
    size: { w: number; h: number }
  ) => {
    if (!preferences) return;

    const component = preferences.components.find(comp => comp.id === componentId);
    if (!component) return;

    updateComponent(componentId, {
      position: { ...component.position, ...size }
    });
  }, [preferences, updateComponent]);

  const toggleComponentVisibility = useCallback((componentId: string) => {
    if (!preferences) return;

    const component = preferences.components.find(comp => comp.id === componentId);
    if (!component) return;

    updateComponent(componentId, { visible: !component.visible });
  }, [preferences, updateComponent]);

  // Drag and drop handlers
  const handleDragStart = useCallback((component: ComponentConfig) => {
    setDraggedItem(component);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDropZone(null);
  }, []);

  const handleDrop = useCallback((
    targetId: string,
    position: { x: number; y: number }
  ) => {
    if (!draggedItem) return;

    moveComponent(draggedItem.id, {
      ...draggedItem.position,
      x: position.x,
      y: position.y
    });

    handleDragEnd();
  }, [draggedItem, moveComponent, handleDragEnd]);

  const handleDropZoneEnter = useCallback((zoneId: string) => {
    setDropZone(zoneId);
  }, []);

  const handleDropZoneLeave = useCallback(() => {
    setDropZone(null);
  }, []);

  // Grid layout helpers
  const getGridLayout = useCallback(() => {
    if (!preferences) return [];

    return preferences.components.map(component => ({
      i: component.id,
      x: component.position.x,
      y: component.position.y,
      w: component.position.w,
      h: component.position.h,
      minW: 2,
      minH: 2,
      maxW: 12,
      static: !component.draggable && !component.resizable
    }));
  }, [preferences]);

  const handleLayoutChange = useCallback((layout: any[]) => {
    if (!preferences) return;

    const updatedComponents = preferences.components.map(component => {
      const layoutItem = layout.find(item => item.i === component.id);
      if (layoutItem) {
        return {
          ...component,
          position: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          }
        };
      }
      return component;
    });

    updateComponents(updatedComponents);
  }, [preferences, updateComponents]);

  // Responsive breakpoints
  const getBreakpoints = useCallback(() => {
    return preferences?.breakpoints || {
      mobile: 768,
      tablet: 1024,
      desktop: 1280
    };
  }, [preferences]);

  // Theme and styling
  const getCurrentTheme = useCallback(() => {
    return preferences?.theme || 'light';
  }, [preferences]);

  const getPrimaryColor = useCallback(() => {
    return preferences?.primaryColor || '#3b82f6';
  }, [preferences]);

  const getAnimationsEnabled = useCallback(() => {
    return preferences?.animationsEnabled !== false;
  }, [preferences]);

  // Template management
  const exportLayoutAsTemplate = useCallback(async (
    name: string,
    description?: string
  ) => {
    if (!preferences) return null;

    try {
      await actions.saveAsTemplate(name, description);
      return true;
    } catch (error) {
      console.error('Failed to save template:', error);
      return false;
    }
  }, [preferences, actions]);

  // Auto-save when customizing
  useEffect(() => {
    if (isCustomizing && hasUnsavedChanges) {
      const timer = setTimeout(savePreferences, 1000);
      return () => clearTimeout(timer);
    }
  }, [isCustomizing, hasUnsavedChanges, savePreferences]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isCustomizing) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            savePreferences();
            break;
          case 'z':
            event.preventDefault();
            // Could implement undo functionality
            break;
          case 'Escape':
            event.preventDefault();
            stopCustomizing();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCustomizing, savePreferences, stopCustomizing]);

  return {
    // State
    preferences,
    loading,
    error,
    isCustomizing,
    hasUnsavedChanges,
    draggedItem,
    dropZone,

    // Component management
    addComponent,
    removeComponent,
    updateComponent,
    moveComponent,
    resizeComponent,
    toggleComponentVisibility,

    // Drag and drop
    handleDragStart,
    handleDragEnd,
    handleDrop,
    handleDropZoneEnter,
    handleDropZoneLeave,

    // Grid layout
    getGridLayout,
    handleLayoutChange,
    getBreakpoints,

    // Theme and styling
    getCurrentTheme,
    getPrimaryColor,
    getAnimationsEnabled,
    updateTheme,
    updatePrimaryColor,
    updateGridSettings,
    updateSidebarSettings,
    toggleAnimations,

    // Customization mode
    startCustomizing,
    stopCustomizing,

    // Persistence
    savePreferences,
    resetPreferences,
    exportLayoutAsTemplate,
  };
};