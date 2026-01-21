/**
 * Safe JSON Parsing Utilities
 * Prevents application crashes from malformed JSON
 */

import { logger } from './logger';

/**
 * Safely parse JSON with error handling
 * @param str - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback value
 */
export function safeJsonParse<T = any>(str: string, fallback: T | null = null): T | null {
  if (!str || typeof str !== 'string') {
    return fallback;
  }

  try {
    return JSON.parse(str) as T;
  } catch (error) {
    logger.warn('Failed to parse JSON:', error);
    return fallback;
  }
}

/**
 * Safely stringify JSON with error handling
 * @param obj - Object to stringify
 * @param replacer - Optional replacer function
 * @param space - Optional spacing for pretty printing
 * @returns JSON string or empty object string on error
 */
export function safeJsonStringify(
  obj: any,
  replacer?: (key: string, value: any) => any,
  space?: string | number
): string {
  if (obj === undefined || obj === null) {
    return 'null';
  }

  try {
    return JSON.stringify(obj, replacer, space);
  } catch (error) {
    logger.error('Failed to stringify JSON:', error);
    
    // Try to handle circular references
    try {
      const seen = new WeakSet();
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }
        return replacer ? replacer(key, value) : value;
      }, space);
    } catch {
      return '{}';
    }
  }
}

/**
 * Parse JWT token payload safely
 * @param token - JWT token string
 * @returns Parsed payload or null
 */
export function safeParseJWT<T = any>(token: string): T | null {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      logger.warn('Invalid JWT format');
      return null;
    }

    // Decode base64 payload
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    
    return safeJsonParse<T>(decoded);
  } catch (error) {
    logger.error('Failed to parse JWT:', error);
    return null;
  }
}

/**
 * Deep clone an object safely
 * @param obj - Object to clone
 * @returns Cloned object or null on error
 */
export function safeDeepClone<T = any>(obj: T): T | null {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  try {
    // Use structured clone if available (modern browsers)
    if (typeof structuredClone === 'function') {
      return structuredClone(obj);
    }

    // Fallback to JSON method (loses functions and special objects)
    const jsonStr = safeJsonStringify(obj);
    return safeJsonParse<T>(jsonStr, null);
  } catch (error) {
    logger.error('Failed to clone object:', error);
    return null;
  }
}

/**
 * Validate JSON schema (basic validation)
 * @param data - Data to validate
 * @param schema - Expected schema
 * @returns Boolean indicating if data matches schema
 */
export function validateJsonSchema(data: any, schema: Record<string, string>): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  try {
    for (const [key, expectedType] of Object.entries(schema)) {
      if (!(key in data)) {
        logger.warn(`Missing required field: ${key}`);
        return false;
      }

      const actualType = Array.isArray(data[key]) ? 'array' : typeof data[key];
      if (actualType !== expectedType) {
        logger.warn(`Type mismatch for ${key}: expected ${expectedType}, got ${actualType}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error('Schema validation error:', error);
    return false;
  }
}

/**
 * Sanitize JSON object by removing sensitive keys
 * @param obj - Object to sanitize
 * @param sensitiveKeys - Keys to remove
 * @returns Sanitized object
 */
export function sanitizeJson<T extends Record<string, any>>(
  obj: T,
  sensitiveKeys: string[] = ['password', 'token', 'secret', 'key', 'authorization']
): Record<string, any> {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized: Record<string, any> = { ...obj };
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive.toLowerCase())
    )) {
      delete sanitized[key];
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeJson(sanitized[key], sensitiveKeys);
    }
  }

  return sanitized;
}