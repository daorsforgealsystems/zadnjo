import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ReactErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Check if this is a React forwardRef error
      const isForwardRefError = this.state.error?.message?.includes('forwardRef') ||
                               this.state.error?.stack?.includes('forwardRef');

      // Custom fallback UI
      return this.props.fallback || (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-lg w-full space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {isForwardRefError ? 'Component Loading Error' : 'Something went wrong'}
              </h1>
              <p className="text-muted-foreground">
                {isForwardRefError 
                  ? 'There was an issue loading React components. This might be a temporary issue.'
                  : 'An unexpected error occurred while rendering the application.'
                }
              </p>
            </div>

            {/* Error details for development */}
            {import.meta.env.DEV && this.state.error && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h3 className="text-sm font-medium text-foreground">Error Details (Development)</h3>
                <div className="text-xs text-muted-foreground font-mono bg-background p-2 rounded overflow-auto max-h-32">
                  <div className="text-destructive font-semibold">{this.state.error.name}: {this.state.error.message}</div>
                  {this.state.error.stack && (
                    <pre className="mt-2 whitespace-pre-wrap">{this.state.error.stack}</pre>
                  )}
                </div>
              </div>
            )}

            {/* Suggested fixes for forwardRef errors */}
            {isForwardRefError && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Possible Solutions:
                </h3>
                <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• Try refreshing the page</li>
                  <li>• Clear your browser cache</li>
                  <li>• Check if you have multiple React versions installed</li>
                  <li>• Ensure all dependencies are properly installed</li>
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                If this problem persists, please contact support or check the browser console for more details.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ReactErrorBoundary;