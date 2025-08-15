import anime from 'animejs';
import { AnimationConfig, NavigationAnimations } from '@/types/animations';

export const navigationAnimationPresets: NavigationAnimations = {
  sidebarToggle: {
    duration: 300,
    easing: 'easeOutCubic',
    autoplay: false,
  },
  menuItemHover: {
    duration: 200,
    easing: 'easeOutQuad',
    autoplay: false,
  },
  breadcrumbTransition: {
    duration: 250,
    easing: 'easeInOutQuad',
    autoplay: false,
  },
  mobileMenuSlide: {
    duration: 350,
    easing: 'easeOutBack',
    autoplay: false,
  },
  searchExpansion: {
    duration: 200,
    easing: 'easeOutQuart',
    autoplay: false,
  },
};

export const animateSidebarToggle = (
  element: HTMLElement,
  isExpanded: boolean,
  config: AnimationConfig = navigationAnimationPresets.sidebarToggle
) => {
  return anime({
    targets: element,
    width: isExpanded ? '256px' : '64px',
    duration: config.duration,
    easing: config.easing,
    complete: () => {
      // Animate child elements
      const children = element.querySelectorAll('[data-animate-child]');
      if (children.length > 0) {
        anime({
          targets: children,
          opacity: isExpanded ? [0, 1] : [1, 0],
          translateX: isExpanded ? [-20, 0] : [0, -20],
          duration: config.duration ? config.duration * 0.6 : 180,
          delay: anime.stagger(30),
          easing: 'easeOutQuad',
        });
      }
      if (config.complete) config.complete();
    },
  });
};

export const animateMenuItemHover = (
  element: HTMLElement,
  isHovering: boolean,
  config: AnimationConfig = navigationAnimationPresets.menuItemHover
) => {
  return anime({
    targets: element,
    backgroundColor: isHovering 
      ? 'rgba(var(--primary), 0.1)' 
      : 'transparent',
    scale: isHovering ? 1.02 : 1,
    duration: config.duration,
    easing: config.easing,
    complete: config.complete,
  });
};

export const animateBreadcrumbTransition = (
  element: HTMLElement,
  config: AnimationConfig = navigationAnimationPresets.breadcrumbTransition
) => {
  return anime({
    targets: element.children,
    opacity: [0, 1],
    translateX: [20, 0],
    duration: config.duration,
    delay: anime.stagger(50),
    easing: config.easing,
    complete: config.complete,
  });
};

export const animateMobileMenuSlide = (
  element: HTMLElement,
  isOpen: boolean,
  config: AnimationConfig = navigationAnimationPresets.mobileMenuSlide
) => {
  return anime({
    targets: element,
    translateX: isOpen ? '0%' : '-100%',
    duration: config.duration,
    easing: config.easing,
    complete: () => {
      if (isOpen) {
        // Animate menu items in
        const menuItems = element.querySelectorAll('.mobile-menu-item');
        anime({
          targets: menuItems,
          opacity: [0, 1],
          translateX: [-30, 0],
          duration: 200,
          delay: anime.stagger(50),
          easing: 'easeOutQuad',
        });
      }
      if (config.complete) config.complete();
    },
  });
};

export const animateSearchExpansion = (
  element: HTMLElement,
  isExpanded: boolean,
  config: AnimationConfig = navigationAnimationPresets.searchExpansion
) => {
  return anime({
    targets: element,
    width: isExpanded ? '300px' : '200px',
    duration: config.duration,
    easing: config.easing,
    complete: config.complete,
  });
};

export const animateDropdown = (
  element: HTMLElement,
  isOpen: boolean,
  config?: Partial<AnimationConfig>
) => {
  const animation = anime({
    targets: element,
    maxHeight: isOpen ? '300px' : '0px',
    opacity: isOpen ? 1 : 0,
    duration: config?.duration || 250,
    easing: config?.easing || 'easeOutQuart',
    complete: config?.complete,
  });

  if (isOpen) {
    // Animate children
    const children = element.children;
    anime({
      targets: children,
      opacity: [0, 1],
      translateY: [-10, 0],
      duration: 200,
      delay: anime.stagger(30),
      easing: 'easeOutQuad',
    });
  }

  return animation;
};