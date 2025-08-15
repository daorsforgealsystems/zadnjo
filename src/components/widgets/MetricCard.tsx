import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period?: string;
  };
  icon: LucideIcon;
  iconColor?: string;
  description?: string;
  className?: string;
  trend?: Array<{ label: string; value: number }>;
}

const MetricCard = ({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-primary',
  description,
  className,
  trend
}: MetricCardProps) => {
  const getChangeColor = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'decrease':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const formatChange = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value}%`;
  };

  return (
    <Card className={cn('glass hover-lift', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              {change && (
                <Badge 
                  variant="secondary" 
                  className={cn('text-xs px-2 py-0.5', getChangeColor(change.type))}
                >
                  {formatChange(change.value)}
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{value}</p>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
              {change?.period && (
                <p className="text-xs text-muted-foreground">vs {change.period}</p>
              )}
            </div>
          </div>
          <div className={cn('h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center', iconColor)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        
        {trend && trend.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-xs">
              {trend.map((point, index) => (
                <div key={index} className="text-center">
                  <div className="text-muted-foreground">{point.label}</div>
                  <div className="font-medium">{point.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;