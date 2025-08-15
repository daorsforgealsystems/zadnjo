import { AnimeParams } from 'animejs';

export interface AnimationConfig extends Omit<AnimeParams, 'duration' | 'easing' | 'delay' | 'complete' | 'autoplay'> {
  duration: number;
  easing: string;
  delay?: number;
  complete?: () => void;
  autoplay?: boolean;
  targets: HTMLElement | HTMLElement[];
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
  createAnimation: (config: AnimationConfig) => any;
  animateEntrance: (element: HTMLElement, type: EntranceAnimation, config?: Partial<AnimationConfig>) => any;
  animateExit: (element: HTMLElement, type: EntranceAnimation, config?: Partial<AnimationConfig>) => any;
  createHoverAnimation: (element: HTMLElement, config?: Partial<AnimationConfig>) => any;
}

export interface ScrollAnimationConfig extends AnimationConfig {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}