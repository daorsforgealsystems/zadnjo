import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  ChevronDown, 
  ChevronUp,
  Bug,
  Wifi,
  Server,
  Clock,
  Shield,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export type ErrorType = 
  | 'network' 
  | 'server' 
  | 'timeout' 
  | 'permission' 
  | 'validation' 
  | 'unknown'
  | 'maintenance';

export interface ErrorInfo {
  type: ErrorType;
  title: string;
  message: string;
  code?: string;
  timestamp?: Date;
  stack?: string;
  suggestions?: string[];
  canRetry?: boolean;
  canGoHome?: boolean;
  supportContact?: string;
}

interface EnhancedErrorProps {
  error: ErrorInfo;
  onRetry?: () => void;
  onGoHome?: () => void;
  onContactSupport?: () => void;
  className?: string;
  showDetails?: boolean;
}

const errorIcons = {
  network: Wifi,
  server: Server,
  timeout: Clock,
  permission: Shield,
  validation: AlertTriangle,
  unknown: Bug,
  maintenance: HelpCircle,
};

const errorColors = {
  network: 'text-blue-500',
  server: 'text-red-500',
  timeout: 'text-yellow-500',
  permission: 'text-orange-500',
  validation: 'text-purple-500',
  unknown: 'text-gray-500',
  maintenance: 'text-indigo-500',
};

const errorBadgeColors = {
  network: 'bg-blue-100 text-blue-800 border-blue-200',
  server: 'bg-red-100 text-red-800 border-red-200',
  timeout: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  permission: 'bg-orange-100 text-orange-800 border-orange-200',
  validation: 'bg-purple-100 text-purple-800 border-purple-200',
  unknown: 'bg-gray-100 text-gray-800 border-gray-200',
  maintenance: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

export const EnhancedError: React.FC<EnhancedErrorProps> = ({
  error,
  onRetry,
  onGoHome,
  onContactSupport,
  className,
  showDetails = false,
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(showDetails);
  const [isRetrying, setIsRetrying] = useState(false);

  const IconComponent = errorIcons[error.type];
  const iconColor = errorColors[error.type];
  const badgeColor = errorBadgeColors[error.type];

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn('w-full max-w-2xl mx-auto', className)}
    >
      <Card className="border-destructive/20">
        <CardHeader className="text-center pb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' as const, stiffness: 200 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10"
          >
            <IconComponent className={cn('h-8 w-8', iconColor)} />
          </motion.div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <CardTitle className="text-xl">{error.title}</CardTitle>
              <Badge variant="outline" className={badgeColor}>
                {error.type.toUpperCase()}
              </Badge>
            </div>
            
            <CardDescription className="text-base">
              {error.message}
            </CardDescription>
            
            {error.code && (
              <div className="text-sm text-muted-foreground font-mono">
                Error Code: {error.code}
              </div>
            )}
            
            {error.timestamp && (
              <div className="text-xs text-muted-foreground">
                Occurred at {error.timestamp.toLocaleString()}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Suggestions */}
          {error.suggestions && error.suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <h4 className="font-medium text-sm text-muted-foreground">
                What you can try:
              </h4>
              <ul className="space-y-2">
                {error.suggestions.map((suggestion, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-start gap-2 text-sm"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            {error.canRetry && onRetry && (
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex-1"
              >
                <AnimatePresence mode="wait">
                  {isRetrying ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Retrying...
                    </motion.div>
                  ) : (
                    <motion.div
                      key="retry"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Try Again
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            )}
            
            {error.canGoHome && onGoHome && (
              <Button
                variant="outline"
                onClick={onGoHome}
                className="flex-1"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            )}
            
            {error.supportContact && onContactSupport && (
              <Button
                variant="outline"
                onClick={onContactSupport}
                className="flex-1"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            )}
          </motion.div>

          {/* Technical Details */}
          {(error.stack || error.code) && (
            <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-muted-foreground"
                >
                  <span>Technical Details</span>
                  {isDetailsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 bg-muted rounded-lg"
                >
                  {error.code && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Error Code:
                      </p>
                      <code className="text-xs font-mono bg-background px-2 py-1 rounded">
                        {error.code}
                      </code>
                    </div>
                  )}
                  
                  {error.stack && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Stack Trace:
                      </p>
                      <pre className="text-xs font-mono bg-background p-3 rounded overflow-auto max-h-40">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </motion.div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Predefined error configurations
export const createErrorInfo = {
  network: (message?: string): ErrorInfo => ({
    type: 'network',
    title: 'Connection Problem',
    message: message || 'Unable to connect to the server. Please check your internet connection.',
    suggestions: [
      'Check your internet connection',
      'Try refreshing the page',
      'Disable VPN if you\'re using one',
      'Contact your network administrator'
    ],
    canRetry: true,
    canGoHome: true,
  }),

  server: (message?: string, code?: string): ErrorInfo => ({
    type: 'server',
    title: 'Server Error',
    message: message || 'The server encountered an error while processing your request.',
    code,
    suggestions: [
      'Try refreshing the page',
      'Wait a few minutes and try again',
      'Contact support if the problem persists'
    ],
    canRetry: true,
    canGoHome: true,
    supportContact: 'support@example.com',
  }),

  timeout: (message?: string): ErrorInfo => ({
    type: 'timeout',
    title: 'Request Timeout',
    message: message || 'The request took too long to complete.',
    suggestions: [
      'Check your internet connection speed',
      'Try again with a more stable connection',
      'Contact support if timeouts persist'
    ],
    canRetry: true,
    canGoHome: true,
  }),

  permission: (message?: string): ErrorInfo => ({
    type: 'permission',
    title: 'Access Denied',
    message: message || 'You don\'t have permission to access this resource.',
    suggestions: [
      'Make sure you\'re logged in',
      'Contact your administrator for access',
      'Try logging out and back in'
    ],
    canRetry: false,
    canGoHome: true,
    supportContact: 'admin@example.com',
  }),

  validation: (message?: string): ErrorInfo => ({
    type: 'validation',
    title: 'Invalid Data',
    message: message || 'The provided data is invalid or incomplete.',
    suggestions: [
      'Check all required fields are filled',
      'Verify data formats are correct',
      'Remove any special characters if not allowed'
    ],
    canRetry: false,
    canGoHome: false,
  }),

  maintenance: (message?: string): ErrorInfo => ({
    type: 'maintenance',
    title: 'Under Maintenance',
    message: message || 'The system is currently under maintenance. Please try again later.',
    suggestions: [
      'Check our status page for updates',
      'Try again in a few minutes',
      'Follow us on social media for announcements'
    ],
    canRetry: true,
    canGoHome: true,
  }),

  unknown: (message?: string, stack?: string): ErrorInfo => ({
    type: 'unknown',
    title: 'Unexpected Error',
    message: message || 'An unexpected error occurred.',
    stack,
    suggestions: [
      'Try refreshing the page',
      'Clear your browser cache',
      'Try using a different browser',
      'Contact support with the error details'
    ],
    canRetry: true,
    canGoHome: true,
    supportContact: 'support@example.com',
  }),
};

// Error boundary component with enhanced error display
export const EnhancedErrorBoundary: React.FC<{
  children: React.ReactNode;
  fallback?: (error: ErrorInfo) => React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}> = ({ children, fallback, onError }) => {
  const [error, setError] = useState<ErrorInfo | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorInfo = createErrorInfo.unknown(
        event.message,
        event.error?.stack
      );
      errorInfo.timestamp = new Date();
      setError(errorInfo);
      onError?.(event.error, { componentStack: '' });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorInfo = createErrorInfo.unknown(
        `Unhandled promise rejection: ${event.reason}`,
        event.reason?.stack
      );
      errorInfo.timestamp = new Date();
      setError(errorInfo);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  if (error) {
    if (fallback) {
      return <>{fallback(error)}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <EnhancedError
          error={error}
          onRetry={() => {
            setError(null);
            window.location.reload();
          }}
          onGoHome={() => {
            window.location.href = '/';
          }}
          onContactSupport={() => {
            window.open(`mailto:${error.supportContact}?subject=Error Report&body=${encodeURIComponent(
              `Error: ${error.title}\nMessage: ${error.message}\nCode: ${error.code || 'N/A'}\nTimestamp: ${error.timestamp?.toISOString() || 'N/A'}`
            )}`);
          }}
        />
      </div>
    );
  }

  return <>{children}</>;
};