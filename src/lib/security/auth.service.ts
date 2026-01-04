/**
 * Secure Authentication Service
 * Implements JWT-based authentication with secure token storage
 */

import { jwtDecode } from 'jwt-decode'
import { SecureStorage } from './secure-storage'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface JWTPayload {
  sub: string
  email: string
  roles: string[]
  exp: number
  iat: number
}

export class AuthService {
  private static readonly TOKEN_KEY = 'sequb_auth'
  private static readonly REFRESH_THRESHOLD = 5 * 60 * 1000 // 5 minutes
  private static refreshPromise: Promise<boolean> | null = null

  /**
   * Login with credentials
   */
  static async login(email: string, password: string): Promise<AuthTokens> {
    // Validate inputs
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email format')
    }

    if (!this.validatePassword(password)) {
      throw new Error('Password does not meet security requirements')
    }

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // For CSRF cookie
      })

      if (!response.ok) {
        throw new Error('Authentication failed')
      }

      const tokens: AuthTokens = await response.json()
      
      // Validate tokens before storing
      this.validateTokens(tokens)
      
      // Store securely
      await this.storeTokens(tokens)
      
      return tokens
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  /**
   * Logout and clear all auth data
   */
  static async logout(): Promise<void> {
    try {
      const tokens = await this.getTokens()
      if (tokens) {
        // Notify server to invalidate refresh token
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken: tokens.refreshToken })
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always clear local auth data
      await SecureStorage.remove(this.TOKEN_KEY)
      // Clear any session data
      sessionStorage.clear()
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const tokens = await this.getTokens()
    if (!tokens) return false

    // Check if token is expired
    if (Date.now() >= tokens.expiresAt) {
      // Try to refresh
      const refreshed = await this.refreshToken()
      return refreshed
    }

    return true
  }

  /**
   * Get current access token
   */
  static async getAccessToken(): Promise<string | null> {
    const tokens = await this.getTokens()
    if (!tokens) return null

    // Check if we need to refresh
    if (this.shouldRefresh(tokens)) {
      await this.refreshToken()
      const newTokens = await this.getTokens()
      return newTokens?.accessToken || null
    }

    return tokens.accessToken
  }

  /**
   * Get user information from token
   */
  static async getCurrentUser(): Promise<JWTPayload | null> {
    const token = await this.getAccessToken()
    if (!token) return null

    try {
      return jwtDecode<JWTPayload>(token)
    } catch {
      return null
    }
  }

  /**
   * Check if user has specific role
   */
  static async hasRole(role: string): Promise<boolean> {
    const user = await this.getCurrentUser()
    return user?.roles.includes(role) || false
  }

  /**
   * Refresh access token
   */
  static async refreshToken(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this.doRefresh()
    
    try {
      const result = await this.refreshPromise
      return result
    } finally {
      this.refreshPromise = null
    }
  }

  private static async doRefresh(): Promise<boolean> {
    const tokens = await this.getTokens()
    if (!tokens?.refreshToken) return false

    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        credentials: 'include'
      })

      if (!response.ok) {
        await this.logout()
        return false
      }

      const newTokens: AuthTokens = await response.json()
      this.validateTokens(newTokens)
      await this.storeTokens(newTokens)
      
      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      await this.logout()
      return false
    }
  }

  /**
   * Store tokens securely
   */
  private static async storeTokens(tokens: AuthTokens): Promise<void> {
    await SecureStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokens))
  }

  /**
   * Retrieve tokens from secure storage
   */
  private static async getTokens(): Promise<AuthTokens | null> {
    const stored = await SecureStorage.getItem(this.TOKEN_KEY)
    if (!stored) return null

    try {
      const tokens: AuthTokens = JSON.parse(stored)
      return tokens
    } catch {
      return null
    }
  }

  /**
   * Check if tokens need refreshing
   */
  private static shouldRefresh(tokens: AuthTokens): boolean {
    const timeUntilExpiry = tokens.expiresAt - Date.now()
    return timeUntilExpiry < this.REFRESH_THRESHOLD && timeUntilExpiry > 0
  }

  /**
   * Validate token structure
   */
  private static validateTokens(tokens: AuthTokens): void {
    if (!tokens.accessToken || typeof tokens.accessToken !== 'string') {
      throw new Error('Invalid access token')
    }

    if (!tokens.refreshToken || typeof tokens.refreshToken !== 'string') {
      throw new Error('Invalid refresh token')
    }

    if (!tokens.expiresAt || typeof tokens.expiresAt !== 'number') {
      throw new Error('Invalid expiration time')
    }

    // Decode and validate JWT structure
    try {
      const decoded = jwtDecode<JWTPayload>(tokens.accessToken)
      if (!decoded.sub || !decoded.exp) {
        throw new Error('Invalid JWT payload')
      }
    } catch {
      throw new Error('Invalid JWT token')
    }
  }

  /**
   * Validate email format
   */
  private static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate password strength
   */
  private static validatePassword(password: string): boolean {
    // Minimum 8 characters, at least one uppercase, one lowercase, one number, one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return passwordRegex.test(password)
  }
}

// Auto-refresh token before requests
export function setupAuthInterceptor(axiosInstance: any): void {
  axiosInstance.interceptors.request.use(
    async (config: any) => {
      const token = await AuthService.getAccessToken()
      
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
      
      // Add CSRF token for state-changing operations
      if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())) {
        const csrfToken = getCSRFToken()
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken
        }
      }
      
      return config
    },
    (error: any) => Promise.reject(error)
  )

  // Handle 401 responses
  axiosInstance.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
      if (error.response?.status === 401) {
        // Token expired, try to refresh
        const refreshed = await AuthService.refreshToken()
        
        if (refreshed) {
          // Retry original request
          const token = await AuthService.getAccessToken()
          error.config.headers['Authorization'] = `Bearer ${token}`
          return axiosInstance(error.config)
        } else {
          // Refresh failed, redirect to login
          await AuthService.logout()
          window.location.href = '/login'
        }
      }
      
      return Promise.reject(error)
    }
  )
}

function getCSRFToken(): string | null {
  // Get CSRF token from cookie or meta tag
  const metaTag = document.querySelector('meta[name="csrf-token"]')
  return metaTag?.getAttribute('content') || null
}