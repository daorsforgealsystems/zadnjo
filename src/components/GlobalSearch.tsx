import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, MapPin, Users, FileText, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getItems } from '@/lib/api';
import { useTranslation } from 'react-i18next';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'package' | 'location' | 'user' | 'document' | 'page';
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  metadata?: string;
}

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  onSelect?: (result: SearchResult) => void;
}

const GlobalSearch = ({ className, placeholder, onSelect }: GlobalSearchProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: getItems,
  });

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // Mock data for demonstration
    const mockPages = [
      { title: 'Dashboard', href: '/', description: 'Main dashboard overview' },
      { title: 'Package Tracking', href: '/item-tracking', description: 'Track your packages' },
      { title: 'Live Map', href: '/live-map', description: 'Real-time tracking map' },
      { title: 'Route Optimization', href: '/route-optimization', description: 'Optimize delivery routes' },
      { title: 'Reports', href: '/reports', description: 'Analytics and reports' },
      { title: 'Settings', href: '/settings', description: 'Application settings' },
      { title: 'Support', href: '/support', description: 'Help and support center' },
      { title: 'Team Management', href: '/team', description: 'Manage team members' }
    ];

    const mockLocations = [
      'Belgrade, Serbia',
      'Sarajevo, Bosnia and Herzegovina',
      'Zagreb, Croatia',
      'Pristina, Kosovo',
      'Skopje, North Macedonia',
      'Podgorica, Montenegro'
    ];

    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search packages
    items
      .filter(item => 
        item.name.toLowerCase().includes(lowerQuery) ||
        item.id.toLowerCase().includes(lowerQuery) ||
        item.location.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 3)
      .forEach(item => {
        searchResults.push({
          id: item.id,
          title: item.name,
          description: `Package ID: ${item.id}`,
          type: 'package',
          href: `/item-tracking?id=${item.id}`,
          icon: Package,
          metadata: item.status
        });
      });

    // Search locations
    mockLocations
      .filter(location => location.toLowerCase().includes(lowerQuery))
      .slice(0, 3)
      .forEach(location => {
        searchResults.push({
          id: location,
          title: location,
          description: 'Location',
          type: 'location',
          href: `/live-map?location=${encodeURIComponent(location)}`,
          icon: MapPin
        });
      });

    // Search pages
    mockPages
      .filter(page => 
        page.title.toLowerCase().includes(lowerQuery) ||
        page.description.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 3)
      .forEach(page => {
        searchResults.push({
          id: page.href,
          title: page.title,
          description: page.description,
          type: 'page',
          href: page.href,
          icon: FileText
        });
      });

    setResults(searchResults);
    setIsOpen(searchResults.length > 0);
    setSelectedIndex(-1);
  }, [query, items]);

  const handleSelect = (result: SearchResult) => {
    if (onSelect) {
      onSelect(result);
    } else {
      navigate(result.href);
    }
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'package':
        return Package;
      case 'location':
        return MapPin;
      case 'user':
        return Users;
      case 'document':
        return FileText;
      default:
        return FileText;
    }
  };

  const getTypeBadge = (type: SearchResult['type']) => {
    const badges = {
      package: { label: 'Package', variant: 'default' as const },
      location: { label: 'Location', variant: 'secondary' as const },
      user: { label: 'User', variant: 'outline' as const },
      document: { label: 'Document', variant: 'outline' as const },
      page: { label: 'Page', variant: 'secondary' as const }
    };
    return badges[type] || badges.document;
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder || t('search.placeholder', 'Search packages, locations, pages...')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 glass border shadow-lg">
          <CardContent className="p-2">
            <div className="space-y-1" ref={resultsRef}>
              {results.map((result, index) => {
                const IconComponent = getTypeIcon(result.type);
                const badge = getTypeBadge(result.type);
                
                return (
                  <div
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                      index === selectedIndex 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                      index === selectedIndex 
                        ? "bg-primary-foreground/20" 
                        : "bg-muted"
                    )}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{result.title}</p>
                        <Badge 
                          variant={badge.variant}
                          className="text-xs"
                        >
                          {badge.label}
                        </Badge>
                        {result.metadata && (
                          <Badge variant="outline" className="text-xs">
                            {result.metadata}
                          </Badge>
                        )}
                      </div>
                      <p className={cn(
                        "text-sm truncate",
                        index === selectedIndex 
                          ? "text-primary-foreground/70" 
                          : "text-muted-foreground"
                      )}>
                        {result.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {results.length > 0 && (
              <div className="mt-2 pt-2 border-t text-center">
                <p className="text-xs text-muted-foreground">
                  Use ↑↓ to navigate, Enter to select, Esc to close
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GlobalSearch;
