import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface AnimatedChartProps {
  title: string;
  data: ChartData[];
  type?: "bar" | "line" | "donut";
  className?: string;
  delay?: number;
}

// Tooltip props type without importing runtime from recharts
type TooltipPropsLike = { active?: boolean; payload?: any[]; label?: string };

const CustomTooltip = ({ active, payload, label }: TooltipPropsLike) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-[0.7rem] uppercase text-muted-foreground">
              {label || payload[0].payload.label}
            </span>
            <span className="font-bold text-muted-foreground">
              {payload[0].value}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Show nothing for tooltip if not active
  return null;
};

// Empty state for chart
const ChartEmptyState = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-48 text-zinc-400">
    <span className="text-2xl mb-2">📊</span>
    <span className="font-semibold">No data available</span>
    <span className="text-xs mt-1">{title}</span>
  </div>
);

const resolveColor = (color: string): string => {
  const colorName = color.replace('bg-', '');
  switch (colorName) {
    case 'primary':
      return 'hsl(189 75% 55%)';
    case 'success':
      return 'hsl(142 76% 36%)';
    case 'warning':
      return 'hsl(45 93% 47%)';
    case 'destructive':
      return 'hsl(0 75% 60%)';
    case 'blue-500':
      return '#3b82f6';
    case 'green-500':
      return '#22c55e';
    case 'purple-500':
      return '#8b5cf6';
    case 'orange-500':
      return '#f97316';
    default:
      return color;
  }
};

const AnimatedChart = ({
  title,
  data,
  type = "bar",
  className,
  delay = 0,
}: AnimatedChartProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [R, setR] = useState<any>(null); // dynamically loaded recharts

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    let mounted = true;
    import('recharts').then((mod) => {
      if (mounted) setR(mod);
    }).catch((e) => console.error('Failed to load charts', e));
    return () => { mounted = false; };
  }, []);

  const loadingSkeleton = (
    <div className="w-full h-[200px] animate-pulse rounded-md bg-muted" />
  );

  const renderBarChart = () => (
    R ? (
      <R.ResponsiveContainer width="100%" height={200}>
        <R.BarChart data={data}>
          <R.CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground)/.2)" />
          <R.XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <R.YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <R.Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--primary)/.1)' }} />
          <R.Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <R.Cell key={`cell-${index}`} fill={resolveColor(entry.color)} />
            ))}
          </R.Bar>
        </R.BarChart>
      </R.ResponsiveContainer>
    ) : loadingSkeleton
  );

  const renderLineChart = () => (
    R ? (
      <R.ResponsiveContainer width="100%" height={200}>
        <R.LineChart data={data}>
          <R.CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground)/.2)" />
          <R.XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <R.YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <R.Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--primary)/.1)', strokeWidth: 2 }} />
          <R.Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6, fill: 'hsl(var(--primary))' }} />
        </R.LineChart>
      </R.ResponsiveContainer>
    ) : loadingSkeleton
  );

  const renderDonutChart = () => {
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
      if (innerRadius === undefined || outerRadius === undefined || cx === undefined || cy === undefined || midAngle === undefined || percent === undefined) return null;
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
      return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      );
    };

    return R ? (
      <R.ResponsiveContainer width="100%" height={200}>
        <R.PieChart>
          <R.Tooltip content={<CustomTooltip />} />
          <R.Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            isAnimationActive={true}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <R.Cell key={`cell-${index}`} fill={resolveColor(entry.color)} />
            ))}
          </R.Pie>
          <R.Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
        </R.PieChart>
      </R.ResponsiveContainer>
    ) : loadingSkeleton;
  };

  return (
    <Card
      className={cn(
        "glass hover-lift transition-all duration-300",
        isVisible && "animate-slide-up-fade",
        className
      )}
    >
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {type === "bar" && renderBarChart()}
        {type === "line" && renderLineChart()}
        {type === "donut" && renderDonutChart()}
      </CardContent>
    </Card>
  );
};

export default AnimatedChart;