/**
 * Local no-op Sentry shim to avoid build-time dependency on @sentry/node
 * and shared logger during local development.
 */
export function initSentry(): void {
  // no-op
}

export function captureError(error: any, context?: any): void {
  // Fallback to console for local runs
  try {
    // eslint-disable-next-line no-console
    console.error(error?.message || error, { error, context });
  } catch {
    // ignore
  }
}