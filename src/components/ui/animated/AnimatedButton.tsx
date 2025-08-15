// Animated button component using anime.js
import React, { useRef, useEffect } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useAnimations } from '@/hooks/useAnimations';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends ButtonProps {
  animation?: 'pulse' | 'bounce' | 'shake' | 'glow' | 'slide' | 'rotate';
  trigger?: 'hover' | 'click' | 'focus' | 'mount';
  intensity?: 'subtle' | 'medium' | 'strong';
  ripple?: boolean;
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
  const { createAnimation, createHoverAnimation } = useAnimations();

  const intensityConfig = {
    subtle: { scale: 1.02, duration: 200 },
    medium: { scale: 1.05, duration: 300 },
    strong: { scale: 1.1, duration: 400 },
  };

  const config = intensityConfig[intensity];

  // Animation configurations
  const animations = {
    pulse: {
      enter: { scale: [1, config.scale, 1], duration: config.duration },
      leave: { scale: 1, duration: config.duration / 2 },
    },
    bounce: {
      enter: { 
        translateY: [0, -8, 0], 
        scale: [1, config.scale, 1], 
        duration: config.duration,
        easing: 'easeOutBounce' 
      },
      leave: { translateY: 0, scale: 1, duration: config.duration / 2 },
    },
    shake: {
      enter: { 
        translateX: [0, -5, 5, -3, 3, 0], 
        duration: config.duration,
        easing: 'easeInOutQuad' 
      },
      leave: { translateX: 0, duration: 100 },
    },
    glow: {
      enter: { 
        boxShadow: [
          '0 0 0 rgba(var(--primary), 0)',
          `0 0 20px rgba(var(--primary), 0.5)`,
          `0 0 30px rgba(var(--primary), 0.3)`
        ],
        duration: config.duration 
      },
      leave: { 
        boxShadow: '0 0 0 rgba(var(--primary), 0)', 
        duration: config.duration / 2 
      },
    },
    slide: {
      enter: { 
        translateX: [0, 5, 0], 
        duration: config.duration,
        easing: 'easeOutBack' 
      },
      leave: { translateX: 0, duration: config.duration / 2 },
    },
    rotate: {
      enter: { 
        rotate: [0, 5, -5, 0], 
        scale: [1, config.scale, 1],
        duration: config.duration 
      },
      leave: { rotate: 0, scale: 1, duration: config.duration / 2 },
    },
  };

  const currentAnimation = animations[animation];

  // Set up animations based on trigger
  useEffect(() => {
    if (!buttonRef.current) return;

    const button = buttonRef.current;

    if (trigger === 'mount') {
      createAnimation('button-mount', button, {
        ...currentAnimation.enter,
        autoplay: true,
      });
      return;
    }

    if (trigger === 'hover') {
      return createHoverAnimation(
        button,
        currentAnimation.enter,
        currentAnimation.leave
      );
    }

    if (trigger === 'focus') {
      const handleFocus = () => {
        createAnimation('button-focus', button, {
          ...currentAnimation.enter,
          autoplay: true,
        });
      };

      const handleBlur = () => {
        createAnimation('button-blur', button, {
          ...currentAnimation.leave,
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
  }, [animation, trigger, intensity, createAnimation, createHoverAnimation]);

  // Handle click animation and ripple effect
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (trigger === 'click' && buttonRef.current) {
      createAnimation('button-click', buttonRef.current, {
        ...currentAnimation.enter,
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

        createAnimation('ripple-effect', rippleElement, {
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
  const { createStaggeredAnimation } = useAnimations();

  useEffect(() => {
    if (groupRef.current) {
      const buttons = groupRef.current.querySelectorAll('button');
      createStaggeredAnimation(
        buttons,
        {
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 400,
          easing: 'easeOutQuart',
        },
        stagger
      );
    }
  }, [createStaggeredAnimation, stagger]);

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
      createAnimation('spinner', spinnerRef.current, {
        rotate: [0, 360],
        duration: 1000,
        loop: true,
        easing: 'linear',
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