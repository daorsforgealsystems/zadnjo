import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnimations } from '@/hooks/useAnimations';
import { cn } from '@/lib/utils';
import anime from 'animejs';

export interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'hover-lift' | 'tilt' | 'glow' | 'flip' | 'slide' | 'scale' | 'bounce';
  intensity?: 'low' | 'medium' | 'high';
  trigger?: 'hover' | 'click' | 'intersection' | 'always';
  delay?: number;
  duration?: number;
  hoverEffects?: boolean;
  glowColor?: string;
  backgroundColor?: string;
  borderGlow?: boolean;
  title?: string;
  description?: string;
  onClick?: () => void;
  onHover?: (isHovered: boolean) => void;
  loading?: boolean;
  disabled?: boolean;
  interactive?: boolean;
}

const cardVariants = {
  default: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  'hover-lift': {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    hover: { y: -10, scale: 1.02, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }
  },
  tilt: {
    initial: { opacity: 0, rotateX: -15 },
    animate: { opacity: 1, rotateX: 0 },
    hover: { rotateX: 5, rotateY: 5, scale: 1.02 }
  },
  glow: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    hover: { scale: 1.05 }
  },
  flip: {
    initial: { opacity: 0, rotateY: -90 },
    animate: { opacity: 1, rotateY: 0 },
    hover: { rotateY: 10, scale: 1.02 }
  },
  slide: {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0 },
    hover: { x: 5 }
  },
  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    hover: { scale: 1.1 }
  },
  bounce: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { type: 'spring', stiffness: 260, damping: 20 }
    },
    hover: { 
      scale: 1.05,
      transition: { type: 'spring', stiffness: 400, damping: 10 }
    }
  }
};

const intensityMultipliers = {
  low: 0.5,
  medium: 1,
  high: 1.5
};

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className,
  variant = 'default',
  intensity = 'medium',
  trigger = 'intersection',
  delay = 0,
  duration = 0.5,
  hoverEffects = true,
  glowColor = '#3b82f6',
  backgroundColor,
  borderGlow = false,
  title,
  description,
  onClick,
  onHover,
  loading = false,
  disabled = false,
  interactive = true,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(trigger === 'always');
  const [isHovered, setIsHovered] = useState(false);
  const { createHoverAnimation } = useAnimations();

  // Mouse position for tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(mouseX, { stiffness: 200, damping: 30 });
  const rotateY = useSpring(mouseY, { stiffness: 200, damping: 30 });

  useEffect(() => {
    if (trigger === 'intersection' && cardRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsVisible(entry.isIntersecting);
        },
        { threshold: 0.1 }
      );

      observer.observe(cardRef.current);
      return () => observer.disconnect();
    }
  }, [trigger]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current || variant !== 'tilt') return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseXValue = (e.clientX - centerX) / (rect.width / 2);
    const mouseYValue = (e.clientY - centerY) / (rect.height / 2);

    mouseX.set(mouseXValue * 10 * intensityMultipliers[intensity]);
    mouseY.set(mouseYValue * -10 * intensityMultipliers[intensity]);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover?.(true);

    if (variant === 'glow' && cardRef.current) {
      anime({
        targets: cardRef.current,
        boxShadow: `0 0 20px ${glowColor}40, 0 0 40px ${glowColor}20`,
        duration: 300,
        easing: 'easeOutQuad'
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHover?.(false);
    
    if (variant === 'tilt') {
      mouseX.set(0);
      mouseY.set(0);
    }

    if (variant === 'glow' && cardRef.current) {
      anime({
        targets: cardRef.current,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        duration: 300,
        easing: 'easeOutQuad'
      });
    }
  };

  const currentVariant = cardVariants[variant];
  
  const cardStyle = {
    ...(backgroundColor && { backgroundColor }),
    ...(borderGlow && isHovered && {
      borderColor: glowColor,
      boxShadow: `0 0 10px ${glowColor}50`
    }),
    ...(variant === 'tilt' && {
      transformStyle: 'preserve-3d' as const,
      transformOrigin: 'center'
    })
  };

  const MotionCard = motion(Card);

  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 rounded"></div>
            <div className="h-3 bg-gray-300 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <MotionCard
      ref={cardRef}
      className={cn(
        'cursor-pointer transition-all duration-300',
        disabled && 'opacity-50 cursor-not-allowed',
        borderGlow && 'border-2',
        className
      )}
      style={cardStyle}
      initial={currentVariant.initial}
      animate={isVisible ? currentVariant.animate : currentVariant.initial}
      whileHover={
        hoverEffects && !disabled && interactive 
          ? currentVariant.hover 
          : undefined
      }
      whileTap={
        interactive && !disabled 
          ? { scale: 0.98 } 
          : undefined
      }
      transition={{
        duration: duration * intensityMultipliers[intensity],
        delay,
        ease: 'easeOut'
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={!disabled ? onClick : undefined}
      {...(variant === 'tilt' && {
        style: {
          ...cardStyle,
          rotateX: rotateY,
          rotateY: rotateX
        }
      })}
      {...props}
    >
      {title || description ? (
        <>
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </>
      ) : (
        children
      )}
    </MotionCard>
  );
};

// Specialized card variants
export const HoverLiftCard: React.FC<Omit<AnimatedCardProps, 'variant'>> = (props) => (
  <AnimatedCard variant="hover-lift" {...props} />
);

export const TiltCard: React.FC<Omit<AnimatedCardProps, 'variant'>> = (props) => (
  <AnimatedCard variant="tilt" {...props} />
);

export const GlowCard: React.FC<Omit<AnimatedCardProps, 'variant'>> = (props) => (
  <AnimatedCard variant="glow" {...props} />
);

export const FlipCard: React.FC<Omit<AnimatedCardProps, 'variant'>> = (props) => (
  <AnimatedCard variant="flip" {...props} />
);

export const BounceCard: React.FC<Omit<AnimatedCardProps, 'variant'>> = (props) => (
  <AnimatedCard variant="bounce" {...props} />
);

// Card with flip animation showing different content on front/back
export interface FlipCardTwoSidedProps extends Omit<AnimatedCardProps, 'children'> {
  front: React.ReactNode;
  back: React.ReactNode;
  flipTrigger?: 'hover' | 'click';
}

export const FlipCardTwoSided: React.FC<FlipCardTwoSidedProps> = ({
  front,
  back,
  flipTrigger = 'hover',
  className,
  ...props
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    if (flipTrigger === 'click') {
      setIsFlipped(!isFlipped);
    }
  };

  const handleMouseEnter = () => {
    if (flipTrigger === 'hover') {
      setIsFlipped(true);
    }
  };

  const handleMouseLeave = () => {
    if (flipTrigger === 'hover') {
      setIsFlipped(false);
    }
  };

  return (
    <div 
      className={cn('relative preserve-3d', className)}
      style={{ transformStyle: 'preserve-3d' }}
      onClick={handleFlip}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="w-full h-full absolute backface-hidden"
        style={{ backfaceVisibility: 'hidden' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        <AnimatedCard {...props}>{front}</AnimatedCard>
      </motion.div>
      <motion.div
        className="w-full h-full absolute backface-hidden"
        style={{ backfaceVisibility: 'hidden', rotateY: 180 }}
        animate={{ rotateY: isFlipped ? 0 : -180 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        <AnimatedCard {...props}>{back}</AnimatedCard>
      </motion.div>
    </div>
  );
};