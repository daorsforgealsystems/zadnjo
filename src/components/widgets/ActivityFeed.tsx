import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  User,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'package_delivered' | 'package_picked_up' | 'route_optimized' | 'user_login' | 'alert' | 'location_update';
  title: string;
  description: string;
  timestamp: Date;
  user?: {
    name: string;
    avatar?: string;
  };
  metadata?: {
    packageId?: string;
    location?: string;
    status?: string;
  };
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  className?: string;
  maxItems?: number;
  showHeader?: boolean;
}

const ActivityFeed = ({ 
  activities, 
  className, 
  maxItems = 10,
  showHeader = true 
}: ActivityFeedProps) => {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'package_delivered':
        return CheckCircle;
      case 'package_picked_up':
        return Package;
      case 'route_optimized':
        return Truck;
      case 'user_login':
        return User;
      case 'alert':
        return AlertTriangle;
      case 'location_update':
        return MapPin;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'package_delivered':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'package_picked_up':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'route_optimized':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'user_login':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      case 'alert':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'location_update':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const variants = {
      'delivered': 'default',
      'in_transit': 'secondary',
      'pending': 'outline',
      'delayed': 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'} className="text-xs">
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const displayedActivities = activities.slice(0, maxItems);

  return (
    <Card className={cn('glass', className)}>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </CardHeader>
      )}
      <CardContent className={cn(showHeader ? '' : 'pt-6')}>
        <div className="space-y-4">
          {displayedActivities.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            displayedActivities.map((activity, index) => {
              const IconComponent = getActivityIcon(activity.type);
              const iconColor = getActivityColor(activity.type);
              
              return (
                <div key={activity.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn('h-8 w-8 rounded-full flex items-center justify-center', iconColor)}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    {index < displayedActivities.length - 1 && (
                      <div className="w-px h-6 bg-border mt-2" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                        
                        {activity.metadata && (
                          <div className="flex items-center gap-2 mt-2">
                            {activity.metadata.packageId && (
                              <Badge variant="outline" className="text-xs">
                                {activity.metadata.packageId}
                              </Badge>
                            )}
                            {activity.metadata.status && getStatusBadge(activity.metadata.status)}
                            {activity.metadata.location && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {activity.metadata.location}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                        </span>
                        {activity.user && (
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={activity.user.avatar} />
                              <AvatarFallback className="text-xs">
                                {activity.user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {activity.user.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {activities.length > maxItems && (
          <div className="pt-4 border-t">
            <Button variant="ghost" size="sm" className="w-full">
              View all activity ({activities.length - maxItems} more)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;