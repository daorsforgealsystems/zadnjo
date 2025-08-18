import React, { useState } from 'react';
import { Home, BarChart3, Package, Truck, Menu, X } from 'lucide-react';
import { MobileNavigationConfig } from '@/types/navigation';

interface MobileNavigationProps {
  config: MobileNavigationConfig;
  onItemClick: (item: any) => void;
  className?: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  config,
  onItemClick,
  className = '',
}) => {
    const [open, setOpen] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
      function handleClick(e: MouseEvent) {
        if (open && menuRef.current && !menuRef.current.contains(e.target as Node) && !menuButtonRef.current?.contains(e.target as Node)) {
          setOpen(false);
        }
      }
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    // Keyboard navigation: close on Escape
    useEffect(() => {
      function handleKey(e: KeyboardEvent) {
        if (e.key === 'Escape') setOpen(false);
      }
      if (open) document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }, [open]);

    return (
      <>
        {/* Mobile menu button */}
        <button
          ref={menuButtonRef}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-full shadow-lg md:hidden"
        >
          <span>{open ? '✕' : '☰'}</span>
        </button>
        <Suspense fallback={<div className="absolute left-0 right-0 bg-white shadow-lg">Loading...</div>}>
          {open && (
            <div
              id="mobile-menu"
              ref={menuRef}
              className="absolute left-0 right-0 bg-white shadow-lg z-50"
              tabIndex={-1}
              role="menu"
            >
              <LazyMenu />
            </div>
          )}
        </Suspense>
      </nav>
    );
  };

  export default MobileNavigation;

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
    { id: 'shipments', label: 'Shipments', icon: Package, href: '/shipments' },
    { id: 'fleet', label: 'Fleet', icon: Truck, href: '/fleet' },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 left-4 z-50 p-2 bg-white rounded-full shadow-lg md:hidden ${className}`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile navigation drawer */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
        <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Navigation</h2>
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onItemClick(item);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 rounded-md"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom navigation */}
      {config.bottomNavigation && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
          <div className="flex justify-around py-2">
            {navigationItems.slice(0, 4).map((item) => (
              <button
                key={item.id}
                onClick={() => onItemClick(item)}
                className="flex flex-col items-center p-2 text-gray-600 hover:text-blue-600"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
