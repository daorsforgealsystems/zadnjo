import React from 'react';
import { motion } from 'framer-motion';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { cn } from '@/lib/utils';

export interface ResponsiveTypographyProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'overline';
  component?: keyof JSX.IntrinsicElements;
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  gradient?: boolean;
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  align?: 'left' | 'center' | 'right' | 'justify';
  color?: 'primary' | 'secondary' | 'muted' | 'destructive' | 'accent';
  responsive?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  maxWidth?: boolean;
}

const typographyVariants = {
  h1: 'text-4xl md:text-5xl lg:text-6xl font-bold leading-tight',
  h2: 'text-3xl md:text-4xl lg:text-5xl font-bold leading-tight',
  h3: 'text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight',
  h4: 'text-xl md:text-2xl lg:text-3xl font-semibold leading-snug',
  h5: 'text-lg md:text-xl lg:text-2xl font-medium leading-snug',
  h6: 'text-base md:text-lg lg:text-xl font-medium leading-normal',
  body1: 'text-base md:text-lg leading-relaxed',
  body2: 'text-sm md:text-base leading-relaxed',
  caption: 'text-xs md:text-sm text-muted-foreground',
  overline: 'text-xs uppercase tracking-wider font-medium text-muted-foreground'
};

const weightVariants = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold'
};

const alignVariants = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify'
};

const colorVariants = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  muted: 'text-muted-foreground',
  destructive: 'text-destructive',
  accent: 'text-accent-foreground'
};

export const ResponsiveTypography: React.FC<ResponsiveTypographyProps> = ({
  variant = 'body1',
  component,
  children,
  className,
  animate = false,
  gradient = false,
  weight,
  align = 'left',
  color,
  responsive,
  maxWidth = false,
  ...props
}) => {
  const { isMobile, isTablet } = useResponsiveLayout();

  // Determine the component to render
  const Component = component || (variant.startsWith('h') ? variant as keyof JSX.IntrinsicElements : 'p');

  // Get responsive text size
  const getResponsiveSize = () => {
    if (responsive) {
      if (isMobile && responsive.mobile) return responsive.mobile;
      if (isTablet && responsive.tablet) return responsive.tablet;
      if (responsive.desktop) return responsive.desktop;
    }
    return typographyVariants[variant];
  };

  const baseClasses = cn(
    getResponsiveSize(),
    weight && weightVariants[weight],
    alignVariants[align],
    color && colorVariants[color],
    gradient && 'bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent',
    maxWidth && 'max-w-prose',
    className
  );

  const animationVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  if (animate) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={animationVariants}
      >
        <Component className={baseClasses} {...props}>
          {children}
        </Component>
      </motion.div>
    );
  }

  return (
    <Component className={baseClasses} {...props}>
      {children}
    </Component>
  );
};

// Predefined responsive typography components
export const ResponsiveHeading: React.FC<Omit<ResponsiveTypographyProps, 'variant'> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }> = ({ 
  level = 1, 
  ...props 
}) => (
  <ResponsiveTypography variant={`h${level}` as any} {...props} />
);

export const ResponsiveText: React.FC<Omit<ResponsiveTypographyProps, 'variant'> & { size?: 'large' | 'normal' | 'small' }> = ({ 
  size = 'normal', 
  ...props 
}) => {
  const variant = size === 'large' ? 'body1' : size === 'small' ? 'caption' : 'body2';
  return <ResponsiveTypography variant={variant} {...props} />;
};

export const ResponsiveTitle: React.FC<ResponsiveTypographyProps> = (props) => (
  <ResponsiveTypography
    variant="h2"
    gradient
    animate
    maxWidth
    {...props}
  />
);

export const ResponsiveSubtitle: React.FC<ResponsiveTypographyProps> = (props) => (
  <ResponsiveTypography
    variant="h4"
    color="muted"
    animate
    maxWidth
    {...props}
  />
);