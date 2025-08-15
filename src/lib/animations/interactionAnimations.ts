import anime from 'animejs';
import { AnimationConfig, InteractionAnimations, EntranceAnimation } from '@/types/animations';

export const interactionAnimationPresets: InteractionAnimations = {
  buttonHover: {
    duration: 200,
    easing: 'easeOutQuad',
    autoplay: false,
  },
  cardHover: {
    duration: 300,
    easing: 'easeOutCubic',
    autoplay: false,
  },
  modalEntrance: {
    duration: 400,
    easing: 'easeOutBack',
    autoplay: false,
  },
  tooltipShow: {
    duration: 150,
    easing: 'easeOutQuart',
    autoplay: false,
  },
  loadingSpinner: {
    duration: 1000,
    easing: 'linear',
    autoplay: true,
    loop: true,
  },
};

export const animateButtonHover = (
  element: HTMLElement,
  isHovering: boolean,
  config: AnimationConfig = interactionAnimationPresets.buttonHover
) => {
  return anime({
    targets: element,
    scale: isHovering ? 1.05 : 1,
    boxShadow: isHovering 
      ? '0 4px 12px rgba(0,0,0,0.15)'
      : '0 2px 4px rgba(0,0,0,0.1)',
    duration: config.duration,
    easing: config.easing,
    complete: config.complete,
  });
};

export const animateCardHover = (
  element: HTMLElement,
  isHovering: boolean,
  config: AnimationConfig = interactionAnimationPresets.cardHover
) => {
  return anime({
    targets: element,
    translateY: isHovering ? -5 : 0,
    boxShadow: isHovering
      ? '0 8px 25px rgba(0,0,0,0.15)'
      : '0 2px 8px rgba(0,0,0,0.1)',
    duration: config.duration,
    easing: config.easing,
    complete: config.complete,
  });
};

export const animateModalEntrance = (
  element: HTMLElement,
  config: AnimationConfig = interactionAnimationPresets.modalEntrance
) => {
  // Initial state
  anime.set(element, {
    scale: 0.7,
    opacity: 0,
    translateY: 50,
  });

  return anime({
    targets: element,
    scale: [0.7, 1],
    opacity: [0, 1],
    translateY: [50, 0],
    duration: config.duration,
    easing: config.easing,
    complete: config.complete,
  });
};

export const animateTooltipShow = (
  element: HTMLElement,
  isVisible: boolean,
  config: AnimationConfig = interactionAnimationPresets.tooltipShow
) => {
  if (isVisible) {
    anime.set(element, {
      scale: 0.8,
      opacity: 0,
      translateY: 10,
    });
  }

  return anime({
    targets: element,
    scale: isVisible ? [0.8, 1] : [1, 0.8],
    opacity: isVisible ? [0, 1] : [1, 0],
    translateY: isVisible ? [10, 0] : [0, 10],
    duration: config.duration,
    easing: config.easing,
    complete: config.complete,
  });
};

export const animateLoadingSpinner = (
  element: HTMLElement,
  config: AnimationConfig = interactionAnimationPresets.loadingSpinner
) => {
  return anime({
    targets: element,
    rotate: '360deg',
    duration: config.duration,
    easing: config.easing,
    loop: config.loop,
    complete: config.complete,
  });
};

// Entrance animations
export const entranceAnimations = {
  fadeIn: (element: HTMLElement, config?: Partial<AnimationConfig>) => {
    anime.set(element, { opacity: 0 });
    return anime({
      targets: element,
      opacity: [0, 1],
      duration: config?.duration || 300,
      easing: config?.easing || 'easeOutQuad',
      complete: config?.complete,
    });
  },

  slideUp: (element: HTMLElement, config?: Partial<AnimationConfig>) => {
    anime.set(element, { 
      opacity: 0,
      translateY: 30,
    });
    return anime({
      targets: element,
      opacity: [0, 1],
      translateY: [30, 0],
      duration: config?.duration || 400,
      easing: config?.easing || 'easeOutBack',
      complete: config?.complete,
    });
  },

  slideDown: (element: HTMLElement, config?: Partial<AnimationConfig>) => {
    anime.set(element, { 
      opacity: 0,
      translateY: -30,
    });
    return anime({
      targets: element,
      opacity: [0, 1],
      translateY: [-30, 0],
      duration: config?.duration || 400,
      easing: config?.easing || 'easeOutBack',
      complete: config?.complete,
    });
  },

  slideLeft: (element: HTMLElement, config?: Partial<AnimationConfig>) => {
    anime.set(element, { 
      opacity: 0,
      translateX: 30,
    });
    return anime({
      targets: element,
      opacity: [0, 1],
      translateX: [30, 0],
      duration: config?.duration || 400,
      easing: config?.easing || 'easeOutBack',
      complete: config?.complete,
    });
  },

  slideRight: (element: HTMLElement, config?: Partial<AnimationConfig>) => {
    anime.set(element, { 
      opacity: 0,
      translateX: -30,
    });
    return anime({
      targets: element,
      opacity: [0, 1],
      translateX: [-30, 0],
      duration: config?.duration || 400,
      easing: config?.easing || 'easeOutBack',
      complete: config?.complete,
    });
  },

  scaleIn: (element: HTMLElement, config?: Partial<AnimationConfig>) => {
    anime.set(element, { 
      opacity: 0,
      scale: 0.8,
    });
    return anime({
      targets: element,
      opacity: [0, 1],
      scale: [0.8, 1],
      duration: config?.duration || 350,
      easing: config?.easing || 'easeOutElastic(1, .6)',
      complete: config?.complete,
    });
  },

  bounceIn: (element: HTMLElement, config?: Partial<AnimationConfig>) => {
    anime.set(element, { 
      opacity: 0,
      scale: 0.3,
    });
    return anime({
      targets: element,
      opacity: [0, 1],
      scale: [0.3, 1],
      duration: config?.duration || 600,
      easing: config?.easing || 'easeOutElastic(1, .8)',
      complete: config?.complete,
    });
  },
};

export const animateEntrance = (
  element: HTMLElement,
  type: EntranceAnimation,
  config?: Partial<AnimationConfig>
) => {
  const animator = entranceAnimations[type];
  if (!animator) {
    throw new Error(`Animation type "${type}" not found`);
  }
  return animator(element, config);
};

export const animateStaggeredEntrance = (
  elements: HTMLElement[],
  type: EntranceAnimation,
  staggerDelay: number = 100,
  config?: Partial<AnimationConfig>
) => {
  return elements.map((element, index) => {
    const delayedConfig = {
      ...config,
      delay: (config?.delay || 0) + (index * staggerDelay),
    };
    return animateEntrance(element, type, delayedConfig);
  });
};

export const createRippleEffect = (
  element: HTMLElement,
  event: MouseEvent
) => {
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  const ripple = document.createElement('span');
  ripple.className = 'ripple-effect';
  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    pointer-events: none;
    z-index: 1000;
  `;

  element.appendChild(ripple);

  anime({
    targets: ripple,
    scale: [0, 2],
    opacity: [1, 0],
    duration: 600,
    easing: 'easeOutQuart',
    complete: () => {
      ripple.remove();
    },
  });
};