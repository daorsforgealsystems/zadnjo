import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveLayoutSystem } from './ResponsiveLayoutSystem';
import { DynamicGridSystem } from './DynamicGridSystem';
import { CustomizableHeader } from './headers/CustomizableHeader';
import { CustomizableFooter } from './footers/CustomizableFooter';
import { useLayoutCustomization } from '@/hooks/useLayoutCustomization';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Layout, 
  Palette, 
  Grid3x3, 
  Save, 
  RotateCcw, 
  Eye,
  EyeOff,
  Plus,
  Minus,
  Download,
  Upload
} from 'lucide-react';
import { ComponentConfig } from '@/lib/api/preferences-api';
import { cn } from '@/lib/utils';

interface IntegratedLayoutDemoProps {
  className?: string;
}

export const IntegratedLayoutDemo: React.FC<IntegratedLayoutDemoProps> = ({
  className
}) => {
  const { user } = useAuth();
  const {
    preferences,
    isCustomizing,
    hasUnsavedChanges,
    getCurrentTheme,
    getPrimaryColor,
    getAnimationsEnabled,
    startCustomizing,
    stopCustomizing,
    savePreferences,
    resetPreferences,
    addComponent,
    removeComponent,
    toggleComponentVisibility,
    updateTheme,
    updatePrimaryColor,
    updateGridSettings,
    updateSidebarSettings,
    exportLayoutAsTemplate
  } = useLayoutCustomization();

  const {
    menu,
    canNavigateTo,
    hasPermission,
    trackComponentInteraction,
    setBadgeCount
  } = useNavigationGuard();

  const [showCustomizationPanel, setShowCustomizationPanel] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<ComponentConfig | null>(null);
  const [templateName, setTemplateName] = useState('');

  // Demo components configuration
  const availableComponents: Omit<ComponentConfig, 'id' | 'position'>[] = [
    {
      type: 'metrics',
      title: 'Key Metrics',
      config: { metrics: ['revenue', 'orders', 'customers', 'growth'] },
      resizable: true,
      draggable: true,
      visible: true
    },
    {
      type: 'chart',
      title: 'Performance Chart',
      config: { chartType: 'line', timeRange: '7d' },
      resizable: true,
      draggable: true,
      visible: true
    },
    {
      type: 'table',
      title: 'Recent Orders',
      config: { dataSource: 'orders', limit: 10 },
      resizable: true,
      draggable: true,
      visible: true
    },
    {
      type: 'map',
      title: 'Fleet Tracking',
      config: { showVehicles: true, showRoutes: true },
      resizable: true,
      draggable: true,
      visible: true
    },
    {
      type: 'alerts',
      title: 'System Alerts',
      config: { severity: ['high', 'medium'], autoRefresh: true },
      resizable: true,
      draggable: true,
      visible: true
    }
  ];

  // Handle customization toggle
  const handleToggleCustomization = async () => {
    if (isCustomizing) {
      await stopCustomizing();
      setShowCustomizationPanel(false);
    } else {
      await startCustomizing();
      setShowCustomizationPanel(true);
    }
    
    await trackComponentInteraction('layout', isCustomizing ? 'stop_customizing' : 'start_customizing');
  };

  // Handle component addition
  const handleAddComponent = async (componentType: string) => {
    const componentConfig = availableComponents.find(comp => comp.type === componentType);
    if (!componentConfig || !preferences) return;

    // Find next available position
    const existingComponents = preferences.components;
    const maxY = existingComponents.length > 0 
      ? Math.max(...existingComponents.map(comp => comp.position.y + comp.position.h))
      : 0;

    await addComponent({
      ...componentConfig,
      position: { x: 0, y: maxY, w: 6, h: 4 }
    });

    await trackComponentInteraction('layout', 'add_component', { type: componentType });
  };

  // Handle component removal
  const handleRemoveComponent = async (componentId: string) => {
    await removeComponent(componentId);
    await trackComponentInteraction('layout', 'remove_component', { componentId });
    
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null);
    }
  };

  // Handle theme change
  const handleThemeChange = async (theme: 'light' | 'dark' | 'auto') => {
    await updateTheme(theme);
    await trackComponentInteraction('layout', 'change_theme', { theme });
  };

  // Handle save template
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    
    const success = await exportLayoutAsTemplate(templateName, 'Custom layout created by user');
    if (success) {
      setTemplateName('');
      await trackComponentInteraction('layout', 'save_template', { name: templateName });
    }
  };

  // Mock component renderer
  const renderComponent = (component: ComponentConfig) => {
    const baseContent = {
      metrics: (
        <div className="grid grid-cols-2 gap-4">
          {['Revenue', 'Orders', 'Customers', 'Growth'].map((metric, index) => (
            <div key={metric} className="text-center">
              <div className="text-2xl font-bold text-primary">{(Math.random() * 1000).toFixed(0)}</div>
              <div className="text-sm text-muted-foreground">{metric}</div>
            </div>
          ))}
        </div>
      ),
      chart: (
        <div className="h-full flex items-center justify-center">
          <div className="w-full h-32 bg-gradient-to-r from-primary/20 to-primary/40 rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground">Chart Placeholder</span>
          </div>
        </div>
      ),
      table: (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex justify-between items-center p-2 bg-muted/50 rounded">
              <span>Order #{1000 + i}</span>
              <Badge variant="outline">Processing</Badge>
            </div>
          ))}
        </div>
      ),
      map: (
        <div className="h-full bg-muted/50 rounded-lg flex items-center justify-center">
          <span className="text-muted-foreground">Map Placeholder</span>
        </div>
      ),
      alerts: (
        <div className="space-y-2">
          {['High Priority Alert', 'Medium Priority Alert'].map((alert, index) => (
            <div key={alert} className="p-2 bg-red-50 border border-red-200 rounded">
              <span className="text-sm text-red-800">{alert}</span>
            </div>
          ))}
        </div>
      )
    };

    return (
      <Card 
        className={cn(
          'h-full relative group',
          selectedComponent?.id === component.id && 'ring-2 ring-primary',
          !component.visible && 'opacity-50'
        )}
        onClick={() => isCustomizing && setSelectedComponent(component)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{component.title}</CardTitle>
            {isCustomizing && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleComponentVisibility(component.id);
                  }}
                >
                  {component.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveComponent(component.id);
                  }}
                >
                  <Minus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {baseContent[component.type as keyof typeof baseContent] || (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Unknown Component Type
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Update navigation badges (demo)
  useEffect(() => {
    const interval = setInterval(async () => {
      await setBadgeCount('orders', Math.floor(Math.random() * 10));
      await setBadgeCount('notifications', Math.floor(Math.random() * 5));
    }, 10000);

    return () => clearInterval(interval);
  }, [setBadgeCount]);

  if (!preferences) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Header */}
      <CustomizableHeader
        variant="default"
        logo={<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">DF</div>}
        title="Logistics Platform"
        subtitle="Integrated Layout Demo"
        user={user ? {
          name: user.name || 'User',
          email: user.email,
          avatar: user.avatar
        } : undefined}
        actions={[
          {
            id: 'customize',
            label: isCustomizing ? 'Exit Customize' : 'Customize',
            icon: <Layout className="h-4 w-4" />,
            onClick: handleToggleCustomization,
            variant: isCustomizing ? 'default' : 'outline'
          }
        ]}
        showSearch={true}
        showNotifications={true}
        notificationCount={3}
        onSearch={async (query) => {
          // Mock search tracking
          await trackComponentInteraction('search', 'query', { query });
        }}
      />

      <div className="flex h-[calc(100vh-64px)]">
        {/* Customization Panel */}
        <AnimatePresence>
          {showCustomizationPanel && (
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="w-80 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            >
              <div className="p-4 h-full overflow-y-auto">
                <div className="space-y-6">
                  {/* Save/Reset Actions */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={savePreferences}
                        disabled={!hasUnsavedChanges}
                        className="flex-1"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Layout
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={resetPreferences}
                        className="flex-1"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                    
                    {hasUnsavedChanges && (
                      <Badge variant="secondary" className="w-full justify-center">
                        Unsaved Changes
                      </Badge>
                    )}
                  </div>

                  <Tabs defaultValue="components" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="components">Components</TabsTrigger>
                      <TabsTrigger value="theme">Theme</TabsTrigger>
                      <TabsTrigger value="layout">Layout</TabsTrigger>
                    </TabsList>

                    {/* Components Tab */}
                    <TabsContent value="components" className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Add Components</h3>
                        <div className="grid grid-cols-1 gap-2">
                          {availableComponents.map((component) => (
                            <Button
                              key={component.type}
                              variant="outline"
                              size="sm"
                              className="justify-start"
                              onClick={() => handleAddComponent(component.type)}
                            >
                              <Plus className="h-3 w-3 mr-2" />
                              {component.title}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium mb-2">Current Components</h3>
                        <div className="space-y-1">
                          {preferences.components.map((component) => (
                            <div
                              key={component.id}
                              className={cn(
                                'flex items-center justify-between p-2 rounded border',
                                selectedComponent?.id === component.id && 'bg-primary/10 border-primary'
                              )}
                            >
                              <span className="text-sm">{component.title}</span>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => toggleComponentVisibility(component.id)}
                                >
                                  {component.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-red-500"
                                  onClick={() => handleRemoveComponent(component.id)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    {/* Theme Tab */}
                    <TabsContent value="theme" className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Theme</h3>
                        <div className="grid grid-cols-3 gap-2">
                          {(['light', 'dark', 'auto'] as const).map((theme) => (
                            <Button
                              key={theme}
                              variant={getCurrentTheme() === theme ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleThemeChange(theme)}
                              className="capitalize"
                            >
                              {theme}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium mb-2">Primary Color</h3>
                        <div className="grid grid-cols-4 gap-2">
                          {['#3b82f6', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b', '#ec4899'].map((color) => (
                            <button
                              key={color}
                              className={cn(
                                'h-8 w-8 rounded border-2',
                                getPrimaryColor() === color ? 'border-foreground' : 'border-border'
                              )}
                              style={{ backgroundColor: color }}
                              onClick={() => updatePrimaryColor(color)}
                            />
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    {/* Layout Tab */}
                    <TabsContent value="layout" className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Grid Settings</h3>
                        <div className="space-y-2">
                          <label className="text-sm">Gap Size</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[16, 24, 32].map((gap) => (
                              <Button
                                key={gap}
                                variant={preferences.gridGap === gap ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateGridSettings({ gap })}
                              >
                                {gap}px
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium mb-2">Save as Template</h3>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Template name"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            className="w-full px-3 py-2 text-sm border rounded"
                          />
                          <Button
                            size="sm"
                            onClick={handleSaveTemplate}
                            disabled={!templateName.trim()}
                            className="w-full"
                          >
                            Save Template
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <ResponsiveLayoutSystem
            components={preferences.components}
            renderComponent={renderComponent}
            gridGap={preferences.gridGap}
            animationsEnabled={getAnimationsEnabled()}
            breakpoints={preferences.breakpoints}
            customizing={isCustomizing}
            onComponentsChange={(components) => {
              // This would be handled by the ResponsiveLayoutSystem internally
              // calling the layout context methods
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <CustomizableFooter
        variant="minimal"
        companyName="DAORS Logistics"
        socialLinks={[
          { platform: 'github', url: 'https://github.com' },
          { platform: 'linkedin', url: 'https://linkedin.com' }
        ]}
        showDivider={false}
      />
    </div>
  );
};