import anime from 'animejs';

export interface GridAnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  autoplay?: boolean;
}

export const gridAnimationPresets = {
  gridReorder: {
    duration: 400,
    easing: 'easeOutQuad',
    delay: 0,
    autoplay: true,
  },
  gridItemAdd: {
    duration: 500,
    easing: 'easeOutBack',
    delay: 0,
    autoplay: true,
  },
  gridItemRemove: {
    duration: 300,
    easing: 'easeInBack',
    delay: 0,
    autoplay: true,
  },
  gridResize: {
    duration: 350,
    easing: 'easeOutQuad',
    delay: 0,
    autoplay: true,
  },
  gridReveal: {
    duration: 600,
    easing: 'easeOutExpo',
    delay: 0,
    autoplay: true,
  },
  dragStart: {
    duration: 200,
    easing: 'easeOutQuad',
    delay: 0,
    autoplay: true,
  },
  dragEnd: {
    duration: 300,
    easing: 'easeOutBack',
    delay: 0,
    autoplay: true,
  }
};

// Grid reorder animation for drag-and-drop
export const animateGridReorder = (
  elements: HTMLElement[],
  newPositions: { x: number; y: number }[],
  config: GridAnimationConfig = gridAnimationPresets.gridReorder
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

// Animate grid item addition
export const animateGridItemAdd = (
  element: HTMLElement,
  fromPosition?: { x: number; y: number },
  config: GridAnimationConfig = gridAnimationPresets.gridItemAdd
) => {
  // Set initial state
  element.style.opacity = '0';
  element.style.transform = 'scale(0.8)';
  
  if (fromPosition) {
    element.style.transform += ` translate(${fromPosition.x}px, ${fromPosition.y}px)`;
  }

  return anime({
    targets: element,
    opacity: [0, 1],
    scale: [0.8, 1.05, 1],
    translateX: fromPosition ? [fromPosition.x, 0] : 0,
    translateY: fromPosition ? [fromPosition.y, 0] : 0,
    duration: config.duration,
    easing: config.easing,
    complete: () => {
      element.style.transform = '';
    }
  });
};

// Animate grid item removal
export const animateGridItemRemove = (
  element: HTMLElement,
  toPosition?: { x: number; y: number },
  config: GridAnimationConfig = gridAnimationPresets.gridItemRemove
) => {
  return anime({
    targets: element,
    opacity: [1, 0],
    scale: [1, 0.8],
    translateX: toPosition ? toPosition.x : 0,
    translateY: toPosition ? toPosition.y : 0,
    duration: config.duration,
    easing: config.easing,
    complete: () => {
      element.remove();
    }
  });
};

// Grid container resize animation
export const animateGridResize = (
  container: HTMLElement,
  newDimensions: { width?: number; height?: number; columns?: number },
  config: GridAnimationConfig = gridAnimationPresets.gridResize
) => {
  const targets: any = {};
  
  if (newDimensions.width) {
    targets.width = `${newDimensions.width}px`;
  }
  
  if (newDimensions.height) {
    targets.height = `${newDimensions.height}px`;
  }

  if (newDimensions.columns) {
    targets.gridTemplateColumns = `repeat(${newDimensions.columns}, 1fr)`;
  }

  return anime({
    targets: container,
    ...targets,
    duration: config.duration,
    easing: config.easing,
  });
};

// Staggered grid reveal animation
export const animateGridReveal = (
  elements: HTMLElement[],
  pattern: 'sequence' | 'wave' | 'spiral' | 'random' = 'sequence',
  config: GridAnimationConfig = gridAnimationPresets.gridReveal
) => {
  // Set initial state
  elements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px) scale(0.9)';
  });

  let delayFunction;
  
  switch (pattern) {
    case 'sequence':
      delayFunction = anime.stagger(50);
      break;
    case 'wave':
      delayFunction = anime.stagger(50, {grid: [Math.ceil(Math.sqrt(elements.length)), Math.ceil(Math.sqrt(elements.length))], from: 'center'});
      break;
    case 'spiral':
      delayFunction = anime.stagger(50, {grid: [Math.ceil(Math.sqrt(elements.length)), Math.ceil(Math.sqrt(elements.length))], from: 'center', direction: 'reverse'});
      break;
    case 'random':
      delayFunction = () => Math.random() * 300;
      break;
    default:
      delayFunction = anime.stagger(50);
  }

  return anime({
    targets: elements,
    opacity: [0, 1],
    translateY: [20, 0],
    scale: [0.9, 1],
    duration: config.duration,
    delay: delayFunction,
    easing: config.easing,
    complete: () => {
      elements.forEach(el => {
        el.style.transform = '';
      });
    }
  });
};

// Drag start animation
export const animateDragStart = (
  element: HTMLElement,
  config: GridAnimationConfig = gridAnimationPresets.dragStart
) => {
  return anime({
    targets: element,
    scale: [1, 1.05],
    rotate: [0, 2],
    boxShadow: [
      '0 1px 3px rgba(0,0,0,0.1)',
      '0 10px 25px rgba(0,0,0,0.2)'
    ],
    zIndex: 1000,
    duration: config.duration,
    easing: config.easing,
  });
};

// Drag end animation
export const animateDragEnd = (
  element: HTMLElement,
  config: GridAnimationConfig = gridAnimationPresets.dragEnd
) => {
  return anime({
    targets: element,
    scale: [1.05, 1],
    rotate: [2, 0],
    boxShadow: [
      '0 10px 25px rgba(0,0,0,0.2)',
      '0 1px 3px rgba(0,0,0,0.1)'
    ],
    zIndex: 1,
    duration: config.duration,
    easing: config.easing,
  });
};

// Grid hover effect
export const animateGridItemHover = (
  element: HTMLElement,
  isHovered: boolean,
  config: GridAnimationConfig = { duration: 200, easing: 'easeOutQuad' }
) => {
  return anime({
    targets: element,
    scale: isHovered ? 1.02 : 1,
    translateY: isHovered ? -2 : 0,
    boxShadow: isHovered 
      ? '0 4px 12px rgba(0,0,0,0.15)'
      : '0 1px 3px rgba(0,0,0,0.1)',
    duration: config.duration,
    easing: config.easing,
  });
};

// Grid loading skeleton animation
export const animateGridSkeleton = (
  elements: HTMLElement[],
  config: GridAnimationConfig = {
    duration: 1200,
    easing: 'easeInOutSine'
  }
) => {
  return anime({
    targets: elements,
    opacity: [0.3, 0.7, 0.3],
    duration: config.duration,
    delay: anime.stagger(100),
    direction: 'alternate',
    loop: true,
    easing: config.easing,
  });
};

// Masonry-style layout animation
export const animateMasonryLayout = (
  elements: HTMLElement[],
  positions: Array<{ x: number; y: number; width: number; height: number }>,
  config: GridAnimationConfig = gridAnimationPresets.gridReorder
) => {
  return anime({
    targets: elements,
    translateX: (el, i) => positions[i].x,
    translateY: (el, i) => positions[i].y,
    width: (el, i) => positions[i].width,
    height: (el, i) => positions[i].height,
    duration: config.duration,
    delay: anime.stagger(50),
    easing: config.easing,
  });
};

// Grid filter animation
export const animateGridFilter = (
  showElements: HTMLElement[],
  hideElements: HTMLElement[],
  config: GridAnimationConfig = {
    duration: 400,
    easing: 'easeOutQuad'
  }
) => {
  const timeline = anime.timeline({
    easing: config.easing,
  });

  // Hide elements first
  if (hideElements.length > 0) {
    timeline.add({
      targets: hideElements,
      opacity: [1, 0],
      scale: [1, 0.8],
      duration: config.duration ? config.duration * 0.6 : 240,
      complete: () => {
        hideElements.forEach(el => {
          el.style.display = 'none';
        });
      }
    });
  }

  // Show elements
  if (showElements.length > 0) {
    showElements.forEach(el => {
      el.style.display = '';
      el.style.opacity = '0';
      el.style.transform = 'scale(0.8)';
    });

    timeline.add({
      targets: showElements,
      opacity: [0, 1],
      scale: [0.8, 1],
      duration: config.duration,
      delay: anime.stagger(30),
    }, hideElements.length > 0 ? `-=${config.duration ? config.duration * 0.3 : 120}` : 0);
  }

  return timeline;
};

// Grid sort animation
export const animateGridSort = (
  elements: HTMLElement[],
  newOrder: number[],
  config: GridAnimationConfig = gridAnimationPresets.gridReorder
) => {
  const timeline = anime.timeline({
    easing: config.easing,
  });

  // Fade out
  timeline.add({
    targets: elements,
    opacity: [1, 0.3],
    scale: [1, 0.95],
    duration: config.duration ? config.duration * 0.4 : 160,
  });

  // Reorder (this would typically involve actual DOM manipulation)
  timeline.add({
    targets: elements,
    translateY: (el, i) => {
      const currentIndex = elements.indexOf(el);
      const newIndex = newOrder.indexOf(currentIndex);
      return (newIndex - currentIndex) * 100; // Assuming 100px height per item
    },
    duration: config.duration ? config.duration * 0.6 : 240,
  });

  // Fade in
  timeline.add({
    targets: elements,
    opacity: [0.3, 1],
    scale: [0.95, 1],
    translateY: 0,
    duration: config.duration ? config.duration * 0.4 : 160,
  });

  return timeline;
};

// Responsive grid animation
export const animateGridResponsive = (
  container: HTMLElement,
  elements: HTMLElement[],
  breakpoint: 'mobile' | 'tablet' | 'desktop',
  config: GridAnimationConfig = gridAnimationPresets.gridResize
) => {
  const gridConfigs = {
    mobile: {
      columns: 1,
      gap: '1rem',
      padding: '1rem'
    },
    tablet: {
      columns: 2,
      gap: '1.5rem',
      padding: '1.5rem'
    },
    desktop: {
      columns: 3,
      gap: '2rem',
      padding: '2rem'
    }
  };

  const targetConfig = gridConfigs[breakpoint];

  return anime({
    targets: container,
    gridTemplateColumns: `repeat(${targetConfig.columns}, 1fr)`,
    gap: targetConfig.gap,
    padding: targetConfig.padding,
    duration: config.duration,
    easing: config.easing,
    complete: () => {
      // Animate child elements if needed
      anime({
        targets: elements,
        scale: [0.95, 1],
        duration: 200,
        delay: anime.stagger(30),
        easing: 'easeOutQuad',
      });
    }
  });
};

// Grid item pulse animation (for notifications/updates)
export const animateGridItemPulse = (
  element: HTMLElement,
  config: GridAnimationConfig = {
    duration: 1000,
    easing: 'easeInOutSine'
  }
) => {
  return anime({
    targets: element,
    scale: [1, 1.02, 1],
    borderColor: ['#e2e8f0', '#3b82f6', '#e2e8f0'],
    duration: config.duration,
    direction: 'alternate',
    loop: 3,
    easing: config.easing,
  });
};

export default {
  animateGridReorder,
  animateGridItemAdd,
  animateGridItemRemove,
  animateGridResize,
  animateGridReveal,
  animateDragStart,
  animateDragEnd,
  animateGridItemHover,
  animateGridSkeleton,
  animateMasonryLayout,
  animateGridFilter,
  animateGridSort,
  animateGridResponsive,
  animateGridItemPulse,
  gridAnimationPresets,
};