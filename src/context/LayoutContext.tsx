import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { PreferencesAPI, LayoutPreferences, ComponentConfig } from '@/lib/api/preferences-api';
import { useAuth } from './AuthContext';
import { toast } from '@/lib/toast';

interface LayoutState {
  preferences: LayoutPreferences | null;
  loading: boolean;
  error: string | null;
  templates: any[];
  isCustomizing: boolean;
  hasUnsavedChanges: boolean;
}

type LayoutAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PREFERENCES'; payload: LayoutPreferences }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<LayoutPreferences> }
  | { type: 'SET_TEMPLATES'; payload: any[] }
  | { type: 'SET_CUSTOMIZING'; payload: boolean }
  | { type: 'SET_UNSAVED_CHANGES'; payload: boolean }
  | { type: 'RESET_STATE' };

const initialState: LayoutState = {
  preferences: null,
  loading: false,
  error: null,
  templates: [],
  isCustomizing: false,
  hasUnsavedChanges: false,
};

function layoutReducer(state: LayoutState, action: LayoutAction): LayoutState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_PREFERENCES':
      return { 
        ...state, 
        preferences: action.payload, 
        loading: false, 
        error: null,
        hasUnsavedChanges: false 
      };
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: state.preferences 
          ? { ...state.preferences, ...action.payload }
          : null,
        hasUnsavedChanges: true
      };
    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload };
    case 'SET_CUSTOMIZING':
      return { ...state, isCustomizing: action.payload };
    case 'SET_UNSAVED_CHANGES':
      return { ...state, hasUnsavedChanges: action.payload };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

interface LayoutContextType {
  state: LayoutState;
  actions: {
    loadPreferences: () => Promise<void>;
    updatePreferences: (updates: Partial<LayoutPreferences>) => void;
    savePreferences: () => Promise<void>;
    resetPreferences: () => Promise<void>;
    loadTemplates: (role?: string) => Promise<void>;
    applyTemplate: (templateId: string) => Promise<void>;
    saveAsTemplate: (name: string, description?: string) => Promise<void>;
    updateTheme: (theme: 'light' | 'dark' | 'auto') => void;
    updatePrimaryColor: (color: string) => void;
    updateSidebarSettings: (settings: { width?: number; collapsed?: boolean }) => void;
    updateGridSettings: (settings: { gap?: number; compactMode?: boolean }) => void;
    updateComponents: (components: ComponentConfig[]) => void;
    toggleAnimations: (enabled: boolean) => void;
    startCustomizing: () => void;
    stopCustomizing: () => void;
    exportPreferences: () => Promise<any>;
    importPreferences: (data: any) => Promise<void>;
  };
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

interface LayoutProviderProps {
  children: React.ReactNode;
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(layoutReducer, initialState);
  const { user } = useAuth();

  // Load user preferences on mount or user change
  useEffect(() => {
    if (user?.id) {
      loadPreferences();
    } else {
      dispatch({ type: 'RESET_STATE' });
    }
  }, [user?.id]);

  const loadPreferences = useCallback(async () => {
    if (!user?.id) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const preferences = await PreferencesAPI.getLayoutPreferences(user.id);
      dispatch({ type: 'SET_PREFERENCES', payload: preferences });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load layout preferences' });
      console.error('Error loading preferences:', error);
    }
  }, [user?.id]);

  const updatePreferences = useCallback((updates: Partial<LayoutPreferences>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: updates });
  }, []);

  const savePreferences = useCallback(async () => {
    if (!user?.id || !state.preferences) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const updated = await PreferencesAPI.updateLayoutPreferences(user.id, state.preferences);
      dispatch({ type: 'SET_PREFERENCES', payload: updated });
      toast.success('Layout preferences saved successfully');
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save preferences' });
      toast.error('Failed to save layout preferences');
      console.error('Error saving preferences:', error);
    }
  }, [user?.id, state.preferences]);

  const resetPreferences = useCallback(async () => {
    if (!user?.id) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await PreferencesAPI.resetPreferences(user.id, 'layout');
      await loadPreferences();
      toast.success('Layout preferences reset to defaults');
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to reset preferences' });
      toast.error('Failed to reset layout preferences');
      console.error('Error resetting preferences:', error);
    }
  }, [user?.id, loadPreferences]);

  const loadTemplates = useCallback(async (role?: string) => {
    try {
      const templates = await PreferencesAPI.getLayoutTemplates(role);
      dispatch({ type: 'SET_TEMPLATES', payload: templates });
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }, []);

  const applyTemplate = useCallback(async (templateId: string) => {
    if (!user?.id) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const preferences = await PreferencesAPI.applyLayoutTemplate(templateId, user.id);
      dispatch({ type: 'SET_PREFERENCES', payload: preferences });
      toast.success('Template applied successfully');
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to apply template' });
      toast.error('Failed to apply template');
      console.error('Error applying template:', error);
    }
  }, [user?.id]);

  const saveAsTemplate = useCallback(async (name: string, description?: string) => {
    if (!user?.id || !state.preferences) return;

    try {
      await PreferencesAPI.saveCustomLayout(user.id, {
        name,
        description,
        components: state.preferences.components,
        gridConfig: {
          gap: state.preferences.gridGap,
          compactMode: state.preferences.compactMode
        }
      });
      toast.success('Layout saved as template');
    } catch (error) {
      toast.error('Failed to save template');
      console.error('Error saving template:', error);
    }
  }, [user?.id, state.preferences]);

  // Theme and appearance
  const updateTheme = useCallback((theme: 'light' | 'dark' | 'auto') => {
    updatePreferences({ theme });
  }, [updatePreferences]);

  const updatePrimaryColor = useCallback((color: string) => {
    updatePreferences({ primaryColor: color });
  }, [updatePreferences]);

  // Sidebar settings
  const updateSidebarSettings = useCallback((settings: { width?: number; collapsed?: boolean }) => {
    updatePreferences({
      sidebarWidth: settings.width,
      sidebarCollapsed: settings.collapsed
    });
  }, [updatePreferences]);

  // Grid settings
  const updateGridSettings = useCallback((settings: { gap?: number; compactMode?: boolean }) => {
    updatePreferences({
      gridGap: settings.gap,
      compactMode: settings.compactMode
    });
  }, [updatePreferences]);

  // Components
  const updateComponents = useCallback((components: ComponentConfig[]) => {
    updatePreferences({ components });
  }, [updatePreferences]);

  // Animations
  const toggleAnimations = useCallback((enabled: boolean) => {
    updatePreferences({ animationsEnabled: enabled });
  }, [updatePreferences]);

  // Customization mode
  const startCustomizing = useCallback(() => {
    dispatch({ type: 'SET_CUSTOMIZING', payload: true });
  }, []);

  const stopCustomizing = useCallback(() => {
    dispatch({ type: 'SET_CUSTOMIZING', payload: false });
  }, []);

  // Import/Export
  const exportPreferences = useCallback(async () => {
    if (!user?.id) return null;

    try {
      return await PreferencesAPI.exportPreferences(user.id);
    } catch (error) {
      toast.error('Failed to export preferences');
      console.error('Error exporting preferences:', error);
      return null;
    }
  }, [user?.id]);

  const importPreferences = useCallback(async (data: any) => {
    if (!user?.id) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await PreferencesAPI.importPreferences(user.id, data);
      await loadPreferences();
      toast.success('Preferences imported successfully');
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to import preferences' });
      toast.error('Failed to import preferences');
      console.error('Error importing preferences:', error);
    }
  }, [user?.id, loadPreferences]);

  // Auto-save when preferences change (debounced)
  useEffect(() => {
    if (state.hasUnsavedChanges && !state.loading) {
      const timer = setTimeout(savePreferences, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.hasUnsavedChanges, state.loading, savePreferences]);

  const contextValue: LayoutContextType = {
    state,
    actions: {
      loadPreferences,
      updatePreferences,
      savePreferences,
      resetPreferences,
      loadTemplates,
      applyTemplate,
      saveAsTemplate,
      updateTheme,
      updatePrimaryColor,
      updateSidebarSettings,
      updateGridSettings,
      updateComponents,
      toggleAnimations,
      startCustomizing,
      stopCustomizing,
      exportPreferences,
      importPreferences,
    }
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
};