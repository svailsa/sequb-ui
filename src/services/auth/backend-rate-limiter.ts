/**
 * Backend-Driven Rate Limiting Service
 * Gets rate limit configurations from backend and respects server-side limits
 */

import { api } from '@/services/api/client';
import { logger } from '@/services/monitoring/logger';

interface RateLimitConfig {
  max_requests: number;
  window_seconds: number;
  cost: number;
  description: string;
}

interface RateLimitStatus {
  limit: number;
  remaining: number;
  reset_after_seconds: number;
}

interface AuthConfig {
  rate_limits: Record<string, RateLimitConfig>;
  session_config: {
    timeout_seconds: number;
    refresh_buffer_seconds: number;
    require_mfa: boolean;
    remember_me_duration_days: number;
  };
  security_policies: {
    allowed_domains: string[];
    blocked_domains: string[];
    email_domains: {
      allowed_domains: string[];
      blocked_domains: string[];
      require_verification: boolean;
    };
    url_validation: {
      allow_localhost: boolean;
      allow_private_ips: boolean;
      blocked_schemes: string[];
    };
  };
}

class BackendRateLimiter {
  private authConfig: AuthConfig | null = null;
  private configLoadPromise: Promise<void> | null = null;
  private lastConfigFetch = 0;
  private readonly CONFIG_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Eagerly load config
    this.loadAuthConfig();
  }

  /**
   * Load authentication configuration from backend
   */
  private async loadAuthConfig(): Promise<void> {
    const now = Date.now();
    
    // Return existing promise if load is in progress
    if (this.configLoadPromise) {
      return this.configLoadPromise;
    }

    // Use cached config if still fresh
    if (this.authConfig && (now - this.lastConfigFetch) < this.CONFIG_TTL) {
      return;
    }

    this.configLoadPromise = this.fetchAuthConfig();
    try {
      await this.configLoadPromise;
    } finally {
      this.configLoadPromise = null;
    }
  }

  private async fetchAuthConfig(): Promise<void> {
    try {
      const response = await api.authConfig.getConfig();
      this.authConfig = response.data.data;
      this.lastConfigFetch = Date.now();
      logger.debug('Auth configuration loaded from backend', {
        rate_limits_count: Object.keys(this.authConfig.rate_limits).length,
        session_timeout: this.authConfig.session_config.timeout_seconds,
      });
    } catch (error) {
      logger.error('Failed to load auth configuration from backend', error);
      // Use fallback configuration
      this.authConfig = this.getFallbackConfig();
    }
  }

  /**
   * Get fallback configuration when backend is unavailable
   */
  private getFallbackConfig(): AuthConfig {
    return {
      rate_limits: {
        login: { max_requests: 5, window_seconds: 900, cost: 1, description: "Login attempts" },
        register: { max_requests: 3, window_seconds: 3600, cost: 1, description: "Registration attempts" },
        api_general: { max_requests: 100, window_seconds: 60, cost: 1, description: "General API requests" },
      },
      session_config: {
        timeout_seconds: 86400, // 24 hours
        refresh_buffer_seconds: 300, // 5 minutes
        require_mfa: false,
        remember_me_duration_days: 30,
      },
      security_policies: {
        allowed_domains: [],
        blocked_domains: [],
        email_domains: {
          allowed_domains: [],
          blocked_domains: ['temp-mail.org', '10minutemail.com'],
          require_verification: true,
        },
        url_validation: {
          allow_localhost: process.env.NODE_ENV !== 'production',
          allow_private_ips: process.env.NODE_ENV !== 'production',
          blocked_schemes: ['file', 'ftp'],
        },
      },
    };
  }

  /**
   * Get rate limit configuration for an action
   */
  async getRateLimitConfig(action: string): Promise<RateLimitConfig | null> {
    await this.loadAuthConfig();
    return this.authConfig?.rate_limits[action] || null;
  }

  /**
   * Get all rate limit configurations
   */
  async getAllRateLimitConfigs(): Promise<Record<string, RateLimitConfig>> {
    await this.loadAuthConfig();
    return this.authConfig?.rate_limits || {};
  }

  /**
   * Get current rate limit status from backend
   */
  async getRateLimitStatus(endpoint: string): Promise<RateLimitStatus | null> {
    try {
      const response = await api.authConfig.getRateLimitStatus(endpoint);
      return response.data.data;
    } catch (error) {
      logger.warn('Failed to get rate limit status from backend', { endpoint, error });
    }
    return null;
  }

  /**
   * Check if action should be allowed (informational only - server enforces)
   */
  async shouldAllowAction(action: string): Promise<{ allowed: boolean; config?: RateLimitConfig; reason?: string }> {
    const config = await this.getRateLimitConfig(action);
    
    if (!config) {
      // No specific configuration found, allow by default
      return { allowed: true, reason: 'No rate limit configured' };
    }

    // In a backend-driven architecture, we primarily rely on server-side enforcement
    // This client-side check is for UX improvements only
    const status = await this.getRateLimitStatus(action);
    
    if (status) {
      const allowed = status.remaining > 0;
      return {
        allowed,
        config,
        reason: allowed ? 'Within rate limit' : `Rate limit exceeded. Try again in ${status.reset_after_seconds} seconds`,
      };
    }

    // If we can't get status from server, assume allowed (server will enforce)
    return { allowed: true, config, reason: 'Rate limit status unavailable, deferring to server' };
  }

  /**
   * Get session configuration
   */
  async getSessionConfig() {
    await this.loadAuthConfig();
    return this.authConfig?.session_config || this.getFallbackConfig().session_config;
  }

  /**
   * Get security policies
   */
  async getSecurityPolicies() {
    await this.loadAuthConfig();
    return this.authConfig?.security_policies || this.getFallbackConfig().security_policies;
  }

  /**
   * Check if URL is allowed based on security policies
   */
  async isUrlAllowed(url: string): Promise<boolean> {
    const policies = await this.getSecurityPolicies();
    
    try {
      const urlObj = new URL(url);
      
      // Check blocked schemes
      if (policies.url_validation.blocked_schemes.includes(urlObj.protocol.slice(0, -1))) {
        return false;
      }
      
      // Check localhost in production
      if (!policies.url_validation.allow_localhost && 
          (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1')) {
        return false;
      }
      
      // Check private IPs (simplified check)
      if (!policies.url_validation.allow_private_ips && 
          urlObj.hostname.match(/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01]))/)) {
        return false;
      }
      
      // Check blocked domains
      if (policies.blocked_domains.some(domain => urlObj.hostname.includes(domain))) {
        return false;
      }
      
      return true;
    } catch {
      // Invalid URL
      return false;
    }
  }

  /**
   * Check if email domain is allowed
   */
  async isEmailDomainAllowed(email: string): Promise<boolean> {
    const policies = await this.getSecurityPolicies();
    const domain = email.split('@')[1]?.toLowerCase();
    
    if (!domain) {
      return false;
    }
    
    const { email_domains } = policies;
    
    // Check blocked domains first
    if (email_domains.blocked_domains.includes(domain)) {
      return false;
    }
    
    // If allowed domains are specified, check if domain is in the list
    if (email_domains.allowed_domains.length > 0) {
      return email_domains.allowed_domains.includes(domain);
    }
    
    // No specific restrictions, allow all domains except blocked ones
    return true;
  }

  /**
   * Force refresh configuration from backend
   */
  async refreshConfig(): Promise<void> {
    this.lastConfigFetch = 0; // Force refresh
    await this.loadAuthConfig();
  }

  /**
   * Get time until token should be refreshed
   */
  async getTokenRefreshTime(): Promise<number> {
    const config = await this.getSessionConfig();
    return config.refresh_buffer_seconds * 1000; // Convert to milliseconds
  }
}

// Export singleton instance
export const backendRateLimiter = new BackendRateLimiter();