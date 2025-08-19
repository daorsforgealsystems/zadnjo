import { useContext } from 'react';
import { AnimationContextProvider, AnimationProviderContext } from '@/components/providers/AnimationContext';

export const useAnimationContext = (): AnimationProviderContext => {
  const context = useContext(AnimationContextProvider);
  if (context === undefined) {
    throw new Error('useAnimationContext must be used within an AnimationProvider');
  }
  return context;
};