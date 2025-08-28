import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/useAuth';

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
}

export function AuthErrorBoundary({ children }: AuthErrorBoundaryProps) {
  const { authState, initError, retryAuth, loginAsGuest } = useAuth();

  // Show error UI only if we're in error state
  if (authState !== 'error' || !initError) {
    return <>{children}</>;
  }

  const handleRetry = async () => {
    if (retryAuth) {
      await retryAuth();
    }
  };

  const handleGuestMode = async () => {
    await loginAsGuest();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Authentication Error
          </h1>
          <p className="text-muted-foreground">
            We're having trouble connecting to the authentication service.
          </p>
        </div>

        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Connection Issue</AlertTitle>
          <AlertDescription className="mt-2">
            {initError}
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button 
            onClick={handleRetry} 
            className="w-full"
            variant="default"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <Button 
            onClick={handleGuestMode} 
            variant="outline" 
            className="w-full"
          >
            <Wifi className="w-4 h-4 mr-2" />
            Continue as Guest
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Guest mode provides limited functionality but allows you to explore the application.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthErrorBoundary;