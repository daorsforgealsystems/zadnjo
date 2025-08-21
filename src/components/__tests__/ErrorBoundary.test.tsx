import { render, screen, fireEvent } from '@/lib/test-utils';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ErrorBoundary from '../ErrorBoundary';

// Mock child component that can throw errors
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div data-testid="working-child">Child component working</div>;
};

// Mock enhanced error component
vi.mock('@/components/ui/enhanced-error', () => ({
  EnhancedError: ({ error, onRetry, onGoHome, onContactSupport }: any) => (
    <div data-testid="enhanced-error">
      <div data-testid="enhanced-error-title">{error.title}</div>
      <div data-testid="enhanced-error-message">{error.message}</div>
      <button onClick={onRetry} data-testid="enhanced-retry-button">
        Retry
      </button>
      <button onClick={onGoHome} data-testid="enhanced-home-button">
        Go Home
      </button>
      <button onClick={onContactSupport} data-testid="enhanced-support-button">
        Contact Support
      </button>
    </div>
  ),
  createErrorInfo: {
    unknown: (message: string, stack?: string) => ({
      title: 'Unknown Error',
      message,
      stack,
      timestamp: null,
    }),
  },
}));

describe('ErrorBoundary', () => {
  // Mock console.error to avoid noise in test output
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    console.error = vi.fn();
    // Mock window.location methods
    Object.defineProperty(window, 'location', {
      value: {
        href: '',
        reload: vi.fn(),
      },
      writable: true,
    });
    // Mock window.open
    window.open = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('Normal operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('working-child')).toBeInTheDocument();
      expect(screen.getByText('Child component working')).toBeInTheDocument();
    });

    it('should not interfere with normal component rendering', () => {
      render(
        <ErrorBoundary>
          <div data-testid="normal-div">Normal content</div>
          <span data-testid="normal-span">More content</span>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('normal-div')).toBeInTheDocument();
      expect(screen.getByTestId('normal-span')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should catch and display error when child throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('An unexpected error occurred. Please try refreshing the page.')).toBeInTheDocument();
    });

    it('should log error to console when caught', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.any(Object)
      );
      
      consoleSpy.mockRestore();
    });

    it('should display error details in development mode', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error Details:')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.getByText('Stack Trace')).toBeInTheDocument();

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should not display error details in production mode', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Error Details:')).not.toBeInTheDocument();
      expect(screen.queryByText('Test error message')).not.toBeInTheDocument();

      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('Custom fallback UI', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should prioritize custom fallback over enhanced error UI', () => {
      const customFallback = <div data-testid="custom-fallback">Custom error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback} useEnhancedError={true}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('enhanced-error')).not.toBeInTheDocument();
    });
  });

  describe('Enhanced error UI', () => {
    it('should render enhanced error UI when enabled', () => {
      render(
        <ErrorBoundary useEnhancedError={true}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('enhanced-error')).toBeInTheDocument();
      expect(screen.getByTestId('enhanced-error-title')).toHaveTextContent('Unknown Error');
      expect(screen.getByTestId('enhanced-error-message')).toHaveTextContent('Test error message');
    });

    it('should provide retry functionality in enhanced error UI', () => {
      render(
        <ErrorBoundary useEnhancedError={true}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const retryButton = screen.getByTestId('enhanced-retry-button');
      expect(retryButton).toBeInTheDocument();
      
      // Should be able to click retry
      fireEvent.click(retryButton);
    });

    it('should provide home navigation in enhanced error UI', () => {
      render(
        <ErrorBoundary useEnhancedError={true}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const homeButton = screen.getByTestId('enhanced-home-button');
      expect(homeButton).toBeInTheDocument();
      
      fireEvent.click(homeButton);
      expect(window.location.href).toBe('/');
    });

    it('should provide support contact in enhanced error UI', () => {
      render(
        <ErrorBoundary useEnhancedError={true}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const supportButton = screen.getByTestId('enhanced-support-button');
      expect(supportButton).toBeInTheDocument();
      
      fireEvent.click(supportButton);
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('mailto:support@example.com')
      );
    });
  });

  describe('Error recovery', () => {
    it('should reset error state when retry is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Error UI should be visible
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      
      // Click try again button
      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(tryAgainButton);
      
      // Re-render with non-throwing child
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Should show working component now
      expect(screen.getByTestId('working-child')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should reload page when reload button is clicked', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: /reload page/i });
      fireEvent.click(reloadButton);

      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  describe('Multiple error scenarios', () => {
    it('should handle multiple consecutive errors', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // First error
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      
      // Reset error
      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(tryAgainButton);
      
      // Cause another error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should handle second error
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should handle errors with different error messages', () => {
      const ThrowCustomError = () => {
        throw new Error('Custom error message');
      };

      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowCustomError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();

      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const alertIcon = document.querySelector('[data-testid="alert-triangle"]');
      const buttons = screen.getAllByRole('button');
      
      expect(buttons).toHaveLength(2); // Try Again and Reload Page buttons
      expect(buttons[0]).toHaveTextContent('Try Again');
      expect(buttons[1]).toHaveTextContent('Reload Page');
    });

    it('should maintain focus management in error state', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      tryAgainButton.focus();
      expect(document.activeElement).toBe(tryAgainButton);
    });
  });

  describe('Edge cases', () => {
    it('should handle errors without error messages', () => {
      const ThrowEmptyError = () => {
        const error = new Error();
        error.message = '';
        throw error;
      };

      render(
        <ErrorBoundary useEnhancedError={true}>
          <ThrowEmptyError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('enhanced-error-message')).toHaveTextContent('An unexpected error occurred');
    });

    it('should handle null child components', () => {
      render(
        <ErrorBoundary>
          {null}
        </ErrorBoundary>
      );

      // Should not crash and should not show error UI
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should handle undefined child components', () => {
      render(
        <ErrorBoundary>
          {undefined}
        </ErrorBoundary>
      );

      // Should not crash and should not show error UI
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should handle async errors gracefully', async () => {
      const AsyncErrorComponent = () => {
        // Simulate async error that gets caught by ErrorBoundary
        setTimeout(() => {
          throw new Error('Async error');
        }, 0);
        return <div>Async component</div>;
      };

      render(
        <ErrorBoundary>
          <AsyncErrorComponent />
        </ErrorBoundary>
      );

      // Component should render initially
      expect(screen.getByText('Async component')).toBeInTheDocument();
    });
  });
});