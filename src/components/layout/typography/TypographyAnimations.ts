import anime from 'animejs';

export interface TypographyAnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  autoplay?: boolean;
}

export const typographyAnimationPresets = {
  fadeInUp: {
    duration: 600,
    easing: 'easeOutExpo',
    delay: 0,
    autoplay: true,
  },
  typewriter: {
    duration: 1500,
    easing: 'easeOutExpo',
    delay: 0,
    autoplay: true,
  },
  slideFromLeft: {
    duration: 800,
    easing: 'easeOutBack',
    delay: 0,
    autoplay: true,
  },
  bounce: {
    duration: 1000,
    easing: 'easeOutBounce',
    delay: 0,
    autoplay: true,
  },
  pulse: {
    duration: 2000,
    easing: 'easeInOutSine',
    delay: 0,
    autoplay: true,
  },
  gradient: {
    duration: 3000,
    easing: 'easeInOutQuad',
    delay: 0,
    autoplay: true,
  }
};

// Text reveal animation (character by character)
export const animateTextReveal = (
  element: HTMLElement,
  config: TypographyAnimationConfig = typographyAnimationPresets.typewriter
) => {
  const text = element.textContent || '';
  element.innerHTML = text
    .split('')
    .map((char, i) => `<span style="opacity: 0; transform: translateY(20px);" data-char="${i}">${char === ' ' ? '&nbsp;' : char}</span>`)
    .join('');

  return anime({
    targets: element.querySelectorAll('[data-char]'),
    opacity: [0, 1],
    translateY: [20, 0],
    duration: config.duration ? config.duration / text.length : 50,
    delay: anime.stagger(config.duration ? config.duration / text.length / 2 : 25),
    easing: config.easing || 'easeOutExpo',
    autoplay: config.autoplay ?? true,
  });
};

// Word-by-word reveal animation
export const animateWordReveal = (
  element: HTMLElement,
  config: TypographyAnimationConfig = typographyAnimationPresets.fadeInUp
) => {
  const text = element.textContent || '';
  const words = text.split(' ');
  
  element.innerHTML = words
    .map((word, i) => `<span style="display: inline-block; opacity: 0; transform: translateY(30px);" data-word="${i}">${word}&nbsp;</span>`)
    .join('');

  return anime({
    targets: element.querySelectorAll('[data-word]'),
    opacity: [0, 1],
    translateY: [30, 0],
    duration: config.duration || 600,
    delay: anime.stagger(100),
    easing: config.easing || 'easeOutExpo',
    autoplay: config.autoplay ?? true,
  });
};

// Line-by-line reveal animation
export const animateLineReveal = (
  element: HTMLElement,
  config: TypographyAnimationConfig = typographyAnimationPresets.slideFromLeft
) => {
  const text = element.innerHTML;
  const lines = text.split('<br>').length > 1 ? text.split('<br>') : [text];
  
  element.innerHTML = lines
    .map((line, i) => `<div style="opacity: 0; transform: translateX(-50px);" data-line="${i}">${line}</div>`)
    .join('');

  return anime({
    targets: element.querySelectorAll('[data-line]'),
    opacity: [0, 1],
    translateX: [-50, 0],
    duration: config.duration || 800,
    delay: anime.stagger(200),
    easing: config.easing || 'easeOutBack',
    autoplay: config.autoplay ?? true,
  });
};

// Gradient text animation
export const animateGradientText = (
  element: HTMLElement,
  config: TypographyAnimationConfig = typographyAnimationPresets.gradient
) => {
  // Add gradient styles
  element.style.background = 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b)';
  element.style.backgroundSize = '400% 400%';
  element.style.webkitBackgroundClip = 'text';
  element.style.webkitTextFillColor = 'transparent';
  element.style.backgroundClip = 'text';

  // Animate gradient position
  const gradientAnimation = anime({
    targets: element,
    duration: config.duration || 3000,
    easing: config.easing || 'easeInOutQuad',
    direction: 'alternate',
    loop: true,
    autoplay: config.autoplay ?? true,
    update: (anim) => {
      const progress = anim.progress / 100;
      const xPos = progress * 400;
      const yPos = Math.sin(progress * Math.PI * 2) * 100 + 100;
      element.style.backgroundPosition = `${xPos}% ${yPos}%`;
    }
  });

  return gradientAnimation;
};

// Bounce effect for headings
export const animateHeadingBounce = (
  element: HTMLElement,
  config: TypographyAnimationConfig = typographyAnimationPresets.bounce
) => {
  return anime({
    targets: element,
    opacity: [0, 1],
    scale: [0.8, 1.1, 1],
    duration: config.duration || 1000,
    easing: config.easing || 'easeOutBounce',
    delay: config.delay || 0,
    autoplay: config.autoplay ?? true,
  });
};

// Pulse animation for emphasis
export const animateTextPulse = (
  element: HTMLElement,
  config: TypographyAnimationConfig = typographyAnimationPresets.pulse
) => {
  return anime({
    targets: element,
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    duration: config.duration || 2000,
    easing: config.easing || 'easeInOutSine',
    direction: 'alternate',
    loop: true,
    delay: config.delay || 0,
    autoplay: config.autoplay ?? true,
  });
};

// Counter animation for numbers
export const animateCounter = (
  element: HTMLElement,
  targetValue: number,
  config: TypographyAnimationConfig = typographyAnimationPresets.fadeInUp
) => {
  const obj = { value: 0 };
  
  return anime({
    targets: obj,
    value: targetValue,
    round: 1,
    duration: config.duration || 1000,
    easing: config.easing || 'easeOutExpo',
    delay: config.delay || 0,
    autoplay: config.autoplay ?? true,
    update: () => {
      element.textContent = obj.value.toLocaleString();
    }
  });
};

// Scroll-triggered text animation
export const animateTextOnScroll = (
  element: HTMLElement,
  animationType: 'fadeInUp' | 'slideFromLeft' | 'bounce' = 'fadeInUp',
  config?: TypographyAnimationConfig
) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        switch (animationType) {
          case 'fadeInUp':
            anime({
              targets: entry.target,
              opacity: [0, 1],
              translateY: [20, 0],
              duration: config?.duration || 600,
              easing: config?.easing || 'easeOutExpo',
            });
            break;
          case 'slideFromLeft':
            anime({
              targets: entry.target,
              opacity: [0, 1],
              translateX: [-50, 0],
              duration: config?.duration || 800,
              easing: config?.easing || 'easeOutBack',
            });
            break;
          case 'bounce':
            animateHeadingBounce(entry.target as HTMLElement, config);
            break;
        }
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  observer.observe(element);
  return observer;
};

// Combination animation for titles with multiple effects
export const animateTitleSequence = (
  titleElement: HTMLElement,
  subtitleElement?: HTMLElement,
  config: TypographyAnimationConfig = typographyAnimationPresets.fadeInUp
) => {
  const timeline = anime.timeline({
    autoplay: config.autoplay ?? true,
  });

  // Animate title first
  timeline.add({
    targets: titleElement,
    opacity: [0, 1],
    translateY: [30, 0],
    scale: [0.9, 1],
    duration: config.duration || 800,
    easing: config.easing || 'easeOutBack',
  });

  // If subtitle exists, animate it after title
  if (subtitleElement) {
    timeline.add({
      targets: subtitleElement,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: (config.duration || 800) * 0.6,
      easing: config.easing || 'easeOutExpo',
    }, '-=200');
  }

  return timeline;
};

export default {
  animateTextReveal,
  animateWordReveal,
  animateLineReveal,
  animateGradientText,
  animateHeadingBounce,
  animateTextPulse,
  animateCounter,
  animateTextOnScroll,
  animateTitleSequence,
  typographyAnimationPresets,
};