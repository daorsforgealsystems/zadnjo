import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface ChartWidgetProps {
  title: string;
  data: ChartData[];
  type: 'bar' | 'line' | 'pie' | 'area';
  className?: string;
  showTrend?: boolean;
  trendValue?: number;
  height?: number;
  actions?: React.ReactNode;
}

const ChartWidget = ({
  title,
  data,
  type,
  className,
  showTrend = false,
  trendValue,
  height = 200,
  actions
}: ChartWidgetProps) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  const renderBarChart = () => (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1 gap-2">
          <div 
            className={cn(
              "w-full rounded-t-md transition-all duration-500 hover:opacity-80",
              item.color || "bg-primary"
            )}
            style={{ 
              height: `${(item.value / maxValue) * (height - 40)}px`,
              minHeight: '4px'
            }}
          />
          <div className="text-center">
            <div className="text-xs font-medium">{item.value}</div>
            <div className="text-xs text-muted-foreground truncate">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderLineChart = () => (
    <div className="relative" style={{ height }}>
      <svg width="100%" height="100%" className="overflow-visible">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line
            key={y}
            x1="0"
            y1={`${y}%`}
            x2="100%"
            y2={`${y}%`}
            stroke="hsl(var(--border))"
            strokeWidth="1"
            opacity="0.3"
          />
        ))}
        
        {/* Area fill */}
        <path
          d={`M 0 ${height} ${data.map((item, index) => 
            `L ${(index / (data.length - 1)) * 100}% ${height - (item.value / maxValue) * height}`
          ).join(' ')} L 100% ${height} Z`}
          fill="url(#lineGradient)"
        />
        
        {/* Line */}
        <path
          d={`M ${data.map((item, index) => 
            `${(index / (data.length - 1)) * 100}% ${height - (item.value / maxValue) * height}`
          ).join(' L ')}`}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          className="drop-shadow-sm"
        />
        
        {/* Data points */}
        {data.map((item, index) => (
          <circle
            key={index}
            cx={`${(index / (data.length - 1)) * 100}%`}
            cy={height - (item.value / maxValue) * height}
            r="4"
            fill="hsl(var(--primary))"
            className="drop-shadow-sm hover:r-6 transition-all cursor-pointer"
          >
            <title>{`${item.label}: ${item.value}`}</title>
          </circle>
        ))}
      </svg>
      
      {/* X-axis labels */}
      <div className="flex justify-between mt-2">
        {data.map((item, index) => (
          <div key={index} className="text-xs text-muted-foreground text-center flex-1">
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );

  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    const radius = Math.min(height, 200) / 2 - 20;
    const centerX = radius + 20;
    const centerY = radius + 20;

    return (
      <div className="flex items-center gap-6">
        <div className="relative">
          <svg width={radius * 2 + 40} height={radius * 2 + 40}>
            {data.map((item, index) => {
              const angle = (item.value / total) * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              
              const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
              const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
              const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
              const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
              
              const largeArcFlag = angle > 180 ? 1 : 0;
              
              const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');
              
              currentAngle += angle;
              
              return (
                <path
                  key={index}
                  d={pathData}
                  fill={item.color || `hsl(${index * 137.5 % 360}, 70%, 50%)`}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <title>{`${item.label}: ${item.value} (${((item.value / total) * 100).toFixed(1)}%)`}</title>
                </path>
              );
            })}
          </svg>
        </div>
        
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color || `hsl(${index * 137.5 % 360}, 70%, 50%)` }}
              />
              <span className="text-sm">{item.label}</span>
              <span className="text-sm font-medium ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'line':
      case 'area':
        return renderLineChart();
      case 'pie':
        return renderPieChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <Card className={cn('glass', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {showTrend && trendValue !== undefined && (
            <Badge variant="outline" className="gap-1">
              {trendValue > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              {Math.abs(trendValue)}%
            </Badge>
          )}
          {actions || (
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
};

export default ChartWidget;