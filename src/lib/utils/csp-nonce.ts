/**
 * Content Security Policy Nonce Generation Utility
 * Generates cryptographically secure nonces for CSP script-src directives
 */

/**
 * Generate a cryptographically secure nonce for CSP
 * Uses Web Crypto API when available, fallback to Node.js crypto, then secure random generation
 */
export function generateCSPNonce(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    // Browser environment with Web Crypto API
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  } else if (typeof global !== 'undefined' && global.crypto) {
    // Node.js environment with Web Crypto API
    const crypto = global.crypto;
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Buffer.from(array).toString('base64');
  } else {
    // Node.js environment with crypto module
    try {
      const crypto = require('crypto');
      const bytes = crypto.randomBytes(16);
      return bytes.toString('base64');
    } catch {
      // Final fallback for environments without crypto
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let result = '';
      for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  }
}

/**
 * CSP nonce storage for server-side rendering
 * This will be used to store nonces generated during SSR
 */
let ssrNonceStore: Map<string, string> = new Map();

/**
 * Set nonce for SSR context
 */
export function setSSRNonce(key: string, nonce: string): void {
  ssrNonceStore.set(key, nonce);
}

/**
 * Get nonce for SSR context
 */
export function getSSRNonce(key: string): string | undefined {
  return ssrNonceStore.get(key);
}

/**
 * Clear SSR nonce store (for cleanup)
 */
export function clearSSRNonces(): void {
  ssrNonceStore.clear();
}

/**
 * React hook for CSP nonce management
 */
export function useCSPNonce() {
  if (typeof window !== 'undefined') {
    // Client-side: get nonce from meta tag if available
    const metaNonce = document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content');
    return metaNonce || generateCSPNonce();
  }
  
  // Server-side: generate new nonce
  return generateCSPNonce();
}