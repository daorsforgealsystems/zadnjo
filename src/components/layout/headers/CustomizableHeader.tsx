import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Bell, 
  Search, 
  Menu, 
  User, 
  Settings, 
  LogOut,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';
import anime from 'animejs';

export interface HeaderAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'ghost' | 'outline';
  badge?: number;
}

export interface HeaderUser {
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
}

export interface CustomizableHeaderProps {
  variant?: 'default' | 'glass' | 'solid' | 'gradient' | 'minimal' | 'expanded';
  logo?: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: HeaderAction[];
  user?: HeaderUser;
  showSearch?: boolean;
  showNotifications?: boolean;
  notificationCount?: number;
  showThemeToggle?: boolean;
  showUserMenu?: boolean;
  onMenuToggle?: () => void;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onUserMenuClick?: () => void;
  onThemeToggle?: () => void;
  className?: string;
  height?: number;
  sticky?: boolean;
  blur?: boolean;
  shadow?: boolean;
  border?: boolean;
  theme?: 'light' | 'dark';
  gradientColors?: string[];
  customContent?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  searchPlaceholder?: string;
}

const headerVariants = {
  default: 'bg-background/95 backdrop-blur-sm',
  glass: 'bg-background/20 backdrop-blur-md',
  solid: 'bg-background',
  gradient: 'bg-gradient-to-r',
  minimal: 'bg-transparent',
  expanded: 'bg-background/95 backdrop-blur-sm'
};

export const CustomizableHeader: React.FC<CustomizableHeaderProps> = ({
  variant = 'default',
  logo,
  title,
  subtitle,
  actions = [],
  user,
  showSearch = true,
  showNotifications = true,
  notificationCount = 0,
  showThemeToggle = true,
  showUserMenu = true,
  onMenuToggle,
  onSearch,
  onNotificationClick,
  onUserMenuClick,
  onThemeToggle,
  className,
  height = 64,
  sticky = true,
  blur = true,
  shadow = true,
  border = true,
  theme = 'light',
  gradientColors = ['#3b82f6', '#8b5cf6'],
  customContent,
  breadcrumbs,
  searchPlaceholder = 'Search...',
}) => {
  const headerRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const { scrollY } = useScroll();

  // Transform values based on scroll
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.95]);
  const headerBlur = useTransform(scrollY, [0, 100], [0, 10]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    if (sticky) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [sticky]);

  // Animate header on scroll
  useEffect(() => {
    if (headerRef.current && sticky) {
      anime({
        targets: headerRef.current,
        translateY: isScrolled ? 0 : 0,
        boxShadow: isScrolled 
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
          : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        duration: 200,
        easing: 'easeOutQuad'
      });
    }
  }, [isScrolled, sticky]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const gradientStyle = variant === 'gradient' ? {
    backgroundImage: `linear-gradient(to right, ${gradientColors.join(', ')})`
  } : {};

  const getHeaderClasses = () => {
    return cn(
      'w-full transition-all duration-200 z-50',
      sticky && 'sticky top-0',
      headerVariants[variant],
      shadow && isScrolled && 'shadow-lg',
      border && 'border-b border-border/50',
      blur && variant !== 'solid' && 'backdrop-blur-md',
      className
    );
  };

  return (
    <motion.header
      ref={headerRef}
      className={getHeaderClasses()}
      style={{ 
        height: variant === 'expanded' ? 'auto' : height,
        opacity: sticky ? headerOpacity : 1,
        backdropFilter: blur ? `blur(${headerBlur}px)` : undefined,
        ...gradientStyle
      }}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="h-full px-4 lg:px-6">
        <div className="flex items-center justify-between h-full">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onMenuToggle}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              {logo && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {logo}
                </motion.div>
              )}
              
              {(title || subtitle) && (
                <div className="hidden sm:block">
                  {title && (
                    <h1 className="text-lg font-semibold text-foreground">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-sm text-muted-foreground">
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="hidden lg:flex items-center gap-2 text-sm">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && (
                      <span className="text-muted-foreground">/</span>
                    )}
                    <span 
                      className={cn(
                        index === breadcrumbs.length - 1 
                          ? 'text-foreground font-medium' 
                          : 'text-muted-foreground hover:text-foreground cursor-pointer'
                      )}
                    >
                      {crumb.label}
                    </span>
                  </React.Fragment>
                ))}
              </nav>
            )}
          </div>

          {/* Center Section */}
          <div className="flex-1 max-w-md mx-8">
            {showSearch && (
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                />
              </form>
            )}
            
            {customContent && (
              <div className="flex items-center justify-center">
                {customContent}
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Custom Actions */}
            {actions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant || 'ghost'}
                size="sm"
                onClick={action.onClick}
                className="relative"
              >
                {action.icon}
                {action.label && (
                  <span className="hidden sm:inline ml-2">
                    {action.label}
                  </span>
                )}
                {action.badge && action.badge > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    variant="destructive"
                  >
                    {action.badge > 99 ? '99+' : action.badge}
                  </Badge>
                )}
              </Button>
            ))}

            {/* Theme Toggle */}
            {showThemeToggle && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onThemeToggle}
                className="relative"
              >
                {theme === 'light' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            )}

            {/* Notifications */}
            {showNotifications && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onNotificationClick}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                  >
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </motion.div>
                )}
              </Button>
            )}

            {/* User Menu */}
            {showUserMenu && user && (
              <div className="relative">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium">{user.name}</p>
                    {user.role && (
                      <p className="text-xs text-muted-foreground">
                        {user.role}
                      </p>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>

                {/* User Dropdown */}
                {showUserDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-background border border-border rounded-lg shadow-lg z-50"
                  >
                    <div className="p-3 border-b border-border">
                      <p className="font-medium">{user.name}</p>
                      {user.email && (
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                    </div>
                    
                    <div className="py-2">
                      <button className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-muted">
                        <User className="h-4 w-4" />
                        Profile
                      </button>
                      <button className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-muted">
                        <Settings className="h-4 w-4" />
                        Settings
                      </button>
                      <div className="border-t border-border my-1" />
                      <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {variant === 'expanded' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="py-4 border-t border-border/50"
          >
            {customContent || (
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{title}</h2>
                  {subtitle && (
                    <p className="text-muted-foreground mt-1">{subtitle}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {actions.map((action) => (
                    <Button
                      key={action.id}
                      variant={action.variant || 'default'}
                      onClick={action.onClick}
                    >
                      {action.icon}
                      <span className="ml-2">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

// Specialized header variants
export const GlassHeader: React.FC<Omit<CustomizableHeaderProps, 'variant'>> = (props) => (
  <CustomizableHeader variant="glass" {...props} />
);

export const GradientHeader: React.FC<Omit<CustomizableHeaderProps, 'variant'>> = (props) => (
  <CustomizableHeader variant="gradient" {...props} />
);

export const MinimalHeader: React.FC<Omit<CustomizableHeaderProps, 'variant'>> = (props) => (
  <CustomizableHeader variant="minimal" {...props} />
);

export const ExpandedHeader: React.FC<Omit<CustomizableHeaderProps, 'variant'>> = (props) => (
  <CustomizableHeader variant="expanded" {...props} />
);

// Slide-in header that appears/disappears based on scroll direction
export interface SlideInHeaderProps extends CustomizableHeaderProps {
  threshold?: number;
  hideOnScrollDown?: boolean;
}

export const SlideInHeader: React.FC<SlideInHeaderProps> = ({
  threshold = 100,
  hideOnScrollDown = true,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (hideOnScrollDown) {
        if (currentScrollY < threshold) {
          setIsVisible(true);
        } else if (currentScrollY > lastScrollY && currentScrollY > threshold) {
          setIsVisible(false);
        } else if (currentScrollY < lastScrollY) {
          setIsVisible(true);
        }
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, threshold, hideOnScrollDown]);

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: isVisible ? 0 : -100 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed top-0 w-full z-50"
    >
      <CustomizableHeader {...props} sticky={false} />
    </motion.div>
  );
};

// Expandable header that changes height based on scroll position
export interface ExpandableHeaderProps extends CustomizableHeaderProps {
  expandedHeight?: number;
  collapsedHeight?: number;
  threshold?: number;
}

export const ExpandableHeader: React.FC<ExpandableHeaderProps> = ({
  expandedHeight = 120,
  collapsedHeight = 64,
  threshold = 50,
  ...props
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsExpanded(window.scrollY < threshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return (
    <motion.div
      animate={{ 
        height: isExpanded ? expandedHeight : collapsedHeight 
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <CustomizableHeader 
        {...props} 
        height={isExpanded ? expandedHeight : collapsedHeight}
        variant={isExpanded ? 'expanded' : 'default'}
      />
    </motion.div>
  );
};