import { ResponsiveBreakpoint } from '@/types/layout';

export const defaultBreakpoints: ResponsiveBreakpoint[] = [
  { name: 'xs', minWidth: 0, columns: 1, containerPadding: '16px', gap: 16 },
  { name: 'sm', minWidth: 640, columns: 2, containerPadding: '20px', gap: 20 },
  { name: 'md', minWidth: 768, columns: 3, containerPadding: '24px', gap: 24 },
  { name: 'lg', minWidth: 1024, columns: 4, containerPadding: '32px', gap: 28 },
  { name: 'xl', minWidth: 1280, columns: 6, containerPadding: '40px', gap: 32 },
  { name: '2xl', minWidth: 1536, columns: 8, containerPadding: '48px', gap: 36 },
];

export const getCurrentBreakpoint = (width: number, breakpoints: ResponsiveBreakpoint[] = defaultBreakpoints): ResponsiveBreakpoint => {
  return breakpoints
    .slice()
    .reverse()
    .find(bp => width >= bp.minWidth) || breakpoints[0];
};

export const getBreakpointValue = <T>(
  breakpointValues: Partial<Record<ResponsiveBreakpoint['name'], T>>,
  currentBreakpoint: ResponsiveBreakpoint
): T | undefined => {
  // Return the exact match or fall back to the closest smaller breakpoint
  const fallbackOrder: ResponsiveBreakpoint['name'][] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  const startIndex = fallbackOrder.indexOf(currentBreakpoint.name);
  
  for (let i = startIndex; i < fallbackOrder.length; i++) {
    const value = breakpointValues[fallbackOrder[i]];
    if (value !== undefined) {
      return value;
    }
  }
  
  return undefined;
};

export const isBreakpointUp = (
  current: ResponsiveBreakpoint['name'],
  target: ResponsiveBreakpoint['name'],
  breakpoints: ResponsiveBreakpoint[] = defaultBreakpoints
): boolean => {
  const currentBp = breakpoints.find(bp => bp.name === current);
  const targetBp = breakpoints.find(bp => bp.name === target);
  
  if (!currentBp || !targetBp) return false;
  
  return currentBp.minWidth >= targetBp.minWidth;
};

export const isBreakpointDown = (
  current: ResponsiveBreakpoint['name'],
  target: ResponsiveBreakpoint['name'],
  breakpoints: ResponsiveBreakpoint[] = defaultBreakpoints
): boolean => {
  const currentBp = breakpoints.find(bp => bp.name === current);
  const targetBp = breakpoints.find(bp => bp.name === target);
  
  if (!currentBp || !targetBp) return false;
  
  return currentBp.minWidth <= targetBp.minWidth;
};