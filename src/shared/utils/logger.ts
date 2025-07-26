// Logging utility for the Bible App
// This provides a centralized way to handle logging with environment-based control

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote?: boolean;
}

class Logger {
  private config: LogConfig;

  constructor(
    config: LogConfig = { level: LogLevel.INFO, enableConsole: true }
  ) {
    this.config = config;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level;
  }

  private formatMessage(
    level: string,
    message: string,
    ...args: any[]
  ): string {
    const timestamp = new Date().toISOString();
    const formattedArgs =
      args.length > 0
        ? ` ${args
            .map(arg =>
              typeof arg === 'object'
                ? JSON.stringify(arg, null, 2)
                : String(arg)
            )
            .join(' ')}`
        : '';
    return `[${timestamp}] ${level}: ${message}${formattedArgs}`;
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const formattedMessage = this.formatMessage('ERROR', message, ...args);
      if (this.config.enableConsole) {
        console.error(formattedMessage);
      }
      // TODO: Send to remote logging service if enabled
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const formattedMessage = this.formatMessage('WARN', message, ...args);
      if (this.config.enableConsole) {
        console.warn(formattedMessage);
      }
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const formattedMessage = this.formatMessage('INFO', message, ...args);
      if (this.config.enableConsole) {
        console.info(formattedMessage);
      }
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const formattedMessage = this.formatMessage('DEBUG', message, ...args);
      if (this.config.enableConsole) {
        console.debug(formattedMessage);
      }
    }
  }

  // Convenience method for backward compatibility
  log(message: string, ...args: any[]): void {
    this.info(message, ...args);
  }

  setConfig(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): LogConfig {
    return { ...this.config };
  }
}

// Create default logger instance
export const logger = new Logger({
  level: __DEV__ ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
});

// Export individual log methods for convenience
export const { error, warn, info, debug, log } = logger;

// Export logger instance for advanced usage
export default logger;
