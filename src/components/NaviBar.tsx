import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { LogIn, UserPlus, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const NaviBar = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Add scroll effect
  const handleScroll = () => {
    if (window.scrollY > 20) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  // Set up scroll listener
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', handleScroll);
  }

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/90 backdrop-blur-md shadow-sm py-2' 
          : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4 md:px-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/" className="flex items-center gap-2 group">
            <Logo size="md" showText={true} />
          </Link>
        </motion.div>
        
        <div className="hidden md:flex items-center gap-8">
          <NavigationMenu>
            <NavigationMenuList className="flex items-center gap-6">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-sm font-medium">
                  {t('navbar.features')}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] border border-border/50 rounded-xl bg-card/90 backdrop-blur-sm shadow-lg">
                    {/* Add features here */}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="compact" />
            
            <Button 
              variant="ghost" 
              asChild
              className="group relative overflow-hidden px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-primary/10"
            >
              <Link to="/login">
                <LogIn className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                {t('navbar.login', 'Login')}
              </Link>
            </Button>
            
            <Button 
              asChild
              className="relative overflow-hidden px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Link to="/signup">
                <UserPlus className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                {t('navbar.signup', 'Sign Up')}
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="md:hidden">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="relative overflow-hidden p-2 rounded-full hover:bg-primary/10 transition-colors"
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-full max-w-xs bg-background/95 backdrop-blur-xl border-l-0 rounded-l-xl"
            >
              <div className="flex flex-col gap-6 p-6">
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex justify-center mb-4">
                    <LanguageSwitcher variant="default" />
                  </div>
                  
                  <Link 
                    to="/login" 
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LogIn className="h-5 w-5 text-primary" />
                    <span className="font-medium">{t('navbar.login', 'Login')}</span>
                  </Link>
                  <Link 
                    to="/signup" 
                    className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 text-primary font-medium transition-all hover:bg-primary/20"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserPlus className="h-5 w-5" />
                    <span>{t('navbar.signup', 'Sign Up')}</span>
                  </Link>
                </motion.div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default NaviBar;
