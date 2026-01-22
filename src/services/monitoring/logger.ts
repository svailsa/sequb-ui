/**
 * Production-Safe Logger Service
 * Prevents sensitive information leakage in production
 */

type LogLevel = 'debug' | 'log' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enableInProduction: boolean;
  logLevel: LogLevel;
  sanitizeErrors: boolean;
  maxMessageLength: number;
}

class Logger {
  private config: LoggerConfig = {
    enableInProduction: false,
    logLevel: 'log',
    sanitizeErrors: true,
    maxMessageLength: 1000,
  };

  private isDevelopment = process.env.NODE_ENV !== 'production';
  private logHistory: Array<{ level: LogLevel; message: string; timestamp: Date }> = [];
  private maxHistorySize = 100;

  /**
   * Check if logging is enabled for the current environment
   */
  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    
    // In production, only log warnings and errors by default
    if (!this.config.enableInProduction) {
      return level === 'warn' || level === 'error';
    }

    const levels: LogLevel[] = ['debug', 'log', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Sanitize sensitive information from messages
   */
  private sanitize(message: any): any {
    if (!this.config.sanitizeErrors) return message;
    
    if (typeof message === 'string') {
      // Remove potential tokens, passwords, and keys
      return message
        .replace(/Bearer\s+[\w-]+\.[\w-]+\.[\w-]+/gi, 'Bearer [REDACTED]')
        .replace(/password["\s]*[:=]\s*["']?[\w\S]+["']?/gi, 'password: [REDACTED]')
        .replace(/token["\s]*[:=]\s*["']?[\w\S]+["']?/gi, 'token: [REDACTED]')
        .replace(/api[-_]?key["\s]*[:=]\s*["']?[\w\S]+["']?/gi, 'api_key: [REDACTED]')
        .replace(/secret["\s]*[:=]\s*["']?[\w\S]+["']?/gi, 'secret: [REDACTED]')
        .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
        .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD_NUMBER]');
    }
    
    if (typeof message === 'object' && message !== null) {
      const sanitized = { ...message };
      const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];
      
      for (const key of Object.keys(sanitized)) {
        if (sensitiveKeys.some(sensitive => 
          key.toLowerCase().includes(sensitive.toLowerCase())
        )) {
          sanitized[key] = '[REDACTED]';
        }
      }
      
      return sanitized;
    }
    
    return message;
  }

  /**
   * Truncate long messages
   */
  private truncate(message: string): string {
    if (message.length <= this.config.maxMessageLength) {
      return message;
    }
    return `${message.substring(0, this.config.maxMessageLength)}... [TRUNCATED]`;
  }

  /**
   * Format message for output
   */
  private formatMessage(...args: any[]): string {
    return args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(this.sanitize(arg), null, 2);
        } catch {
          return '[Unable to stringify object]';
        }
      }
      return String(this.sanitize(arg));
    }).join(' ');
  }

  /**
   * Add to log history for debugging
   */
  private addToHistory(level: LogLevel, message: string): void {
    this.logHistory.push({
      level,
      message: this.truncate(message),
      timestamp: new Date(),
    });
    
    // Keep history size limited
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  /**
   * Debug level logging
   */
  debug(...args: any[]): void {
    if (!this.shouldLog('debug')) return;
    
    const message = this.formatMessage(...args);
    this.addToHistory('debug', message);
    console.debug(`[DEBUG] ${message}`);
  }

  /**
   * Standard logging
   */
  log(...args: any[]): void {
    if (!this.shouldLog('log')) return;
    
    const message = this.formatMessage(...args);
    this.addToHistory('log', message);
    console.log(message);
  }

  /**
   * Info level logging
   */
  info(...args: any[]): void {
    if (!this.shouldLog('info')) return;
    
    const message = this.formatMessage(...args);
    this.addToHistory('info', message);
    console.info(`[INFO] ${message}`);
  }

  /**
   * Warning level logging
   */
  warn(...args: any[]): void {
    if (!this.shouldLog('warn')) return;
    
    const message = this.formatMessage(...args);
    this.addToHistory('warn', message);
    console.warn(`[WARN] ${message}`);
  }

  /**
   * Error level logging
   */
  error(...args: any[]): void {
    if (!this.shouldLog('error')) return;
    
    const message = this.formatMessage(...args);
    this.addToHistory('error', message);
    console.error(`[ERROR] ${message}`);
    
    // In production, you might want to send errors to a logging service
    if (!this.isDevelopment && typeof window !== 'undefined') {
      this.sendToLoggingService('error', message);
    }
  }

  /**
   * Group logging statements
   */
  group(label: string): void {
    if (!this.shouldLog('log')) return;
    console.group(label);
  }

  /**
   * End group
   */
  groupEnd(): void {
    if (!this.shouldLog('log')) return;
    console.groupEnd();
  }

  /**
   * Time measurement
   */
  time(label: string): void {
    if (!this.shouldLog('debug')) return;
    console.time(label);
  }

  /**
   * End time measurement
   */
  timeEnd(label: string): void {
    if (!this.shouldLog('debug')) return;
    console.timeEnd(label);
  }

  /**
   * Clear console (development only)
   */
  clear(): void {
    if (this.isDevelopment) {
      console.clear();
    }
  }

  /**
   * Get log history (for debugging)
   */
  getHistory(): Array<{ level: LogLevel; message: string; timestamp: Date }> {
    return [...this.logHistory];
  }

  /**
   * Send logs to external service (implement based on your logging service)
   */
  private sendToLoggingService(level: string, message: string): void {
    // Implement integration with your logging service
    // Example: Sentry, LogRocket, DataDog, etc.
    
    // For now, just store in sessionStorage for debugging
    try {
      const logs = sessionStorage.getItem('error_logs');
      const existingLogs = logs ? JSON.parse(logs) : [];
      existingLogs.push({
        level,
        message: this.truncate(message),
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
      
      // Keep only last 50 errors
      if (existingLogs.length > 50) {
        existingLogs.shift();
      }
      
      sessionStorage.setItem('error_logs', JSON.stringify(existingLogs));
    } catch {
      // Fail silently if storage is full
    }
  }

  /**
   * Configure logger settings
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Create singleton instance
export const logger = new Logger();

// Export type for use in components
export type LoggerType = typeof logger;