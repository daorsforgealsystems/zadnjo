import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Globe } from 'lucide-react';

const LanguageChangeNotification = () => {
  const [notification, setNotification] = useState<{ language: string } | null>(null);

  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setNotification({ language: event.detail.language });
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    };

    window.addEventListener('language-changed', handleLanguageChange as EventListener);
    
    return () => {
      window.removeEventListener('language-changed', handleLanguageChange as EventListener);
    };
  }, []);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-none"
        >
          <div className="bg-background/90 backdrop-blur-lg border border-border/50 rounded-full px-6 py-3 shadow-lg flex items-center gap-3">
            <div className="bg-green-500/20 rounded-full p-1">
              <Check className="h-4 w-4 text-green-500" />
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                Language changed to {notification.language}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LanguageChangeNotification;