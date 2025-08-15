import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';
import ParticleBackground from './ParticleBackground';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showParticles?: boolean;
  className?: string;
}

const ResponsiveLayout = ({ 
  children, 
  showSidebar = true, 
  showParticles = true,
  className 
}: ResponsiveLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {showParticles && <ParticleBackground />}
      <div className="relative z-20">
        
        {showSidebar && !isMobile && <Sidebar isOpen={sidebarOpen} onAlertsClick={() => {}} />}

        <main className={cn(
          "transition-all duration-300 pt-header",
          showSidebar && !isMobile ? (sidebarOpen ? "ml-64" : "ml-16") : "",
          className
        )}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default ResponsiveLayout;
