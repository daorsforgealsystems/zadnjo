import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', flag: '🇧🇦' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', flag: '🇷🇸' },
  { code: 'de-CH', name: 'Swiss German', nativeName: 'Schweizer Deutsch', flag: '🇨🇭' },
  { code: 'fr-CH', name: 'Swiss French', nativeName: 'Français Suisse', flag: '🇨🇭' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
];

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'floating';
  className?: string;
}

const LanguageSwitcher = ({ variant = 'default', className }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language | null>(null);

  useEffect(() => {
    const current = languages.find(lang => lang.code === i18n.language) || languages[1]; // Default to English
    setCurrentLanguage(current);
  }, [i18n.language]);

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      const newLanguage = languages.find(lang => lang.code === languageCode);
      setCurrentLanguage(newLanguage || languages[1]);
      setIsOpen(false);
      
      // Store the language preference
      localStorage.setItem('i18nextLng', languageCode);
      
      // Show a subtle notification
      const event = new CustomEvent('language-changed', { 
        detail: { language: newLanguage?.nativeName || 'English' } 
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "h-8 w-8 p-0 rounded-full hover:bg-primary/10 transition-all duration-300",
              className
            )}
          >
            <span className="text-lg">{currentLanguage?.flag || '🌐'}</span>
            <span className="sr-only">Select language</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {languages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{language.flag}</span>
                <span className="text-sm">{language.nativeName}</span>
              </div>
              {currentLanguage?.code === language.code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "fixed top-4 right-4 z-50",
          className
        )}
      >
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="outline" 
                className="bg-background/80 backdrop-blur-lg border-border/50 hover:bg-background/90 transition-all duration-300 shadow-lg hover:shadow-xl rounded-full px-4 py-2 h-auto"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{currentLanguage?.flag || '🌐'}</span>
                  <span className="text-sm font-medium hidden sm:inline">
                    {currentLanguage?.nativeName || 'Language'}
                  </span>
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )} />
                </div>
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-56 bg-background/90 backdrop-blur-lg border-border/50 shadow-xl rounded-xl"
          >
            <AnimatePresence>
              {languages.map((language, index) => (
                <motion.div
                  key={language.code}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <DropdownMenuItem
                    onClick={() => handleLanguageChange(language.code)}
                    className="flex items-center justify-between cursor-pointer hover:bg-primary/10 transition-colors rounded-lg mx-1 my-0.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{language.flag}</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{language.nativeName}</span>
                        <span className="text-xs text-muted-foreground">{language.name}</span>
                      </div>
                    </div>
                    {currentLanguage?.code === language.code && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <Check className="h-4 w-4 text-primary" />
                      </motion.div>
                    )}
                  </DropdownMenuItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    );
  }

  // Default variant
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background/90 transition-all duration-300 shadow-md",
            className
          )}
        >
          <Globe className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{currentLanguage?.nativeName || 'Language'}</span>
          <ChevronDown className={cn(
            "h-4 w-4 ml-2 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{language.flag}</span>
              <span className="text-sm">{language.nativeName}</span>
            </div>
            {currentLanguage?.code === language.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;