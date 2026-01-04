/**
 * Secure Storage Service
 * Provides encrypted storage for sensitive data using Web Crypto API
 */

export class SecureStorage {
  private static encryptionKey: CryptoKey | null = null

  /**
   * Initialize encryption key
   */
  private static async getKey(): Promise<CryptoKey> {
    if (this.encryptionKey) {
      return this.encryptionKey
    }

    // In production, derive from user password or hardware key
    // For now, generate a session-based key
    const keyMaterial = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    )

    this.encryptionKey = keyMaterial
    return keyMaterial
  }

  /**
   * Encrypt and store data
   */
  static async setItem(key: string, value: string): Promise<void> {
    try {
      const encryptedData = await this.encrypt(value)
      
      // Use sessionStorage for sensitive data (cleared on tab close)
      // For less sensitive data that needs persistence, use IndexedDB with encryption
      sessionStorage.setItem(this.formatKey(key), encryptedData)
    } catch (error) {
      console.error('Failed to store encrypted data:', error)
      throw new Error('Storage operation failed')
    }
  }

  /**
   * Retrieve and decrypt data
   */
  static async getItem(key: string): Promise<string | null> {
    try {
      const encryptedData = sessionStorage.getItem(this.formatKey(key))
      
      if (!encryptedData) {
        return null
      }

      return await this.decrypt(encryptedData)
    } catch (error) {
      console.error('Failed to retrieve encrypted data:', error)
      // If decryption fails, remove corrupted data
      this.remove(key)
      return null
    }
  }

  /**
   * Remove item from storage
   */
  static remove(key: string): void {
    sessionStorage.removeItem(this.formatKey(key))
  }

  /**
   * Clear all secure storage
   */
  static clear(): void {
    // Clear only our prefixed keys
    const keysToRemove: string[] = []
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key?.startsWith('sequb_secure_')) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach(key => sessionStorage.removeItem(key))
  }

  /**
   * Encrypt data using AES-GCM
   */
  private static async encrypt(plaintext: string): Promise<string> {
    const key = await this.getKey()
    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)

    // Generate random IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Encrypt the data
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    )

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(encrypted), iv.length)

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined))
  }

  /**
   * Decrypt data using AES-GCM
   */
  private static async decrypt(encryptedData: string): Promise<string> {
    const key = await this.getKey()
    
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12)
    const encrypted = combined.slice(12)

    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encrypted
    )

    // Convert back to string
    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  }

  /**
   * Format storage key with prefix
   */
  private static formatKey(key: string): string {
    return `sequb_secure_${key}`
  }
}

/**
 * IndexedDB Secure Storage for persistent encrypted data
 */
export class PersistentSecureStorage {
  private static readonly DB_NAME = 'SequbSecureDB'
  private static readonly STORE_NAME = 'secureData'
  private static db: IDBDatabase | null = null

  /**
   * Initialize IndexedDB
   */
  private static async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1)

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'id' })
        }
      }
    })
  }

  /**
   * Store encrypted data persistently
   */
  static async setItem(key: string, value: any, expiry?: number): Promise<void> {
    const db = await this.initDB()
    const encryptedValue = await this.encryptData(value)
    
    const transaction = db.transaction([this.STORE_NAME], 'readwrite')
    const store = transaction.objectStore(this.STORE_NAME)
    
    const data = {
      id: key,
      value: encryptedValue,
      timestamp: Date.now(),
      expiry: expiry || null
    }

    return new Promise((resolve, reject) => {
      const request = store.put(data)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to store data'))
    })
  }

  /**
   * Retrieve encrypted data from persistent storage
   */
  static async getItem(key: string): Promise<any | null> {
    const db = await this.initDB()
    const transaction = db.transaction([this.STORE_NAME], 'readonly')
    const store = transaction.objectStore(this.STORE_NAME)

    return new Promise(async (resolve, reject) => {
      const request = store.get(key)
      
      request.onsuccess = async () => {
        const data = request.result
        
        if (!data) {
          resolve(null)
          return
        }

        // Check expiry
        if (data.expiry && Date.now() > data.expiry) {
          await this.removeItem(key)
          resolve(null)
          return
        }

        try {
          const decrypted = await this.decryptData(data.value)
          resolve(decrypted)
        } catch (error) {
          console.error('Decryption failed:', error)
          resolve(null)
        }
      }
      
      request.onerror = () => reject(new Error('Failed to retrieve data'))
    })
  }

  /**
   * Remove item from persistent storage
   */
  static async removeItem(key: string): Promise<void> {
    const db = await this.initDB()
    const transaction = db.transaction([this.STORE_NAME], 'readwrite')
    const store = transaction.objectStore(this.STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.delete(key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to remove data'))
    })
  }

  /**
   * Clear all persistent storage
   */
  static async clear(): Promise<void> {
    const db = await this.initDB()
    const transaction = db.transaction([this.STORE_NAME], 'readwrite')
    const store = transaction.objectStore(this.STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to clear data'))
    })
  }

  /**
   * Encrypt data for persistent storage
   */
  private static async encryptData(data: any): Promise<string> {
    const jsonString = JSON.stringify(data)
    // Reuse SecureStorage encryption logic
    const encoder = new TextEncoder()
    const encodedData = encoder.encode(jsonString)
    
    const key = await this.getDerivedKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    )
    
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(encrypted), iv.length)
    
    return btoa(String.fromCharCode(...combined))
  }

  /**
   * Decrypt data from persistent storage
   */
  private static async decryptData(encryptedData: string): Promise<any> {
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const encrypted = combined.slice(12)
    
    const key = await this.getDerivedKey()
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    )
    
    const decoder = new TextDecoder()
    const jsonString = decoder.decode(decrypted)
    return JSON.parse(jsonString)
  }

  /**
   * Derive encryption key from master key
   */
  private static async getDerivedKey(): Promise<CryptoKey> {
    // In production, derive from user password
    const masterKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
    
    return masterKey
  }
}