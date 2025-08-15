import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  trail: { x: number; y: number }[];
}

export interface ParticleSystemProps {
  particleCount?: number;
  emissionRate?: number;
  particleLife?: number;
  particleSize?: { min: number; max: number };
  particleSpeed?: { min: number; max: number };
  gravity?: { x: number; y: number };
  colors?: string[];
  shape?: 'circle' | 'square' | 'triangle' | 'star' | 'image';
  imageUrl?: string;
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'hard-light';
  emitterPosition?: { x: number; y: number } | 'mouse' | 'center' | 'random';
  emitterShape?: 'point' | 'circle' | 'rectangle' | 'line';
  emitterSize?: { width: number; height: number };
  direction?: { angle: number; spread: number } | 'radial' | 'upward' | 'random';
  fadeOut?: boolean;
  trail?: boolean;
  trailLength?: number;
  collision?: boolean;
  interactive?: boolean;
  paused?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onParticleClick?: (particle: Particle) => void;
  onParticleComplete?: (particle: Particle) => void;
}

const defaultColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  particleCount = 100,
  emissionRate = 5,
  particleLife = 3000,
  particleSize = { min: 2, max: 8 },
  particleSpeed = { min: 0.5, max: 2 },
  gravity = { x: 0, y: 0.1 },
  colors = defaultColors,
  shape = 'circle',
  imageUrl,
  blendMode = 'normal',
  emitterPosition = 'center',
  emitterShape = 'point',
  emitterSize = { width: 10, height: 10 },
  direction = 'radial',
  fadeOut = true,
  trail = false,
  trailLength = 5,
  collision = false,
  interactive = false,
  paused = false,
  className,
  style,
  onParticleClick,
  onParticleComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const particleIdRef = useRef(0);

  // Update container size
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Generate particle position based on emitter settings
  const generatePosition = useCallback(() => {
    let x: number, y: number;

    if (emitterPosition === 'mouse') {
      x = mousePosition.x;
      y = mousePosition.y;
    } else if (emitterPosition === 'center') {
      x = containerSize.width / 2;
      y = containerSize.height / 2;
    } else if (emitterPosition === 'random') {
      x = Math.random() * containerSize.width;
      y = Math.random() * containerSize.height;
    } else {
      x = emitterPosition.x;
      y = emitterPosition.y;
    }

    // Apply emitter shape
    switch (emitterShape) {
      case 'circle':
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * emitterSize.width / 2;
        x += Math.cos(angle) * radius;
        y += Math.sin(angle) * radius;
        break;
      
      case 'rectangle':
        x += (Math.random() - 0.5) * emitterSize.width;
        y += (Math.random() - 0.5) * emitterSize.height;
        break;
      
      case 'line':
        x += (Math.random() - 0.5) * emitterSize.width;
        break;
    }

    return { x, y };
  }, [emitterPosition, emitterShape, emitterSize, mousePosition, containerSize]);

  // Generate particle velocity based on direction settings
  const generateVelocity = useCallback(() => {
    const speed = Math.random() * (particleSpeed.max - particleSpeed.min) + particleSpeed.min;
    let angle: number;

    if (direction === 'radial') {
      angle = Math.random() * Math.PI * 2;
    } else if (direction === 'upward') {
      angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    } else if (direction === 'random') {
      angle = Math.random() * Math.PI * 2;
    } else {
      const baseAngle = direction.angle;
      const spread = direction.spread;
      angle = baseAngle + (Math.random() - 0.5) * spread;
    }

    return {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed
    };
  }, [direction, particleSpeed]);

  // Create new particle
  const createParticle = useCallback((): Particle => {
    const position = generatePosition();
    const velocity = generateVelocity();
    const size = Math.random() * (particleSize.max - particleSize.min) + particleSize.min;
    const color = colors[Math.floor(Math.random() * colors.length)];

    return {
      id: particleIdRef.current++,
      x: position.x,
      y: position.y,
      vx: velocity.vx,
      vy: velocity.vy,
      size,
      life: particleLife,
      maxLife: particleLife,
      color,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      opacity: 1,
      trail: trail ? [] : []
    };
  }, [generatePosition, generateVelocity, particleSize, colors, particleLife, trail]);

  // Update particles
  const updateParticles = useCallback(() => {
    setParticles(prevParticles => {
      let updatedParticles = prevParticles.map(particle => {
        // Update trail
        if (trail) {
          particle.trail.push({ x: particle.x, y: particle.y });
          if (particle.trail.length > trailLength) {
            particle.trail.shift();
          }
        }

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Apply gravity
        particle.vx += gravity.x;
        particle.vy += gravity.y;

        // Update rotation
        particle.rotation += particle.rotationSpeed;

        // Update life
        particle.life -= 16; // Assuming 60fps

        // Update opacity for fade out
        if (fadeOut) {
          particle.opacity = particle.life / particle.maxLife;
        }

        // Collision with boundaries
        if (collision) {
          if (particle.x < 0 || particle.x > containerSize.width) {
            particle.vx *= -0.8;
            particle.x = Math.max(0, Math.min(containerSize.width, particle.x));
          }
          if (particle.y < 0 || particle.y > containerSize.height) {
            particle.vy *= -0.8;
            particle.y = Math.max(0, Math.min(containerSize.height, particle.y));
          }
        }

        return particle;
      });

      // Remove dead particles
      const aliveParticles = updatedParticles.filter(particle => {
        if (particle.life <= 0) {
          onParticleComplete?.(particle);
          return false;
        }
        return true;
      });

      // Add new particles based on emission rate
      if (!paused && aliveParticles.length < particleCount) {
        const particlesToAdd = Math.min(emissionRate, particleCount - aliveParticles.length);
        for (let i = 0; i < particlesToAdd; i++) {
          aliveParticles.push(createParticle());
        }
      }

      return aliveParticles;
    });
  }, [
    trail, trailLength, gravity, fadeOut, collision, containerSize,
    paused, particleCount, emissionRate, createParticle, onParticleComplete
  ]);

  // Animation loop
  useEffect(() => {
    if (paused) return;

    const animate = () => {
      updateParticles();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updateParticles, paused]);

  // Mouse tracking
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  // Canvas rendering
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = containerSize.width;
    canvas.height = containerSize.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation;

    // Draw particles
    particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);

      // Draw trail
      if (trail && particle.trail.length > 1) {
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particle.trail[0].x - particle.x, particle.trail[0].y - particle.y);
        
        for (let i = 1; i < particle.trail.length; i++) {
          const trailOpacity = i / particle.trail.length;
          ctx.globalAlpha = particle.opacity * trailOpacity;
          ctx.lineTo(particle.trail[i].x - particle.x, particle.trail[i].y - particle.y);
        }
        ctx.stroke();
        ctx.globalAlpha = particle.opacity;
      }

      // Draw particle
      ctx.fillStyle = particle.color;

      switch (shape) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        
        case 'square':
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
          break;
        
        case 'triangle':
          ctx.beginPath();
          ctx.moveTo(0, -particle.size / 2);
          ctx.lineTo(-particle.size / 2, particle.size / 2);
          ctx.lineTo(particle.size / 2, particle.size / 2);
          ctx.closePath();
          ctx.fill();
          break;
        
        case 'star':
          const spikes = 5;
          const outerRadius = particle.size;
          const innerRadius = particle.size / 2;
          
          ctx.beginPath();
          for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.closePath();
          ctx.fill();
          break;
      }

      ctx.restore();
    });
  }, [particles, containerSize, blendMode, shape, trail]);

  // Handle particle click
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!interactive || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const clickedParticle = particles.find(particle => {
      const distance = Math.sqrt(
        Math.pow(clickX - particle.x, 2) + Math.pow(clickY - particle.y, 2)
      );
      return distance <= particle.size;
    });

    if (clickedParticle) {
      onParticleClick?.(clickedParticle);
    }
  }, [interactive, particles, onParticleClick]);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={style}
      onMouseMove={handleMouseMove}
      onClick={handleCanvasClick}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: blendMode }}
      />
    </div>
  );
};

// Predefined particle systems
export const FireworkParticles: React.FC<Omit<ParticleSystemProps, 'direction' | 'gravity' | 'colors'>> = (props) => (
  <ParticleSystem
    direction="radial"
    gravity={{ x: 0, y: 0.2 }}
    colors={['#ff6b6b', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd']}
    particleLife={2000}
    fadeOut={true}
    trail={true}
    {...props}
  />
);

export const SnowParticles: React.FC<Omit<ParticleSystemProps, 'direction' | 'gravity' | 'colors' | 'shape'>> = (props) => (
  <ParticleSystem
    direction={{ angle: Math.PI / 2, spread: 0.2 }}
    gravity={{ x: 0.05, y: 0.1 }}
    colors={['#ffffff', '#f8f9fa', '#e9ecef']}
    shape="circle"
    particleSize={{ min: 2, max: 6 }}
    emitterPosition={{ x: 0, y: -10 }}
    emitterShape="line"
    emitterSize={{ width: 1000, height: 10 }}
    {...props}
  />
);

export const SmokeParticles: React.FC<Omit<ParticleSystemProps, 'direction' | 'gravity' | 'colors'>> = (props) => (
  <ParticleSystem
    direction={{ angle: -Math.PI / 2, spread: 0.3 }}
    gravity={{ x: 0.02, y: -0.05 }}
    colors={['#6c757d', '#adb5bd', '#ced4da']}
    blendMode="multiply"
    fadeOut={true}
    particleSize={{ min: 8, max: 20 }}
    particleLife={4000}
    {...props}
  />
);

export const BubbleParticles: React.FC<Omit<ParticleSystemProps, 'direction' | 'gravity' | 'colors' | 'shape'>> = (props) => (
  <ParticleSystem
    direction="upward"
    gravity={{ x: 0, y: -0.1 }}
    colors={['#74b9ff', '#00cec9', '#6c5ce7', '#a29bfe']}
    shape="circle"
    fadeOut={true}
    collision={true}
    {...props}
  />
);

export const StarfieldParticles: React.FC<Omit<ParticleSystemProps, 'direction' | 'gravity' | 'colors' | 'shape'>> = (props) => (
  <ParticleSystem
    direction="random"
    gravity={{ x: 0, y: 0 }}
    colors={['#ffffff', '#ffeaa7', '#74b9ff', '#fd79a8']}
    shape="star"
    particleSize={{ min: 1, max: 4 }}
    particleSpeed={{ min: 0.1, max: 0.5 }}
    emitterPosition="random"
    particleLife={8000}
    fadeOut={false}
    {...props}
  />
);