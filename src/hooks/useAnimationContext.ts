import { useContext } from 'react';
import { AnimationContextProvider } from '@/components/providers/AnimationProvider';
import { AnimationProviderContext } from '@/components/providers/AnimationProvider';

export const useAnimationContext = (): AnimationProviderContext => {
  const context = useContext(AnimationContextProvider);
  if (context === undefined) {
    throw new Error('useAnimationContext must be used within an AnimationProvider');
  }
  return context;
};