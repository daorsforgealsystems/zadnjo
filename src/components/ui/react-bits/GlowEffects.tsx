import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import anime from 'animejs';

export interface GlowEffectsProps {
  children: React.ReactNode;
  variant?: 'subtle' | 'medium' | 'intense' | 'rainbow' | 'pulse' | 'wave' | 'border' | 'text';
  color?: string;
  colors?: string[];
  size?: 'sm' | 'md' | 'lg' | 'xl';
  speed?: 'slow' | 'normal' | 'fast';
  trigger?: 'hover' | 'focus' | 'always' | 'click' | 'intersection';
  disabled?: boolean;
  className?: string;
  glowClassName?: string;
  intensity?: number;
  spread?: number;
  animate?: boolean;
  blur?: number;
  opacity?: number;
  offset?: { x?: number; y?: number };
  borderRadius?: string;
  onGlowStart?: () => void;
  onGlowEnd?: () => void;
}

const glowSizes = {
  sm: 10,
  md: 20,
  lg: 30,
  xl: 40
};

const glowSpeeds = {
  slow: 3000,
  normal: 2000,
  fast: 1000
};

const rainbowColors = [
  '#ff0000', '#ff7f00', '#ffff00', '#00ff00',
  '#0000ff', '#4b0082', '#9400d3'
];

export const GlowEffects: React.FC<GlowEffectsProps> = ({
  children,
  variant = 'subtle',
  color = '#3b82f6',
  colors,
  size = 'md',
  speed = 'normal',
  trigger = 'hover',
  disabled = false,
  className,
  glowClassName,
  intensity = 1,
  spread = 1,
  animate = true,
  blur = 20,
  opacity = 0.5,
  offset = { x: 0, y: 0 },
  borderRadius,
  onGlowStart,
  onGlowEnd,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(trigger === 'always');
  const [isVisible, setIsVisible] = useState(false);
  const animationRef = useRef<any>();

  const glowSize = glowSizes[size] * spread;
  const animationSpeed = glowSpeeds[speed];
  const effectiveColors = colors || (variant === 'rainbow' ? rainbowColors : [color]);

  useEffect(() => {
    if (trigger === 'intersection' && elementRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsVisible(entry.isIntersecting);
          if (entry.isIntersecting) {
            setIsActive(true);
            onGlowStart?.();
          } else {
            setIsActive(false);
            onGlowEnd?.();
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(elementRef.current);
      return () => observer.disconnect();
    }
  }, [trigger, onGlowStart, onGlowEnd]);

  useEffect(() => {
    if (!isActive || !animate || disabled || !elementRef.current) return;

    const element = elementRef.current;
    
    if (variant === 'pulse') {
      animationRef.current = anime({
        targets: element,
        boxShadow: [
          `${offset.x}px ${offset.y}px ${blur}px ${effectiveColors[0]}00`,
          `${offset.x}px ${offset.y}px ${blur * 2}px ${effectiveColors[0]}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
        ],
        duration: animationSpeed,
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutSine'
      });
    }

    if (variant === 'wave') {
      let colorIndex = 0;
      const waveAnimation = () => {
        anime({
          targets: element,
          boxShadow: `${offset.x}px ${offset.y}px ${blur}px ${effectiveColors[colorIndex]}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
          duration: animationSpeed / effectiveColors.length,
          easing: 'easeInOutQuad',
          complete: () => {
            colorIndex = (colorIndex + 1) % effectiveColors.length;
            if (isActive) waveAnimation();
          }
        });
      };
      waveAnimation();
    }

    if (variant === 'rainbow') {
      animationRef.current = anime({
        targets: element,
        duration: animationSpeed,
        loop: true,
        easing: 'linear',
        update: (anim) => {
          const progress = anim.progress / 100;
          const colorIndex = Math.floor(progress * effectiveColors.length) % effectiveColors.length;
          const nextColorIndex = (colorIndex + 1) % effectiveColors.length;
          const localProgress = (progress * effectiveColors.length) % 1;
          
          // Interpolate between current and next color
          const currentColor = effectiveColors[colorIndex];
          const nextColor = effectiveColors[nextColorIndex];
          
          element.style.boxShadow = `${offset.x}px ${offset.y}px ${blur}px ${currentColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
        }
      });
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.pause();
      }
    };
  }, [isActive, animate, disabled, variant, animationSpeed, blur, opacity, offset]);

  const handleMouseEnter = () => {
    if (trigger === 'hover' && !disabled) {
      setIsActive(true);
      onGlowStart?.();
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover' && !disabled) {
      setIsActive(false);
      onGlowEnd?.();
    }
  };

  const handleFocus = () => {
    if (trigger === 'focus' && !disabled) {
      setIsActive(true);
      onGlowStart?.();
    }
  };

  const handleBlur = () => {
    if (trigger === 'focus' && !disabled) {
      setIsActive(false);
      onGlowEnd?.();
    }
  };

  const handleClick = () => {
    if (trigger === 'click' && !disabled) {
      setIsActive(!isActive);
      if (!isActive) {
        onGlowStart?.();
      } else {
        onGlowEnd?.();
      }
    }
  };

  const getGlowStyle = () => {
    if (disabled || !isActive) return {};

    const baseGlow = `${offset.x}px ${offset.y}px ${blur}px`;
    
    switch (variant) {
      case 'subtle':
        return {
          boxShadow: `${baseGlow} ${color}${Math.round(opacity * 0.3 * 255).toString(16).padStart(2, '0')}`
        };
      
      case 'medium':
        return {
          boxShadow: `${baseGlow} ${color}${Math.round(opacity * 0.6 * 255).toString(16).padStart(2, '0')}`
        };
      
      case 'intense':
        return {
          boxShadow: `${baseGlow} ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}, ${baseGlow} ${color}${Math.round(opacity * 0.5 * 255).toString(16).padStart(2, '0')}`
        };
      
      case 'border':
        return {
          border: `1px solid ${color}`,
          boxShadow: `inset 0 0 ${blur}px ${color}${Math.round(opacity * 0.3 * 255).toString(16).padStart(2, '0')}, 0 0 ${blur}px ${color}${Math.round(opacity * 0.5 * 255).toString(16).padStart(2, '0')}`
        };
      
      case 'text':
        return {
          textShadow: `0 0 ${blur}px ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
        };
      
      default:
        return {
          boxShadow: `${baseGlow} ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
        };
    }
  };

  return (
    <motion.div
      ref={elementRef}
      className={cn(
        'relative transition-all duration-300',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      style={{
        ...getGlowStyle(),
        borderRadius,
        ...(variant === 'text' && { color: isActive ? color : undefined })
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
      
      {/* Additional glow layers for intense effects */}
      {variant === 'intense' && isActive && !disabled && (
        <>
          <div 
            className={cn(
              "absolute inset-0 rounded-inherit pointer-events-none",
              glowClassName
            )}
            style={{
              background: `radial-gradient(circle, ${color}${Math.round(opacity * 0.1 * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
              transform: `scale(${1 + intensity * 0.1})`,
              zIndex: -1
            }}
          />
          <div 
            className={cn(
              "absolute inset-0 rounded-inherit pointer-events-none",
              glowClassName
            )}
            style={{
              background: `radial-gradient(circle, ${color}${Math.round(opacity * 0.05 * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
              transform: `scale(${1 + intensity * 0.2})`,
              zIndex: -2
            }}
          />
        </>
      )}
    </motion.div>
  );
};

// Specialized glow components
export const SubtleGlow: React.FC<Omit<GlowEffectsProps, 'variant'>> = (props) => (
  <GlowEffects variant="subtle" {...props} />
);

export const IntenseGlow: React.FC<Omit<GlowEffectsProps, 'variant'>> = (props) => (
  <GlowEffects variant="intense" {...props} />
);

export const RainbowGlow: React.FC<Omit<GlowEffectsProps, 'variant'>> = (props) => (
  <GlowEffects variant="rainbow" {...props} />
);

export const PulseGlow: React.FC<Omit<GlowEffectsProps, 'variant'>> = (props) => (
  <GlowEffects variant="pulse" {...props} />
);

export const BorderGlow: React.FC<Omit<GlowEffectsProps, 'variant'>> = (props) => (
  <GlowEffects variant="border" {...props} />
);

export const TextGlow: React.FC<Omit<GlowEffectsProps, 'variant'>> = (props) => (
  <GlowEffects variant="text" {...props} />
);

// Glow container for multiple elements
export interface GlowContainerProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: 'low' | 'medium' | 'high';
  animate?: boolean;
}

export const GlowContainer: React.FC<GlowContainerProps> = ({
  children,
  className,
  glowColor = '#3b82f6',
  intensity = 'medium',
  animate = true
}) => {
  const intensityValues = {
    low: { blur: 10, opacity: 0.3, scale: 1.02 },
    medium: { blur: 20, opacity: 0.5, scale: 1.05 },
    high: { blur: 30, opacity: 0.7, scale: 1.08 }
  };

  const config = intensityValues[intensity];

  return (
    <div className={cn('relative', className)}>
      {animate && (
        <motion.div
          className="absolute inset-0 rounded-inherit"
          style={{
            background: `radial-gradient(circle, ${glowColor}${Math.round(config.opacity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
            filter: `blur(${config.blur}px)`,
            transform: `scale(${config.scale})`,
            zIndex: -1
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [config.scale * 0.95, config.scale, config.scale * 0.95]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// Animated glow text component
export interface GlowTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  speed?: 'slow' | 'normal' | 'fast';
  intensity?: number;
}

export const GlowText: React.FC<GlowTextProps> = ({
  children,
  className,
  colors = ['#ff0000', '#00ff00', '#0000ff'],
  speed = 'normal',
  intensity = 1
}) => {
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!textRef.current) return;

    const element = textRef.current;
    let colorIndex = 0;

    const animateGlow = () => {
      anime({
        targets: element,
        textShadow: `0 0 ${20 * intensity}px ${colors[colorIndex]}`,
        duration: glowSpeeds[speed] / colors.length,
        easing: 'easeInOutQuad',
        complete: () => {
          colorIndex = (colorIndex + 1) % colors.length;
          animateGlow();
        }
      });
    };

    animateGlow();
  }, [colors, speed, intensity]);

  return (
    <span
      ref={textRef}
      className={cn('transition-all duration-300', className)}
    >
      {children}
    </span>
  );
};