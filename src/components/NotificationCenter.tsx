import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAllAsRead: () => void;
  unreadCount: number;
}

const NotificationCenter = ({ notifications, onMarkAllAsRead, unreadCount }: NotificationCenterProps) => {
    const { t } = useTranslation();

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "anomaly":
        return <Bell className="h-4 w-4 text-destructive" />;
      case "status_change":
        return <CheckCheck className="h-4 w-4 text-success" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 flex items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 glass">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-sm">{t("notifications.title")}</h4>
          <Button variant="link" size="sm" onClick={onMarkAllAsRead} disabled={unreadCount === 0}>
            {t("notifications.markAllAsRead")}
          </Button>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t("notifications.noNotifications")}</p>
          ) : (
            notifications.map(notif => (
              <div key={notif.id} className={cn("p-2 rounded-lg flex items-start gap-3", !notif.read && "bg-primary/10")}>
                {getNotificationIcon(notif.type)}
                <div className="flex-1">
                  <p className="text-sm">{notif.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notif.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="text-center mt-2">
            <Button variant="link" size="sm" className="w-full">{t("notifications.viewAll")}</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
