import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEffect, useState } from 'react';

const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (isOnline && showReconnected === false) {
      // Show reconnected message briefly
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showReconnected]);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      <Alert className={`${isOnline ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-orange-500 bg-orange-50 dark:bg-orange-950'}`}>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          )}
          <AlertDescription className={isOnline ? 'text-green-800 dark:text-green-200' : 'text-orange-800 dark:text-orange-200'}>
            {isOnline 
              ? 'Connection restored! Data will sync automatically.' 
              : 'You are offline. Some features may be limited.'
            }
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
};

export default OfflineIndicator;