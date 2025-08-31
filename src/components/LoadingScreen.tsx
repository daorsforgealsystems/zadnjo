import { Truck, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { FullPageLoading } from '@/components/ui/loading-states';
import { EnhancedError } from '@/components/ui/enhanced-error';
import { createErrorInfo } from '@/components/ui/error-info';

interface LoadingScreenProps {
  timeout?: number; // Timeout in milliseconds
  useEnhanced?: boolean; // Use enhanced loading screen
}

const LoadingScreen = ({ timeout = 15000, useEnhanced = true }: LoadingScreenProps) => {
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const [loadingStage, setLoadingStage] = useState('Initializing application...');

  // Update loading stage based on time elapsed
  useEffect(() => {
    const stages = [
      { time: 0, message: 'Initializing application...' },
      { time: 2000, message: 'Loading resources...' },
      { time: 4000, message: 'Connecting to services...' },
      { time: 6000, message: 'Preparing dashboard...' },
      { time: 8000, message: 'Almost there...' },
      { time: 10000, message: 'Taking longer than expected...' },
    ];

    // Update loading time every second
    const interval = setInterval(() => {
      setLoadingTime(prev => prev + 1000);
    }, 1000);

    // Check for timeout
    const timeoutId = setTimeout(() => {
      setIsTimedOut(true);
    }, timeout);

    // Update loading stage based on time
    const stageInterval = setInterval(() => {
      const currentTime = loadingTime;
      const currentStage = stages.reduce((latest, stage) => {
        if (stage.time <= currentTime && stage.time > latest.time) {
          return stage;
        }
        return latest;
      }, stages[0]);

      setLoadingStage(currentStage.message);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
      clearInterval(stageInterval);
    };
  }, [timeout, loadingTime]);

  // Always wrap all branches in a top-level div with the expected classes
  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Timed out branch */}
      {isTimedOut ? (
        useEnhanced ? (
          (() => {
            const timeoutError = createErrorInfo.timeout(
              'The application is taking longer than expected to load. This might be due to network issues or service unavailability.'
            );
            timeoutError.timestamp = new Date();
            return (
              <div className="w-full p-4">
                <EnhancedError
                  error={timeoutError}
                  onRetry={() => window.location.reload()}
                  onGoHome={() => window.location.href = '/'}
                />
              </div>
            );
          })()
        ) : (
          <div className="text-center space-y-6 max-w-md p-6 bg-background rounded-md">
            <div className="relative">
              <Truck className="h-12 w-12 text-destructive mx-auto" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">Loading Timeout</h2>
              <p className="text-sm text-muted-foreground">
                The application is taking longer than expected to load. This might be due to network issues or service unavailability.
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <button 
                onClick={() => window.location.reload()} 
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh Page</span>
              </button>
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }} 
                className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/90 transition-colors"
              >
                Clear Cache & Reload
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              If the problem persists, please check your network connection or contact support.
            </p>
          </div>
        )
      ) : (
        // Normal loading screen
        useEnhanced ? (
          (() => {
            const stages = [
              'Initializing application...',
              'Loading resources...',
              'Connecting to services...',
              'Preparing dashboard...',
              'Almost there...'
            ];
            const currentStepIndex = Math.min(
              Math.floor((loadingTime / timeout) * stages.length),
              stages.length - 1
            );
            return (
              <FullPageLoading
                title="DAORS Flow Motion"
                subtitle="Preparing your logistics platform..."
                progress={(loadingTime / timeout) * 100}
                steps={stages}
                currentStep={currentStepIndex}
              />
            );
          })()
        ) : (
          <div className="text-center space-y-4 max-w-md p-6 bg-background rounded-md">
            <div className="relative">
              <Truck className="h-12 w-12 text-primary mx-auto animate-bounce" />
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">DAORS Flow Motion</h2>
              <p className="text-sm text-muted-foreground">{loadingStage}</p>
            </div>
            <div className="w-48 h-1 bg-muted rounded-full mx-auto overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full" 
                style={{ 
                  width: `${Math.min(100, (loadingTime / timeout) * 100)}%`,
                  transition: 'width 1s linear'
                }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.floor(loadingTime / 1000)}s elapsed
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default LoadingScreen;