import React, { createContext } from 'react';
import { AnimationContext, AnimationIntensity } from '@/types/animations';

export interface AnimationProviderContext extends AnimationContext {
  setIntensity: (intensity: AnimationIntensity) => void;
  toggleReducedMotion: () => void;
}

export const AnimationContextProvider = createContext<AnimationProviderContext | undefined>(undefined);

export const useAnimationContext = (): AnimationProviderContext => {
  const context = React.useContext(AnimationContextProvider);
  if (context === undefined) {
    throw new Error('useAnimationContext must be used within an AnimationProvider');
  }
  return context;
};