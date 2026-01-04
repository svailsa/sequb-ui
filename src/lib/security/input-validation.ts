/**
 * Input Validation and Sanitization Service
 * Provides comprehensive input validation to prevent injection attacks
 */

import DOMPurify from 'dompurify'
import { z } from 'zod'

/**
 * Common validation schemas
 */
export const ValidationSchemas = {
  // User input schemas
  email: z.string().email().max(255),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number and special character'),
  
  username: z.string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens'),
  
  // Node and workflow schemas
  nodeId: z.string()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid node ID format')
    .max(100),
  
  nodeName: z.string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9\s_-]+$/, 'Node name contains invalid characters'),
  
  nodeType: z.string()
    .regex(/^[a-zA-Z0-9_]+$/, 'Invalid node type')
    .max(50),
  
  workflowName: z.string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9\s_-]+$/, 'Workflow name contains invalid characters'),
  
  // File upload schemas
  fileName: z.string()
    .max(255)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Filename contains invalid characters'),
  
  fileSize: z.number()
    .max(10 * 1024 * 1024, 'File size exceeds 10MB limit'),
  
  mimeType: z.enum([
    'application/wasm',
    'application/javascript',
    'application/zip',
    'application/json',
    'text/plain'
  ]),
  
  // API input schemas
  port: z.number()
    .min(1024)
    .max(65535),
  
  url: z.string()
    .url()
    .max(2048),
  
  apiKey: z.string()
    .regex(/^[a-zA-Z0-9_-]+$/)
    .min(20)
    .max(100),
  
  // Code and script schemas
  code: z.string()
    .max(100000), // 100KB max for code inputs
  
  jsonData: z.string().transform((str, ctx) => {
    try {
      return JSON.parse(str)
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid JSON format'
      })
      return z.NEVER
    }
  })
}

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHTML(dirty: string, options?: any): string {
    const defaultConfig = {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
      USE_PROFILES: { html: true }
    }
    
    return DOMPurify.sanitize(dirty, options || defaultConfig) as unknown as string
  }

  /**
   * Sanitize plain text (remove all HTML)
   */
  static sanitizePlainText(dirty: string): string {
    return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] }) as unknown as string
  }

  /**
   * Sanitize SQL-like inputs
   */
  static sanitizeSQL(input: string): string {
    // Remove common SQL injection patterns
    const dangerous = [
      /(\b)(DELETE|DROP|EXEC|EXECUTE|INSERT|SELECT|UNION|UPDATE)(\b)/gi,
      /--/g,
      /\/\*/g,
      /\*\//g,
      /;/g,
      /'/g,
      /"/g,
      /`/g
    ]
    
    let sanitized = input
    dangerous.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '')
    })
    
    return sanitized.trim()
  }

  /**
   * Sanitize command line arguments
   */
  static sanitizeShellArg(input: string): string {
    // Remove shell metacharacters
    const dangerous = /[;&|`$()<>\\'"]/g
    return input.replace(dangerous, '')
  }

  /**
   * Sanitize file paths
   */
  static sanitizePath(path: string): string {
    // Remove path traversal attempts
    const sanitized = path
      .replace(/\.\./g, '')
      .replace(/\/\//g, '/')
      .replace(/\\/g, '/')
      .replace(/^\//, '')
    
    // Only allow alphanumeric, dash, underscore, dot, and forward slash
    return sanitized.replace(/[^a-zA-Z0-9._\-\/]/g, '')
  }

  /**
   * Escape special regex characters
   */
  static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * Sanitize JSON string
   */
  static sanitizeJSON(input: string): string | null {
    try {
      const parsed = JSON.parse(input)
      // Re-stringify to remove any extra properties or formatting
      return JSON.stringify(parsed)
    } catch {
      return null
    }
  }
}

/**
 * Validation utilities
 */
export class InputValidator {
  /**
   * Validate email address
   */
  static isValidEmail(email: string): boolean {
    try {
      ValidationSchemas.email.parse(email)
      return true
    } catch {
      return false
    }
  }

  /**
   * Validate URL
   */
  static isValidURL(url: string): boolean {
    try {
      ValidationSchemas.url.parse(url)
      // Additional check for allowed protocols
      const parsed = new URL(url)
      return ['http:', 'https:'].includes(parsed.protocol)
    } catch {
      return false
    }
  }

  /**
   * Validate file upload
   */
  static async validateFileUpload(file: File): Promise<{ valid: boolean; error?: string }> {
    // Check file size
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'File size exceeds 10MB limit' }
    }

    // Check file extension
    const allowedExtensions = ['.wasm', '.js', '.json', '.zip', '.txt']
    const extension = file.name.substring(file.name.lastIndexOf('.'))
    if (!allowedExtensions.includes(extension)) {
      return { valid: false, error: 'File type not allowed' }
    }

    // Check MIME type
    const allowedMimeTypes = [
      'application/wasm',
      'application/javascript',
      'application/json',
      'application/zip',
      'text/plain'
    ]
    if (!allowedMimeTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid MIME type' }
    }

    // Check file content (magic bytes)
    const bytes = new Uint8Array(await file.slice(0, 4).arrayBuffer())
    
    if (extension === '.wasm') {
      // WASM magic bytes: 0x00 0x61 0x73 0x6D
      if (bytes[0] !== 0x00 || bytes[1] !== 0x61 || bytes[2] !== 0x73 || bytes[3] !== 0x6D) {
        return { valid: false, error: 'Invalid WASM file format' }
      }
    }

    if (extension === '.zip') {
      // ZIP magic bytes: 0x50 0x4B
      if (bytes[0] !== 0x50 || bytes[1] !== 0x4B) {
        return { valid: false, error: 'Invalid ZIP file format' }
      }
    }

    return { valid: true }
  }

  /**
   * Validate node configuration
   */
  static validateNodeConfig(config: any): { valid: boolean; errors?: string[] } {
    const errors: string[] = []

    // Validate node ID
    if (config.id) {
      try {
        ValidationSchemas.nodeId.parse(config.id)
      } catch (e: any) {
        errors.push(`Invalid node ID: ${e.message}`)
      }
    }

    // Validate node type
    if (config.type) {
      try {
        ValidationSchemas.nodeType.parse(config.type)
      } catch (e: any) {
        errors.push(`Invalid node type: ${e.message}`)
      }
    }

    // Validate node name
    if (config.name) {
      try {
        ValidationSchemas.nodeName.parse(config.name)
      } catch (e: any) {
        errors.push(`Invalid node name: ${e.message}`)
      }
    }

    // Validate position
    if (config.position) {
      if (typeof config.position.x !== 'number' || 
          typeof config.position.y !== 'number' ||
          Math.abs(config.position.x) > 10000 ||
          Math.abs(config.position.y) > 10000) {
        errors.push('Invalid node position')
      }
    }

    return errors.length === 0 
      ? { valid: true } 
      : { valid: false, errors }
  }

  /**
   * Rate limiting check
   */
  private static rateLimitMap = new Map<string, number[]>()
  
  static checkRateLimit(
    key: string, 
    maxRequests: number = 60, 
    windowMs: number = 60000
  ): boolean {
    const now = Date.now()
    const requests = this.rateLimitMap.get(key) || []
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => now - time < windowMs)
    
    if (recentRequests.length >= maxRequests) {
      return false
    }
    
    recentRequests.push(now)
    this.rateLimitMap.set(key, recentRequests)
    
    return true
  }
}

/**
 * Content Security Policy validator
 */
export class CSPValidator {
  static validateCSPHeader(policy: string): boolean {
    const requiredDirectives = [
      'default-src',
      'script-src',
      'style-src',
      'img-src',
      'connect-src',
      'frame-src',
      'object-src'
    ]

    const hasAllRequired = requiredDirectives.every(directive => 
      policy.includes(directive)
    )

    // Check for unsafe-inline in script-src (should be avoided)
    const hasUnsafeInline = policy.includes("script-src") && 
                           policy.includes("'unsafe-inline'")

    // Check for unsafe-eval (should be avoided)
    const hasUnsafeEval = policy.includes("'unsafe-eval'")

    return hasAllRequired && !hasUnsafeInline && !hasUnsafeEval
  }
}

/**
 * SQL Injection prevention
 */
export class SQLInjectionPrevention {
  /**
   * Create parameterized query
   */
  static createParameterizedQuery(
    query: string, 
    params: any[]
  ): { query: string; params: any[] } {
    // Validate that query uses placeholders
    const placeholderCount = (query.match(/\?/g) || []).length
    
    if (placeholderCount !== params.length) {
      throw new Error('Parameter count mismatch')
    }

    // Sanitize parameters
    const sanitizedParams = params.map(param => {
      if (typeof param === 'string') {
        return InputSanitizer.sanitizeSQL(param)
      }
      return param
    })

    return { query, params: sanitizedParams }
  }

  /**
   * Validate query structure
   */
  static isValidQuery(query: string): boolean {
    // Check for common injection patterns
    const dangerousPatterns = [
      /;\s*DROP\s+/i,
      /;\s*DELETE\s+/i,
      /;\s*UPDATE\s+/i,
      /;\s*INSERT\s+/i,
      /UNION\s+SELECT/i,
      /OR\s+1\s*=\s*1/i,
      /--$/,
      /\/\*.*\*\//
    ]

    return !dangerousPatterns.some(pattern => pattern.test(query))
  }
}

/**
 * Export convenience functions
 */
export const validate = {
  email: (email: string) => ValidationSchemas.email.safeParse(email),
  password: (password: string) => ValidationSchemas.password.safeParse(password),
  username: (username: string) => ValidationSchemas.username.safeParse(username),
  nodeId: (id: string) => ValidationSchemas.nodeId.safeParse(id),
  nodeName: (name: string) => ValidationSchemas.nodeName.safeParse(name),
  nodeType: (type: string) => ValidationSchemas.nodeType.safeParse(type),
  workflowName: (name: string) => ValidationSchemas.workflowName.safeParse(name),
  fileName: (name: string) => ValidationSchemas.fileName.safeParse(name),
  port: (port: number) => ValidationSchemas.port.safeParse(port),
  url: (url: string) => ValidationSchemas.url.safeParse(url),
  apiKey: (key: string) => ValidationSchemas.apiKey.safeParse(key),
  code: (code: string) => ValidationSchemas.code.safeParse(code),
  json: (json: string) => ValidationSchemas.jsonData.safeParse(json)
}

export const sanitize = {
  html: InputSanitizer.sanitizeHTML,
  text: InputSanitizer.sanitizePlainText,
  sql: InputSanitizer.sanitizeSQL,
  shell: InputSanitizer.sanitizeShellArg,
  path: InputSanitizer.sanitizePath,
  regex: InputSanitizer.escapeRegex,
  json: InputSanitizer.sanitizeJSON
}