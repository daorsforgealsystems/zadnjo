import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import anime from 'animejs';

export interface FloatingElementsProps {
  count?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  speed?: 'slow' | 'normal' | 'fast';
  color?: string;
  opacity?: number;
  shape?: 'circle' | 'square' | 'triangle' | 'hexagon' | 'star';
  direction?: 'up' | 'down' | 'left' | 'right' | 'random';
  interactive?: boolean;
  glow?: boolean;
  blur?: boolean;
  className?: string;
  children?: React.ReactNode;
  zIndex?: number;
  bounds?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  onElementClick?: (elementId: number) => void;
}

interface FloatingElement {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  speed: number;
  direction: number;
  color: string;
  opacity: number;
}

const sizeVariants = {
  sm: { min: 8, max: 16 },
  md: { min: 16, max: 32 },
  lg: { min: 32, max: 64 },
  xl: { min: 64, max: 128 }
};

const speedVariants = {
  slow: { min: 0.5, max: 1.5 },
  normal: { min: 1.5, max: 3 },
  fast: { min: 3, max: 6 }
};

const shapes = {
  circle: 'rounded-full',
  square: 'rounded-none',
  triangle: 'rounded-none triangle',
  hexagon: 'rounded-none hexagon',
  star: 'rounded-none star'
};

const generateRandomColor = () => {
  const colors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#ef4444', '#06b6d4', '#f97316'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const FloatingElements: React.FC<FloatingElementsProps> = ({
  count = 20,
  size = 'md',
  speed = 'normal',
  color,
  opacity = 0.6,
  shape = 'circle',
  direction = 'random',
  interactive = true,
  glow = false,
  blur = false,
  className,
  children,
  zIndex = 1,
  bounds,
  onElementClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<FloatingElement[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const animationRef = useRef<any>();

  // Initialize floating elements
  useEffect(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    setContainerSize({ width: rect.width, height: rect.height });

    const newElements: FloatingElement[] = [];
    const sizeRange = sizeVariants[size];
    const speedRange = speedVariants[speed];

    for (let i = 0; i < count; i++) {
      const elementSize = Math.random() * (sizeRange.max - sizeRange.min) + sizeRange.min;
      const elementSpeed = Math.random() * (speedRange.max - speedRange.min) + speedRange.min;
      
      let elementDirection: number;
      switch (direction) {
        case 'up':
          elementDirection = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
          break;
        case 'down':
          elementDirection = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
          break;
        case 'left':
          elementDirection = Math.PI + (Math.random() - 0.5) * 0.5;
          break;
        case 'right':
          elementDirection = (Math.random() - 0.5) * 0.5;
          break;
        default:
          elementDirection = Math.random() * Math.PI * 2;
      }

      newElements.push({
        id: i,
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        size: elementSize,
        rotation: Math.random() * 360,
        speed: elementSpeed,
        direction: elementDirection,
        color: color || generateRandomColor(),
        opacity: opacity * (0.5 + Math.random() * 0.5)
      });
    }

    setElements(newElements);
  }, [count, size, speed, color, opacity, direction]);

  // Animation loop
  useEffect(() => {
    if (elements.length === 0 || !containerRef.current) return;

    const animate = () => {
      setElements(prevElements => 
        prevElements.map(element => {
          let newX = element.x + Math.cos(element.direction) * element.speed;
          let newY = element.y + Math.sin(element.direction) * element.speed;
          let newDirection = element.direction;

          // Boundary checks
          const leftBound = bounds?.left ?? 0;
          const rightBound = bounds?.right ?? containerSize.width;
          const topBound = bounds?.top ?? 0;
          const bottomBound = bounds?.bottom ?? containerSize.height;

          if (newX < leftBound || newX > rightBound - element.size) {
            newDirection = Math.PI - element.direction;
            newX = Math.max(leftBound, Math.min(rightBound - element.size, newX));
          }
          
          if (newY < topBound || newY > bottomBound - element.size) {
            newDirection = -element.direction;
            newY = Math.max(topBound, Math.min(bottomBound - element.size, newY));
          }

          return {
            ...element,
            x: newX,
            y: newY,
            direction: newDirection,
            rotation: element.rotation + 1
          };
        })
      );
    };

    animationRef.current = setInterval(animate, 16); // ~60fps

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [elements.length, containerSize, bounds]);

  // Handle mouse interaction
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!interactive || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setElements(prevElements =>
      prevElements.map(element => {
        const dx = mouseX - (element.x + element.size / 2);
        const dy = mouseY - (element.y + element.size / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const interactionRadius = 100;

        if (distance < interactionRadius) {
          const force = (interactionRadius - distance) / interactionRadius;
          const angle = Math.atan2(dy, dx) + Math.PI; // Repel from mouse
          const pushX = Math.cos(angle) * force * 5;
          const pushY = Math.sin(angle) * force * 5;

          return {
            ...element,
            x: Math.max(0, Math.min(containerSize.width - element.size, element.x + pushX)),
            y: Math.max(0, Math.min(containerSize.height - element.size, element.y + pushY))
          };
        }

        return element;
      })
    );
  };

  const handleElementClick = (element: FloatingElement, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Click animation
    const target = e.currentTarget as HTMLElement;
    anime({
      targets: target,
      scale: [1, 1.5, 1],
      opacity: [element.opacity, 1, element.opacity],
      duration: 300,
      easing: 'easeOutQuad'
    });

    onElementClick?.(element.id);
  };

  const renderShape = (element: FloatingElement) => {
    const baseClasses = cn(
      'absolute transition-all duration-75 ease-linear',
      shapes[shape],
      glow && `shadow-lg shadow-[${element.color}]/50`,
      blur && 'backdrop-blur-sm',
      interactive && 'cursor-pointer hover:scale-110'
    );

    const style = {
      left: element.x,
      top: element.y,
      width: element.size,
      height: element.size,
      backgroundColor: element.color,
      opacity: element.opacity,
      transform: `rotate(${element.rotation}deg)`,
      filter: blur ? 'blur(1px)' : undefined,
      boxShadow: glow ? `0 0 ${element.size}px ${element.color}40` : undefined
    };

    if (shape === 'triangle') {
      return (
        <div
          key={element.id}
          className={baseClasses}
          style={{
            ...style,
            backgroundColor: 'transparent',
            borderLeft: `${element.size / 2}px solid transparent`,
            borderRight: `${element.size / 2}px solid transparent`,
            borderBottom: `${element.size}px solid ${element.color}`,
            width: 0,
            height: 0
          }}
          onClick={interactive ? (e) => handleElementClick(element, e) : undefined}
        />
      );
    }

    if (shape === 'star') {
      return (
        <div
          key={element.id}
          className={baseClasses}
          style={style}
          onClick={interactive ? (e) => handleElementClick(element, e) : undefined}
        >
          <svg
            width={element.size}
            height={element.size}
            viewBox="0 0 24 24"
            fill={element.color}
            className="w-full h-full"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      );
    }

    if (shape === 'hexagon') {
      return (
        <div
          key={element.id}
          className={baseClasses}
          style={style}
          onClick={interactive ? (e) => handleElementClick(element, e) : undefined}
        >
          <svg
            width={element.size}
            height={element.size}
            viewBox="0 0 24 24"
            fill={element.color}
            className="w-full h-full"
          >
            <path d="M17.5 3.5L22 12l-4.5 8.5h-11L2 12l4.5-8.5h11z" />
          </svg>
        </div>
      );
    }

    return (
      <div
        key={element.id}
        className={baseClasses}
        style={style}
        onClick={interactive ? (e) => handleElementClick(element, e) : undefined}
      />
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden w-full h-full',
        className
      )}
      style={{ zIndex }}
      onMouseMove={handleMouseMove}
    >
      {/* Content */}
      {children && (
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      )}

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <AnimatePresence>
          {elements.map(element => (
            <motion.div
              key={element.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: element.opacity, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.3 }}
              className="pointer-events-auto"
            >
              {renderShape(element)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Predefined floating element configurations
export const FloatingBubbles: React.FC<Omit<FloatingElementsProps, 'shape'>> = (props) => (
  <FloatingElements shape="circle" glow blur {...props} />
);

export const FloatingSquares: React.FC<Omit<FloatingElementsProps, 'shape'>> = (props) => (
  <FloatingElements shape="square" {...props} />
);

export const FloatingStars: React.FC<Omit<FloatingElementsProps, 'shape'>> = (props) => (
  <FloatingElements shape="star" glow {...props} />
);

export const FloatingTriangles: React.FC<Omit<FloatingElementsProps, 'shape'>> = (props) => (
  <FloatingElements shape="triangle" {...props} />
);

export const FloatingHexagons: React.FC<Omit<FloatingElementsProps, 'shape'>> = (props) => (
  <FloatingElements shape="hexagon" {...props} />
);

// Animated background with floating elements
export interface AnimatedFloatingBackgroundProps extends FloatingElementsProps {
  gradient?: boolean;
  gradientColors?: string[];
}

export const AnimatedFloatingBackground: React.FC<AnimatedFloatingBackgroundProps> = ({
  gradient = false,
  gradientColors = ['#3b82f6', '#8b5cf6'],
  ...props
}) => {
  const gradientStyle = gradient
    ? {
        background: `linear-gradient(45deg, ${gradientColors.join(', ')})`,
        opacity: 0.1
      }
    : {};

  return (
    <div className="absolute inset-0" style={gradientStyle}>
      <FloatingElements {...props} />
    </div>
  );
};