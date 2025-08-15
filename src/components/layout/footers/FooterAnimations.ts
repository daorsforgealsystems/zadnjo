import anime from 'animejs';

export interface FooterAnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  autoplay?: boolean;
}

export const footerAnimationPresets = {
  slideUp: {
    duration: 500,
    easing: 'easeOutQuad',
    delay: 0,
    autoplay: true,
  },
  fadeIn: {
    duration: 600,
    easing: 'easeOutExpo',
    delay: 0,
    autoplay: true,
  },
  expandCollapse: {
    duration: 400,
    easing: 'easeInOutQuad',
    delay: 0,
    autoplay: true,
  },
  socialHover: {
    duration: 200,
    easing: 'easeOutBack',
    delay: 0,
    autoplay: true,
  },
  newsletterSuccess: {
    duration: 300,
    easing: 'easeOutBack',
    delay: 0,
    autoplay: true,
  },
  backToTop: {
    duration: 800,
    easing: 'easeOutQuart',
    delay: 0,
    autoplay: true,
  }
};

// Footer slide up animation
export const animateFooterSlideUp = (
  element: HTMLElement,
  config: FooterAnimationConfig = footerAnimationPresets.slideUp
) => {
  const sections = element.querySelectorAll('[data-footer-section]');
  
  // Set initial state
  element.style.transform = 'translateY(100px)';
  element.style.opacity = '0';
  
  return anime({
    targets: element,
    translateY: [100, 0],
    opacity: [0, 1],
    duration: config.duration,
    easing: config.easing,
    complete: () => {
      if (sections.length > 0) {
        anime({
          targets: sections,
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 400,
          delay: anime.stagger(100),
          easing: 'easeOutQuad',
        });
      }
    }
  });
};

// Footer sections staggered fade in
export const animateFooterSections = (
  sections: HTMLElement[],
  config: FooterAnimationConfig = footerAnimationPresets.fadeIn
) => {
  // Set initial state
  sections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
  });

  return anime({
    targets: sections,
    opacity: [0, 1],
    translateY: [30, 0],
    duration: config.duration,
    delay: anime.stagger(150, {start: 200}),
    easing: config.easing,
    complete: () => {
      sections.forEach(section => {
        section.style.transform = '';
      });
    }
  });
};

// Footer expand/collapse animation
export const animateFooterExpand = (
  element: HTMLElement,
  isExpanded: boolean,
  expandedHeight: number,
  collapsedHeight: number,
  config: FooterAnimationConfig = footerAnimationPresets.expandCollapse
) => {
  const expandableContent = element.querySelector('[data-expandable-content]');
  
  anime({
    targets: element,
    height: isExpanded ? `${expandedHeight}px` : `${collapsedHeight}px`,
    duration: config.duration,
    easing: config.easing,
  });

  if (expandableContent) {
    anime({
      targets: expandableContent,
      opacity: isExpanded ? [0, 1] : [1, 0],
      maxHeight: isExpanded ? 'auto' : '0px',
      duration: config.duration,
      easing: config.easing,
    });
  }
};

// Social icons hover animation
export const animateSocialIconHover = (
  element: HTMLElement,
  isHovered: boolean,
  config: FooterAnimationConfig = footerAnimationPresets.socialHover
) => {
  const icon = element.querySelector('[data-social-icon]');
  
  anime({
    targets: element,
    scale: isHovered ? 1.1 : 1,
    translateY: isHovered ? -2 : 0,
    backgroundColor: isHovered ? '#3b82f6' : 'transparent',
    duration: config.duration,
    easing: config.easing,
  });

  if (icon) {
    anime({
      targets: icon,
      color: isHovered ? '#ffffff' : '#6b7280',
      rotate: isHovered ? '5deg' : '0deg',
      duration: config.duration,
      easing: config.easing,
    });
  }
};

// Newsletter signup success animation
export const animateNewsletterSuccess = (
  formElement: HTMLElement,
  successMessage: HTMLElement,
  config: FooterAnimationConfig = footerAnimationPresets.newsletterSuccess
) => {
  const timeline = anime.timeline({
    easing: config.easing,
  });

  // Hide form
  timeline.add({
    targets: formElement,
    opacity: [1, 0],
    scale: [1, 0.8],
    duration: config.duration,
  });

  // Show success message
  timeline.add({
    targets: successMessage,
    opacity: [0, 1],
    scale: [0.8, 1],
    translateY: [10, 0],
    duration: config.duration,
  }, `-=${config.duration ? config.duration * 0.3 : 90}`);

  return timeline;
};

// Back to top button animation
export const animateBackToTop = (
  element: HTMLElement,
  isVisible: boolean,
  config: FooterAnimationConfig = footerAnimationPresets.backToTop
) => {
  if (isVisible) {
    element.style.display = 'block';
    anime({
      targets: element,
      opacity: [0, 1],
      scale: [0.8, 1],
      translateY: [20, 0],
      duration: 300,
      easing: 'easeOutBack',
    });
  } else {
    anime({
      targets: element,
      opacity: [1, 0],
      scale: [1, 0.8],
      translateY: [0, 20],
      duration: 300,
      easing: 'easeInBack',
      complete: () => {
        element.style.display = 'none';
      }
    });
  }
};

// Back to top click animation
export const animateBackToTopClick = (
  element: HTMLElement,
  config: FooterAnimationConfig = footerAnimationPresets.backToTop
) => {
  // Button click feedback
  anime({
    targets: element,
    scale: [1, 0.9, 1],
    rotate: [0, 10, 0],
    duration: 200,
    easing: 'easeOutQuad',
  });

  // Scroll animation would typically be handled separately
  return anime({
    targets: document.documentElement,
    scrollTop: 0,
    duration: config.duration,
    easing: config.easing,
  });
};

// Footer links hover animation
export const animateFooterLinkHover = (
  element: HTMLElement,
  isHovered: boolean,
  config: FooterAnimationConfig = {
    duration: 150,
    easing: 'easeOutQuad'
  }
) => {
  return anime({
    targets: element,
    color: isHovered ? '#3b82f6' : '#6b7280',
    translateX: isHovered ? 4 : 0,
    duration: config.duration,
    easing: config.easing,
  });
};

// Footer logo animation
export const animateFooterLogo = (
  element: HTMLElement,
  animationType: 'pulse' | 'bounce' | 'rotate' = 'pulse',
  config: FooterAnimationConfig = {
    duration: 600,
    easing: 'easeInOutSine'
  }
) => {
  const animations = {
    pulse: {
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1],
    },
    bounce: {
      translateY: [0, -5, 0],
      scale: [1, 1.05, 1],
    },
    rotate: {
      rotate: [0, 5, -5, 0],
      scale: [1, 1.02, 1],
    }
  };

  return anime({
    targets: element,
    ...animations[animationType],
    duration: config.duration,
    direction: 'alternate',
    loop: true,
    easing: config.easing,
  });
};

// Copyright text typing animation
export const animateCopyrightText = (
  element: HTMLElement,
  config: FooterAnimationConfig = {
    duration: 2000,
    easing: 'linear'
  }
) => {
  const text = element.textContent || '';
  element.textContent = '';

  let currentChar = 0;
  
  return anime({
    duration: config.duration,
    easing: config.easing,
    update: (anim) => {
      const progress = anim.progress / 100;
      const charsToShow = Math.floor(progress * text.length);
      
      if (charsToShow > currentChar) {
        element.textContent = text.substring(0, charsToShow);
        currentChar = charsToShow;
      }
    }
  });
};

// Footer divider animation
export const animateFooterDivider = (
  element: HTMLElement,
  config: FooterAnimationConfig = {
    duration: 800,
    easing: 'easeOutQuad'
  }
) => {
  return anime({
    targets: element,
    scaleX: [0, 1],
    opacity: [0, 1],
    duration: config.duration,
    easing: config.easing,
  });
};

// Newsletter input focus animation
export const animateNewsletterInputFocus = (
  element: HTMLElement,
  isFocused: boolean,
  config: FooterAnimationConfig = {
    duration: 200,
    easing: 'easeOutQuad'
  }
) => {
  return anime({
    targets: element,
    borderColor: isFocused ? '#3b82f6' : '#e5e7eb',
    backgroundColor: isFocused ? '#ffffff' : '#f9fafb',
    boxShadow: isFocused 
      ? '0 0 0 3px rgba(59, 130, 246, 0.1)' 
      : '0 1px 3px rgba(0, 0, 0, 0.1)',
    duration: config.duration,
    easing: config.easing,
  });
};

// Footer sticky animation
export const animateFooterSticky = (
  element: HTMLElement,
  isSticky: boolean,
  config: FooterAnimationConfig = {
    duration: 300,
    easing: 'easeOutQuad'
  }
) => {
  return anime({
    targets: element,
    boxShadow: isSticky 
      ? '0 -4px 6px -1px rgba(0, 0, 0, 0.1)' 
      : '0 0 0 0 rgba(0, 0, 0, 0)',
    backgroundColor: isSticky 
      ? 'rgba(255, 255, 255, 0.95)' 
      : 'rgba(255, 255, 255, 1)',
    backdropFilter: isSticky ? 'blur(10px)' : 'blur(0px)',
    duration: config.duration,
    easing: config.easing,
  });
};

// Footer contact info reveal animation
export const animateContactInfoReveal = (
  elements: HTMLElement[],
  config: FooterAnimationConfig = {
    duration: 400,
    easing: 'easeOutQuad'
  }
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

// Footer mobile accordion animation
export const animateFooterMobileAccordion = (
  headerElement: HTMLElement,
  contentElement: HTMLElement,
  isExpanded: boolean,
  config: FooterAnimationConfig = {
    duration: 300,
    easing: 'easeInOutQuad'
  }
) => {
  const chevron = headerElement.querySelector('[data-accordion-chevron]');
  
  // Animate chevron
  if (chevron) {
    anime({
      targets: chevron,
      rotate: isExpanded ? '180deg' : '0deg',
      duration: config.duration,
      easing: config.easing,
    });
  }

  // Animate content
  anime({
    targets: contentElement,
    height: isExpanded ? 'auto' : '0px',
    opacity: isExpanded ? [0, 1] : [1, 0],
    duration: config.duration,
    easing: config.easing,
  });
};

export default {
  animateFooterSlideUp,
  animateFooterSections,
  animateFooterExpand,
  animateSocialIconHover,
  animateNewsletterSuccess,
  animateBackToTop,
  animateBackToTopClick,
  animateFooterLinkHover,
  animateFooterLogo,
  animateCopyrightText,
  animateFooterDivider,
  animateNewsletterInputFocus,
  animateFooterSticky,
  animateContactInfoReveal,
  animateFooterMobileAccordion,
  footerAnimationPresets,
};