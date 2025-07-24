// Logging utility for the Bible App
// This provides a centralized way to handle logging with environment-based control

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote?: boolean;
}

class Logger {
  private config: LoggerConfig = {
    level: __DEV__ ? 'debug' : 'warn',
    enableConsole: __DEV__,
  };

  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.config.level];
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    ..._args: unknown[]
  ): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return `${prefix} ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug') && this.config.enableConsole) {
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info') && this.config.enableConsole) {
      // eslint-disable-next-line no-console
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn') && this.config.enableConsole) {
      // eslint-disable-next-line no-console
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error') && this.config.enableConsole) {
      // eslint-disable-next-line no-console
      console.error(this.formatMessage('error', message), ...args);
    }
  }

  // Convenience methods for specific contexts
  database(message: string, ...args: unknown[]): void {
    this.debug(`[DB] ${message}`, ...args);
  }

  sync(message: string, ...args: unknown[]): void {
    this.debug(`[SYNC] ${message}`, ...args);
  }

  auth(message: string, ...args: unknown[]): void {
    this.debug(`[AUTH] ${message}`, ...args);
  }

  media(message: string, ...args: unknown[]): void {
    this.debug(`[MEDIA] ${message}`, ...args);
  }

  api(message: string, ...args: unknown[]): void {
    this.debug(`[API] ${message}`, ...args);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for use in other files
export type { LogLevel, LoggerConfig };
