import { AnimeParams, AnimeInstance } from 'animejs';

export interface AnimationConfig extends AnimeParams {
  duration: number;
  easing: string;
  delay?: number;
  complete?: () => void;
  autoplay?: boolean;
}

export interface NavigationAnimations {
  sidebarToggle: AnimationConfig;
  menuItemHover: AnimationConfig;
  breadcrumbTransition: AnimationConfig;
  mobileMenuSlide: AnimationConfig;
  searchExpansion: AnimationConfig;
}

export interface LayoutAnimations {
  gridReorder: AnimationConfig;
  componentAdd: AnimationConfig;
  componentRemove: AnimationConfig;
  containerResize: AnimationConfig;
  breakpointTransition: AnimationConfig;
}

export interface InteractionAnimations {
  buttonHover: AnimationConfig;
  cardHover: AnimationConfig;
  modalEntrance: AnimationConfig;
  tooltipShow: AnimationConfig;
  loadingSpinner: AnimationConfig;
}

export interface AnimationPresets {
  navigation: NavigationAnimations;
  layout: LayoutAnimations;
  interaction: InteractionAnimations;
}

export type AnimationTrigger = 'hover' | 'focus' | 'click' | 'scroll' | 'mount' | 'unmount';
export type AnimationIntensity = 'low' | 'medium' | 'high';
export type EntranceAnimation = 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scaleIn' | 'bounceIn';

export interface AnimationContext {
  presets: AnimationPresets;
  intensity: AnimationIntensity;
  reducedMotion: boolean;
  createAnimation: (config: AnimationConfig) => AnimeInstance;
  animateEntrance: (element: HTMLElement, type: EntranceAnimation, config?: Partial<AnimationConfig>) => AnimeInstance;
  animateExit: (element: HTMLElement, type: EntranceAnimation, config?: Partial<AnimationConfig>) => AnimeInstance;
  createHoverAnimation: (element: HTMLElement, config?: Partial<AnimationConfig>) => () => void;
}

export interface ScrollAnimationConfig extends AnimationConfig {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}