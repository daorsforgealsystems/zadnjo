// Animated button component using anime.js
import React, { useRef, useEffect } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useAnimations } from '@/hooks/useAnimations';
import { cn } from '@/lib/utils';
import anime from 'animejs';

interface AnimatedButtonProps extends ButtonProps {
  animation?: 'pulse' | 'bounce' | 'shake' | 'glow' | 'slide' | 'rotate';
  trigger?: 'hover' | 'click' | 'focus' | 'mount';
  intensity?: 'subtle' | 'medium' | 'strong';
  ripple?: boolean;
}

interface AnimationConfig {
  scale?: number | number[];
  translateY?: number | number[];
  translateX?: number | number[];
  boxShadow?: string | string[];
  rotate?: number | number[];
  duration: number;
  easing?: string;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  className,
  animation = 'pulse',
  trigger = 'hover',
  intensity = 'medium',
  ripple = false,
  onClick,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const { createAnimation } = useAnimations();

  const intensityConfig = {
    subtle: { scale: 1.02, duration: 200 },
    medium: { scale: 1.05, duration: 300 },
    strong: { scale: 1.1, duration: 400 },
  };

  const config = intensityConfig[intensity];

  // Animation configurations
  const animations: Record<string, { enter: AnimationConfig; leave: AnimationConfig }> = {
    pulse: {
      enter: { scale: [1, config.scale, 1], duration: config.duration, easing: 'easeOutQuad' },
      leave: { scale: 1, duration: config.duration / 2, easing: 'easeOutQuad' },
    },
    bounce: {
      enter: { 
        translateY: [0, -8, 0], 
        scale: [1, config.scale, 1], 
        duration: config.duration,
        easing: 'easeOutBounce' 
      },
      leave: { translateY: 0, scale: 1, duration: config.duration / 2, easing: 'easeOutQuad' },
    },
    shake: {
      enter: { 
        translateX: [0, -5, 5, -3, 3, 0], 
        duration: config.duration,
        easing: 'easeInOutQuad' 
      },
      leave: { translateX: 0, duration: 100, easing: 'easeOutQuad' },
    },
    glow: {
      enter: { 
        boxShadow: [
          '0 0 0 rgba(var(--primary), 0)',
          `0 0 20px rgba(var(--primary), 0.5)`,
          `0 0 30px rgba(var(--primary), 0.3)`
        ],
        duration: config.duration,
        easing: 'easeOutQuad'
      },
      leave: { 
        boxShadow: '0 0 0 rgba(var(--primary), 0)', 
        duration: config.duration / 2,
        easing: 'easeOutQuad'
      },
    },
    slide: {
      enter: { 
        translateX: [0, 5, 0], 
        duration: config.duration,
        easing: 'easeOutBack' 
      },
      leave: { translateX: 0, duration: config.duration / 2, easing: 'easeOutQuad' },
    },
    rotate: {
      enter: { 
        rotate: [0, 5, -5, 0], 
        scale: [1, config.scale, 1],
        duration: config.duration,
        easing: 'easeOutQuad'
      },
      leave: { rotate: 0, scale: 1, duration: config.duration / 2, easing: 'easeOutQuad' },
    },
  };

  const currentAnimation = animations[animation];

  // Set up animations based on trigger
  useEffect(() => {
    if (!buttonRef.current) return;

    const button = buttonRef.current;

    if (trigger === 'mount') {
      createAnimation({
        targets: button,
        ...currentAnimation.enter,
        easing: currentAnimation.enter.easing || 'easeOutQuad',
        autoplay: true,
      });
      return;
    }

    if (trigger === 'hover') {
      const handleMouseEnter = () => {
        anime({
          targets: button,
          ...currentAnimation.enter,
        });
      };

      const handleMouseLeave = () => {
        anime({
          targets: button,
          ...currentAnimation.leave,
        });
      };

      button.addEventListener('mouseenter', handleMouseEnter);
      button.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        button.removeEventListener('mouseenter', handleMouseEnter);
        button.removeEventListener('mouseleave', handleMouseLeave);
      };
    }

    if (trigger === 'focus') {
      const handleFocus = () => {
        createAnimation({
          targets: button,
          ...currentAnimation.enter,
          easing: currentAnimation.enter.easing || 'easeOutQuad',
          autoplay: true,
        });
      };

      const handleBlur = () => {
        createAnimation({
          targets: button,
          ...currentAnimation.leave,
          easing: currentAnimation.leave.easing || 'easeOutQuad',
          autoplay: true,
        });
      };

      button.addEventListener('focus', handleFocus);
      button.addEventListener('blur', handleBlur);

      return () => {
        button.removeEventListener('focus', handleFocus);
        button.removeEventListener('blur', handleBlur);
      };
    }
  }, [animation, trigger, intensity, createAnimation, currentAnimation.enter, currentAnimation.leave]);

  // Handle click animation and ripple effect
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (trigger === 'click' && buttonRef.current) {
      createAnimation({
        targets: buttonRef.current,
        ...currentAnimation.enter,
        easing: currentAnimation.enter.easing || 'easeOutQuad',
        autoplay: true,
      });
    }

    // Ripple effect
    if (ripple && rippleRef.current) {
      const button = buttonRef.current;
      const rippleElement = rippleRef.current;
      
      if (button) {
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        rippleElement.style.width = `${size}px`;
        rippleElement.style.height = `${size}px`;
        rippleElement.style.left = `${x}px`;
        rippleElement.style.top = `${y}px`;

        createAnimation({
          targets: rippleElement,
          scale: [0, 1],
          opacity: [0.6, 0],
          duration: 600,
          easing: 'easeOutQuart',
          autoplay: true,
        });
      }
    }

    onClick?.(e);
  };

  return (
    <Button
      ref={buttonRef}
      className={cn(
        'relative overflow-hidden transition-all duration-200',
        ripple && 'overflow-hidden',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
      {ripple && (
        <div
          ref={rippleRef}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{ transform: 'scale(0)' }}
        />
      )}
    </Button>
  );
};

// Floating action button with animation
export const FloatingActionButton: React.FC<AnimatedButtonProps & {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}> = ({
  children,
  className,
  position = 'bottom-right',
  animation = 'pulse',
  ...props
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-20 right-6',
    'top-left': 'fixed top-20 left-6',
  };

  return (
    <AnimatedButton
      className={cn(
        'rounded-full w-14 h-14 shadow-lg z-50',
        positionClasses[position],
        className
      )}
      animation={animation}
      ripple
      {...props}
    >
      {children}
    </AnimatedButton>
  );
};

// Button group with staggered animations
export const AnimatedButtonGroup: React.FC<{
  children: React.ReactNode;
  stagger?: number;
  animation?: AnimatedButtonProps['animation'];
  className?: string;
}> = ({
  children,
  stagger = 100,
  animation = 'slide',
  className,
}) => {
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (groupRef.current) {
      const buttons = groupRef.current.querySelectorAll('button');
      anime({
        targets: buttons,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 400,
        delay: anime.stagger(stagger),
        easing: 'easeOutQuart',
        autoplay: true,
      });
    }
  }, [stagger]);

  return (
    <div
      ref={groupRef}
      className={cn('flex gap-2', className)}
      data-button-group
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<AnimatedButtonProps>, {
            animation,
            style: { opacity: 0 },
          });
        }
        return child;
      })}
    </div>
  );
};

// Loading button with animated spinner
export const LoadingButton: React.FC<AnimatedButtonProps & {
  loading?: boolean;
  loadingText?: string;
}> = ({
  children,
  loading = false,
  loadingText = 'Loading...',
  disabled,
  className,
  ...props
}) => {
  const spinnerRef = useRef<HTMLDivElement>(null);
  const { createAnimation } = useAnimations();

  useEffect(() => {
    if (loading && spinnerRef.current) {
      createAnimation({
        targets: spinnerRef.current,
        rotate: [0, 360],
        duration: 1000,
        loop: true,
        easing: 'linear',
        autoplay: true,
      });
    }
  }, [loading, createAnimation]);

  return (
    <AnimatedButton
      disabled={disabled || loading}
      className={cn(
        'relative transition-all duration-200',
        loading && 'cursor-not-allowed',
        className
      )}
      {...props}
    >
      {loading && (
        <div
          ref={spinnerRef}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
        </div>
      )}
      <span className={cn('transition-opacity duration-200', loading && 'opacity-0')}>
        {loading ? loadingText : children}
      </span>
    </AnimatedButton>
  );
};