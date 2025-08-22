import { createContext, useContext, useMemo } from 'react';
import { useWindowSize } from '@/hooks/useWindowSize';

type LayoutVariant = 'mobile' | 'tablet' | 'desktop' | 'widescreen';

interface LayoutContextProps {
  variant: LayoutVariant;
}

const LayoutContext = createContext<LayoutContextProps | undefined>(undefined);

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

interface EnhancedResponsiveLayoutProps {
  children: React.ReactNode;
}

export const EnhancedResponsiveLayout: React.FC<EnhancedResponsiveLayoutProps> = ({ children }) => {
  const { width } = useWindowSize();

  const layoutVariant = useMemo<LayoutVariant>(() => {
    if (width === undefined) {
        return 'desktop';
    }
    if (width < 640) return 'mobile';
    if (width < 1024) return 'tablet';
    if (width < 1536) return 'desktop';
    return 'widescreen';
  }, [width]);

  return (
    <LayoutContext.Provider value={{ variant: layoutVariant }}>
      <div className="layout-container" data-layout={layoutVariant}>
        {children}
      </div>
    </LayoutContext.Provider>
  );
};