# Error Handling & Logging Best Practices

This document covers best practices for implementing robust error handling and logging across our application stack.

## 1. Frontend Error Boundaries

### Implementation
Create an ErrorBoundary component to catch React rendering errors:

```typescript:src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../lib/utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state = { hasError: false };

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('UI Rendering Error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={() => window.location.reload()}>Refresh</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Usage
Wrap top-level components:
```typescript:src/App.tsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      {/* Application content */}
    </ErrorBoundary>
  );
}
```

## 2. Centralized Logging

### Frontend Logger
```typescript:src/lib/utils/logger.ts
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  log(level: LogLevel, message: string, context?: object) {
    if (this.shouldLog(level)) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        context: {
          ...context,
          path: window.location.pathname,
        },
      };
      console[level](JSON.stringify(logEntry));
      // Add remote logging here (Sentry, etc.)
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  debug(message: string, context?: object) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: object) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: object) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: object) {
    this.log(LogLevel.ERROR, message, context);
  }
}

export const logger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
);
```

### Backend Logging (Node.js)
```typescript:logi-core/shared/logger.ts
import winston from 'winston';

const { combine, timestamp, json, errors } = winston.format;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
});

export default logger;
```

## 3. Sentry Integration

### Frontend Setup
```typescript:src/main.tsx
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  release: `logi-core@${process.env.REACT_APP_VERSION}`,
  beforeSend(event) {
    // Filter out known non-critical errors
    if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
      return null;
    }
    return event;
  },
});
```

### Backend Setup (Node.js)
```typescript:logi-core/services/user-service/src/main.ts
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app }),
    new Sentry.Integrations.Prisma({ client: prisma }),
  ],
});
```

## Best Practices Checklist

1. **Error Classification**
   - Distinguish between operational errors (expected) and programmer errors (bugs)
   - Create custom error classes for domain-specific errors

2. **Logging Principles**
   - Use structured logging with timestamps and context
   - Include correlation IDs for distributed tracing
   - Log at appropriate levels (DEBUG, INFO, WARN, ERROR)

3. **Monitoring**
   - Set up Sentry alerts for:
     - New errors
     - Error frequency spikes
     - Critical user flows
   - Create dashboards for error rates and latency

4. **Error Handling**
   - Always catch promises: `promise.catch(logger.error)`
   - Use try/catch for async operations
   - Validate user input with Zod/Joi
   - Implement retry logic with exponential backoff

5. **Production vs Development**
   - More verbose logging in development
   - Sample traces at lower rate in production
   - Obfuscate sensitive data in logs