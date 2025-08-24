import type { Variants, Easing } from 'framer-motion';

// Page transition variants
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: 'spring' as const, 
      stiffness: 300, 
      damping: 30,
      mass: 1
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { 
      duration: 0.2, 
      ease: 'easeInOut' as const 
    }
  }
};

// Auth page transition variants
const easeOut: Easing = [0.22, 1, 0.36, 1];
const easeInOut: Easing = [0.4, 0, 1, 1];

export const authFade: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
  transition: { duration: 0.3, ease: easeOut }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
  transition: { duration: 0.2, ease: easeInOut }
  }
};

// Nested route transition variants
export const nestedFadeSlide: Variants = {
  initial: { opacity: 0, x: 10 },
  animate: { 
    opacity: 1, 
    x: 0,
  transition: { duration: 0.2, ease: easeOut }
  },
  exit: { 
    opacity: 0, 
    x: -10,
  transition: { duration: 0.15, ease: easeInOut }
  }
};

// Card hover variants
export const cardHover: Variants = {
  rest: { scale: 1, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  hover: { 
    scale: 1.03, 
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    transition: { duration: 0.3, ease: easeOut }
  }
};

// List item animation variants
export const listItem = (index: number): Variants => ({
  initial: { opacity: 0, x: -20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { delay: index * 0.05 }
  },
  exit: { 
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 }
  }
});

// Legacy motionVariants object for backward compatibility
export const motionVariants = {
  pageTransition,
  cardHover,
  listItem
};