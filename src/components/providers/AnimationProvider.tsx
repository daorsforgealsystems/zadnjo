import React, { createContext, useState, useCallback, useEffect } from 'react';
import { AnimationContext, AnimationIntensity } from '@/types/animations';
import { useAnimations } from '@/hooks/useAnimations';

interface AnimationProviderProps {
  children: React.ReactNode;
  defaultIntensity?: AnimationIntensity;
  respectReducedMotion?: boolean;
}

export interface AnimationProviderContext extends AnimationContext {
  setIntensity: (intensity: AnimationIntensity) => void;
  toggleReducedMotion: () => void;
}

export const AnimationContextProvider = createContext<AnimationProviderContext | undefined>(undefined);

export const AnimationProvider: React.FC<AnimationProviderProps> = ({
  children,
  defaultIntensity = 'medium',
  respectReducedMotion = true,
}) => {
  const [intensity, setIntensity] = useState<AnimationIntensity>(defaultIntensity);
  const [userReducedMotion, setUserReducedMotion] = useState(false);

  // Get system reduced motion preference
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setSystemReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Determine if reduced motion should be active
  const reducedMotionActive = respectReducedMotion 
    ? (systemReducedMotion || userReducedMotion)
    : userReducedMotion;

  // Use the animations hook with current settings
  const animationHooks = useAnimations(reducedMotionActive ? 'low' : intensity);

  const toggleReducedMotion = useCallback(() => {
    setUserReducedMotion(prev => !prev);
  }, []);

  const contextValue: AnimationProviderContext = {
    ...animationHooks,
    reducedMotion: reducedMotionActive,
    intensity: reducedMotionActive ? 'low' : intensity,
    setIntensity,
    toggleReducedMotion,
  };

  return (
    <AnimationContextProvider.Provider value={contextValue}>
      {children}
    </AnimationContextProvider.Provider>
  );
};



