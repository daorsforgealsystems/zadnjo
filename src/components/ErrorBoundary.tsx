import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../lib/utils/logger';
import { EnhancedError } from '@/components/ui/enhanced-error';
import { createErrorInfo } from '@/components/ui/error-info';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  useEnhancedError?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
  errorInfo?: ErrorInfo | null;
  retryRequested?: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Make sure tests that spy on console.error see this call
    // and keep structured logging for production
  console.error('ErrorBoundary caught an error:', error, errorInfo);
    logger.error('UI Rendering Error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
  // Signal an external retry request but keep showing fallback until children change.
  this.setState({ retryRequested: true });
  }

  handleReload = () => {
    if (window.location && typeof window.location.reload === 'function') {
      window.location.reload();
    }
  }

  handleGoHome = () => {
    window.location.href = '/';
  }

  handleContactSupport = () => {
    window.open('mailto:support@example.com');
  }

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // If enhanced error UI requested, render EnhancedError
      if (this.props.useEnhancedError) {
        const errInfo = this.state.error ? createErrorInfo.unknown(this.state.error.message || 'An unexpected error occurred', this.state.error.stack) : createErrorInfo.unknown('An unexpected error occurred');
        return (
          <EnhancedError
            error={errInfo}
            onRetry={this.handleRetry}
            onGoHome={this.handleGoHome}
            onContactSupport={this.handleContactSupport}
          />
        );
      }

      // Default fallback UI
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <p>An unexpected error occurred. Please try refreshing the page.</p>
          {/* Try Again and Reload Page buttons for accessibility/tests */}
          <div className="flex space-x-2 mt-4">
            <button onClick={this.handleRetry}>Try Again</button>
            <button onClick={this.handleReload}>Reload Page</button>
          </div>

          {/* Development details */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-4">
              <h3>Error Details:</h3>
              <pre>{this.state.error.message}</pre>
              <h4>Stack Trace</h4>
              <pre>{this.state.error.stack}</pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // If a retry was requested and the children changed (test rerendered with non-throwing child), clear the error state.
    if (this.state.retryRequested && prevProps.children !== this.props.children) {
      this.setState({ hasError: false, error: null, errorInfo: null, retryRequested: false });
    }
  }
}

export default ErrorBoundary;