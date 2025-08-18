import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Truck, Package, MapPin, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnhancedSkeleton, SkeletonCard, SkeletonTable, SkeletonChart, SkeletonList } from './enhanced-skeleton';

// Loading spinner variants
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'dots' | 'pulse' | 'truck';
  className?: string;
}> = ({ size = 'md', variant = 'default', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  if (variant === 'dots') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn(
              'rounded-full bg-current',
              size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'
            )}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <motion.div
        className={cn('rounded-full bg-current', sizeClasses[size], className)}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
        }}
      />
    );
  }

  if (variant === 'truck') {
    return (
      <motion.div className={cn('relative', className)}>
        <Truck className={cn('text-primary', sizeClasses[size])} />
        <motion.div
          className="absolute -bottom-1 left-0 right-0 flex justify-center space-x-1"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1 h-1 bg-primary rounded-full opacity-60"
            />
          ))}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />
  );
};

// Inline loading state
export const InlineLoading: React.FC<{
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'dots' | 'pulse' | 'truck';
  className?: string;
}> = ({ text = 'Loading...', size = 'md', variant = 'default', className }) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LoadingSpinner size={size} variant={variant} />
      <span className="text-muted-foreground">{text}</span>
    </div>
  );
};

// Full page loading with progress
export const FullPageLoading: React.FC<{
  title?: string;
  subtitle?: string;
  progress?: number;
  steps?: string[];
  currentStep?: number;
  className?: string;
}> = ({
  title = 'Loading',
  subtitle = 'Please wait while we prepare your data...',
  progress,
  steps,
  currentStep = 0,
  className,
}) => {
  return (
    <div className={cn('min-h-screen flex items-center justify-center bg-background', className)}>
      <div className="text-center space-y-6 max-w-md p-6">
        {/* Logo/Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mx-auto mb-6"
        >
          <LoadingSpinner size="lg" variant="truck" />
        </motion.div>

        {/* Title and subtitle */}
        <div className="space-y-2">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-semibold"
          >
            {title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground"
          >
            {subtitle}
          </motion.p>
        </div>

        {/* Progress bar */}
        {progress !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2"
          >
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        )}

        {/* Steps */}
        {steps && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            {steps.map((step, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-3 text-sm',
                  index < currentStep && 'text-green-600',
                  index === currentStep && 'text-primary',
                  index > currentStep && 'text-muted-foreground'
                )}
              >
                {index < currentStep ? (
                  <CheckCircle className="w-4 h-4" />
                ) : index === currentStep ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                )}
                <span>{step}</span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Card loading state
export const CardLoading: React.FC<{
  variant?: 'default' | 'detailed' | 'minimal';
  className?: string;
}> = ({ variant = 'default', className }) => {
  if (variant === 'minimal') {
    return (
      <div className={cn('p-4 space-y-3', className)}>
        <EnhancedSkeleton className="h-4 w-3/4" variant="shimmer" />
        <EnhancedSkeleton className="h-3 w-1/2" variant="shimmer" />
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <SkeletonCard className={className} showHeader showFooter lines={4} />
    );
  }

  return (
    <SkeletonCard className={className} showHeader lines={3} />
  );
};

// Table loading state
export const TableLoading: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex justify-between items-center">
        <EnhancedSkeleton className="h-6 w-32" variant="shimmer" />
        <EnhancedSkeleton className="h-8 w-24" variant="shimmer" />
      </div>
      <SkeletonTable rows={rows} columns={columns} />
    </div>
  );
};

// List loading state
export const ListLoading: React.FC<{
  items?: number;
  showAvatar?: boolean;
  className?: string;
}> = ({ items = 5, showAvatar = true, className }) => {
  return <SkeletonList items={items} showAvatar={showAvatar} className={className} />;
};

// Chart loading state
export const ChartLoading: React.FC<{
  type?: 'bar' | 'line' | 'pie';
  className?: string;
}> = ({ type = 'bar', className }) => {
  return <SkeletonChart type={type} className={className} />;
};

// Button loading state
export const ButtonLoading: React.FC<{
  children: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}> = ({
  children,
  loading = false,
  loadingText = 'Loading...',
  variant = 'default',
  size = 'md',
  className,
  onClick,
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';
  
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  };

  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 py-2 px-4',
    lg: 'h-11 px-8',
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        loading && 'cursor-not-allowed',
        className
      )}
      disabled={loading}
      onClick={onClick}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Search loading state
export const SearchLoading: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <LoadingSpinner size="sm" />
        <span className="text-sm text-muted-foreground">Searching...</span>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <EnhancedSkeleton className="h-4 w-full" variant="shimmer" />
            <EnhancedSkeleton className="h-3 w-3/4" variant="shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Form loading state
export const FormLoading: React.FC<{
  fields?: number;
  className?: string;
}> = ({ fields = 4, className }) => {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <EnhancedSkeleton className="h-4 w-24" variant="shimmer" />
          <EnhancedSkeleton className="h-10 w-full" variant="shimmer" />
        </div>
      ))}
      <div className="flex justify-end gap-2">
        <EnhancedSkeleton className="h-10 w-20" variant="shimmer" />
        <EnhancedSkeleton className="h-10 w-24" variant="shimmer" />
      </div>
    </div>
  );
};

// Logistics-specific loading states
export const ShipmentLoading: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-3">
        <Package className="w-5 h-5 text-muted-foreground" />
        <div className="flex-1 space-y-2">
          <EnhancedSkeleton className="h-4 w-32" variant="shimmer" />
          <EnhancedSkeleton className="h-3 w-24" variant="shimmer" />
        </div>
        <LoadingSpinner size="sm" />
      </div>
      <div className="pl-8 space-y-2">
        <EnhancedSkeleton className="h-3 w-full" variant="shimmer" />
        <EnhancedSkeleton className="h-3 w-2/3" variant="shimmer" />
      </div>
    </div>
  );
};

export const RouteLoading: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-3">
        <MapPin className="w-5 h-5 text-muted-foreground" />
        <div className="flex-1">
          <EnhancedSkeleton className="h-4 w-48" variant="shimmer" />
        </div>
        <LoadingSpinner size="sm" variant="truck" />
      </div>
      <div className="pl-8 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-muted" />
            <EnhancedSkeleton className="h-3 w-40" variant="shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const DeliveryStatusLoading: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <EnhancedSkeleton className="h-4 w-32" variant="shimmer" />
        </div>
        <LoadingSpinner size="sm" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <EnhancedSkeleton className="w-3 h-3" variant="pulse" rounded="full" />
            <div className="flex-1 space-y-1">
              <EnhancedSkeleton className="h-3 w-full" variant="shimmer" />
              <EnhancedSkeleton className="h-2 w-2/3" variant="shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};