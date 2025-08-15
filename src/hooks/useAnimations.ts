import { useCallback, useRef, useEffect, useMemo } from 'react';
import { useAnimation } from 'framer-motion';
import anime from 'animejs';
import { 
  AnimationConfig, 
  AnimationContext, 
  AnimationPresets, 
  EntranceAnimation,
  AnimationIntensity
} from '@/types/animations';
import { 
  navigationAnimationPresets,
  animateEntrance,
  animateStaggeredEntrance,
  createRippleEffect,
} from '@/lib/animations/interactionAnimations';
import {
  layoutAnimationPresets
} from '@/lib/animations/layoutAnimations';
import {
  interactionAnimationPresets
} from '@/lib/animations/interactionAnimations';

export const useAnimations = (intensity: AnimationIntensity = 'medium') => {
  const activeAnimations = useRef<anime.AnimeInstance[]>([]);
  const reducedMotion = useMemo(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const presets: AnimationPresets = useMemo(() => ({
    navigation: navigationAnimationPresets,
    layout: layoutAnimationPresets,
    interaction: interactionAnimationPresets,
  }), []);

  // Adjust animation configs based on intensity and reduced motion
  const adjustConfig = useCallback((config: AnimationConfig): AnimationConfig => {
    if (reducedMotion) {
      return {
        ...config,
        duration: Math.min(config.duration || 300, 150),
        easing: 'linear',
      };
    }

    const intensityMultipliers = {
      low: 0.7,
      medium: 1,
      high: 1.3,
    };

    const multiplier = intensityMultipliers[intensity];

    return {
      ...config,
      duration: Math.round((config.duration || 300) * multiplier),
    };
  }, [intensity, reducedMotion]);

  const createAnimation = useCallback((config: AnimationConfig) => {
    const adjustedConfig = adjustConfig(config);
    const animation = anime(adjustedConfig);
    activeAnimations.current.push(animation);
    return animation;
  }, [adjustConfig]);

  const animateEntranceHook = useCallback((
    element: HTMLElement,
    type: EntranceAnimation,
    config?: Partial<AnimationConfig>
  ) => {
    const adjustedConfig = adjustConfig({ duration: 300, easing: 'easeOutQuad', ...config });
    return animateEntrance(element, type, adjustedConfig);
  }, [adjustConfig]);

  const animateExit = useCallback((
    element: HTMLElement,
    type: EntranceAnimation,
    config?: Partial<AnimationConfig>
  ) => {
    const adjustedConfig = adjustConfig({ duration: 250, easing: 'easeInQuad', ...config });
    
    // Reverse the entrance animation
    const reverseConfig = { ...adjustedConfig };
    
    switch (type) {
      case 'fadeIn':
        return anime({
          ...reverseConfig,
          targets: element,
          opacity: [1, 0],
        });
      case 'slideUp':
        return anime({
          ...reverseConfig,
          targets: element,
          opacity: [1, 0],
          translateY: [0, 30],
        });
      case 'slideDown':
        return anime({
          ...reverseConfig,
          targets: element,
          opacity: [1, 0],
          translateY: [0, -30],
        });
      case 'slideLeft':
        return anime({
          ...reverseConfig,
          targets: element,
          opacity: [1, 0],
          translateX: [0, 30],
        });
      case 'slideRight':
        return anime({
          ...reverseConfig,
          targets: element,
          opacity: [1, 0],
          translateX: [0, -30],
        });
      case 'scaleIn':
        return anime({
          ...reverseConfig,
          targets: element,
          opacity: [1, 0],
          scale: [1, 0.8],
        });
      case 'bounceIn':
        return anime({
          ...reverseConfig,
          targets: element,
          opacity: [1, 0],
          scale: [1, 0.3],
          easing: 'easeInBack',
        });
      default:
        return anime({
          ...reverseConfig,
          targets: element,
          opacity: [1, 0],
        });
    }
  }, [adjustConfig]);

  const createHoverAnimation = useCallback((
    element: HTMLElement,
    config?: Partial<AnimationConfig>
  ) => {
    const defaultConfig = {
      duration: 200,
      easing: 'easeOutQuad',
      scale: 1.02,
      translateY: -2,
    };

    const adjustedConfig = adjustConfig({ ...defaultConfig, ...config });

    const handleMouseEnter = () => {
      anime({
        targets: element,
        scale: adjustedConfig.scale,
        translateY: adjustedConfig.translateY,
        duration: adjustedConfig.duration,
        easing: adjustedConfig.easing,
      });
    };

    const handleMouseLeave = () => {
      anime({
        targets: element,
        scale: 1,
        translateY: 0,
        duration: adjustedConfig.duration,
        easing: adjustedConfig.easing,
      });
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [adjustConfig]);

  const createScrollAnimation = useCallback((
    elements: HTMLElement[],
    config?: Partial<AnimationConfig & { threshold?: number; stagger?: number }>
  ) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            const delay = (config?.stagger || 100) * index;
            setTimeout(() => {
              animateEntranceHook(entry.target as HTMLElement, 'slideUp', {
                ...config,
                delay: 0,
              });
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: config?.threshold || 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    elements.forEach(element => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, [animateEntranceHook]);

  const createRipple = useCallback((
    element: HTMLElement,
    event: MouseEvent
  ) => {
    if (reducedMotion) return;
    createRippleEffect(element, event);
  }, [reducedMotion]);

  // Cleanup function
  const cleanup = useCallback(() => {
    activeAnimations.current.forEach(animation => {
      if (animation && typeof animation.pause === 'function') {
        animation.pause();
      }
    });
    activeAnimations.current = [];
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const context: AnimationContext = useMemo(() => ({
    presets,
    intensity,
    reducedMotion,
    createAnimation,
    animateEntrance: animateEntranceHook,
    animateExit,
    createHoverAnimation,
  }), [
    presets,
    intensity,
    reducedMotion,
    createAnimation,
    animateEntranceHook,
    animateExit,
    createHoverAnimation,
  ]);

  return {
    ...context,
    createScrollAnimation,
    createRipple,
    cleanup,
    // Utility functions
    staggeredEntrance: animateStaggeredEntrance,
  };
};