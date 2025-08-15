import anime from 'animejs';

export interface NavigationAnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  autoplay?: boolean;
}

export const navigationAnimationPresets = {
  sidebarToggle: {
    duration: 300,
    easing: 'easeOutQuad',
    delay: 0,
    autoplay: true,
  },
  menuItemHover: {
    duration: 200,
    easing: 'easeOutQuad',
    delay: 0,
    autoplay: true,
  },
  breadcrumbsReveal: {
    duration: 400,
    easing: 'easeOutExpo',
    delay: 0,
    autoplay: true,
  },
  mobileMenuSlide: {
    duration: 350,
    easing: 'easeOutBack',
    delay: 0,
    autoplay: true,
  },
  navbarScroll: {
    duration: 250,
    easing: 'easeOutQuad',
    delay: 0,
    autoplay: true,
  },
  dropdownReveal: {
    duration: 200,
    easing: 'easeOutQuart',
    delay: 0,
    autoplay: true,
  }
};

// Sidebar toggle animation with child elements
export const animateSidebarToggle = (
  element: HTMLElement,
  isExpanded: boolean,
  config: NavigationAnimationConfig = navigationAnimationPresets.sidebarToggle
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
    },
  });
};

// Menu item hover animation
export const animateMenuItemHover = (
  element: HTMLElement,
  isHovered: boolean,
  config: NavigationAnimationConfig = navigationAnimationPresets.menuItemHover
) => {
  const icon = element.querySelector('[data-nav-icon]');
  const text = element.querySelector('[data-nav-text]');
  const indicator = element.querySelector('[data-nav-indicator]');

  anime({
    targets: element,
    backgroundColor: isHovered ? '#f1f5f9' : 'transparent',
    duration: config.duration,
    easing: config.easing,
  });

  if (icon) {
    anime({
      targets: icon,
      scale: isHovered ? 1.1 : 1,
      rotate: isHovered ? '5deg' : '0deg',
      duration: config.duration,
      easing: config.easing,
    });
  }

  if (text) {
    anime({
      targets: text,
      translateX: isHovered ? 4 : 0,
      duration: config.duration,
      easing: config.easing,
    });
  }

  if (indicator) {
    anime({
      targets: indicator,
      scaleX: isHovered ? 1 : 0,
      duration: config.duration,
      easing: config.easing,
    });
  }
};

// Animated breadcrumbs reveal
export const animateBreadcrumbsReveal = (
  elements: HTMLElement[],
  config: NavigationAnimationConfig = navigationAnimationPresets.breadcrumbsReveal
) => {
  return anime({
    targets: elements,
    opacity: [0, 1],
    translateX: [-20, 0],
    duration: config.duration,
    delay: anime.stagger(100),
    easing: config.easing,
  });
};

// Mobile menu slide animation
export const animateMobileMenuSlide = (
  element: HTMLElement,
  isOpen: boolean,
  config: NavigationAnimationConfig = navigationAnimationPresets.mobileMenuSlide
) => {
  const menuItems = element.querySelectorAll('[data-mobile-menu-item]');
  
  anime({
    targets: element,
    translateX: isOpen ? 0 : '-100%',
    duration: config.duration,
    easing: config.easing,
  });

  if (isOpen && menuItems.length > 0) {
    anime({
      targets: menuItems,
      opacity: [0, 1],
      translateX: [-30, 0],
      duration: config.duration ? config.duration * 0.8 : 280,
      delay: anime.stagger(50, {start: 100}),
      easing: 'easeOutQuad',
    });
  }
};

// Navbar scroll animation
export const animateNavbarScroll = (
  element: HTMLElement,
  isScrolled: boolean,
  config: NavigationAnimationConfig = navigationAnimationPresets.navbarScroll
) => {
  return anime({
    targets: element,
    backgroundColor: isScrolled 
      ? 'rgba(255, 255, 255, 0.95)' 
      : 'rgba(255, 255, 255, 0)',
    boxShadow: isScrolled 
      ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
      : '0 0 0 0 rgba(0, 0, 0, 0)',
    backdropFilter: isScrolled ? 'blur(10px)' : 'blur(0px)',
    duration: config.duration,
    easing: config.easing,
  });
};

// Dropdown menu reveal animation
export const animateDropdownReveal = (
  element: HTMLElement,
  isVisible: boolean,
  config: NavigationAnimationConfig = navigationAnimationPresets.dropdownReveal
) => {
  const items = element.querySelectorAll('[data-dropdown-item]');
  
  anime({
    targets: element,
    opacity: isVisible ? [0, 1] : [1, 0],
    scale: isVisible ? [0.95, 1] : [1, 0.95],
    translateY: isVisible ? [-10, 0] : [0, -10],
    duration: config.duration,
    easing: config.easing,
  });

  if (isVisible && items.length > 0) {
    anime({
      targets: items,
      opacity: [0, 1],
      translateY: [-10, 0],
      duration: config.duration ? config.duration * 0.8 : 160,
      delay: anime.stagger(30),
      easing: config.easing,
    });
  }
};

// Active menu item highlight animation
export const animateActiveMenuItem = (
  element: HTMLElement,
  config: NavigationAnimationConfig = navigationAnimationPresets.menuItemHover
) => {
  const indicator = element.querySelector('[data-nav-indicator]');
  
  anime({
    targets: element,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    duration: config.duration,
    easing: config.easing,
  });

  if (indicator) {
    anime({
      targets: indicator,
      scaleX: [0, 1],
      backgroundColor: '#ffffff',
      duration: config.duration,
      easing: config.easing,
    });
  }
};

// Tab navigation animation
export const animateTabNavigation = (
  activeTab: HTMLElement,
  previousTab?: HTMLElement,
  config: NavigationAnimationConfig = navigationAnimationPresets.menuItemHover
) => {
  const timeline = anime.timeline({
    easing: config.easing,
    duration: config.duration,
  });

  if (previousTab) {
    timeline.add({
      targets: previousTab,
      opacity: 0.6,
      borderBottomColor: 'transparent',
    });
  }

  timeline.add({
    targets: activeTab,
    opacity: 1,
    borderBottomColor: '#3b82f6',
    borderBottomWidth: '2px',
  });
};

// Search bar focus animation
export const animateSearchFocus = (
  searchElement: HTMLElement,
  isFocused: boolean,
  config: NavigationAnimationConfig = navigationAnimationPresets.menuItemHover
) => {
  const searchIcon = searchElement.querySelector('[data-search-icon]');
  
  anime({
    targets: searchElement,
    width: isFocused ? '320px' : '200px',
    backgroundColor: isFocused ? '#f8fafc' : '#f1f5f9',
    borderColor: isFocused ? '#3b82f6' : '#e2e8f0',
    duration: config.duration,
    easing: config.easing,
  });

  if (searchIcon) {
    anime({
      targets: searchIcon,
      color: isFocused ? '#3b82f6' : '#64748b',
      scale: isFocused ? 1.1 : 1,
      duration: config.duration,
      easing: config.easing,
    });
  }
};

// User menu avatar animation
export const animateUserMenuToggle = (
  avatarElement: HTMLElement,
  menuElement: HTMLElement,
  isOpen: boolean,
  config: NavigationAnimationConfig = navigationAnimationPresets.dropdownReveal
) => {
  // Avatar animation
  anime({
    targets: avatarElement,
    scale: isOpen ? 1.1 : 1,
    rotate: isOpen ? '5deg' : '0deg',
    duration: config.duration,
    easing: config.easing,
  });

  // Menu animation
  anime({
    targets: menuElement,
    opacity: isOpen ? [0, 1] : [1, 0],
    scale: isOpen ? [0.9, 1] : [1, 0.9],
    translateY: isOpen ? [10, 0] : [0, 10],
    duration: config.duration,
    easing: config.easing,
    complete: () => {
      if (!isOpen) {
        menuElement.style.display = 'none';
      }
    }
  });

  if (isOpen) {
    menuElement.style.display = 'block';
  }
};

// Notification badge pulse animation
export const animateNotificationBadge = (
  element: HTMLElement,
  config: NavigationAnimationConfig = {
    duration: 1000,
    easing: 'easeInOutSine'
  }
) => {
  return anime({
    targets: element,
    scale: [1, 1.2, 1],
    opacity: [1, 0.8, 1],
    duration: config.duration,
    direction: 'alternate',
    loop: true,
    easing: config.easing,
  });
};

// Navigation loading skeleton animation
export const animateNavigationSkeleton = (
  elements: HTMLElement[],
  config: NavigationAnimationConfig = {
    duration: 1200,
    easing: 'easeInOutSine'
  }
) => {
  return anime({
    targets: elements,
    opacity: [0.3, 1, 0.3],
    duration: config.duration,
    loop: true,
    direction: 'alternate',
    easing: config.easing,
  });
};

// Page transition with navigation context
export const animatePageTransition = (
  outgoingPage: HTMLElement,
  incomingPage: HTMLElement,
  direction: 'left' | 'right' | 'up' | 'down' = 'right',
  config: NavigationAnimationConfig = {
    duration: 400,
    easing: 'easeInOutQuad'
  }
) => {
  const translateValues = {
    left: { out: '-100%', in: '100%' },
    right: { out: '100%', in: '-100%' },
    up: { out: '-100%', in: '100%' },
    down: { out: '100%', in: '-100%' }
  };

  const isVertical = direction === 'up' || direction === 'down';
  const translateProperty = isVertical ? 'translateY' : 'translateX';

  const timeline = anime.timeline({
    easing: config.easing,
    duration: config.duration,
  });

  // Animate outgoing page
  timeline.add({
    targets: outgoingPage,
    [translateProperty]: translateValues[direction].out,
    opacity: [1, 0],
  });

  // Animate incoming page
  timeline.add({
    targets: incomingPage,
    [translateProperty]: [translateValues[direction].in, '0%'],
    opacity: [0, 1],
  }, `-=${config.duration ? config.duration * 0.3 : 120}`);

  return timeline;
};

export default {
  animateSidebarToggle,
  animateMenuItemHover,
  animateBreadcrumbsReveal,
  animateMobileMenuSlide,
  animateNavbarScroll,
  animateDropdownReveal,
  animateActiveMenuItem,
  animateTabNavigation,
  animateSearchFocus,
  animateUserMenuToggle,
  animateNotificationBadge,
  animateNavigationSkeleton,
  animatePageTransition,
  navigationAnimationPresets,
};