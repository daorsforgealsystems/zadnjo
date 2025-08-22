export const motionVariants = {
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { 
      type: 'spring', 
      stiffness: 300, 
      damping: 30,
      mass: 1
    }
  },
  
  cardHover: {
    rest: { scale: 1, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
    hover: { 
      scale: 1.03, 
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  },
  
  listItem: (index: number) => ({
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
  })
};