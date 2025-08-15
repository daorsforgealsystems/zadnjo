import { useState, useEffect, useCallback, useMemo } from 'react';
import { ResponsiveBreakpoint } from '@/types/layout';
import { 
  defaultBreakpoints, 
  getCurrentBreakpoint, 
  getBreakpointValue, 
  isBreakpointUp, 
  isBreakpointDown 
} from '@/lib/layout/breakpoints';

interface UseResponsiveLayoutOptions {
  debounceMs?: number;
  customBreakpoints?: ResponsiveBreakpoint[];
}

export const useResponsiveLayout = (options: UseResponsiveLayoutOptions = {}) => {
  const { debounceMs = 150, customBreakpoints } = options;
  const breakpoints = customBreakpoints || defaultBreakpoints;
  
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [currentBreakpoint, setCurrentBreakpoint] = useState<ResponsiveBreakpoint>(breakpoints[0]);

  // Debounced resize handler
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const updateSize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      
      setWindowSize({ width: newWidth, height: newHeight });
      setCurrentBreakpoint(getCurrentBreakpoint(newWidth, breakpoints));
    };

    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateSize, debounceMs);
    };

    // Initial call
    updateSize();
    
    window.addEventListener('resize', debouncedUpdate);

    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      clearTimeout(timeoutId);
    };
  }, [breakpoints, debounceMs]);

  // Helper functions
  const isMobile = useMemo(() => 
    currentBreakpoint.name === 'xs' || currentBreakpoint.name === 'sm',
    [currentBreakpoint.name]
  );

  const isTablet = useMemo(() => 
    currentBreakpoint.name === 'md',
    [currentBreakpoint.name]
  );

  const isDesktop = useMemo(() => 
    ['lg', 'xl', '2xl'].includes(currentBreakpoint.name),
    [currentBreakpoint.name]
  );

  const getResponsiveValue = useCallback(<T>(
    breakpointValues: Partial<Record<ResponsiveBreakpoint['name'], T>>
  ): T | undefined => {
    return getBreakpointValue(breakpointValues, currentBreakpoint);
  }, [currentBreakpoint]);

  const isBreakpointUpFrom = useCallback((
    target: ResponsiveBreakpoint['name']
  ): boolean => {
    return isBreakpointUp(currentBreakpoint.name, target, breakpoints);
  }, [currentBreakpoint.name, breakpoints]);

  const isBreakpointDownFrom = useCallback((
    target: ResponsiveBreakpoint['name']
  ): boolean => {
    return isBreakpointDown(currentBreakpoint.name, target, breakpoints);
  }, [currentBreakpoint.name, breakpoints]);

  // Get columns for current breakpoint
  const columns = useMemo(() => currentBreakpoint.columns, [currentBreakpoint.columns]);

  // Get container padding for current breakpoint
  const containerPadding = useMemo(() => 
    currentBreakpoint.containerPadding, 
    [currentBreakpoint.containerPadding]
  );

  // Get gap for current breakpoint
  const gap = useMemo(() => currentBreakpoint.gap || 24, [currentBreakpoint.gap]);

  return {
    windowSize,
    currentBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    breakpoints,
    columns,
    containerPadding,
    gap,
    getResponsiveValue,
    isBreakpointUp: isBreakpointUpFrom,
    isBreakpointDown: isBreakpointDownFrom,
  };
};