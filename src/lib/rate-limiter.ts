/**
 * Client-side Rate Limiting Service
 * Prevents abuse by limiting the frequency of certain actions
 */

import { safeJsonParse, safeJsonStringify } from './safe-json';
import { logger } from './logger';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier?: string;
}

interface RateLimitEntry {
  requests: number[];
  blockedUntil?: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly STORAGE_KEY = 'rate_limits';
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Load persisted rate limits from storage
    this.loadFromStorage();
    
    // Set up periodic cleanup
    if (typeof window !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
    }
  }

  /**
   * Check if an action is allowed based on rate limits
   */
  isAllowed(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const identifier = config.identifier || key;
    
    // Get or create entry for this identifier
    let entry = this.limits.get(identifier) || { requests: [] };
    
    // Check if currently blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return false;
    }
    
    // Remove old requests outside the window
    entry.requests = entry.requests.filter(time => now - time < config.windowMs);
    
    // Check if limit exceeded
    if (entry.requests.length >= config.maxRequests) {
      // Block for the remainder of the window
      entry.blockedUntil = now + config.windowMs;
      this.limits.set(identifier, entry);
      this.saveToStorage();
      return false;
    }
    
    // Add current request
    entry.requests.push(now);
    entry.blockedUntil = undefined;
    this.limits.set(identifier, entry);
    this.saveToStorage();
    
    return true;
  }

  /**
   * Get remaining attempts for a given key
   */
  getRemainingAttempts(key: string, config: RateLimitConfig): number {
    const now = Date.now();
    const identifier = config.identifier || key;
    const entry = this.limits.get(identifier);
    
    if (!entry) {
      return config.maxRequests;
    }
    
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return 0;
    }
    
    const validRequests = entry.requests.filter(time => now - time < config.windowMs);
    return Math.max(0, config.maxRequests - validRequests.length);
  }

  /**
   * Get time until rate limit resets (in seconds)
   */
  getResetTime(key: string, config: RateLimitConfig): number | null {
    const now = Date.now();
    const identifier = config.identifier || key;
    const entry = this.limits.get(identifier);
    
    if (!entry) {
      return null;
    }
    
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return Math.ceil((entry.blockedUntil - now) / 1000);
    }
    
    if (entry.requests.length === 0) {
      return null;
    }
    
    // Find the oldest request in the window
    const validRequests = entry.requests.filter(time => now - time < config.windowMs);
    if (validRequests.length > 0) {
      const oldestRequest = Math.min(...validRequests);
      const resetTime = oldestRequest + config.windowMs;
      return Math.ceil((resetTime - now) / 1000);
    }
    
    return null;
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.limits.delete(key);
    this.saveToStorage();
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.limits.clear();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    
    for (const [key, entry] of this.limits.entries()) {
      // Remove entries with no recent requests
      const hasRecentRequests = entry.requests.some(time => now - time < maxAge);
      const isBlocked = entry.blockedUntil && now < entry.blockedUntil;
      
      if (!hasRecentRequests && !isBlocked) {
        this.limits.delete(key);
      }
    }
    
    this.saveToStorage();
  }

  /**
   * Save rate limits to storage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    const data = Array.from(this.limits.entries());
    const serialized = safeJsonStringify(data);
    try {
      sessionStorage.setItem(this.STORAGE_KEY, serialized);
    } catch (error) {
      logger.error('Failed to save rate limits:', error);
    }
  }

  /**
   * Load rate limits from storage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    const stored = sessionStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      const data = safeJsonParse<Array<[string, RateLimitEntry]>>(stored, []);
      if (Array.isArray(data)) {
        this.limits = new Map(data);
        // Clean up on load
        this.cleanup();
      } else {
        logger.warn('Invalid rate limit data format');
        this.limits.clear();
      }
    }
  }

  /**
   * Destroy the rate limiter (cleanup intervals)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Create singleton instance
export const rateLimiter = new RateLimiter();

// Predefined rate limit configurations
export const RateLimitConfigs = {
  // Authentication endpoints
  LOGIN: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000 // 5 attempts per 15 minutes
  },
  REGISTER: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000 // 3 attempts per hour
  },
  PASSWORD_RESET: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000 // 3 attempts per hour
  },
  
  // API endpoints
  API_DEFAULT: {
    maxRequests: 100,
    windowMs: 60 * 1000 // 100 requests per minute
  },
  API_HEAVY: {
    maxRequests: 10,
    windowMs: 60 * 1000 // 10 requests per minute for heavy operations
  },
  
  // File uploads
  FILE_UPLOAD: {
    maxRequests: 5,
    windowMs: 5 * 60 * 1000 // 5 uploads per 5 minutes
  },
  
  // Chat/messaging
  CHAT_MESSAGE: {
    maxRequests: 30,
    windowMs: 60 * 1000 // 30 messages per minute
  },
  
  // Search
  SEARCH: {
    maxRequests: 20,
    windowMs: 60 * 1000 // 20 searches per minute
  }
};

/**
 * React hook for rate limiting
 */
export function useRateLimit(key: string, config: RateLimitConfig = RateLimitConfigs.API_DEFAULT) {
  const checkLimit = () => rateLimiter.isAllowed(key, config);
  const getRemainingAttempts = () => rateLimiter.getRemainingAttempts(key, config);
  const getResetTime = () => rateLimiter.getResetTime(key, config);
  const reset = () => rateLimiter.reset(key);
  
  return {
    checkLimit,
    getRemainingAttempts,
    getResetTime,
    reset
  };
}

/**
 * Decorator for rate-limited functions
 */
export function rateLimit(config: RateLimitConfig) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const key = `${target.constructor.name}.${propertyKey}`;
      
      if (!rateLimiter.isAllowed(key, config)) {
        const resetTime = rateLimiter.getResetTime(key, config);
        throw new Error(`Rate limit exceeded. Please try again in ${resetTime} seconds.`);
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}