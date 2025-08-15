// Debug utility for tracking application initialization and rendering
const DEBUG_ENABLED = true;
const DEBUG_PREFIX = '[DAORS-DEBUG]';

// Store debug logs in memory for later retrieval
const debugLogs: string[] = [];

// Debug levels
type DebugLevel = 'info' | 'warn' | 'error' | 'critical';

// Debug function with timestamp
export const debug = (message: string, level: DebugLevel = 'info', data?: any) => {
  if (!DEBUG_ENABLED) return;
  
  const timestamp = new Date().toISOString();
  const formattedMessage = `${DEBUG_PREFIX} [${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  // Store in memory
  debugLogs.push(formattedMessage);
  
  // Log to console with appropriate level
  switch (level) {
    case 'info':
      console.log(formattedMessage, data || '');
      break;
    case 'warn':
      console.warn(formattedMessage, data || '');
      break;
    case 'error':
    case 'critical':
      console.error(formattedMessage, data || '');
      break;
  }
  
  // For critical errors, also show on screen if possible
  if (level === 'critical') {
    try {
      const debugElement = document.getElementById('debug-overlay');
      if (debugElement) {
        const errorItem = document.createElement('div');
        errorItem.className = 'debug-error';
        errorItem.textContent = `${message} ${data ? JSON.stringify(data) : ''}`;
        debugElement.appendChild(errorItem);
      } else {
        // Create debug overlay if it doesn't exist
        const overlay = document.createElement('div');
        overlay.id = 'debug-overlay';
        overlay.style.position = 'fixed';
        overlay.style.bottom = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
        overlay.style.color = 'red';
        overlay.style.padding = '10px';
        overlay.style.zIndex = '9999';
        overlay.style.maxHeight = '200px';
        overlay.style.overflowY = 'auto';
        overlay.style.fontFamily = 'monospace';
        overlay.style.fontSize = '12px';
        
        const errorItem = document.createElement('div');
        errorItem.className = 'debug-error';
        errorItem.textContent = `${message} ${data ? JSON.stringify(data) : ''}`;
        overlay.appendChild(errorItem);
        
        document.body.appendChild(overlay);
      }
    } catch (e) {
      // Silently fail if DOM manipulation fails
    }
  }
};

// Get all logs
export const getLogs = () => {
  return [...debugLogs];
};

// Clear logs
export const clearLogs = () => {
  debugLogs.length = 0;
};

// Initialize debug system
export const initDebug = () => {
  debug('Debug system initialized', 'info');
  
  // Override console.error to catch unhandled errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    debug(`Console error: ${args.join(' ')}`, 'error');
    originalConsoleError.apply(console, args);
  };
  
  // Add global error handler
  window.addEventListener('error', (event) => {
    debug(`Unhandled error: ${event.message}`, 'critical', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.stack || event.error?.message || 'Unknown error'
    });
  });
  
  // Add unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    debug(`Unhandled promise rejection: ${event.reason}`, 'critical', {
      reason: event.reason?.stack || event.reason?.message || 'Unknown reason'
    });
  });
  
  return {
    debug,
    getLogs,
    clearLogs
  };
};

export default {
  debug,
  getLogs,
  clearLogs,
  initDebug
};