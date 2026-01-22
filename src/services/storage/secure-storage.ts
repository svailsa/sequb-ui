/**
 * Secure Storage Utility
 * Provides encryption and secure handling for sensitive data persistence
 */

import { logger } from '@/services/monitoring/logger';
import { safeJsonParse, safeJsonStringify } from '@/lib/utils/safe-json';

interface StorageOptions {
  encrypt?: boolean;
  ttl?: number; // Time to live in milliseconds
  persistent?: boolean; // Use localStorage vs sessionStorage
}

interface StoredData {
  data: any;
  timestamp: number;
  ttl?: number;
  encrypted?: boolean;
}

class SecureStorage {
  private readonly PREFIX = 'sequb_';

  /**
   * Simple XOR encryption for basic obfuscation
   * Note: This is NOT cryptographically secure, just prevents casual inspection
   */
  private simpleEncrypt(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(result);
  }

  /**
   * Simple XOR decryption
   */
  private simpleDecrypt(encoded: string, key: string): string {
    try {
      const text = atob(encoded);
      let result = '';
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(
          text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return result;
    } catch {
      return '';
    }
  }

  /**
   * Get encryption key based on browser fingerprint
   */
  private getEncryptionKey(): string {
    if (typeof window === 'undefined') return 'fallback-key';
    
    // Create a simple fingerprint from browser characteristics
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
      window.location.hostname
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Get the appropriate storage mechanism
   */
  private getStorage(persistent: boolean): Storage | null {
    if (typeof window === 'undefined') return null;
    return persistent ? localStorage : sessionStorage;
  }

  /**
   * Generate storage key with prefix
   */
  private getKey(key: string): string {
    return `${this.PREFIX}${key}`;
  }

  /**
   * Set item in secure storage
   */
  setItem(key: string, value: any, options: StorageOptions = {}): boolean {
    const { encrypt = false, ttl, persistent = false } = options;
    const storage = this.getStorage(persistent);
    
    if (!storage) {
      logger.warn('Storage not available');
      return false;
    }

    try {
      const storedData: StoredData = {
        data: value,
        timestamp: Date.now(),
        ttl,
        encrypted: encrypt,
      };

      let serialized = safeJsonStringify(storedData);
      
      if (encrypt) {
        const encryptionKey = this.getEncryptionKey();
        serialized = this.simpleEncrypt(serialized, encryptionKey);
      }

      storage.setItem(this.getKey(key), serialized);
      return true;
    } catch (error) {
      logger.error('Failed to set storage item:', { key, error });
      return false;
    }
  }

  /**
   * Get item from secure storage
   */
  getItem<T = any>(key: string, defaultValue: T | null = null): T | null {
    const storage = this.getStorage(false) || this.getStorage(true);
    
    if (!storage) {
      logger.warn('Storage not available');
      return defaultValue;
    }

    try {
      // Try both sessionStorage and localStorage
      let serialized = sessionStorage?.getItem(this.getKey(key)) || 
                      localStorage?.getItem(this.getKey(key));
                      
      if (!serialized) {
        return defaultValue;
      }

      // Try to decrypt if it looks encrypted (base64)
      if (/^[A-Za-z0-9+/]*={0,2}$/.test(serialized) && serialized.length % 4 === 0) {
        try {
          const encryptionKey = this.getEncryptionKey();
          const decrypted = this.simpleDecrypt(serialized, encryptionKey);
          if (decrypted) {
            serialized = decrypted;
          }
        } catch {
          // Not encrypted or decryption failed, use as-is
        }
      }

      const storedData = safeJsonParse<StoredData>(serialized);
      
      if (!storedData || typeof storedData !== 'object') {
        logger.warn('Invalid stored data format');
        return defaultValue;
      }

      // Check TTL
      if (storedData.ttl && storedData.timestamp) {
        const age = Date.now() - storedData.timestamp;
        if (age > storedData.ttl) {
          logger.debug('Stored data expired, removing');
          this.removeItem(key);
          return defaultValue;
        }
      }

      return storedData.data as T;
    } catch (error) {
      logger.error('Failed to get storage item:', { key, error });
      return defaultValue;
    }
  }

  /**
   * Remove item from storage
   */
  removeItem(key: string): boolean {
    try {
      const storageKey = this.getKey(key);
      sessionStorage?.removeItem(storageKey);
      localStorage?.removeItem(storageKey);
      return true;
    } catch (error) {
      logger.error('Failed to remove storage item:', { key, error });
      return false;
    }
  }

  /**
   * Clear all items with our prefix
   */
  clear(): boolean {
    try {
      const storages = [sessionStorage, localStorage].filter(Boolean);
      
      for (const storage of storages) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key?.startsWith(this.PREFIX)) {
            keysToRemove.push(key);
          }
        }
        
        for (const key of keysToRemove) {
          storage.removeItem(key);
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to clear storage:', error);
      return false;
    }
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      sessionStorage?.setItem(test, test);
      sessionStorage?.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all keys with our prefix
   */
  keys(): string[] {
    const keys: string[] = [];
    const storages = [sessionStorage, localStorage].filter(Boolean);
    
    try {
      for (const storage of storages) {
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key?.startsWith(this.PREFIX)) {
            keys.push(key.substring(this.PREFIX.length));
          }
        }
      }
    } catch (error) {
      logger.error('Failed to get storage keys:', error);
    }
    
    return [...new Set(keys)]; // Remove duplicates
  }

  /**
   * Clean up expired items
   */
  cleanup(): void {
    const keys = this.keys();
    for (const key of keys) {
      // This will automatically remove expired items
      this.getItem(key);
    }
  }
}

// Create singleton instance
export const secureStorage = new SecureStorage();

// Convenience methods for common patterns
export const SecureStorageHelpers = {
  // Store with 1 hour TTL
  setTemporary: (key: string, value: any) => 
    secureStorage.setItem(key, value, { ttl: 60 * 60 * 1000 }),
  
  // Store encrypted with 24 hour TTL
  setSecure: (key: string, value: any) => 
    secureStorage.setItem(key, value, { encrypt: true, ttl: 24 * 60 * 60 * 1000 }),
  
  // Store in localStorage (persistent)
  setPersistent: (key: string, value: any) => 
    secureStorage.setItem(key, value, { persistent: true }),
  
  // Store encrypted and persistent
  setSecurePersistent: (key: string, value: any) => 
    secureStorage.setItem(key, value, { encrypt: true, persistent: true }),
};