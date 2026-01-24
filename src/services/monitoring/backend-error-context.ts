/**
 * Backend-Driven Error Context Service
 * Gets error contexts and suggestions from backend instead of hardcoded rules
 */

import { api } from '@/services/api/client';
import { logger } from '@/services/monitoring/logger';

interface ErrorContext {
  error_code: string;
  title: string;
  message: string;
  suggestions: string[];
  documentation_links: DocumentationLink[];
  severity: 'critical' | 'error' | 'warning' | 'info';
  category: string;
  recoverable: boolean;
  retry_after_seconds?: number;
}

interface DocumentationLink {
  title: string;
  url: string;
  description: string;
}

interface EnhancedError {
  context: ErrorContext;
  originalError: any;
  timestamp: Date;
}

class BackendErrorContextService {
  private errorContextCache: Map<string, ErrorContext> = new Map();
  private errorContextCacheExpiry: Map<string, number> = new Map();
  private availableContexts: string[] = [];
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.loadAvailableContexts();
  }

  /**
   * Load list of available error contexts
   */
  private async loadAvailableContexts(): Promise<void> {
    try {
      const response = await api.ui.getErrorContexts();
      this.availableContexts = response.data.data.error_codes;
      logger.debug('Available error contexts loaded', {
        count: this.availableContexts.length,
      });
    } catch (error) {
      logger.error('Failed to load available error contexts', error);
    }
  }

  /**
   * Get error context for a specific error code
   */
  async getErrorContext(errorCode: string): Promise<ErrorContext | null> {
    const now = Date.now();
    const cached = this.errorContextCache.get(errorCode);
    const cacheExpiry = this.errorContextCacheExpiry.get(errorCode) || 0;

    // Return cached context if still valid
    if (cached && now < cacheExpiry) {
      return cached;
    }

    try {
      const response = await api.ui.getErrorContext(errorCode);
      const context = response.data.data;
      this.errorContextCache.set(errorCode, context);
      this.errorContextCacheExpiry.set(errorCode, now + this.CACHE_TTL);
      return context;
    } catch (error) {
      logger.warn('Failed to load error context from backend', { errorCode, error });
    }

    // Return fallback context
    return this.getFallbackContext(errorCode);
  }

  /**
   * Get fallback context when backend is unavailable
   */
  private getFallbackContext(errorCode: string): ErrorContext | null {
    const fallbacks: Record<string, ErrorContext> = {
      'HTTP_401': {
        error_code: 'HTTP_401',
        title: 'Authentication Required',
        message: 'Your session has expired or you are not authenticated.',
        suggestions: [
          'Please log in again',
          'Check if your session has expired',
          'Verify your API key if using API access',
        ],
        documentation_links: [],
        severity: 'error',
        category: 'authentication',
        recoverable: true,
      },
      'HTTP_403': {
        error_code: 'HTTP_403',
        title: 'Access Forbidden',
        message: 'You don\'t have permission to access this resource.',
        suggestions: [
          'Contact your administrator for access',
          'Check if you have the required role or permissions',
          'Verify you\'re accessing the correct resource',
        ],
        documentation_links: [],
        severity: 'error',
        category: 'authorization',
        recoverable: false,
      },
      'HTTP_429': {
        error_code: 'HTTP_429',
        title: 'Rate Limit Exceeded',
        message: 'You have made too many requests. Please slow down.',
        suggestions: [
          'Wait before making more requests',
          'Check the rate limit headers for reset time',
          'Consider implementing exponential backoff',
        ],
        documentation_links: [],
        severity: 'warning',
        category: 'rate_limit',
        recoverable: true,
        retry_after_seconds: 60,
      },
      'VALIDATION_ERROR': {
        error_code: 'VALIDATION_ERROR',
        title: 'Validation Error',
        message: 'The data you provided doesn\'t meet the required format or constraints.',
        suggestions: [
          'Check the validation messages for specific issues',
          'Ensure all required fields are provided',
          'Verify data formats match the expected schema',
        ],
        documentation_links: [],
        severity: 'error',
        category: 'validation',
        recoverable: true,
      },
      'NETWORK_ERROR': {
        error_code: 'NETWORK_ERROR',
        title: 'Network Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        suggestions: [
          'Check your internet connection',
          'Try refreshing the page',
          'Verify the server status',
          'Try again in a few moments',
        ],
        documentation_links: [],
        severity: 'error',
        category: 'network',
        recoverable: true,
        retry_after_seconds: 10,
      },
    };

    return fallbacks[errorCode] || null;
  }

  /**
   * Extract error code from various error objects
   */
  extractErrorCode(error: any): string {
    // Axios errors
    if (error.response?.status) {
      return `HTTP_${error.response.status}`;
    }

    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      return 'NETWORK_ERROR';
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'TIMEOUT_ERROR';
    }

    // Custom error codes
    if (error.code) {
      return error.code;
    }

    // Error name as fallback
    if (error.name) {
      return error.name.toUpperCase();
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Enhance an error with context from backend
   */
  async enhanceError(error: any): Promise<EnhancedError> {
    const errorCode = this.extractErrorCode(error);
    const context = await this.getErrorContext(errorCode);

    if (context) {
      return {
        context,
        originalError: error,
        timestamp: new Date(),
      };
    }

    // Create a generic context if none found
    return {
      context: {
        error_code: errorCode,
        title: 'Error',
        message: error.message || 'An unexpected error occurred.',
        suggestions: ['Please try again', 'Contact support if the problem persists'],
        documentation_links: [],
        severity: 'error',
        category: 'unknown',
        recoverable: true,
      },
      originalError: error,
      timestamp: new Date(),
    };
  }

  /**
   * Format error for user display
   */
  async formatErrorForDisplay(error: any): Promise<{
    title: string;
    message: string;
    suggestions: string[];
    severity: string;
    recoverable: boolean;
    retryAfter?: number;
    links?: DocumentationLink[];
  }> {
    const enhancedError = await this.enhanceError(error);
    const { context } = enhancedError;

    return {
      title: context.title,
      message: context.message,
      suggestions: context.suggestions,
      severity: context.severity,
      recoverable: context.recoverable,
      retryAfter: context.retry_after_seconds,
      links: context.documentation_links,
    };
  }

  /**
   * Check if error should trigger retry
   */
  async shouldRetry(error: any): Promise<{ shouldRetry: boolean; retryAfter?: number }> {
    const context = await this.getErrorContext(this.extractErrorCode(error));
    
    if (!context) {
      return { shouldRetry: false };
    }

    return {
      shouldRetry: context.recoverable,
      retryAfter: context.retry_after_seconds,
    };
  }

  /**
   * Get user-friendly error message
   */
  async getUserFriendlyMessage(error: any): Promise<string> {
    const errorCode = this.extractErrorCode(error);
    const context = await this.getErrorContext(errorCode);
    
    if (context) {
      return context.message;
    }

    // Fallback to original error message
    return error.message || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Get suggestions for error resolution
   */
  async getSuggestions(error: any): Promise<string[]> {
    const errorCode = this.extractErrorCode(error);
    const context = await this.getErrorContext(errorCode);
    
    if (context) {
      return context.suggestions;
    }

    return ['Please try again', 'Contact support if the problem persists'];
  }

  /**
   * Check if error is critical
   */
  async isCritical(error: any): Promise<boolean> {
    const errorCode = this.extractErrorCode(error);
    const context = await this.getErrorContext(errorCode);
    
    return context?.severity === 'critical' || false;
  }

  /**
   * Get available error contexts
   */
  getAvailableContexts(): string[] {
    return this.availableContexts;
  }

  /**
   * Clear cache for a specific error code or all contexts
   */
  clearCache(errorCode?: string): void {
    if (errorCode) {
      this.errorContextCache.delete(errorCode);
      this.errorContextCacheExpiry.delete(errorCode);
    } else {
      this.errorContextCache.clear();
      this.errorContextCacheExpiry.clear();
    }
  }

  /**
   * Refresh contexts from backend
   */
  async refresh(): Promise<void> {
    this.clearCache();
    await this.loadAvailableContexts();
  }
}

// Export singleton instance
export const backendErrorContext = new BackendErrorContextService();