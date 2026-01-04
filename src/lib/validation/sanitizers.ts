import DOMPurify from 'dompurify'

// Configure DOMPurify for strict sanitization
DOMPurify.setConfig({
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'p', 'br'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
})

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty)
}

/**
 * Sanitize plain text input (removes all HTML)
 */
export function sanitizeText(input: string): string {
  // Remove all HTML tags and decode HTML entities
  const div = document.createElement('div')
  div.innerHTML = input
  return div.textContent || div.innerText || ''
}

/**
 * Sanitize JSON string to prevent injection
 */
export function sanitizeJson(input: string): string | null {
  try {
    const parsed = JSON.parse(input)
    return JSON.stringify(parsed)
  } catch {
    return null
  }
}

/**
 * Sanitize file name to prevent path traversal
 */
export function sanitizeFileName(fileName: string): string {
  // Remove any path separators and special characters
  return fileName
    .replace(/[\/\\]/g, '') // Remove slashes
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
    .substring(0, 255) // Limit length
}

/**
 * Sanitize URL to prevent javascript: and data: URLs
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const allowedProtocols = ['http:', 'https:']
    
    if (!allowedProtocols.includes(parsed.protocol)) {
      return ''
    }
    
    return parsed.toString()
  } catch {
    return ''
  }
}

/**
 * Escape strings for safe display in HTML context
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Validate and sanitize node type identifier
 */
export function sanitizeNodeType(nodeType: string): string {
  // Only allow alphanumeric, underscore, and hyphen
  return nodeType.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 100)
}