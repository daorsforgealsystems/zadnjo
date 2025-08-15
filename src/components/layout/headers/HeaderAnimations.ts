import anime from 'animejs';

export interface HeaderAnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  autoplay?: boolean;
}

export const headerAnimationPresets = {
  stickyTransition: {
    duration: 300,
    easing: 'easeOutQuad',
    delay: 0,
    autoplay: true,
  },
  slideIn: {
    duration: 400,
    easing: 'easeOutBack',
    delay: 0,
    autoplay: true,
  },
  expandCollapse: {
    duration: 350,
    easing: 'easeInOutQuad',
    delay: 0,
    autoplay: true,
  },
  logoSpin: {
    duration: 800,
    easing: 'easeOutElastic',
    delay: 0,
    autoplay: true,
  },
  searchExpand: {
    duration: 250,
    easing: 'easeOutQuad',
    delay: 0,
    autoplay: true,
  },
  userMenuReveal: {
    duration: 200,
    easing: 'easeOutQuart',
    delay: 0,
    autoplay: true,
  }
};

// Sticky header transition animation
export const animateStickyHeaderTransition = (
  element: HTMLElement,
  isSticky: boolean,
  config: HeaderAnimationConfig = headerAnimationPresets.stickyTransition
) => {
  return anime({
    targets: element,
    backgroundColor: isSticky 
      ? 'rgba(255, 255, 255, 0.95)' 
      : 'rgba(255, 255, 255, 1)',
    backdropFilter: isSticky ? 'blur(10px)' : 'blur(0px)',
    boxShadow: isSticky 
      ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      : '0 0 0 0 rgba(0, 0, 0, 0)',
    height: isSticky ? '60px' : '80px',
    duration: config.duration,
    easing: config.easing,
    complete: () => {
      // Animate logo and title scaling
      const logo = element.querySelector('[data-header-logo]');
      const title = element.querySelector('[data-header-title]');
      
      if (logo) {
        anime({
          targets: logo,
          scale: isSticky ? 0.8 : 1,
          duration: config.duration ? config.duration * 0.6 : 180,
          easing: config.easing,
        });
      }
      
      if (title) {
        anime({
          targets: title,
          fontSize: isSticky ? '1.25rem' : '1.5rem',
          duration: config.duration ? config.duration * 0.6 : 180,
          easing: config.easing,
        });
      }
    }
  });
};

// Slide-in header animation
export const animateSlideInHeader = (
  element: HTMLElement,
  direction: 'up' | 'down' = 'down',
  isVisible: boolean,
  config: HeaderAnimationConfig = headerAnimationPresets.slideIn
) => {
  const translateValue = direction === 'up' ? '-100%' : '100%';
  
  return anime({
    targets: element,
    translateY: isVisible ? '0%' : translateValue,
    opacity: isVisible ? 1 : 0,
    duration: config.duration,
    easing: config.easing,
  });
};

// Expandable header animation
export const animateExpandableHeader = (
  element: HTMLElement,
  isExpanded: boolean,
  expandedHeight: number,
  collapsedHeight: number,
  config: HeaderAnimationConfig = headerAnimationPresets.expandCollapse
) => {
  const expandedContent = element.querySelector('[data-expanded-content]');
  const mainContent = element.querySelector('[data-main-content]');
  
  anime({
    targets: element,
    height: isExpanded ? `${expandedHeight}px` : `${collapsedHeight}px`,
    duration: config.duration,
    easing: config.easing,
  });

  if (expandedContent) {
    anime({
      targets: expandedContent,
      opacity: isExpanded ? [0, 1] : [1, 0],
      translateY: isExpanded ? [20, 0] : [0, -20],
      duration: config.duration ? config.duration * 0.8 : 280,
      delay: isExpanded ? 100 : 0,
      easing: config.easing,
    });
  }

  if (mainContent) {
    anime({
      targets: mainContent,
      paddingY: isExpanded ? '1.5rem' : '1rem',
      duration: config.duration,
      easing: config.easing,
    });
  }
};

// Logo animation (spin, bounce, etc.)
export const animateHeaderLogo = (
  element: HTMLElement,
  animationType: 'spin' | 'bounce' | 'pulse' | 'shake' = 'spin',
  config: HeaderAnimationConfig = headerAnimationPresets.logoSpin
) => {
  const animations = {
    spin: {
      rotate: '360deg',
      scale: [1, 1.1, 1],
    },
    bounce: {
      translateY: [0, -10, 0],
      scale: [1, 1.1, 1],
    },
    pulse: {
      scale: [1, 1.2, 1],
      opacity: [1, 0.8, 1],
    },
    shake: {
      translateX: [-5, 5, -5, 5, 0],
      rotate: [-2, 2, -2, 2, 0],
    }
  };

  return anime({
    targets: element,
    ...animations[animationType],
    duration: config.duration,
    easing: config.easing,
  });
};

// Search bar expand/contract animation
export const animateHeaderSearch = (
  element: HTMLElement,
  isFocused: boolean,
  config: HeaderAnimationConfig = headerAnimationPresets.searchExpand
) => {
  const searchIcon = element.querySelector('[data-search-icon]');
  const searchInput = element.querySelector('[data-search-input]');
  
  anime({
    targets: element,
    width: isFocused ? '400px' : '300px',
    backgroundColor: isFocused ? '#ffffff' : '#f8fafc',
    borderColor: isFocused ? '#3b82f6' : '#e2e8f0',
    boxShadow: isFocused 
      ? '0 0 0 3px rgba(59, 130, 246, 0.1)' 
      : '0 1px 3px rgba(0, 0, 0, 0.1)',
    duration: config.duration,
    easing: config.easing,
  });

  if (searchIcon) {
    anime({
      targets: searchIcon,
      color: isFocused ? '#3b82f6' : '#6b7280',
      scale: isFocused ? 1.1 : 1,
      duration: config.duration,
      easing: config.easing,
    });
  }

  if (searchInput) {
    anime({
      targets: searchInput,
      fontSize: isFocused ? '1rem' : '0.875rem',
      duration: config.duration,
      easing: config.easing,
    });
  }
};

// User menu dropdown animation
export const animateUserMenuDropdown = (
  element: HTMLElement,
  isVisible: boolean,
  config: HeaderAnimationConfig = headerAnimationPresets.userMenuReveal
) => {
  const menuItems = element.querySelectorAll('[data-menu-item]');
  
  anime({
    targets: element,
    opacity: isVisible ? [0, 1] : [1, 0],
    scale: isVisible ? [0.95, 1] : [1, 0.95],
    translateY: isVisible ? [-10, 0] : [0, -10],
    duration: config.duration,
    easing: config.easing,
  });

  if (isVisible && menuItems.length > 0) {
    anime({
      targets: menuItems,
      opacity: [0, 1],
      translateX: [-10, 0],
      duration: config.duration ? config.duration * 0.8 : 160,
      delay: anime.stagger(30),
      easing: config.easing,
    });
  }
};

// Notification badge animation
export const animateNotificationBadge = (
  element: HTMLElement,
  count: number,
  config: HeaderAnimationConfig = {
    duration: 300,
    easing: 'easeOutBack'
  }
) => {
  if (count > 0) {
    // Show badge
    element.style.display = 'block';
    anime({
      targets: element,
      scale: [0, 1.2, 1],
      opacity: [0, 1],
      duration: config.duration,
      easing: config.easing,
    });
    
    // Pulse effect for new notifications
    anime({
      targets: element,
      scale: [1, 1.1, 1],
      duration: 600,
      delay: 500,
      direction: 'alternate',
      loop: 2,
      easing: 'easeInOutSine',
    });
  } else {
    // Hide badge
    anime({
      targets: element,
      scale: [1, 0],
      opacity: [1, 0],
      duration: config.duration,
      easing: 'easeInBack',
      complete: () => {
        element.style.display = 'none';
      }
    });
  }
};

// Header progress bar animation
export const animateHeaderProgressBar = (
  element: HTMLElement,
  progress: number,
  config: HeaderAnimationConfig = {
    duration: 500,
    easing: 'easeOutQuad'
  }
) => {
  return anime({
    targets: element,
    width: `${progress}%`,
    opacity: progress > 0 ? 1 : 0,
    duration: config.duration,
    easing: config.easing,
  });
};

// Breadcrumb navigation animation
export const animateBreadcrumbsUpdate = (
  container: HTMLElement,
  newBreadcrumbs: HTMLElement[],
  config: HeaderAnimationConfig = {
    duration: 300,
    easing: 'easeOutQuad'
  }
) => {
  const currentBreadcrumbs = Array.from(container.children) as HTMLElement[];
  
  // Fade out current breadcrumbs
  anime({
    targets: currentBreadcrumbs,
    opacity: [1, 0],
    translateX: [-20],
    duration: config.duration ? config.duration * 0.5 : 150,
    easing: config.easing,
    complete: () => {
      // Replace content
      container.innerHTML = '';
      newBreadcrumbs.forEach(breadcrumb => {
        container.appendChild(breadcrumb);
      });
      
      // Fade in new breadcrumbs
      anime({
        targets: newBreadcrumbs,
        opacity: [0, 1],
        translateX: [20, 0],
        duration: config.duration ? config.duration * 0.5 : 150,
        delay: anime.stagger(50),
        easing: config.easing,
      });
    }
  });
};

// Theme toggle animation
export const animateThemeToggle = (
  element: HTMLElement,
  theme: 'light' | 'dark',
  config: HeaderAnimationConfig = {
    duration: 400,
    easing: 'easeOutQuad'
  }
) => {
  const icon = element.querySelector('[data-theme-icon]');
  
  if (icon) {
    anime({
      targets: icon,
      rotate: [0, 180],
      scale: [1, 0.8, 1],
      duration: config.duration,
      easing: config.easing,
      complete: () => {
        // Switch icon (this would typically be handled by React state)
        icon.classList.toggle('hidden');
      }
    });
  }

  // Animate header background
  anime({
    targets: element.closest('header'),
    backgroundColor: theme === 'dark' 
      ? 'rgba(17, 24, 39, 0.95)' 
      : 'rgba(255, 255, 255, 0.95)',
    color: theme === 'dark' ? '#f9fafb' : '#111827',
    duration: config.duration,
    easing: config.easing,
  });
};

// Mobile menu toggle animation
export const animateMobileMenuToggle = (
  hamburgerElement: HTMLElement,
  menuElement: HTMLElement,
  isOpen: boolean,
  config: HeaderAnimationConfig = {
    duration: 300,
    easing: 'easeOutQuad'
  }
) => {
  // Hamburger animation
  const lines = hamburgerElement.querySelectorAll('[data-hamburger-line]');
  if (lines.length >= 3) {
    anime({
      targets: lines[0],
      translateY: isOpen ? 8 : 0,
      rotate: isOpen ? 45 : 0,
      duration: config.duration,
      easing: config.easing,
    });

    anime({
      targets: lines[1],
      opacity: isOpen ? 0 : 1,
      duration: config.duration ? config.duration * 0.5 : 150,
      easing: config.easing,
    });

    anime({
      targets: lines[2],
      translateY: isOpen ? -8 : 0,
      rotate: isOpen ? -45 : 0,
      duration: config.duration,
      easing: config.easing,
    });
  }

  // Menu animation
  anime({
    targets: menuElement,
    translateX: isOpen ? '0%' : '-100%',
    duration: config.duration,
    easing: config.easing,
  });
};

// Header loading animation
export const animateHeaderLoading = (
  element: HTMLElement,
  isLoading: boolean,
  config: HeaderAnimationConfig = {
    duration: 1200,
    easing: 'easeInOutSine'
  }
) => {
  const loadingElements = element.querySelectorAll('[data-loading-skeleton]');
  
  if (isLoading) {
    anime({
      targets: loadingElements,
      opacity: [0.3, 0.7, 0.3],
      duration: config.duration,
      direction: 'alternate',
      loop: true,
      easing: config.easing,
    });
  } else {
    anime.remove(loadingElements);
    anime({
      targets: loadingElements,
      opacity: 0,
      duration: 200,
      easing: 'easeOutQuad',
    });
  }
};

export default {
  animateStickyHeaderTransition,
  animateSlideInHeader,
  animateExpandableHeader,
  animateHeaderLogo,
  animateHeaderSearch,
  animateUserMenuDropdown,
  animateNotificationBadge,
  animateHeaderProgressBar,
  animateBreadcrumbsUpdate,
  animateThemeToggle,
  animateMobileMenuToggle,
  animateHeaderLoading,
  headerAnimationPresets,
};