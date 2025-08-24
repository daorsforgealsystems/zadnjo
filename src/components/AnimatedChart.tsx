import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ChartData {
  label: string;
  value: number;
  color: string; // tailwind-like color token or hex
}

interface AnimatedChartProps {
  title: string;
  data: ChartData[];
  type?: "bar" | "line" | "donut";
  className?: string;
  delay?: number;
  // Two ways to control chart height:
  // - `containerClassName`: Tailwind classes (recommended, responsive)
  // - `height`: numeric pixel fallback for callers that pass number
  containerClassName?: string;
  height?: number; // fallback chart height in px (default 200)
}

// Tooltip props type without importing runtime types from recharts
// Keep this minimal to avoid coupling to recharts types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            <span className="font-bold text-muted-foreground">{payload[0].value}</span>
          </div>
        </div>
      </div>
    );
  }
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

// Map shadcn/tailwind tokens to concrete colors for Recharts
const resolveColor = (color: string): string => {
  const colorName = color.replace("bg-", "");
  switch (colorName) {
    case "primary":
      return "hsl(189 75% 55%)";
    case "success":
      return "hsl(142 76% 36%)";
    case "warning":
      return "hsl(45 93% 47%)";
    case "destructive":
      return "hsl(0 75% 60%)";
    case "blue-500":
      return "#3b82f6";
    case "green-500":
      return "#22c55e";
    case "purple-500":
      return "#8b5cf6";
    case "orange-500":
      return "#f97316";
    default:
      return color;
  }
};

const AnimatedChart = (props: AnimatedChartProps) => {
  const { title, data, type = "bar", className, delay = 0, height, containerClassName } = props
  const [isVisible, setIsVisible] = useState(false);
  // Dynamically loaded recharts to avoid SSR/initial bundle cost
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [R, setR] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    let mounted = true;
    import("recharts")
      .then((mod) => {
        if (mounted) setR(mod);
      })
      .catch((e) => console.error("Failed to load charts", e));
    return () => {
      mounted = false;
    };
  }, []);

  const chartHeight = height ?? 200;

  const chartConfig = data.reduce((acc, item) => {
    acc[item.label] = {
      label: item.label,
      color: resolveColor(item.color),
    };
    return acc;
  }, {} as ChartConfig);

  const loadingSkeleton = containerClassName ? (
    <div className={cn('w-full animate-pulse rounded-md bg-muted', containerClassName)} />
  ) : (
    <div className="w-full animate-pulse rounded-md bg-muted" style={{ height: chartHeight }} />
  );

  const renderBarChart = () =>
    R ? (
      <ChartContainer
        config={chartConfig}
        // prefer containerClassName (Tailwind-driven); fallback to inline pixel height
        className={containerClassName ? cn('w-full', containerClassName) : 'w-full'}
        style={containerClassName ? undefined : { height: chartHeight }}
      >
        <R.BarChart data={data}>
          <R.CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground)/.2)" />
          <R.XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <R.YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <R.Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--primary)/.1)" }} />
          <R.Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <R.Cell key={`cell-${index}`} fill={resolveColor(entry.color)} />
            ))}
          </R.Bar>
        </R.BarChart>
      </ChartContainer>
    ) : (
      loadingSkeleton
    );

  const renderLineChart = () =>
    R ? (
      <ChartContainer
        config={chartConfig}
        className={containerClassName ? cn('w-full', containerClassName) : 'w-full'}
        style={containerClassName ? undefined : { height: chartHeight }}
      >
        <R.LineChart data={data}>
          <R.CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground)/.2)" />
          <R.XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <R.YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <R.Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--primary)/.1)", strokeWidth: 2 }} />
          <R.Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6, fill: "hsl(var(--primary))" }} />
        </R.LineChart>
      </ChartContainer>
    ) : (
      loadingSkeleton
    );

  const renderDonutChart = () => {
    const RADIAN = Math.PI / 180;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
      if (
        innerRadius === undefined ||
        outerRadius === undefined ||
        cx === undefined ||
        cy === undefined ||
        midAngle === undefined ||
        percent === undefined
      )
        return null;
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
      return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      );
    };

    return R ? (
      <ChartContainer
        config={chartConfig}
        className={containerClassName ? cn('w-full', containerClassName) : 'w-full'}
        style={containerClassName ? undefined : { height: chartHeight }}
      >
        <R.PieChart>
          <R.Tooltip content={<CustomTooltip />} />
          <R.Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={Math.max(60, Math.min(120, chartHeight / 2 - 20))}
            fill="#8884d8"
            dataKey="value"
            isAnimationActive
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <R.Cell key={`cell-${index}`} fill={resolveColor(entry.color)} />
            ))}
          </R.Pie>
          <R.Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
        </R.PieChart>
      </ChartContainer>
    ) : (
      loadingSkeleton
    );
  };

  return (
    <Card className={cn("glass hover-lift transition-all duration-300", isVisible && "animate-slide-up-fade", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <ChartEmptyState title={title} />
        ) : (
          <>
            {type === "bar" && renderBarChart()}
            {type === "line" && renderLineChart()}
            {type === "donut" && renderDonutChart()}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AnimatedChart;
