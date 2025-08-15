import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AnimationContext, AnimationPresets, AnimationIntensity } from '@/types/animations';
import { useAnimations } from '@/hooks/useAnimations';

interface AnimationProviderProps {
  children: React.ReactNode;
  defaultIntensity?: AnimationIntensity;
  respectReducedMotion?: boolean;
}

interface AnimationProviderContext extends AnimationContext {
  setIntensity: (intensity: AnimationIntensity) => void;
  toggleReducedMotion: () => void;
}

const AnimationContextProvider = createContext<AnimationProviderContext | undefined>(undefined);

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

export const useAnimationContext = (): AnimationProviderContext => {
  const context = useContext(AnimationContextProvider);
  if (context === undefined) {
    throw new Error('useAnimationContext must be used within an AnimationProvider');
  }
  return context;
};

// Higher-order component for consuming animation context
export const withAnimations = <P extends object>(
  Component: React.ComponentType<P & { animations: AnimationProviderContext }>
): React.FC<P> => {
  const WithAnimationsComponent: React.FC<P> = (props) => {
    const animations = useAnimationContext();
    return <Component {...props} animations={animations} />;
  };

  WithAnimationsComponent.displayName = `withAnimations(${Component.displayName || Component.name})`;
  return WithAnimationsComponent;
};

// Settings component for controlling animation preferences
export const AnimationSettings: React.FC = () => {
  const { intensity, setIntensity, reducedMotion, toggleReducedMotion } = useAnimationContext();

  return (
    <div className="animation-settings space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Animation Intensity</label>
        <div className="flex space-x-2">
          {(['low', 'medium', 'high'] as AnimationIntensity[]).map((level) => (
            <button
              key={level}
              onClick={() => setIntensity(level)}
              className={`px-3 py-1 rounded text-sm capitalize transition-colors ${
                intensity === level
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Reduced Motion</label>
        <button
          onClick={toggleReducedMotion}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            reducedMotion ? 'bg-primary' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              reducedMotion ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        System preference: {window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'Reduced' : 'No preference'}
      </p>
    </div>
  );
};