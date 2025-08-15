import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Home, 
  ArrowLeft, 
  Search, 
  Package,
  MapPin,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import MediaBackground from "@/components/MediaBackground";

const NotFound = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const quickLinks = [
    {
      title: "Dashboard",
      description: "Go to your main dashboard",
      icon: Home,
      path: isAuthenticated ? (user?.role === 'CLIENT' ? '/portal' : '/') : '/',
    },
    {
      title: "Track Package",
      description: "Track your shipments",
      icon: Package,
      path: "/item-tracking",
    },
    {
      title: "Live Map",
      description: "View real-time tracking",
      icon: MapPin,
      path: "/live-map",
    },
    {
      title: "Support",
      description: "Get help from our team",
      icon: Search,
      path: "/support",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <MediaBackground mediaSrc="/src/assets/hero-logistics.jpg" type="image" />
      <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/80 to-background/90 z-10" />
      
      <div className="relative z-20 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* 404 Display */}
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <AlertTriangle className="h-24 w-24 text-primary animate-pulse" />
            </div>
            <h1 className="text-8xl font-bold gradient-text">404</h1>
            <h2 className="text-3xl font-semibold">
              {t('notFound.title', 'Page Not Found')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-md mx-auto">
              {t('notFound.description', 'The page you\'re looking for doesn\'t exist or has been moved.')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('notFound.path', 'Attempted path:')} <code className="bg-muted px-2 py-1 rounded">{location.pathname}</code>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => window.history.back()} 
              variant="outline" 
              size="lg"
              className="glass hover-lift"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              {t('notFound.goBack', 'Go Back')}
            </Button>
            <Link to={isAuthenticated ? (user?.role === 'CLIENT' ? '/portal' : '/') : '/'}>
              <Button size="lg" className="bg-gradient-primary hover:scale-105 transition-transform">
                <Home className="mr-2 h-5 w-5" />
                {t('notFound.goHome', 'Go Home')}
              </Button>
            </Link>
          </div>

          {/* Quick Links */}
          <Card className="glass">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {t('notFound.quickLinks', 'Quick Links')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickLinks.map((link) => {
                  const IconComponent = link.icon;
                  return (
                    <Link key={link.path} to={link.path}>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors group">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{link.title}</p>
                          <p className="text-sm text-muted-foreground">{link.description}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Help Text */}
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              {t('notFound.stillLost', 'Still can\'t find what you\'re looking for?')}
            </p>
            <Link to="/support">
              <Button variant="link" className="text-primary">
                {t('notFound.contactSupport', 'Contact our support team')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
