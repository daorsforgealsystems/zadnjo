import React, { useEffect, useState, useRef } from 'react';

interface StickyHeaderProps {
  threshold?: number;
  showProgress?: boolean;
  onStickyChange?: (isSticky: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({
  threshold = 20,
  showProgress = false,
  onStickyChange,
  children,
  className = '',
}) => {
  const [isSticky, setIsSticky] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const isNowSticky = scrollTop > threshold;
      
      setIsSticky(isNowSticky);
      
      if (onStickyChange) {
        onStickyChange(isNowSticky);
      }

      if (showProgress) {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = Math.min((scrollTop / docHeight) * 100, 100);
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold, showProgress, onStickyChange]);

  return (
    <div
      ref={headerRef}
      className={`${className} ${isSticky ? 'fixed top-0 left-0 right-0 z-50' : 'relative'}`}
      style={{
        backgroundColor: isSticky ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
        backdropFilter: isSticky ? 'blur(8px)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      {children}
      {showProgress && isSticky && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
          <div
            className="h-full bg-blue-500 transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export const SlideInHeader: React.FC<StickyHeaderProps> = ({
  threshold = 100,
  onStickyChange,
  children,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.pageYOffset;
      
      if (currentScrollY > lastScrollY && currentScrollY > threshold) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
      
      if (onStickyChange) {
        onStickyChange(isVisible);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, threshold, onStickyChange, isVisible]);

  return (
    <div
      className={`${className} fixed top-0 left-0 right-0 z-50 transition-transform duration-300`}
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
      }}
    >
      {children}
    </div>
  );
};

export const ExpandableHeader: React.FC<{
  expandedHeight: number;
  collapsedHeight: number;
  threshold: number;
  children: React.ReactNode;
  className?: string;
}> = ({
  expandedHeight,
  collapsedHeight,
  threshold,
  children,
  className = '',
}) => {
  const [height, setHeight] = useState(expandedHeight);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const newHeight = Math.max(
        collapsedHeight,
        expandedHeight - scrollTop
      );
      setHeight(newHeight);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [expandedHeight, collapsedHeight]);

  return (
    <div
      className={`${className} fixed top-0 left-0 right-0 z-50 transition-all duration-300`}
      style={{ height }}
    >
      {children}
    </div>
  );
};
