/**
 * Input Sanitization Service
 * Provides methods to sanitize user input and prevent XSS attacks
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Only allows safe HTML tags and attributes
 */
export const sanitizeHtml = (dirty: string): string => {
  // Server-side rendering check
  if (typeof window === 'undefined') {
    // On server, strip all HTML tags
    return dirty.replace(/<[^>]*>/g, '');
  }
  
  // Configure DOMPurify for strict sanitization
  return DOMPurify.sanitize(dirty, { 
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    USE_PROFILES: { html: true }
  });
};

/**
 * Sanitize user input for display in text contexts
 * Removes all HTML and potential script injections
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .trim();
};

/**
 * Sanitize URLs to prevent javascript: and data: protocol attacks
 */
export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  
  // Remove whitespace and convert to lowercase for checking
  const cleanUrl = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:',
    'chrome:',
    'chrome-extension:'
  ];
  
  for (const protocol of dangerousProtocols) {
    if (cleanUrl.startsWith(protocol)) {
      console.warn(`Blocked potentially dangerous URL protocol: ${protocol}`);
      return '';
    }
  }
  
  try {
    const parsed = new URL(url);
    
    // Only allow http(s) and relative protocols
    if (!['http:', 'https:', ''].includes(parsed.protocol)) {
      console.warn(`Blocked non-HTTP(S) URL protocol: ${parsed.protocol}`);
      return '';
    }
    
    // Additional check for localhost/internal IPs in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsed.hostname.toLowerCase();
      if (hostname === 'localhost' || 
          hostname === '127.0.0.1' || 
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.')) {
        console.warn(`Blocked internal network URL: ${hostname}`);
        return '';
      }
    }
    
    return parsed.toString();
  } catch (error) {
    // If URL parsing fails, treat as relative URL
    // But still sanitize it
    return sanitizeInput(url);
  }
};

/**
 * Sanitize file names to prevent path traversal attacks
 */
export const sanitizeFileName = (fileName: string): string => {
  if (!fileName) return '';
  
  return fileName
    .replace(/\.\./g, '') // Remove path traversal attempts
    .replace(/[\/\\]/g, '') // Remove directory separators
    .replace(/^\./, '') // Remove leading dots (hidden files)
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
    .trim();
};

/**
 * Sanitize JSON data before parsing
 * Helps prevent JSON injection attacks
 */
export const sanitizeJson = (jsonString: string): string => {
  if (!jsonString) return '{}';
  
  try {
    // Parse and re-stringify to ensure valid JSON
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed);
  } catch (error) {
    console.error('Invalid JSON input:', error);
    return '{}';
  }
};

/**
 * Escape HTML entities for safe display
 */
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
};

/**
 * Validate and sanitize email addresses
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  
  // Basic email validation regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  const trimmed = email.trim().toLowerCase();
  
  if (!emailRegex.test(trimmed)) {
    console.warn('Invalid email format:', email);
    return '';
  }
  
  // Additional sanitization
  return trimmed
    .replace(/[<>]/g, '') // Remove potential HTML
    .substring(0, 254); // RFC 5321 max email length
};

/**
 * Sanitize search queries to prevent injection
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (!query) return '';
  
  return query
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/['"]/g, '') // Remove quotes that might break queries
    .replace(/[;]/g, '') // Remove semicolons
    .replace(/--/g, '') // Remove SQL comment syntax
    .replace(/\/\*/g, '') // Remove SQL block comment start
    .replace(/\*\//g, '') // Remove SQL block comment end
    .trim()
    .substring(0, 200); // Limit query length
};

/**
 * Create a safe HTML element with sanitized content
 */
export const createSafeElement = (
  tag: string, 
  content: string, 
  attributes?: Record<string, string>
): string => {
  const safeTag = sanitizeInput(tag);
  const safeContent = sanitizeHtml(content);
  
  let safeAttributes = '';
  if (attributes) {
    safeAttributes = Object.entries(attributes)
      .map(([key, value]) => {
        const safeKey = sanitizeInput(key);
        const safeValue = escapeHtml(value);
        return `${safeKey}="${safeValue}"`;
      })
      .join(' ');
  }
  
  return `<${safeTag}${safeAttributes ? ' ' + safeAttributes : ''}>${safeContent}</${safeTag}>`;
};