import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  PieLabelRenderProps
} from "recharts";
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

import { TooltipProps } from "recharts";

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
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

  return null;
};

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground)/.2)" />
        <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--primary)/.1)' }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={resolveColor(entry.color)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground)/.2)" />
        <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--primary)/.1)', strokeWidth: 2 }} />
        <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6, fill: 'hsl(var(--primary))' }} />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderDonutChart = () => {
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: PieLabelRenderProps) => {
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
    return (
        <ResponsiveContainer width="100%" height={200}>
            <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
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
                        <Cell key={`cell-${index}`} fill={resolveColor(entry.color)} />
                    ))}
                </Pie>
                <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
            </PieChart>
        </ResponsiveContainer>
    );
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