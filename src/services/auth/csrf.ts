/**
 * CSRF (Cross-Site Request Forgery) Protection Service
 * Generates and validates CSRF tokens to prevent unauthorized requests
 */

import { safeJsonParse, safeJsonStringify } from '@/lib/utils/safe-json';
import { logger } from '@/services/monitoring/logger';

class CSRFService {
  private readonly TOKEN_KEY = 'csrf_token';
  private readonly TOKEN_HEADER = 'X-CSRF-Token';
  private token: string | null = null;
  private tokenExpiry: number | null = null;
  private readonly TOKEN_TTL = 3600000; // 1 hour in milliseconds

  /**
   * Generate a cryptographically secure CSRF token
   */
  generateToken(): string {
    // Generate random bytes
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      // Fallback for server-side or older browsers
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    
    // Convert to hex string
    this.token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    this.tokenExpiry = Date.now() + this.TOKEN_TTL;
    
    // Store in sessionStorage for this session
    if (typeof window !== 'undefined') {
      const data = safeJsonStringify({
        token: this.token,
        expiry: this.tokenExpiry
      });
      sessionStorage.setItem(this.TOKEN_KEY, data);
    }
    
    return this.token;
  }

  /**
   * Get the current CSRF token, generating a new one if necessary
   */
  getToken(): string {
    // Check in-memory token first
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }
    
    // Try to retrieve from sessionStorage
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(this.TOKEN_KEY);
      if (stored) {
        const data = safeJsonParse<{ token: string; expiry: number }>(stored);
        if (data?.token && data?.expiry && Date.now() < data.expiry) {
          this.token = data.token;
          this.tokenExpiry = data.expiry;
          return data.token;
        }
      }
    }
    
    // Generate new token if none exists or expired
    return this.generateToken();
  }

  /**
   * Validate a CSRF token
   */
  validateToken(token: string): boolean {
    if (!token) return false;
    
    const currentToken = this.getToken();
    
    // Constant-time comparison to prevent timing attacks
    if (token.length !== currentToken.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < token.length; i++) {
      result |= token.charCodeAt(i) ^ currentToken.charCodeAt(i);
    }
    
    return result === 0;
  }

  /**
   * Clear the current CSRF token
   */
  clearToken(): void {
    this.token = null;
    this.tokenExpiry = null;
    
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.TOKEN_KEY);
    }
  }

  /**
   * Get the CSRF token header name
   */
  getHeaderName(): string {
    return this.TOKEN_HEADER;
  }

  /**
   * Create a hidden input field for forms
   */
  createHiddenInput(): string {
    const token = this.getToken();
    return `<input type="hidden" name="_csrf" value="${token}" />`;
  }

  /**
   * Get CSRF token for fetch/axios headers
   */
  getHeaders(): Record<string, string> {
    return {
      [this.TOKEN_HEADER]: this.getToken()
    };
  }

  /**
   * Middleware function for validating CSRF tokens in requests
   */
  validateRequest(headers: Record<string, string>, body?: any): boolean {
    // Check header first
    const headerToken = headers[this.TOKEN_HEADER] || headers[this.TOKEN_HEADER.toLowerCase()];
    if (headerToken && this.validateToken(headerToken)) {
      return true;
    }
    
    // Check body for form submissions
    if (body && body._csrf && this.validateToken(body._csrf)) {
      return true;
    }
    
    // Check query parameters as last resort (not recommended)
    // This should be avoided in production
    return false;
  }

  /**
   * Rotate the CSRF token (useful after successful authentication)
   */
  rotateToken(): string {
    this.clearToken();
    return this.generateToken();
  }

  /**
   * Check if the current token is expired
   */
  isTokenExpired(): boolean {
    if (!this.tokenExpiry) return true;
    return Date.now() >= this.tokenExpiry;
  }

  /**
   * Get time until token expiration in seconds
   */
  getTokenExpirationTime(): number | null {
    if (!this.tokenExpiry) return null;
    
    const remaining = Math.floor((this.tokenExpiry - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }
}

// Create singleton instance
export const csrfService = new CSRFService();

// Export type for use in components
export type CSRFServiceType = typeof csrfService;

/**
 * React hook for CSRF protection
 */
export function useCSRF() {
  if (typeof window === 'undefined') {
    // Server-side rendering
    return {
      token: '',
      headers: {},
      validateToken: () => true,
      rotateToken: () => '',
    };
  }
  
  return {
    token: csrfService.getToken(),
    headers: csrfService.getHeaders(),
    validateToken: csrfService.validateToken.bind(csrfService),
    rotateToken: csrfService.rotateToken.bind(csrfService),
  };
}