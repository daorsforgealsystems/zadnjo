import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import winston from 'winston';

// Configure logger for distributed tracing
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'distributed-tracing' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export interface TracingConfig {
  serviceName: string;
  serviceVersion?: string;
  environment?: string;
  jaegerEndpoint?: string;
  sampleRate?: number;
  enableConsoleExporter?: boolean;
}

export interface SpanOptions {
  kind?: SpanKind;
  attributes?: Record<string, string | number | boolean>;
  links?: any[];
}

export class DistributedTracing {
  private sdk: NodeSDK;
  private tracer: any;
  private config: TracingConfig;

  constructor(config: TracingConfig) {
    this.config = {
      serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      jaegerEndpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
      sampleRate: parseFloat(process.env.TRACING_SAMPLE_RATE || '1.0'),
      enableConsoleExporter: process.env.ENABLE_CONSOLE_TRACING === 'true',
      ...config
    };

    this.initializeSDK();
  }

  private initializeSDK(): void {
    try {
      // Configure Jaeger exporter
      const jaegerExporter = new JaegerExporter({
        endpoint: this.config.jaegerEndpoint,
      });

      // Configure the SDK
      this.sdk = new NodeSDK({
        serviceName: this.config.serviceName,
        traceExporter: jaegerExporter,
        instrumentations: [
          getNodeAutoInstrumentations({
            // Disable some instrumentations if needed
            '@opentelemetry/instrumentation-fs': {
              enabled: false,
            },
          }),
        ],
        resource: Resource.default().merge(new Resource({
          [SEMRESATTRS_SERVICE_NAME]: this.config.serviceName,
          [SEMRESATTRS_SERVICE_VERSION]: this.config.serviceVersion,
          'deployment.environment': this.config.environment,
        })),
      });

      logger.info('Distributed tracing initialized', {
        serviceName: this.config.serviceName,
        serviceVersion: this.config.serviceVersion,
        environment: this.config.environment,
        jaegerEndpoint: this.config.jaegerEndpoint
      });

    } catch (error) {
      logger.error('Failed to initialize distributed tracing', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  start(): void {
    try {
      this.sdk.start();
      this.tracer = trace.getTracer(this.config.serviceName, this.config.serviceVersion);
      
      logger.info('Distributed tracing started', {
        serviceName: this.config.serviceName
      });

    } catch (error) {
      logger.error('Failed to start distributed tracing', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    try {
      await this.sdk.shutdown();
      logger.info('Distributed tracing shutdown completed');
    } catch (error) {
      logger.error('Error during tracing shutdown', {
        error: (error as Error).message
      });
    }
  }

  // Create a new span
  createSpan(name: string, options: SpanOptions = {}): any {
    if (!this.tracer) {
      logger.warn('Tracer not initialized, returning no-op span');
      return trace.getActiveSpan();
    }

    const span = this.tracer.startSpan(name, {
      kind: options.kind || SpanKind.INTERNAL,
      attributes: options.attributes || {},
      links: options.links || []
    });

    return span;
  }

  // Execute a function within a span context
  async withSpan<T>(
    name: string,
    fn: (span: any) => Promise<T>,
    options: SpanOptions = {}
  ): Promise<T> {
    const span = this.createSpan(name, options);
    
    try {
      const result = await context.with(trace.setSpan(context.active(), span), () => fn(span));
      
      span.setStatus({ code: SpanStatusCode.OK });
      return result;

    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message
      });
      throw error;

    } finally {
      span.end();
    }
  }

  // Add attributes to the current active span
  addSpanAttributes(attributes: Record<string, string | number | boolean>): void {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      activeSpan.setAttributes(attributes);
    }
  }

  // Add an event to the current active span
  addSpanEvent(name: string, attributes?: Record<string, string | number | boolean>): void {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      activeSpan.addEvent(name, attributes);
    }
  }

  // Record an exception in the current active span
  recordException(error: Error): void {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      activeSpan.recordException(error);
      activeSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message
      });
    }
  }

  // Get the current trace ID for correlation
  getCurrentTraceId(): string | undefined {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      return activeSpan.spanContext().traceId;
    }
    return undefined;
  }

  // Get the current span ID
  getCurrentSpanId(): string | undefined {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      return activeSpan.spanContext().spanId;
    }
    return undefined;
  }

  // Create a child span from the current context
  createChildSpan(name: string, options: SpanOptions = {}): any {
    const parentSpan = trace.getActiveSpan();
    if (!parentSpan) {
      return this.createSpan(name, options);
    }

    return this.tracer.startSpan(name, {
      kind: options.kind || SpanKind.INTERNAL,
      attributes: options.attributes || {},
      links: options.links || []
    }, trace.setSpan(context.active(), parentSpan));
  }

  // Middleware for Express.js to automatically create spans for HTTP requests
  createExpressMiddleware() {
    return (req: any, res: any, next: any) => {
      const span = this.createSpan(`${req.method} ${req.route?.path || req.path}`, {
        kind: SpanKind.SERVER,
        attributes: {
          'http.method': req.method,
          'http.url': req.url,
          'http.route': req.route?.path || req.path,
          'http.user_agent': req.get('User-Agent') || '',
          'user.id': req.user?.id || 'anonymous'
        }
      });

      // Add trace ID to response headers for debugging
      const traceId = this.getCurrentTraceId();
      if (traceId) {
        res.setHeader('X-Trace-Id', traceId);
      }

      // Wrap the response end method to finish the span
      const originalEnd = res.end;
      res.end = function(...args: any[]) {
        span.setAttributes({
          'http.status_code': res.statusCode,
          'http.response.size': res.get('Content-Length') || 0
        });

        if (res.statusCode >= 400) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: `HTTP ${res.statusCode}`
          });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }

        span.end();
        originalEnd.apply(this, args);
      };

      context.with(trace.setSpan(context.active(), span), next);
    };
  }

  // Middleware for NestJS
  createNestMiddleware() {
    return (req: any, res: any, next: any) => {
      return this.createExpressMiddleware()(req, res, next);
    };
  }

  // Utility method to trace database operations
  async traceDbOperation<T>(
    operation: string,
    table: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.withSpan(`db.${operation}`, async (span) => {
      span.setAttributes({
        'db.operation': operation,
        'db.table': table,
        'db.system': 'postgresql' // or whatever DB you're using
      });

      const startTime = Date.now();
      try {
        const result = await fn();
        const duration = Date.now() - startTime;
        
        span.setAttributes({
          'db.duration_ms': duration
        });

        return result;
      } catch (error) {
        span.recordException(error as Error);
        throw error;
      }
    }, {
      kind: SpanKind.CLIENT
    });
  }

  // Utility method to trace external HTTP calls
  async traceHttpCall<T>(
    method: string,
    url: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.withSpan(`http.${method.toLowerCase()}`, async (span) => {
      span.setAttributes({
        'http.method': method,
        'http.url': url,
        'http.client': 'axios' // or whatever HTTP client you're using
      });

      const startTime = Date.now();
      try {
        const result = await fn();
        const duration = Date.now() - startTime;
        
        span.setAttributes({
          'http.duration_ms': duration
        });

        return result;
      } catch (error) {
        span.recordException(error as Error);
        throw error;
      }
    }, {
      kind: SpanKind.CLIENT
    });
  }
}

// Factory function to create a configured distributed tracing instance
export function createDistributedTracing(config: TracingConfig): DistributedTracing {
  return new DistributedTracing(config);
}

// Utility function to initialize tracing for a service
export function initializeTracing(serviceName: string, config?: Partial<TracingConfig>): DistributedTracing {
  const tracing = createDistributedTracing({
    serviceName,
    ...config
  });

  tracing.start();

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    await tracing.shutdown();
  });

  process.on('SIGINT', async () => {
    await tracing.shutdown();
  });

  return tracing;
}