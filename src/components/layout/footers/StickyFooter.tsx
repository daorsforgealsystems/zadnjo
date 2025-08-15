// Sticky footer component with anime.js animations
import React, { useEffect, useRef, useState } from 'react';
import { useAnimations } from '@/hooks/useAnimations';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { animateFooterReveal } from '@/lib/animations/layoutAnimations';
import { cn } from '@/lib/utils';
import { StickyConfig } from '@/types/layout';

interface StickyFooterProps {
  children: React.ReactNode;
  config?: StickyConfig;
  className?: string;
  revealThreshold?: number;
  autoHide?: boolean;
  onVisibilityChange?: (isVisible: boolean) => void;
}

const defaultConfig: StickyConfig = {
  bottom: 0,
  zIndex: 40,
  backgroundColor: 'rgba(var(--background), 0.95)',
  backdropBlur: true,
};

export const StickyFooter: React.FC<StickyFooterProps> = ({
  children,
  config = {},
  className,
  revealThreshold = 100,
  autoHide = false,
  onVisibilityChange,
}) => {
  const footerRef = useRef<HTMLElement>(null);
  const { createAnimation } = useAnimations();
  const { isMobile } = useResponsiveLayout();

  const [isVisible, setIsVisible] = useState(!autoHide);
  const [lastScrollY, setLastScrollY] = useState(0);

  const mergedConfig = { ...defaultConfig, ...config };

  // Handle scroll events for auto-hide functionality
  useEffect(() => {
    if (!autoHide) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const isScrollingUp = scrollY < lastScrollY;
      const shouldShow = scrollY < revealThreshold || isScrollingUp;

      if (shouldShow !== isVisible) {
        setIsVisible(shouldShow);
        onVisibilityChange?.(shouldShow);

        if (footerRef.current) {
          animateFooterReveal(footerRef.current, shouldShow);
        }
      }

      setLastScrollY(scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [autoHide, isVisible, lastScrollY, revealThreshold, onVisibilityChange]);

  return (
    <footer
      ref={footerRef}
      className={cn(
        'fixed bottom-0 left-0 right-0 transition-all duration-300 ease-out',
        'border-t border-border/50',
        !isVisible && autoHide && 'translate-y-full',
        className
      )}
      style={{
        bottom: mergedConfig.bottom,
        zIndex: mergedConfig.zIndex,
        backgroundColor: mergedConfig.backgroundColor,
        backdropFilter: mergedConfig.backdropBlur ? 'blur(12px)' : 'none',
      }}
      data-sticky-footer
      data-is-visible={isVisible}
    >
      {children}
    </footer>
  );
};

// Slide-up footer that appears on scroll
export const SlideUpFooter: React.FC<StickyFooterProps> = ({
  children,
  config = {},
  className,
  revealThreshold = 200,
  onVisibilityChange,
}) => {
  const footerRef = useRef<HTMLElement>(null);
  const { createAnimation } = useAnimations();

  const [isVisible, setIsVisible] = useState(false);

  const mergedConfig = { ...defaultConfig, ...config };

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const scrolledToBottom = scrollY + windowHeight >= documentHeight - revealThreshold;

      if (scrolledToBottom !== isVisible) {
        setIsVisible(scrolledToBottom);
        onVisibilityChange?.(scrolledToBottom);

        if (footerRef.current) {
          createAnimation('slide-footer', footerRef.current, {
            translateY: scrolledToBottom ? ['100%', '0%'] : ['0%', '100%'],
            opacity: scrolledToBottom ? [0, 1] : [1, 0],
            duration: 400,
            easing: 'easeOutQuart',
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVisible, revealThreshold, onVisibilityChange, createAnimation]);

  return (
    <footer
      ref={footerRef}
      className={cn(
        'fixed bottom-0 left-0 right-0 transform translate-y-full opacity-0',
        'bg-background/95 backdrop-blur-md border-t border-border/50',
        className
      )}
      style={{
        zIndex: mergedConfig.zIndex,
      }}
      data-slide-footer
    >
      {children}
    </footer>
  );
};

// Expandable footer that grows when hovered
export const ExpandableFooter: React.FC<StickyFooterProps & {
  expandedHeight?: number;
  collapsedHeight?: number;
  expandOnHover?: boolean;
}> = ({
  children,
  config = {},
  className,
  expandedHeight = 120,
  collapsedHeight = 48,
  expandOnHover = true,
  onVisibilityChange,
}) => {
  const footerRef = useRef<HTMLElement>(null);
  const { createAnimation } = useAnimations();

  const [isExpanded, setIsExpanded] = useState(false);

  const mergedConfig = { ...defaultConfig, ...config };

  const handleMouseEnter = () => {
    if (!expandOnHover) return;
    
    setIsExpanded(true);
    if (footerRef.current) {
      createAnimation('expand-footer', footerRef.current, {
        height: expandedHeight,
        duration: 300,
        easing: 'easeOutBack',
      });
    }
  };

  const handleMouseLeave = () => {
    if (!expandOnHover) return;
    
    setIsExpanded(false);
    if (footerRef.current) {
      createAnimation('collapse-footer', footerRef.current, {
        height: collapsedHeight,
        duration: 300,
        easing: 'easeOutQuart',
      });
    }
  };

  return (
    <footer
      ref={footerRef}
      className={cn(
        'fixed bottom-0 left-0 right-0 transition-all duration-300 ease-out',
        'bg-background/95 backdrop-blur-md border-t border-border/50',
        'overflow-hidden cursor-pointer',
        className
      )}
      style={{
        height: collapsedHeight,
        zIndex: mergedConfig.zIndex,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-expandable-footer
      data-is-expanded={isExpanded}
    >
      <div className="h-full">
        {children}
      </div>
    </footer>
  );
};

// Floating action footer
export const FloatingFooter: React.FC<StickyFooterProps & {
  position?: 'left' | 'center' | 'right';
  margin?: number;
}> = ({
  children,
  config = {},
  className,
  position = 'center',
  margin = 20,
  onVisibilityChange,
}) => {
  const footerRef = useRef<HTMLElement>(null);
  const { createAnimation } = useAnimations();
  const { isMobile } = useResponsiveLayout();

  const [isVisible, setIsVisible] = useState(true);

  const mergedConfig = { ...defaultConfig, ...config };

  const positionClasses = {
    left: 'left-4',
    center: 'left-1/2 transform -translate-x-1/2',
    right: 'right-4',
  };

  useEffect(() => {
    if (footerRef.current) {
      createAnimation('float-footer', footerRef.current, {
        translateY: [20, 0],
        opacity: [0, 1],
        scale: [0.9, 1],
        duration: 500,
        easing: 'easeOutBack',
        delay: 200,
      });
    }
  }, [createAnimation]);

  return (
    <footer
      ref={footerRef}
      className={cn(
        'fixed bottom-4 rounded-full shadow-lg',
        'bg-background/95 backdrop-blur-md border border-border/50',
        positionClasses[position],
        isMobile && 'left-4 right-4 transform-none',
        className
      )}
      style={{
        zIndex: mergedConfig.zIndex,
      }}
      data-floating-footer
    >
      {children}
    </footer>
  );
};

// Progress footer that shows scroll progress
export const ProgressFooter: React.FC<StickyFooterProps & {
  showPercentage?: boolean;
}> = ({
  children,
  config = {},
  className,
  showPercentage = false,
  onVisibilityChange,
}) => {
  const footerRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [scrollProgress, setScrollProgress] = useState(0);

  const mergedConfig = { ...defaultConfig, ...config };

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrollY / documentHeight, 1);
      
      setScrollProgress(progress);

      if (progressRef.current) {
        progressRef.current.style.width = `${progress * 100}%`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <footer
      ref={footerRef}
      className={cn(
        'fixed bottom-0 left-0 right-0',
        'bg-background/95 backdrop-blur-md border-t border-border/50',
        className
      )}
      style={{
        zIndex: mergedConfig.zIndex,
      }}
      data-progress-footer
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
        <div
          ref={progressRef}
          className="h-full bg-primary transition-all duration-100 ease-out"
          style={{ width: '0%' }}
        />
      </div>
      
      <div className="flex items-center justify-between p-4">
        {children}
        {showPercentage && (
          <span className="text-sm text-muted-foreground">
            {Math.round(scrollProgress * 100)}%
          </span>
        )}
      </div>
    </footer>
  );
};