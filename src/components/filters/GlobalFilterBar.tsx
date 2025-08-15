import React from 'react';
import { useUrlState } from '@/hooks/useUrlState';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface GlobalFilterBarProps {
  className?: string;
  onApply?: (filters: Record<string, any>) => void;
  onReset?: () => void;
  // available options
  statuses?: string[];
  regions?: string[];
  vehicles?: string[];
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  className,
  onApply,
  onReset,
  statuses = ['All', 'Processing', 'In Transit', 'Delivered', 'Delayed'],
  regions = ['All', 'BA', 'RS', 'HR', 'CH-DE', 'CH-FR'],
  vehicles = ['All', 'TRK-001', 'TRK-002', 'VAN-101'],
}) => {
  const [filters, setFilters] = useUrlState({
    q: '',
    status: 'All',
    region: 'All',
    vehicle: 'All',
    from: '',
    to: '',
  });

  const apply = () => {
    onApply?.(filters);
  };

  const reset = () => {
    setFilters({ q: '', status: 'All', region: 'All', vehicle: 'All', from: '', to: '' });
    onReset?.();
  };

  return (
    <div className={cn('w-full bg-card/60 border border-border/60 rounded-xl p-3 md:p-4 shadow-sm backdrop-blur-md', className)}>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="text-xs text-muted-foreground">Search</label>
          <Input
            placeholder="Search shipments, orders, customers..."
            value={String(filters.q || '')}
            onChange={(e) => setFilters({ q: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Status</label>
          <Select value={String(filters.status)} onValueChange={(v) => setFilters({ status: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Region</label>
          <Select value={String(filters.region)} onValueChange={(v) => setFilters({ region: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Vehicle</label>
          <Select value={String(filters.vehicle)} onValueChange={(v) => setFilters({ vehicle: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Vehicle" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs text-muted-foreground">Date Range</label>
          <DateRangePicker
            onUpdate={(range) => {
              setFilters({ from: (range as any)?.from ?? '', to: (range as any)?.to ?? '' });
            }}
          />
        </div>

        <div className="flex gap-2 md:justify-end">
          <Button variant="secondary" onClick={reset}>Reset</Button>
          <Button onClick={apply}>Apply</Button>
        </div>
      </div>

      {/* Active filter badges */}
      <div className="mt-3 flex flex-wrap gap-2">
        {['status', 'region', 'vehicle'].map((k) => {
          const val = (filters as any)[k];
          if (!val || val === 'All') return null;
          return <Badge key={k} variant="outline" className="capitalize">{k}: {String(val)}</Badge>;
        })}
        {filters.q ? <Badge variant="outline">q: {String(filters.q)}</Badge> : null}
      </div>
    </div>
  );
};

export default GlobalFilterBar;