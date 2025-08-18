import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation, useInView } from 'framer-motion';
import { Check, X, Heart, Star, ThumbsUp, Copy, Download, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Floating feedback animation
export const FloatingFeedback: React.FC<{
  children: React.ReactNode;
  feedback: 'success' | 'error' | 'like' | 'star' | 'copy';
  trigger?: 'click' | 'hover';
  className?: string;
}> = ({ children, feedback, trigger = 'click', className }) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const feedbackIcons = {
    success: Check,
    error: X,
    like: ThumbsUp,
    star: Star,
    copy: Copy,
  };

  const feedbackColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    like: 'text-blue-500',
    star: 'text-yellow-500',
    copy: 'text-purple-500',
  };

  const IconComponent = feedbackIcons[feedback];

  const triggerFeedback = () => {
    setShowFeedback(true);
    
    // Create particles for celebration effect
    if (feedback === 'success' || feedback === 'like' || feedback === 'star') {
      const newParticles = Array.from({ length: 6 }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
      }));
      setParticles(newParticles);
    }

    setTimeout(() => {
      setShowFeedback(false);
      setParticles([]);
    }, 2000);
  };

  const eventProps = trigger === 'click' 
    ? { onClick: triggerFeedback }
    : { onMouseEnter: triggerFeedback };

  return (
    <div className={cn('relative inline-block', className)} {...eventProps}>
      {children}
      
      <AnimatePresence>
        {showFeedback && (
          <>
            {/* Main feedback icon */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={cn(
                'absolute inset-0 flex items-center justify-center pointer-events-none z-10',
                feedbackColors[feedback]
              )}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: feedback === 'star' ? [0, 360] : 0
                }}
                transition={{ duration: 0.6 }}
              >
                <IconComponent className="w-8 h-8" />
              </motion.div>
            </motion.div>

            {/* Particles */}
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{ 
                  scale: 0, 
                  opacity: 1,
                  x: 0,
                  y: 0
                }}
                animate={{ 
                  scale: [0, 1, 0],
                  opacity: [1, 1, 0],
                  x: particle.x,
                  y: particle.y
                }}
                transition={{ 
                  duration: 1.5,
                  ease: 'easeOut'
                }}
                className={cn(
                  'absolute top-1/2 left-1/2 w-2 h-2 rounded-full pointer-events-none',
                  feedback === 'success' && 'bg-green-500',
                  feedback === 'like' && 'bg-blue-500',
                  feedback === 'star' && 'bg-yellow-500'
                )}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Ripple effect component
export const RippleEffect: React.FC<{
  children: React.ReactNode;
  color?: string;
  duration?: number;
  className?: string;
}> = ({ children, color = 'rgba(255, 255, 255, 0.3)', duration = 600, className }) => {
  const [ripples, setRipples] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
  }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = {
      id: Date.now(),
      x,
      y,
      size,
    };

    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, duration);
  };

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      onClick={handleClick}
    >
      {children}
      {ripples.map((ripple) => (
        <motion.div
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: duration / 1000, ease: 'easeOut' }}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
};

// Magnetic button effect
export const MagneticButton: React.FC<{
  children: React.ReactNode;
  strength?: number;
  className?: string;
  onClick?: () => void;
}> = ({ children, strength = 0.3, className, onClick }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    setPosition({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={buttonRef}
      className={cn('cursor-pointer', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  );
};

// Morphing icon button
export const MorphingIconButton: React.FC<{
  icon1: React.ComponentType<{ className?: string }>;
  icon2: React.ComponentType<{ className?: string }>;
  isToggled: boolean;
  onToggle: () => void;
  className?: string;
  size?: number;
}> = ({ icon1: Icon1, icon2: Icon2, isToggled, onToggle, className, size = 20 }) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className={cn('relative overflow-hidden', className)}
    >
      <AnimatePresence mode="wait">
        {isToggled ? (
          <motion.div
            key="icon2"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            <Icon2 className={`w-${size/4} h-${size/4}`} />
          </motion.div>
        ) : (
          <motion.div
            key="icon1"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            <Icon1 className={`w-${size/4} h-${size/4}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
};

// Elastic scale animation
export const ElasticScale: React.FC<{
  children: React.ReactNode;
  scale?: number;
  className?: string;
}> = ({ children, scale = 1.05, className }) => {
  return (
    <motion.div
      className={className}
      whileHover={{ scale }}
      whileTap={{ scale: scale * 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.div>
  );
};

// Staggered list animation
export const StaggeredList: React.FC<{
  children: React.ReactNode;
  stagger?: number;
  className?: string;
}> = ({ children, stagger = 0.1, className }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      ref={ref}
      variants={container}
      initial="hidden"
      animate={isInView ? 'show' : 'hidden'}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// Progress indicator with animation
export const AnimatedProgress: React.FC<{
  value: number;
  max?: number;
  showValue?: boolean;
  color?: string;
  className?: string;
}> = ({ value, max = 100, showValue = true, color = 'bg-primary', className }) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn('space-y-2', className)}>
      {showValue && (
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <motion.span
            key={value}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {Math.round(percentage)}%
          </motion.span>
        </div>
      )}
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

// Copy to clipboard with feedback
export const CopyButton: React.FC<{
  text: string;
  children?: React.ReactNode;
  className?: string;
}> = ({ text, children, className }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Text copied to clipboard',
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  return (
    <FloatingFeedback feedback="copy" trigger="click">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className={cn('relative', className)}
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-green-500" />
              {children || 'Copied!'}
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              {children || 'Copy'}
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </FloatingFeedback>
  );
};

// Like button with heart animation
export const LikeButton: React.FC<{
  isLiked: boolean;
  onToggle: () => void;
  count?: number;
  className?: string;
}> = ({ isLiked, onToggle, count, className }) => {
  return (
    <FloatingFeedback feedback="like" trigger="click">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className={cn('flex items-center gap-2', className)}
      >
        <motion.div
          animate={isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-colors',
              isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
            )}
          />
        </motion.div>
        {count !== undefined && (
          <motion.span
            key={count}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm"
          >
            {count}
          </motion.span>
        )}
      </Button>
    </FloatingFeedback>
  );
};

// Floating action button with tooltip
export const FloatingActionButton: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}> = ({ icon: Icon, label, onClick, position = 'bottom-right', className }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-20 right-6',
    'top-left': 'fixed top-20 left-6',
  };

  return (
    <div className={cn(positionClasses[position], 'z-50')}>
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onHoverStart={() => setShowTooltip(true)}
        onHoverEnd={() => setShowTooltip(false)}
        className="relative"
      >
        <RippleEffect>
          <Button
            onClick={onClick}
            className={cn(
              'rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow',
              className
            )}
          >
            <Icon className="w-6 h-6" />
          </Button>
        </RippleEffect>

        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 10 }}
              className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-2 bg-foreground text-background text-sm rounded-lg whitespace-nowrap"
            >
              {label}
              <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-foreground" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};