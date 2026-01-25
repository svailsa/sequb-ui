/**
 * Secure Authentication Service
 * Manages authentication tokens with improved security
 */

import { safeParseJWT } from '@/lib/utils/safe-json';
import { logger } from '@/services/monitoring/logger';

class AuthService {
  private readonly TOKEN_KEY = 'sequb_token';
  private readonly REFRESH_TOKEN_KEY = 'sequb_refresh_token';
  private readonly USER_REGION_KEY = 'user_region';
  private tokenInMemory: string | null = null;
  private refreshTokenInMemory: string | null = null;

  /**
   * Store token securely
   * Uses sessionStorage instead of localStorage to reduce XSS attack surface
   */
  setToken(token: string, refreshToken?: string): void {
    this.tokenInMemory = token;
    
    if (refreshToken) {
      this.refreshTokenInMemory = refreshToken;
    }
    
    // Use sessionStorage for better security (cleared on tab close)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.TOKEN_KEY, token);
      
      if (refreshToken) {
        sessionStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      }
    }
  }

  /**
   * Get the current authentication token
   */
  getToken(): string | null {
    // Prefer in-memory token
    if (this.tokenInMemory) {
      // Check if token is expired
      if (this.isTokenExpiredSync(this.tokenInMemory)) {
        this.clearToken();
        return null;
      }
      return this.tokenInMemory;
    }
    
    // Fallback to sessionStorage
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem(this.TOKEN_KEY);
      if (token) {
        // Validate token before using
        if (this.isTokenExpiredSync(token)) {
          this.clearToken();
          return null;
        }
        this.tokenInMemory = token;
        return token;
      }
      
      // Check localStorage for migration (one-time)
      const oldToken = localStorage.getItem(this.TOKEN_KEY);
      if (oldToken && !this.isTokenExpiredSync(oldToken)) {
        // Migrate from localStorage to sessionStorage
        this.setToken(oldToken);
        localStorage.removeItem(this.TOKEN_KEY);
        return oldToken;
      }
    }
    
    return null;
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    if (this.refreshTokenInMemory) return this.refreshTokenInMemory;
    
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
      if (token) {
        this.refreshTokenInMemory = token;
        return token;
      }
    }
    
    return null;
  }

  /**
   * Clear all authentication data
   */
  clearToken(): void {
    this.tokenInMemory = null;
    this.refreshTokenInMemory = null;
    
    if (typeof window !== 'undefined') {
      // Clear from all storage locations
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_KEY); // Clear old localStorage tokens
      localStorage.removeItem('sequb_token'); // Clear legacy key
    }
  }

  /**
   * Check if a JWT token is expired (synchronous version with default buffer)
   * For immediate checks without backend configuration
   */
  isTokenExpiredSync(token: string): boolean {
    const payload = safeParseJWT(token);
    if (!payload) {
      logger.warn('Invalid token format');
      return true; // Consider invalid tokens as expired
    }
    
    // Check expiration with default 1 minute buffer
    if (payload.exp) {
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const bufferTime = 60 * 1000; // 1 minute default buffer
      
      return currentTime >= (expirationTime - bufferTime);
    }
    
    return true; // No expiration claim means expired
  }

  /**
   * Check if a JWT token is expired
   * Uses backend-driven configuration for buffer time
   */
  async isTokenExpired(token: string): Promise<boolean> {
    const payload = safeParseJWT(token);
    if (!payload) {
      logger.warn('Invalid token format');
      return true; // Consider invalid tokens as expired
    }
    
    // Check expiration
    if (payload.exp) {
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      
      // Get buffer time from backend configuration
      let bufferTime = 60 * 1000; // 1 minute default
      try {
        const { backendRateLimiter } = await import('./backend-rate-limiter');
        bufferTime = await backendRateLimiter.getTokenRefreshTime();
      } catch (error) {
        logger.warn('Failed to get token refresh time from backend, using default', error);
      }
      
      return currentTime >= (expirationTime - bufferTime);
    }
    
    // If no exp claim, consider token valid (but this shouldn't happen)
    return false;
  }

  /**
   * Get token payload
   */
  getTokenPayload(token?: string): any | null {
    const activeToken = token || this.getToken();
    if (!activeToken) return null;
    
    return safeParseJWT(activeToken);
  }

  /**
   * Get user region from token or storage
   */
  getUserRegion(): string | null {
    // Try to get from token payload first
    const payload = this.getTokenPayload();
    if (payload?.region) {
      return payload.region;
    }
    
    // Fallback to stored region
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(this.USER_REGION_KEY) || 
             localStorage.getItem(this.USER_REGION_KEY);
    }
    
    return null;
  }

  /**
   * Set user region
   */
  setUserRegion(region: string): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.USER_REGION_KEY, region);
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpiredSync(token);
  }

  /**
   * Get time until token expiration in seconds
   */
  getTokenExpirationTime(): number | null {
    const token = this.getToken();
    if (!token) return null;
    
    const payload = this.getTokenPayload(token);
    if (!payload?.exp) return null;
    
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const remainingTime = Math.floor((expirationTime - currentTime) / 1000);
    
    return remainingTime > 0 ? remainingTime : 0;
  }
}

// Create singleton instance
export const authService = new AuthService();

// Export type for use in components
export type AuthServiceType = typeof authService;