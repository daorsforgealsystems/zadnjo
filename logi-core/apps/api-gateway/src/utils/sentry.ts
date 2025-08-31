import * as Sentry from '@sentry/node';
import { logger } from '../../shared/logger';

export function initSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 1.0,
      environment: process.env.NODE_ENV,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
      ],
    });
    logger.info('Sentry initialized');
  }
}

export function captureError(error: any, context?: any) {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
  logger.error(error.message, { error, context });
}