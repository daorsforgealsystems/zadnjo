import type { Variants } from 'framer-motion';

// Standard page transition used across primary routes
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -16,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

// Subtle fade for auth and simple pages
export const authFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

// Lighter slide used inside nested routes/portal sections
export const nestedFadeSlide: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.3 } },
};

// Card hover interaction for reuse in components
export const cardHover: Variants = {
  rest: { scale: 1, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  hover: {
    scale: 1.03,
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// Sequence helper for list items
export const listItem = (index = 0): Variants => ({
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { delay: index * 0.05 } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
});