import anime from 'animejs';
import { AnimationConfig, LayoutAnimations } from '@/types/animations';

export const layoutAnimationPresets: LayoutAnimations = {
  gridReorder: {
    duration: 400,
    easing: 'easeOutBack',
    autoplay: false,
  },
  componentAdd: {
    duration: 500,
    easing: 'easeOutElastic(1, .6)',
    autoplay: false,
  },
  componentRemove: {
    duration: 300,
    easing: 'easeInBack',
    autoplay: false,
  },
  containerResize: {
    duration: 350,
    easing: 'easeOutCubic',
    autoplay: false,
  },
  breakpointTransition: {
    duration: 450,
    easing: 'easeOutQuart',
    autoplay: false,
  },
};

export const animateGridReorder = (
  elements: HTMLElement[],
  newPositions: { x: number; y: number }[],
  config: AnimationConfig = layoutAnimationPresets.gridReorder
) => {
  const animations = elements.map((element, index) => {
    const newPos = newPositions[index];
    return anime({
      targets: element,
      translateX: newPos.x,
      translateY: newPos.y,
      duration: config.duration,
      easing: config.easing,
      autoplay: false,
    });
  });

  animations.forEach(animation => animation.play());
  return animations;
};

export const animateComponentAdd = (
  element: HTMLElement,
  config: AnimationConfig = layoutAnimationPresets.componentAdd
) => {
  // Initial state
  anime.set(element, {
    scale: 0,
    opacity: 0,
    rotateY: 90,
  });

  return anime({
    targets: element,
    scale: [0, 1],
    opacity: [0, 1],
    rotateY: [90, 0],
    duration: config.duration,
    easing: config.easing,
    complete: config.complete,
  });
};

export const animateComponentRemove = (
  element: HTMLElement,
  config: AnimationConfig = layoutAnimationPresets.componentRemove
) => {
  return anime({
    targets: element,
    scale: [1, 0],
    opacity: [1, 0],
    rotateY: [0, -90],
    duration: config.duration,
    easing: config.easing,
    complete: () => {
      element.remove();
      if (config.complete) config.complete();
    },
  });
};

export const animateContainerResize = (
  element: HTMLElement,
  newDimensions: { width: number; height: number },
  config: AnimationConfig = layoutAnimationPresets.containerResize
) => {
  return anime({
    targets: element,
    width: newDimensions.width,
    height: newDimensions.height,
    duration: config.duration,
    easing: config.easing,
    complete: config.complete,
  });
};

export const animateBreakpointTransition = (
  elements: HTMLElement[],
  config: AnimationConfig = layoutAnimationPresets.breakpointTransition
) => {
  return anime({
    targets: elements,
    scale: [0.95, 1],
    opacity: [0.7, 1],
    duration: config.duration,
    delay: anime.stagger(30),
    easing: config.easing,
    complete: config.complete,
  });
};

export const animateDragStart = (element: HTMLElement) => {
  return anime({
    targets: element,
    scale: 1.05,
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    zIndex: 1000,
    duration: 200,
    easing: 'easeOutQuad',
  });
};

export const animateDragEnd = (element: HTMLElement) => {
  return anime({
    targets: element,
    scale: 1,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    zIndex: 'auto',
    duration: 200,
    easing: 'easeOutQuad',
  });
};

export const animateDropPreview = (
  element: HTMLElement,
  position: { x: number; y: number }
) => {
  return anime({
    targets: element,
    translateX: position.x,
    translateY: position.y,
    opacity: 0.7,
    duration: 150,
    easing: 'easeOutQuart',
  });
};

export const animateDropSuccess = (element: HTMLElement) => {
  return anime({
    targets: element,
    scale: [1.1, 1],
    duration: 300,
    easing: 'easeOutElastic(1, .8)',
  });
};

export const animateLayoutShift = (
  elements: HTMLElement[],
  positions: { element: HTMLElement; x: number; y: number }[]
) => {
  return anime({
    targets: positions.map(p => p.element),
    translateX: (el, i) => positions[i].x,
    translateY: (el, i) => positions[i].y,
    duration: 400,
    easing: 'easeOutQuart',
  });
};