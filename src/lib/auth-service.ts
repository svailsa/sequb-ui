/**
 * Secure Authentication Service
 * Manages authentication tokens with improved security
 */

import { safeParseJWT } from './safe-json';
import { logger } from './logger';

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
      if (this.isTokenExpired(this.tokenInMemory)) {
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
        if (this.isTokenExpired(token)) {
          this.clearToken();
          return null;
        }
        this.tokenInMemory = token;
        return token;
      }
      
      // Check localStorage for migration (one-time)
      const oldToken = localStorage.getItem(this.TOKEN_KEY);
      if (oldToken && !this.isTokenExpired(oldToken)) {
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
   * Check if a JWT token is expired
   */
  isTokenExpired(token: string): boolean {
    const payload = safeParseJWT(token);
    if (!payload) {
      logger.warn('Invalid token format');
      return true; // Consider invalid tokens as expired
    }
    
    // Check expiration
    if (payload.exp) {
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const bufferTime = 60 * 1000; // 1 minute buffer before expiration
      
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
    return !!token && !this.isTokenExpired(token);
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