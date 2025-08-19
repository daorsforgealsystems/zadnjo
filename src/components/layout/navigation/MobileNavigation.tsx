import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Menu, X } from 'lucide-react';
import { MobileNavigationConfig, NavigationItem } from '@/types/navigation';

interface MobileNavigationProps {
  config: MobileNavigationConfig;
  onItemClick: (item: NavigationItem) => void;
  className?: string;
}

// Lazy-loaded menu component
const LazyMenu: React.FC<{ config: MobileNavigationConfig; onItemClick: (item: NavigationItem) => void }> = ({ config, onItemClick }) => (
  <nav className="p-4">
    {config.items.map((item, index) => (
      <button
        key={index}
        onClick={() => onItemClick(item)}
        className="block w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors"
      >
        {item.label}
      </button>
    ))}
  </nav>
);

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
        {open ? <X size={20} /> : <Menu size={20} />}
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
            <LazyMenu config={config} onItemClick={onItemClick} />
          </div>
        )}
      </Suspense>
    </>
  );
};


