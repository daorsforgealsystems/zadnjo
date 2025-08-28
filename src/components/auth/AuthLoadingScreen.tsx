import React, { useEffect, useState } from 'react';
import { Loader2, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/useAuth';

interface AuthLoadingScreenProps {
  children: React.ReactNode;
}

export function AuthLoadingScreen({ children }: AuthLoadingScreenProps) {
  const { loading, authState, initError } = useAuth();
  const [loadingStep, setLoadingStep] = useState(0);
  const [showTimeout, setShowTimeout] = useState(false);

  const loadingSteps = [
    { icon: Shield, text: 'Initializing security...' },
    { icon: Loader2, text: 'Connecting to authentication service...' },
    { icon: CheckCircle, text: 'Verifying credentials...' },
  ];

  useEffect(() => {
    if (!loading) return;

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
    }, 1500);

    // Show timeout message after 8 seconds
    const timeoutTimer = setTimeout(() => {
      setShowTimeout(true);
    }, 8000);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(timeoutTimer);
    };
  }, [loading, loadingSteps.length]);

  // Don't show loading screen if not loading
  if (!loading) {
    return <>{children}</>;
  }

  const CurrentIcon = loadingSteps[loadingStep]?.icon || Loader2;
  const currentText = loadingSteps[loadingStep]?.text || 'Loading...';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CurrentIcon 
              className={`w-8 h-8 text-primary ${
                CurrentIcon === Loader2 ? 'animate-spin' : ''
              }`} 
            />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              DAORS Flow Motion
            </h1>
            <p className="text-muted-foreground">
              {currentText}
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center space-x-2">
          {loadingSteps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                index === loadingStep 
                  ? 'bg-primary' 
                  : index < loadingStep 
                    ? 'bg-primary/50' 
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Timeout message */}
        {showTimeout && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-center space-x-2 text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Taking longer than usual</span>
            </div>
            <p className="text-xs text-muted-foreground">
              The authentication service might be experiencing delays. 
              You'll be redirected to guest mode if this continues.
            </p>
          </div>
        )}

        {/* Error state within loading */}
        {initError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-destructive">
              {initError}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthLoadingScreen;