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