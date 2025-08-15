import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Menu,
  Home,
  Package,
  MapPin,
  Route,
  BarChart3,
  Settings,
  HelpCircle,
  Users,
  Warehouse,
  User,
  LogOut,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import Logo from '@/components/Logo';
import { ROLES } from '@/lib/types';

const MobileNav = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const mainNavItems = [
    {
      title: t('nav.dashboard', 'Dashboard'),
      href: isAuthenticated && user?.role === ROLES.CLIENT ? '/portal' : '/',
      icon: Home,
      roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.DRIVER, ROLES.CLIENT]
    },
    {
      title: t('nav.tracking', 'Package Tracking'),
      href: '/item-tracking',
      icon: Package,
      roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.DRIVER, ROLES.CLIENT]
    },
    {
      title: t('nav.liveMap', 'Live Map'),
      href: '/live-map',
      icon: MapPin,
      roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.DRIVER, ROLES.CLIENT]
    },
    {
      title: t('nav.routeOptimization', 'Route Optimization'),
      href: '/route-optimization',
      icon: Route,
      roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.DRIVER]
    },
    {
      title: t('nav.inventory', 'Inventory'),
      href: '/inventory',
      icon: Warehouse,
      roles: [ROLES.ADMIN, ROLES.MANAGER]
    },
    {
      title: t('nav.reports', 'Reports'),
      href: '/reports',
      icon: BarChart3,
      roles: [ROLES.ADMIN, ROLES.MANAGER]
    }
  ];

  const bottomNavItems = [
    {
      title: t('nav.team', 'Team'),
      href: '/team',
      icon: Users,
      roles: [ROLES.ADMIN, ROLES.MANAGER]
    },
    {
      title: t('nav.settings', 'Settings'),
      href: '/settings',
      icon: Settings,
      roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.DRIVER, ROLES.CLIENT]
    },
    {
      title: t('nav.support', 'Support'),
      href: '/support',
      icon: HelpCircle,
      roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.DRIVER, ROLES.CLIENT]
    }
  ];

  const portalNavItems = user?.role === ROLES.CLIENT ? [
    {
      title: 'My Dashboard',
      href: '/portal',
      icon: Home
    },
    {
      title: 'My Shipments',
      href: '/portal/shipments',
      icon: Package
    },
    {
      title: 'My Profile',
      href: '/portal/profile',
      icon: User
    }
  ] : [];

  const filterItemsByRole = (items: { href: string; title: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; roles?: string[] }[]) => {
    if (!user) return items.filter(item => !item.roles);
    return items.filter(item => !item.roles || item.roles.includes(user.role));
  };

const NavItem = ({ item, onClick }: { item: { href: string; title: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }; onClick?: () => void }) => (
    <Link
      to={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive(item.href)
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <item.icon className="h-5 w-5" />
      {item.title}
      {isActive(item.href) && (
        <Badge variant="secondary" className="ml-auto">
          Active
        </Badge>
      )}
    </Link>
  );

  if (!isAuthenticated) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle className="text-left">Navigation</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              {filterItemsByRole(mainNavItems).map((item) => (
                <NavItem key={item.href} item={item} onClick={() => setIsOpen(false)} />
              ))}
            </div>
            <Separator />
            <div className="space-y-2">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <User className="h-5 w-5" />
                Login
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <Logo size="sm" showText={true} linkTo="/" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
          </div>

          {/* Portal Navigation (for clients) */}
          {portalNavItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                My Account
              </p>
              {portalNavItems.map((item) => (
                <NavItem key={item.href} item={item} onClick={() => setIsOpen(false)} />
              ))}
            </div>
          )}

          {/* Main Navigation */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
              Main Menu
            </p>
            {filterItemsByRole(mainNavItems).map((item) => (
              <NavItem key={item.href} item={item} onClick={() => setIsOpen(false)} />
            ))}
          </div>

          <Separator />

          {/* Bottom Navigation */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
              More
            </p>
            {filterItemsByRole(bottomNavItems).map((item) => (
              <NavItem key={item.href} item={item} onClick={() => setIsOpen(false)} />
            ))}
          </div>

          <Separator />

          {/* Logout */}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5 mr-3" />
            {t('nav.logout', 'Logout')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
