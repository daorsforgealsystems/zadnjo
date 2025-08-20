import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

interface EnhancedSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'default' | 'shimmer' | 'wave' | 'pulse';
  speed?: 'slow' | 'normal' | 'fast';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

const EnhancedSkeleton: React.FC<EnhancedSkeletonProps> = ({
  className,
  variant = 'shimmer',
  speed = 'normal',
  rounded = 'md',
  ...props
}) => {
  const speedConfig = {
    slow: 2,
    normal: 1.5,
    fast: 1,
  };

  const roundedConfig = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  if (variant === 'shimmer') {
    return (
      <div
        className={cn(
          'relative overflow-hidden bg-muted',
          roundedConfig[rounded],
          className
        )}
        {...props}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: speedConfig[speed],
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>
    );
  }

  if (variant === 'wave') {
    return (
      <motion.div
        className={cn(
          'bg-muted',
          roundedConfig[rounded],
          className
        )}
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: speedConfig[speed],
          repeat: Infinity,
          ease: 'easeInOut',
        }}
  {...(props as any)}
      />
    );
  }

  if (variant === 'pulse') {
    return (
      <motion.div
        className={cn(
          'bg-muted',
          roundedConfig[rounded],
          className
        )}
        animate={{
          scale: [1, 1.02, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: speedConfig[speed],
          repeat: Infinity,
          ease: 'easeInOut',
        }}
  {...(props as any)}
      />
    );
  }

  return (
    <Skeleton
      className={cn(roundedConfig[rounded], className)}
      {...props}
    />
  );
};

// Skeleton components for common UI patterns
export const SkeletonCard: React.FC<{
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  lines?: number;
}> = ({
  className,
  showHeader = true,
  showFooter = false,
  lines = 3,
}) => (
  <div className={cn('p-6 space-y-4', className)}>
    {showHeader && (
      <div className="space-y-2">
        <EnhancedSkeleton className="h-6 w-3/4" variant="shimmer" />
        <EnhancedSkeleton className="h-4 w-1/2" variant="shimmer" />
      </div>
    )}
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <EnhancedSkeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-2/3' : 'w-full'
          )}
          variant="shimmer"
        />
      ))}
    </div>
    {showFooter && (
      <div className="flex justify-between items-center pt-4">
        <EnhancedSkeleton className="h-8 w-20" variant="shimmer" />
        <EnhancedSkeleton className="h-8 w-16" variant="shimmer" />
      </div>
    )}
  </div>
);

export const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({
  rows = 5,
  columns = 4,
  className,
}) => (
  <div className={cn('space-y-3', className)}>
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, i) => (
        <EnhancedSkeleton key={i} className="h-6 w-full" variant="shimmer" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <EnhancedSkeleton
            key={colIndex}
            className="h-4 w-full"
            variant="shimmer"
            speed="normal"
          />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonChart: React.FC<{
  className?: string;
  type?: 'bar' | 'line' | 'pie';
}> = ({
  className,
  type = 'bar',
}) => (
  <div className={cn('p-4 space-y-4', className)}>
    <div className="flex justify-between items-center">
      <EnhancedSkeleton className="h-6 w-32" variant="shimmer" />
      <EnhancedSkeleton className="h-8 w-24" variant="shimmer" />
    </div>
    
    {type === 'bar' && (
      <div className="flex items-end justify-between h-48 space-x-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <EnhancedSkeleton
            key={i}
            className="w-full"
            style={{ height: `${Math.random() * 80 + 20}%` }}
            variant="shimmer"
          />
        ))}
      </div>
    )}
    
    {type === 'line' && (
      <div className="h-48 relative">
        <EnhancedSkeleton className="absolute inset-0" variant="wave" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
        </div>
      </div>
    )}
    
    {type === 'pie' && (
      <div className="flex justify-center">
        <EnhancedSkeleton className="w-48 h-48" variant="pulse" rounded="full" />
      </div>
    )}
  </div>
);

export const SkeletonList: React.FC<{
  items?: number;
  showAvatar?: boolean;
  className?: string;
}> = ({
  items = 5,
  showAvatar = true,
  className,
}) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        {showAvatar && (
          <EnhancedSkeleton className="w-10 h-10" variant="shimmer" rounded="full" />
        )}
        <div className="flex-1 space-y-2">
          <EnhancedSkeleton className="h-4 w-3/4" variant="shimmer" />
          <EnhancedSkeleton className="h-3 w-1/2" variant="shimmer" />
        </div>
        <EnhancedSkeleton className="h-8 w-16" variant="shimmer" />
      </div>
    ))}
  </div>
);

export const SkeletonDashboard: React.FC<{
  className?: string;
}> = ({ className }) => (
  <div className={cn('space-y-6', className)}>
    {/* Header */}
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <EnhancedSkeleton className="h-8 w-48" variant="shimmer" />
        <EnhancedSkeleton className="h-4 w-32" variant="shimmer" />
      </div>
      <EnhancedSkeleton className="h-10 w-32" variant="shimmer" />
    </div>
    
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} showHeader={false} lines={2} />
      ))}
    </div>
    
    {/* Main Content */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <SkeletonChart type="bar" />
      </div>
      <div>
        <SkeletonList items={6} />
      </div>
    </div>
  </div>
);

export { EnhancedSkeleton };