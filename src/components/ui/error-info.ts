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

export const createErrorInfo = {
  network: (message?: string): ErrorInfo => ({
    type: 'network',
    title: 'Connection Problem',
    message: message || 'Unable to connect to the server. Please check your internet connection.',
    suggestions: [
      'Check your internet connection',
      'Try refreshing the page',
      "Disable VPN if you're using one",
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
    message: message || "You don't have permission to access this resource.",
    suggestions: [
      "Make sure you're logged in",
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
  title: 'Unknown Error',
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

export default createErrorInfo;
