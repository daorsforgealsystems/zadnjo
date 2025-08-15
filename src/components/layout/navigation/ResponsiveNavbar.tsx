import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, User, Settings, LogOut } from 'lucide-react';
import { NavigationConfig } from '@/types/navigation';
import { useAnimationContext } from '@/components/providers/AnimationProvider';
import { useNavigation } from '@/hooks/useNavigation';
import { Avatar } from '@/components/Avatar';
import { GlobalSearch } from '@/components/GlobalSearch';
import { NotificationCenter } from '@/components/NotificationCenter';
import { animateSearchExpansion, animateDropdown } from '@/lib/animations/navigationAnimations';

interface ResponsiveNavbarProps {
  config: NavigationConfig;
  onMenuToggle?: () => void;
  className?: string;
}

export const ResponsiveNavbar: React.FC<ResponsiveNavbarProps> = ({
  config,
  onMenuToggle,
  className = '',
}) => {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { createAnimation, animateEntrance } = useAnimationContext();
  const { performSearch, searchResults, clearSearch, searchQuery } = useNavigation();

  // Handle search expansion
  const handleSearchFocus = () => {
    if (!searchExpanded && searchRef.current) {
      setSearchExpanded(true);
      animateSearchExpansion(searchRef.current, true);
    }
  };

  const handleSearchBlur = () => {
    if (searchExpanded && !searchQuery.trim() && searchRef.current) {
      setSearchExpanded(false);
      animateSearchExpansion(searchRef.current, false);
    }
  };

  // Handle user menu toggle
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
    if (userMenuRef.current) {
      animateDropdown(userMenuRef.current, !userMenuOpen);
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className={`
      flex items-center justify-between px-6 py-3 
      bg-background/95 backdrop-blur-sm border-b border-border
      transition-all duration-200
      ${config.sticky ? 'sticky top-0 z-50' : ''}
      ${className}
    `}>
      {/* Left section */}
      <div className="flex items-center space-x-4">
        {/* Menu toggle for mobile */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-md hover:bg-accent transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        {/* Title and subtitle */}
        <div className="hidden sm:block">
          {config.title && (
            <h1 className="text-lg font-semibold text-foreground">
              {config.title}
            </h1>
          )}
          {config.subtitle && (
            <p className="text-sm text-muted-foreground -mt-1">
              {config.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Center section - Search */}
      {config.search?.enabled && (
        <div className="flex-1 max-w-md mx-4">
          <div
            ref={searchRef}
            className="relative"
          >
            <div className="relative">
              <Search 
                size={16} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
              />
              <input
                type="text"
                placeholder={config.search.placeholder || "Search..."}
                className="
                  w-full pl-10 pr-4 py-2 
                  bg-accent/50 border border-border rounded-md
                  focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                  transition-all duration-200
                  text-sm
                "
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                onChange={(e) => performSearch(e.target.value)}
              />
            </div>

            {/* Search suggestions */}
            {config.search.showSuggestions && searchResults.length > 0 && (
              <GlobalSearch
                results={searchResults}
                onResultClick={(result) => {
                  // Handle result click
                  console.log('Search result clicked:', result);
                  clearSearch();
                }}
                className="absolute top-full left-0 right-0 mt-1 z-50"
              />
            )}
          </div>
        </div>
      )}

      {/* Right section */}
      <div className="flex items-center space-x-2">
        {/* Notifications */}
        {config.userMenu?.showNotifications && (
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="
                relative p-2 rounded-md hover:bg-accent transition-colors
                focus:outline-none focus:ring-2 focus:ring-primary/20
              "
              aria-label="Notifications"
            >
              <Bell size={18} />
              {config.userMenu.notificationCount && config.userMenu.notificationCount > 0 && (
                <span className="
                  absolute -top-1 -right-1 
                  bg-destructive text-destructive-foreground 
                  text-xs rounded-full h-5 w-5 
                  flex items-center justify-center
                  animate-pulse
                ">
                  {config.userMenu.notificationCount > 99 ? '99+' : config.userMenu.notificationCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <NotificationCenter
                onClose={() => setNotificationsOpen(false)}
                className="absolute top-full right-0 mt-2 z-50"
              />
            )}
          </div>
        )}

        {/* User menu */}
        <div className="relative">
          <button
            onClick={toggleUserMenu}
            className="
              flex items-center space-x-2 p-2 rounded-md 
              hover:bg-accent transition-colors
              focus:outline-none focus:ring-2 focus:ring-primary/20
            "
            aria-label="User menu"
          >
            <Avatar 
              size="sm" 
              className="h-6 w-6"
            />
            <span className="hidden md:block text-sm font-medium">
              John Doe
            </span>
          </button>

          {/* User menu dropdown */}
          {userMenuOpen && (
            <div
              ref={userMenuRef}
              className="
                absolute top-full right-0 mt-2 w-48
                bg-background border border-border rounded-md shadow-lg
                py-1 z-50
                opacity-0
              "
              style={{ maxHeight: '0px', overflow: 'hidden' }}
            >
              <div className="px-4 py-2 border-b border-border">
                <p className="text-sm font-medium">John Doe</p>
                <p className="text-xs text-muted-foreground">john@example.com</p>
              </div>
              
              <button
                className="
                  w-full flex items-center space-x-2 px-4 py-2 text-sm
                  hover:bg-accent transition-colors text-left
                "
                onClick={() => {
                  // Handle profile click
                  setUserMenuOpen(false);
                }}
              >
                <User size={16} />
                <span>Profile</span>
              </button>
              
              <button
                className="
                  w-full flex items-center space-x-2 px-4 py-2 text-sm
                  hover:bg-accent transition-colors text-left
                "
                onClick={() => {
                  // Handle settings click
                  setUserMenuOpen(false);
                }}
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>
              
              <hr className="border-border my-1" />
              
              <button
                className="
                  w-full flex items-center space-x-2 px-4 py-2 text-sm
                  hover:bg-destructive/10 text-destructive transition-colors text-left
                "
                onClick={() => {
                  // Handle logout
                  setUserMenuOpen(false);
                }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};