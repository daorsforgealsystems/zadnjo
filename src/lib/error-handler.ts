import { toast } from '@/lib/toast';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

export class ApiErrorHandler {
  static handle(error: unknown, context?: string): ApiError {
    let apiError: ApiError;

    if (error instanceof Error) {
      apiError = error as ApiError;
    } else if (typeof error === 'string') {
      apiError = new Error(error) as ApiError;
    } else {
      apiError = new Error('An unknown error occurred') as ApiError;
      apiError.details = error;
    }

    // Log error for debugging
    console.error(`API Error${context ? ` in ${context}` : ''}:`, apiError);

    // Show user-friendly error message
    this.showErrorToast(apiError, context);

    return apiError;
  }

  private static showErrorToast(error: ApiError, context?: string) {
    let message = error.message;

    // Customize messages based on error type
    if (error.status === 401) {
      message = 'Authentication required. Please log in again.';
    } else if (error.status === 403) {
      message = 'You do not have permission to perform this action.';
    } else if (error.status === 404) {
      message = 'The requested resource was not found.';
    } else if (error.status === 500) {
      message = 'Server error. Please try again later.';
    } else if (error.status && error.status >= 500) {
      message = 'Service temporarily unavailable. Please try again later.';
    }

    toast.error(message, {
      description: context ? `Error in ${context}` : undefined,
    });
  }

  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.handle(error, context);
      return null;
    }
  }
}

// Utility function for wrapping async operations
export const withErrorHandling = ApiErrorHandler.withErrorHandling;