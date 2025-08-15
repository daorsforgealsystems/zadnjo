import { useState, useEffect } from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  className?: string;
  delay?: number;
  currency?: string;
}

const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon: Icon, 
  className, 
  delay = 0,
  currency
}: MetricCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const numericValue = typeof value === "string" ? parseFloat(value.replace(/[^0-9.-]+/g, "")) : value;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      
      // Animate counter for numeric values
      if (typeof numericValue === "number" && !isNaN(numericValue)) {
        let currentValue = 0;
        const increment = numericValue / 30; // 30 steps for smooth animation
        const stepTime = 50; // 50ms per step = 1.5s total
        
        const counterInterval = setInterval(() => {
          currentValue += increment;
          if (currentValue >= numericValue) {
            currentValue = numericValue;
            clearInterval(counterInterval);
          }
          setDisplayValue(currentValue);
        }, stepTime);

        return () => clearInterval(counterInterval);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [numericValue, delay]);

  const formatDisplayValue = () => {
    if (currency) {
      return `${currency}${Math.round(displayValue).toLocaleString()}`;
    }
    if (typeof value === "string" && value.includes("%")) {
      return `${Math.round(displayValue)}%`;
    }
    return Math.round(displayValue).toLocaleString();
  };

  const getChangeColor = () => {
    switch (changeType) {
      case "positive":
        return "text-success";
      case "negative":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getIconColor = () => {
    switch (changeType) {
      case "positive":
        return "text-success";
      case "negative":
        return "text-destructive";
      default:
        return "text-primary";
    }
  };

  return (
    <Card 
      className={cn(
        "glass hover-lift transition-all duration-300 group relative overflow-hidden",
        isVisible && "animate-slide-up-fade",
        className
      )}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn("h-5 w-5 transition-colors duration-200", getIconColor())} />
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="text-2xl font-bold animate-counter">
          {isVisible ? formatDisplayValue() : (typeof value === "number" ? "0" : value)}
        </div>
        
        {change && (
          <p className={cn("text-xs transition-colors duration-200", getChangeColor())}>
            {change}
          </p>
        )}
      </CardContent>
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-pulse" />
      </div>
    </Card>
  );
};

export default MetricCard;