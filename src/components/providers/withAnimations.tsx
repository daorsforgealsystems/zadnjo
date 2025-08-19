import React from 'react';
import { useAnimationContext } from '@/hooks/useAnimationContext';
import { AnimationProviderContext } from './AnimationContext';

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