import type { Transition, Easing } from 'framer-motion';

// Common easing curves
export const easeOut: Easing = [0.22, 1, 0.36, 1];
export const easeInOut: Easing = [0.4, 0, 1, 1];

// Common spring transitions
export const springSoft: Transition = { type: 'spring', stiffness: 200, damping: 25, mass: 1 };
export const springMedium: Transition = { type: 'spring', stiffness: 300, damping: 30, mass: 1 };
export const springFirm: Transition = { type: 'spring', stiffness: 500, damping: 30, mass: 1 };

// Time/ease-based transitions
export const quickEaseInOut: Transition = { duration: 0.2, ease: 'easeInOut' };
export const fadeInFast: Transition = { duration: 0.2, ease: easeOut };
export const fadeIn: Transition = { duration: 0.3, ease: easeOut };