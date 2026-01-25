/**
 * Secure Storage Utility
 * Provides AES-GCM encryption and secure handling for sensitive data persistence
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
  iv?: string; // Initialization Vector for AES-GCM
}

interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
}

class SecureStorage {
  private readonly PREFIX = 'sequb_';
  private readonly ALGORITHM = 'AES-GCM';
  private readonly KEY_LENGTH = 256;
  private readonly IV_LENGTH = 12; // 96 bits for AES-GCM
  private readonly SALT_LENGTH = 16;
  private readonly PBKDF2_ITERATIONS = 100000;

  /**
   * Check if Web Crypto API is available
   */
  private isWebCryptoAvailable(): boolean {
    return typeof window !== 'undefined' && 
           'crypto' in window && 
           'subtle' in window.crypto;
  }

  /**
   * Generate a cryptographically secure key from password using PBKDF2
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    if (!this.isWebCryptoAvailable()) {
      throw new Error('Web Crypto API not available');
    }

    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import the password as a key for PBKDF2
    const passwordKey = await window.crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive the actual encryption key
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      passwordKey,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate a secure encryption password based on browser characteristics
   */
  private getEncryptionPassword(): string {
    if (typeof window === 'undefined') return 'fallback-key-server';
    
    // Create a more robust fingerprint from stable browser characteristics
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
      window.location.hostname,
      navigator.hardwareConcurrency || 4,
      navigator.maxTouchPoints || 0
    ].join('|');
    
    // Use a more secure hash (simulate with multiple rounds)
    let hash = 0;
    for (let round = 0; round < 3; round++) {
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char + round * 1337;
        hash = hash & hash; // Convert to 32-bit integer
      }
    }
    
    return `sequb_v1_${Math.abs(hash).toString(36)}_${fingerprint.length}`;
  }

  /**
   * Encrypt data using AES-GCM
   */
  private async webCryptoEncrypt(text: string): Promise<EncryptedData> {
    if (!this.isWebCryptoAvailable()) {
      throw new Error('Web Crypto API not available');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    // Generate random salt and IV
    const salt = window.crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
    const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

    // Derive key from password and salt
    const password = this.getEncryptionPassword();
    const key = await this.deriveKey(password, salt);

    // Encrypt the data
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv
      },
      key,
      data
    );

    // Convert to base64 for storage
    const ciphertext = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    const ivB64 = btoa(String.fromCharCode(...iv));
    const saltB64 = btoa(String.fromCharCode(...salt));

    return {
      ciphertext,
      iv: ivB64,
      salt: saltB64
    };
  }

  /**
   * Decrypt data using AES-GCM
   */
  private async webCryptoDecrypt(encryptedData: EncryptedData): Promise<string> {
    if (!this.isWebCryptoAvailable()) {
      throw new Error('Web Crypto API not available');
    }

    try {
      // Convert from base64
      const ciphertext = Uint8Array.from(atob(encryptedData.ciphertext), c => c.charCodeAt(0));
      const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
      const salt = Uint8Array.from(atob(encryptedData.salt), c => c.charCodeAt(0));

      // Derive key from password and salt
      const password = this.getEncryptionPassword();
      const key = await this.deriveKey(password, salt);

      // Decrypt the data
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        ciphertext
      );

      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      logger.error('Failed to decrypt data:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Legacy XOR encryption for backward compatibility
   * Note: This is NOT cryptographically secure, just prevents casual inspection
   */
  private legacyEncrypt(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(result);
  }

  /**
   * Legacy XOR decryption for backward compatibility
   */
  private legacyDecrypt(encoded: string, key: string): string {
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
  async setItem(key: string, value: any, options: StorageOptions = {}): Promise<boolean> {
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
        try {
          // Try Web Crypto API first
          if (this.isWebCryptoAvailable()) {
            const encryptedData = await this.webCryptoEncrypt(serialized);
            serialized = safeJsonStringify({
              ...encryptedData,
              version: 'v2' // Mark as new encryption format
            });
            logger.debug('Data encrypted using Web Crypto API');
          } else {
            // Fallback to legacy encryption
            const legacyKey = this.getEncryptionPassword();
            serialized = this.legacyEncrypt(serialized, legacyKey);
            logger.warn('Using legacy encryption - Web Crypto API not available');
          }
        } catch (error) {
          logger.error('Encryption failed, storing unencrypted:', error);
          // Continue with unencrypted storage
        }
      }

      storage.setItem(this.getKey(key), serialized);
      return true;
    } catch (error) {
      logger.error('Failed to set storage item:', { key, error });
      return false;
    }
  }

  /**
   * Set item in secure storage (synchronous wrapper for backward compatibility)
   */
  setItemSync(key: string, value: any, options: StorageOptions = {}): boolean {
    if (options.encrypt) {
      logger.warn('Synchronous setItem with encryption may use legacy encryption');
      // For synchronous calls with encryption, use legacy method
      const { ttl, persistent = false } = options;
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
          encrypted: true,
        };

        let serialized = safeJsonStringify(storedData);
        const legacyKey = this.getEncryptionPassword();
        serialized = this.legacyEncrypt(serialized, legacyKey);

        storage.setItem(this.getKey(key), serialized);
        return true;
      } catch (error) {
        logger.error('Failed to set storage item:', { key, error });
        return false;
      }
    } else {
      // Non-encrypted data can still be set synchronously
      return this.setItem(key, value, options) as any;
    }
  }

  /**
   * Get item from secure storage
   */
  async getItem<T = any>(key: string, defaultValue: T | null = null): Promise<T | null> {
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

      // Check if this is new format encrypted data
      let decryptedData: string | null = null;
      
      try {
        const maybeEncrypted = safeJsonParse(serialized);
        if (maybeEncrypted && typeof maybeEncrypted === 'object' && maybeEncrypted.version === 'v2') {
          // New Web Crypto format
          if (this.isWebCryptoAvailable()) {
            decryptedData = await this.webCryptoDecrypt(maybeEncrypted as EncryptedData);
            logger.debug('Data decrypted using Web Crypto API');
          } else {
            logger.error('Cannot decrypt v2 data without Web Crypto API');
            return defaultValue;
          }
        } else {
          // Check if it's legacy encrypted data (base64)
          if (/^[A-Za-z0-9+/]*={0,2}$/.test(serialized) && serialized.length % 4 === 0) {
            try {
              const legacyKey = this.getEncryptionPassword();
              decryptedData = this.legacyDecrypt(serialized, legacyKey);
              if (decryptedData) {
                logger.debug('Data decrypted using legacy method');
              }
            } catch {
              // Not encrypted or decryption failed
              decryptedData = null;
            }
          }
        }
      } catch {
        // Not encrypted JSON, continue
      }

      // Use decrypted data if available, otherwise use original
      const dataToProcess = decryptedData || serialized;
      const storedData = safeJsonParse<StoredData>(dataToProcess);
      
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
   * Get item from secure storage (synchronous version for backward compatibility)
   */
  getItemSync<T = any>(key: string, defaultValue: T | null = null): T | null {
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

      // For sync access, only handle legacy encryption
      try {
        const maybeEncrypted = safeJsonParse(serialized);
        if (maybeEncrypted && typeof maybeEncrypted === 'object' && maybeEncrypted.version === 'v2') {
          logger.warn('Cannot synchronously decrypt v2 encrypted data, use async getItem()');
          return defaultValue;
        }
      } catch {
        // Continue with legacy handling
      }

      // Try legacy decryption if it looks encrypted (base64)
      if (/^[A-Za-z0-9+/]*={0,2}$/.test(serialized) && serialized.length % 4 === 0) {
        try {
          const legacyKey = this.getEncryptionPassword();
          const decrypted = this.legacyDecrypt(serialized, legacyKey);
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
  
  // Store encrypted with 24 hour TTL (async for Web Crypto API)
  setSecure: async (key: string, value: any) => 
    await secureStorage.setItem(key, value, { encrypt: true, ttl: 24 * 60 * 60 * 1000 }),
  
  // Store in localStorage (persistent)
  setPersistent: (key: string, value: any) => 
    secureStorage.setItem(key, value, { persistent: true }),
  
  // Store encrypted and persistent (async for Web Crypto API)
  setSecurePersistent: async (key: string, value: any) => 
    await secureStorage.setItem(key, value, { encrypt: true, persistent: true }),

  // Get encrypted data (async for Web Crypto API)
  getSecure: async <T = any>(key: string, defaultValue: T | null = null) =>
    await secureStorage.getItem<T>(key, defaultValue),

  // Synchronous helpers (backward compatibility, may use legacy encryption)
  sync: {
    setSecure: (key: string, value: any) => 
      secureStorage.setItemSync(key, value, { encrypt: true, ttl: 24 * 60 * 60 * 1000 }),
    
    setSecurePersistent: (key: string, value: any) => 
      secureStorage.setItemSync(key, value, { encrypt: true, persistent: true }),
    
    getSecure: <T = any>(key: string, defaultValue: T | null = null) =>
      secureStorage.getItemSync<T>(key, defaultValue),
  }
};