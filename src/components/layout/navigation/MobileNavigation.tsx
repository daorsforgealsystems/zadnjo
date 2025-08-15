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
  const [isOpen, setIsOpen] = useState(false);

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
