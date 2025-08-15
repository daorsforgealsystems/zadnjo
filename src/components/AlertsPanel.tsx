import { useState, useMemo } from "react";
import { AlertTriangle, CheckCircle, Clock, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

import { getAnomalies } from "@/lib/api";
import { Anomaly } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

interface Alert {
  id: string;
  type: "warning" | "error" | "info" | "success";
  title: string;
  description: string;
  timestamp: string;
  priority: "high" | "medium" | "low";
}

interface AlertsPanelProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  alerts: Anomaly[];
  onClearAlerts: () => void;
  onRemoveAlert: (id: string) => void;
}

const anomalyToAlert = (anomaly: Anomaly): Alert => {
  const typeMap: Record<Anomaly["severity"], Alert["type"]> = {
    high: "error",
    medium: "warning",
    low: "info",
  };
  return {
    id: anomaly.id,
    type: typeMap[anomaly.severity],
    title: anomaly.type.replace(/_/g, " "),
    description: anomaly.description,
    timestamp: new Date(anomaly.timestamp).toLocaleString(),
    priority: anomaly.severity,
  };
};

const AlertsPanel: React.FC<AlertsPanelProps> = ({ isOpen, onOpenChange, alerts: anomalies, onClearAlerts, onRemoveAlert }) => {
  const { t } = useTranslation();

  const alerts = useMemo(() => anomalies.map(anomalyToAlert), [anomalies]);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");

  const filteredAlerts = useMemo(() => {
    if (filter === "all") return alerts;
    return alerts.filter(alert => alert.priority === filter);
  }, [alerts, filter]);

  const removeAlert = (id: string) => {
    onRemoveAlert(id);
  };

  const clearAll = () => {
    onClearAlerts();
  };

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "warning": return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "error": return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "success": return <CheckCircle className="h-4 w-4 text-success" />;
      default: return <Clock className="h-4 w-4 text-primary" />;
    }
  };

  const getAlertColor = (type: Alert["type"]) => {
    switch (type) {
      case "warning": return "border-l-warning bg-warning/5";
      case "error": return "border-l-destructive bg-destructive/5";
      case "success": return "border-l-success bg-success/5";
      default: return "border-l-primary bg-primary/5";
    }
  };

  const getPriorityBadge = (priority: Alert["priority"]) => {
    const variantMap: Record<Alert["priority"], "destructive" | "secondary" | "outline"> = {
      high: "destructive",
      medium: "secondary",
      low: "outline",
    };
    const variant = variantMap[priority];
    return <Badge variant={variant}>{t(`alerts.${priority}`)}</Badge>
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] glass flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            {t("alerts.title")}
            <Badge className="ml-auto">{alerts.length} {t("alerts.active")}</Badge>
          </SheetTitle>
          <SheetDescription>
            {t("alerts.description")}
          </SheetDescription>
          <div className="flex items-center gap-2 pt-2">
              <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>{t("alerts.all")}</Button>
              <Button size="sm" variant={filter === 'high' ? 'destructive' : 'outline'} onClick={() => setFilter('high')}>{t("alerts.high")}</Button>
              <Button size="sm" variant={filter === 'medium' ? 'secondary' : 'outline'} onClick={() => setFilter('medium')}>{t("alerts.medium")}</Button>
              <Button size="sm" variant={filter === 'low' ? 'outline' : 'outline'} onClick={() => setFilter('low')}>{t("alerts.low")}</Button>
          </div>
        </SheetHeader>
        <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar p-4">
          {filteredAlerts.map((alert, index) => (
            <div key={alert.id} className={cn("p-3 rounded-lg border-l-4 transition-all duration-300 hover-lift animate-slide-in-right group", getAlertColor(alert.type))} style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{alert.title}</h4>
                      {getPriorityBadge(alert.priority)}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{alert.description}</p>
                    <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeAlert(alert.id)} className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive/20">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          {filteredAlerts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center h-full">
              <CheckCircle className="h-8 w-8 text-success mb-2" />
              <p className="text-sm text-muted-foreground">{t("alerts.noAlerts")}</p>
              {filter !== 'all' && <p className="text-xs text-muted-foreground">{t("alerts.noAlertsForFilter")}</p>}
            </div>
          )}
        </div>
        <SheetFooter>
          <Button variant="outline" size="sm" className="w-full" onClick={clearAll} disabled={alerts.length === 0}>
              <Trash2 className="h-3 w-3 mr-2" />
              {t("alerts.clearAll")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default AlertsPanel;