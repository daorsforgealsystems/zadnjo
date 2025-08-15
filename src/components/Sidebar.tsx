import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Truck, 
  Package,
  BarChart3,
  MapPin,
  Settings,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  ClipboardList,
  TrafficCone,
  FileText,
  LifeBuoy,
  Warehouse,
  Route,
  User,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { ROLES, Role } from "@/lib/types";

// Import the new advanced sidebar component
import { CollapsibleSidebar } from "@/components/layout/navigation/CollapsibleSidebar";

interface SubItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  allowedRoles: Role[];
}

interface MenuItem {
  id: string;
  label:string;
  icon: React.ElementType;
  color?: string;
  href?: string;
  subItems?: SubItem[];
  allowedRoles: Role[];
}

interface SidebarProps {
  isOpen: boolean;
  onAlertsClick: () => void;
  alertsCount?: number;
}

const Sidebar = ({ isOpen, onAlertsClick, alertsCount = 0 }: SidebarProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { hasRole } = useAuth();
  const [openCollapsibles, setOpenCollapsibles] = useState<string[]>([]);

  const toggleCollapsible = (id: string) => {
    setOpenCollapsibles(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const menuItems: MenuItem[] = [
    { id: "dashboard", label: t("sidebar.dashboard"), icon: Home, color: "text-primary", href: "/", allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] },
    { id: "item-tracking", label: t("sidebar.itemTracking"), icon: Package, color: "text-green-400", href: "/item-tracking", allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CLIENT, ROLES.DRIVER] },
    { id: "route-optimization", label: "Route Optimization", icon: Route, color: "text-teal-400", href: "/route-optimization", allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] },
    { id: "inventory", label: t("sidebar.inventory"), icon: Warehouse, color: "text-orange-400", href: "/inventory", allowedRoles: [ROLES.ADMIN] },
    { id: "shipments", label: t("sidebar.shipments"), icon: Truck, color: "text-blue-400", href: "#", allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.DRIVER] },
    {
      id: "analytics",
      label: t("sidebar.analytics"),
      icon: BarChart3,
      color: "text-purple-400",
      allowedRoles: [ROLES.ADMIN, ROLES.MANAGER],
      subItems: [
        { id: "analytics-traffic", label: t("sidebar.analytics.traffic"), icon: TrafficCone, href: "#", allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] },
        { id: "analytics-revenue", label: t("sidebar.analytics.revenue"), icon: DollarSign, href: "#", allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] },
        { id: "analytics-reports", label: t("sidebar.analytics.reports"), icon: FileText, href: "/reports", allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] },
      ]
    },
    { id: "tracking", label: t("sidebar.tracking"), icon: MapPin, color: "text-orange-400", href: "/live-map", allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.DRIVER] },
    {
      id: "finance",
      label: t("sidebar.finance"),
      icon: DollarSign,
      color: "text-yellow-400",
      allowedRoles: [ROLES.ADMIN, ROLES.MANAGER],
      subItems: [
        { id: "finance-invoices", label: t("sidebar.finance.invoices"), icon: ClipboardList, href: "#", allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] },
        { id: "finance-expenses", label: t("sidebar.finance.expenses"), icon: TrendingUp, href: "#", allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] },
      ]
    },
    { id: "alerts", label: t("sidebar.alerts"), icon: AlertTriangle, color: "text-red-400", href: "#", allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.DRIVER] },
  ];

  const bottomItems: MenuItem[] = [
    { id: "profile", label: t("sidebar.profile"), icon: User, color: "text-gray-400", href: "/portal/profile", allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CLIENT, ROLES.DRIVER] },
    { id: "team", label: t("sidebar.team"), icon: Users, color: "text-gray-400", href: "/team", allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] },
    { id: "support", label: t("sidebar.support"), icon: LifeBuoy, color: "text-gray-400", href: "/support", allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CLIENT, ROLES.DRIVER] },
    { id: "settings", label: t("sidebar.settings"), icon: Settings, color: "text-gray-400", href: "/settings", allowedRoles: [ROLES.ADMIN] },
  ];

  const filteredMenuItems = menuItems.filter(item => hasRole(item.allowedRoles));
  const filteredBottomItems = bottomItems.filter(item => hasRole(item.allowedRoles));

  const renderMenuItem = (item: MenuItem, index: number) => {
    const isActive = location.pathname === item.href || 
                    (item.subItems && item.subItems.some(sub => location.pathname === sub.href));
    const isCollapsibleOpen = openCollapsibles.includes(item.id);

    const buttonContent = (
        <>
            <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-primary" : item.color)} />
            {isOpen && <span className={cn("flex-1", isActive && "font-semibold")}>{item.label}</span>}
            {item.id === 'alerts' && isOpen && alertsCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">{alertsCount}</Badge>
            )}
            {isOpen && item.subItems && <ChevronRight className={cn("h-4 w-4 transition-transform", isCollapsibleOpen && "rotate-90")} />}
            {!isOpen && isActive && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-card border border-border rounded-md text-sm whitespace-nowrap animate-slide-in-right">
                {item.label}
              </div>
            )}
        </>
    );

    if (item.id === 'alerts') {
      return (
        <Button
          key={item.id}
          variant="ghost"
          onClick={onAlertsClick}
          className={cn("w-full justify-start gap-3 text-left transition-all duration-200 hover-lift", "hover:bg-secondary/50 text-muted-foreground hover:text-foreground", !isOpen && "justify-center px-2")}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {buttonContent}
        </Button>
      );
    }

    if (item.subItems && isOpen) {
      return (
        <Collapsible key={item.id} open={isCollapsibleOpen} onOpenChange={() => toggleCollapsible(item.id)}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn("w-full justify-start gap-3 text-left transition-all duration-200 hover-lift", isActive && "bg-primary/20 text-primary", !isOpen && "justify-center px-2")}
            >
              {buttonContent}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 space-y-1 mt-1">
            {item.subItems.map(subItem => {
              const isSubActive = location.pathname === subItem.href;
              return (
                <Link to={subItem.href} key={subItem.id}>
                    <Button
                    variant="ghost"
                    className={cn("w-full justify-start gap-3 text-left transition-all duration-200", isSubActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}
                    >
                        <subItem.icon className="h-4 w-4 flex-shrink-0" />
                        <span>{subItem.label}</span>
                    </Button>
                </Link>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
        <Link to={item.href || "#"} key={item.id}>
            <Button
                variant="ghost"
                className={cn("w-full justify-start gap-3 text-left transition-all duration-200 hover-lift", isActive ? "bg-primary/20 text-primary border border-primary/30 shadow-glow" : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground", !isOpen && "justify-center px-2")}
                style={{ animationDelay: `${index * 50}ms` }}
            >
                {buttonContent}
            </Button>
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-header bottom-0 z-40 glass border-r border-border/50 backdrop-blur-xl transition-all duration-300 ease-smooth",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex flex-col h-full p-4">
        {/* Logo Section */}
        <div className={cn("mb-6 pb-4 border-b border-border/50", !isOpen && "text-center")}>
          <Logo 
            size={isOpen ? "md" : "sm"} 
            showText={isOpen} 
            linkTo="/"
          />
        </div>

        <nav className="flex-1 space-y-2">
          {filteredMenuItems.map(renderMenuItem)}
        </nav>

        <div className="space-y-2 pt-4 border-t border-border/50">
          {filteredBottomItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
                <Link to={item.href || "#"} key={item.id}>
                    <Button
                        variant="ghost"
                        className={cn("w-full justify-start gap-3 text-left transition-all duration-200", isActive ? "bg-primary/20 text-primary" : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground", !isOpen && "justify-center px-2")}
                    >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {isOpen && <span>{item.label}</span>}
                    </Button>
              </Link>
            );
          })}
        </div>

        <div className={cn("mt-4 pt-4 border-t border-border/50", !isOpen && "text-center")}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse-glow"></div>
            {isOpen && <span className="text-xs text-muted-foreground">{t("sidebar.systemOnline")}</span>}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
