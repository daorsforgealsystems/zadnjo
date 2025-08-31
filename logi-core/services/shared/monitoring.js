import { performance } from 'perf_hooks';
// Performance metrics storage
const serviceMetrics = {};
// Initialize metrics for a service
const initializeMetrics = (serviceName) => {
    if (!serviceMetrics[serviceName]) {
        serviceMetrics[serviceName] = {
            requestCount: 0,
            responseTime: [],
            errorCount: 0,
            lastReset: Date.now(),
        };
    }
    return serviceMetrics[serviceName];
};
// Calculate average response time
const calculateAverageResponseTime = (responseTimes) => {
    if (responseTimes.length === 0)
        return 0;
    const sum = responseTimes.reduce((acc, time) => acc + time, 0);
    return sum / responseTimes.length;
};
// Calculate p95 response time
const calculateP95ResponseTime = (responseTimes) => {
    if (responseTimes.length === 0)
        return 0;
    const sorted = [...responseTimes].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index];
};
// Middleware for request timing and metrics collection
export const metricsMiddleware = (serviceName) => {
    return (req, res, next) => {
        const metrics = initializeMetrics(serviceName);
        const startTime = performance.now();
        // Increment request count
        metrics.requestCount++;
        // Track response status
        const originalSend = res.send;
        res.send = function (data) {
            const responseTime = performance.now() - startTime;
            metrics.responseTime.push(responseTime);
            // Keep only last 100 response times to prevent memory issues
            if (metrics.responseTime.length > 100) {
                metrics.responseTime = metrics.responseTime.slice(-100);
            }
            // Track errors
            if (res.statusCode >= 400) {
                metrics.errorCount++;
            }
            // Add performance headers
            res.setHeader('X-Response-Time', `${responseTime.toFixed(2)}ms`);
            res.setHeader('X-Request-Count', metrics.requestCount.toString());
            return originalSend.call(this, data);
        };
        next();
    };
};
// Get metrics for a service
export const getMetrics = (serviceName) => {
    const metrics = serviceMetrics[serviceName] || initializeMetrics(serviceName);
    return {
        serviceName,
        requestCount: metrics.requestCount,
        errorCount: metrics.errorCount,
        errorRate: metrics.requestCount > 0 ? (metrics.errorCount / metrics.requestCount) * 100 : 0,
        averageResponseTime: calculateAverageResponseTime(metrics.responseTime),
        p95ResponseTime: calculateP95ResponseTime(metrics.responseTime),
        uptime: Date.now() - metrics.lastReset,
        lastReset: new Date(metrics.lastReset).toISOString(),
    };
};
// Reset metrics for a service
export const resetMetrics = (serviceName) => {
    if (serviceMetrics[serviceName]) {
        serviceMetrics[serviceName] = {
            requestCount: 0,
            responseTime: [],
            errorCount: 0,
            lastReset: Date.now(),
        };
    }
};
// Health check with metrics
export const healthCheck = (serviceName, checks = {}) => {
    return async (req, res) => {
        try {
            const metrics = getMetrics(serviceName);
            const healthChecks = {};
            // Run all health checks
            for (const [name, checkFn] of Object.entries(checks)) {
                try {
                    healthChecks[name] = await checkFn();
                }
                catch (error) {
                    healthChecks[name] = false;
                }
            }
            const allChecksPassed = Object.values(healthChecks).every(check => check === true);
            res.status(allChecksPassed ? 200 : 503).json({
                status: allChecksPassed ? 'healthy' : 'unhealthy',
                service: serviceName,
                timestamp: new Date().toISOString(),
                metrics,
                checks: healthChecks,
            });
        }
        catch (error) {
            res.status(500).json({
                status: 'error',
                service: serviceName,
                timestamp: new Date().toISOString(),
                error: 'Health check failed',
            });
        }
    };
};
// Database connection check utility
export const createDatabaseCheck = (prismaClient) => {
    return async () => {
        try {
            await prismaClient.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            return false;
        }
    };
};
// Redis connection check utility
export const createRedisCheck = (redisClient) => {
    return async () => {
        try {
            await redisClient.ping();
            return true;
        }
        catch (error) {
            return false;
        }
    };
};
// Performance monitoring for specific operations
export const monitorOperation = (operationName, fn) => {
    return async (...args) => {
        const startTime = performance.now();
        try {
            const result = await fn(...args);
            const duration = performance.now() - startTime;
            // Log successful operation
            console.log(`Operation ${operationName} completed in ${duration.toFixed(2)}ms`);
            return result;
        }
        catch (error) {
            const duration = performance.now() - startTime;
            // Log failed operation
            console.error(`Operation ${operationName} failed after ${duration.toFixed(2)}ms:`, error);
            throw error;
        }
    };
};
// Export metrics collection for Prometheus
export const getPrometheusMetrics = (serviceName) => {
    const metrics = getMetrics(serviceName);
    return `
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{service="${serviceName}"} ${metrics.requestCount}

# HELP http_errors_total Total number of HTTP errors
# TYPE http_errors_total counter
http_errors_total{service="${serviceName}"} ${metrics.errorCount}

# HELP http_request_duration_seconds Average HTTP request duration in seconds
# TYPE http_request_duration_seconds gauge
http_request_duration_seconds{service="${serviceName}",quantile="avg"} ${metrics.averageResponseTime / 1000}

# HELP http_request_duration_seconds_p95 95th percentile HTTP request duration in seconds
# TYPE http_request_duration_seconds_p95 gauge
http_request_duration_seconds_p95{service="${serviceName}"} ${metrics.p95ResponseTime / 1000}

# HELP service_uptime_seconds Service uptime in seconds
# TYPE service_uptime_seconds counter
service_uptime_seconds{service="${serviceName}"} ${metrics.uptime / 1000}
`;
};
