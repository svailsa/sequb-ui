/**
 * Safe Timer Utilities
 * Prevents timer-based vulnerabilities by validating and capping delays
 */

import { logger } from '@/services/monitoring/logger';

interface SafeTimerOptions {
  maxDelay?: number;
  minDelay?: number;
  onError?: (error: string) => void;
}

class SafeTimerManager {
  private readonly DEFAULT_MAX_DELAY = 60000; // 60 seconds
  private readonly DEFAULT_MIN_DELAY = 0;
  private activeTimers = new Set<NodeJS.Timeout | number>();
  private activeIntervals = new Set<NodeJS.Timeout | number>();

  /**
   * Validate timer delay
   */
  private validateDelay(delay: number, options: SafeTimerOptions = {}): number {
    const { 
      maxDelay = this.DEFAULT_MAX_DELAY, 
      minDelay = this.DEFAULT_MIN_DELAY,
      onError 
    } = options;

    if (typeof delay !== 'number' || isNaN(delay) || delay < 0) {
      const error = `Invalid delay value: ${delay}`;
      logger.warn(error);
      if (onError) onError(error);
      return minDelay;
    }

    if (delay > maxDelay) {
      const error = `Delay ${delay}ms exceeds maximum allowed ${maxDelay}ms`;
      logger.warn(error);
      if (onError) onError(error);
      return maxDelay;
    }

    if (delay < minDelay) {
      const error = `Delay ${delay}ms below minimum allowed ${minDelay}ms`;
      logger.warn(error);
      if (onError) onError(error);
      return minDelay;
    }

    return delay;
  }

  /**
   * Safe setTimeout with validation
   */
  safeSetTimeout(
    callback: () => void,
    delay: number,
    options: SafeTimerOptions = {}
  ): NodeJS.Timeout | number {
    const validDelay = this.validateDelay(delay, options);
    
    const timerId = setTimeout(() => {
      this.activeTimers.delete(timerId);
      try {
        callback();
      } catch (error) {
        logger.error('Error in setTimeout callback:', error);
      }
    }, validDelay);

    this.activeTimers.add(timerId);
    return timerId;
  }

  /**
   * Safe setInterval with validation
   */
  safeSetInterval(
    callback: () => void,
    delay: number,
    options: SafeTimerOptions = {}
  ): NodeJS.Timeout | number {
    const validDelay = this.validateDelay(delay, {
      ...options,
      minDelay: Math.max(options.minDelay || 100, 100) // Min 100ms for intervals
    });
    
    const intervalId = setInterval(() => {
      try {
        callback();
      } catch (error) {
        logger.error('Error in setInterval callback:', error);
        // Clear interval on error to prevent repeated errors
        this.clearSafeInterval(intervalId);
      }
    }, validDelay);

    this.activeIntervals.add(intervalId);
    return intervalId;
  }

  /**
   * Clear safe timeout
   */
  clearSafeTimeout(timerId: NodeJS.Timeout | number): void {
    clearTimeout(timerId);
    this.activeTimers.delete(timerId);
  }

  /**
   * Clear safe interval
   */
  clearSafeInterval(intervalId: NodeJS.Timeout | number): void {
    clearInterval(intervalId);
    this.activeIntervals.delete(intervalId);
  }

  /**
   * Clear all active timers
   */
  clearAll(): void {
    for (const timerId of this.activeTimers) {
      clearTimeout(timerId);
    }
    for (const intervalId of this.activeIntervals) {
      clearInterval(intervalId);
    }
    
    this.activeTimers.clear();
    this.activeIntervals.clear();
  }

  /**
   * Get count of active timers
   */
  getActiveCount(): { timers: number; intervals: number } {
    return {
      timers: this.activeTimers.size,
      intervals: this.activeIntervals.size,
    };
  }

  /**
   * Debounce function with safe timing
   */
  debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number,
    options: SafeTimerOptions = {}
  ): T {
    let timeoutId: NodeJS.Timeout | number | null = null;
    const validDelay = this.validateDelay(delay, options);

    return ((...args: Parameters<T>) => {
      if (timeoutId) {
        this.clearSafeTimeout(timeoutId);
      }

      timeoutId = this.safeSetTimeout(() => {
        timeoutId = null;
        func(...args);
      }, validDelay, options);
    }) as T;
  }

  /**
   * Throttle function with safe timing
   */
  throttle<T extends (...args: any[]) => void>(
    func: T,
    delay: number,
    options: SafeTimerOptions = {}
  ): T {
    let lastCall = 0;
    const validDelay = this.validateDelay(delay, options);

    return ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= validDelay) {
        lastCall = now;
        func(...args);
      }
    }) as T;
  }

  /**
   * Delay function that returns a Promise
   */
  delay(
    ms: number,
    options: SafeTimerOptions = {}
  ): Promise<void> {
    const validDelay = this.validateDelay(ms, options);
    
    return new Promise((resolve) => {
      const timerId = this.safeSetTimeout(() => {
        resolve();
      }, validDelay, options);
    });
  }

  /**
   * Retry function with exponential backoff
   */
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000,
    options: SafeTimerOptions = {}
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff with jitter
        const backoffDelay = initialDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 1000; // Add up to 1s jitter
        const totalDelay = backoffDelay + jitter;
        
        logger.debug(`Retry attempt ${attempt + 1} in ${totalDelay}ms`);
        await this.delay(totalDelay, options);
      }
    }
    
    throw lastError;
  }

  /**
   * Create a timeout race condition
   */
  timeoutRace<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutError: string = 'Operation timed out',
    options: SafeTimerOptions = {}
  ): Promise<T> {
    const validTimeout = this.validateDelay(timeoutMs, options);
    
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        const timerId = this.safeSetTimeout(() => {
          reject(new Error(timeoutError));
        }, validTimeout, options);
      })
    ]);
  }
}

// Create singleton instance
export const safeTimers = new SafeTimerManager();

// Export convenience functions
export const {
  safeSetTimeout,
  safeSetInterval,
  clearSafeTimeout,
  clearSafeInterval,
  debounce,
  throttle,
  delay,
  retryWithBackoff,
  timeoutRace,
} = safeTimers;

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    safeTimers.clearAll();
  });
}