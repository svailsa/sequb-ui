import { api } from '@/lib/api';
import { logger } from '@/lib/logger';

export interface ErrorContext {
  code: string;
  message: string;
  details?: any;
  suggestions?: string[];
  userActions?: string[];
  technicalDetails?: string;
  timestamp: string;
}

export interface BackendError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
}

// Cache for error contexts from backend
const errorContextCache = new Map<string, ErrorContext>();

// Fetch error context from backend
export async function getErrorContext(error: any): Promise<ErrorContext> {
  const errorCode = extractErrorCode(error);
  const cacheKey = `${errorCode}-${JSON.stringify(error.details || {})}`;
  
  // Check cache first
  if (errorContextCache.has(cacheKey)) {
    return errorContextCache.get(cacheKey)!;
  }

  try {
    // Request context from backend
    const response = await api.ui.getErrorContext(errorCode, error.details);
    const context = response.data.data;
    
    const enrichedContext: ErrorContext = {
      code: context.code || errorCode,
      message: context.message || error.message || 'An error occurred',
      details: context.details || error.details,
      suggestions: context.suggestions || getDefaultSuggestions(errorCode),
      userActions: context.userActions || getDefaultUserActions(errorCode),
      technicalDetails: context.technicalDetails || formatTechnicalDetails(error),
      timestamp: new Date().toISOString(),
    };
    
    // Cache the context
    errorContextCache.set(cacheKey, enrichedContext);
    
    return enrichedContext;
  } catch (contextError) {
    logger.error('Failed to fetch error context from backend:', contextError);
    
    // Return fallback context
    return {
      code: errorCode,
      message: error.message || 'An error occurred',
      details: error.details,
      suggestions: getDefaultSuggestions(errorCode),
      userActions: getDefaultUserActions(errorCode),
      technicalDetails: formatTechnicalDetails(error),
      timestamp: new Date().toISOString(),
    };
  }
}

// Extract error code from various error formats
function extractErrorCode(error: any): string {
  if (error.code) return error.code;
  if (error.response?.data?.code) return error.response.data.code;
  if (error.response?.status) return `HTTP_${error.response.status}`;
  if (error.name) return error.name;
  return 'UNKNOWN_ERROR';
}

// Format technical details for debugging
function formatTechnicalDetails(error: any): string {
  const details: any = {};
  
  if (error.stack) {
    details.stack = error.stack;
  }
  
  if (error.response) {
    details.response = {
      status: error.response.status,
      statusText: error.response.statusText,
      headers: error.response.headers,
      data: error.response.data,
    };
  }
  
  if (error.config) {
    details.request = {
      method: error.config.method,
      url: error.config.url,
      params: error.config.params,
    };
  }
  
  return JSON.stringify(details, null, 2);
}

// Default suggestions based on error code
function getDefaultSuggestions(errorCode: string): string[] {
  const suggestions: Record<string, string[]> = {
    HTTP_401: [
      'Your session may have expired',
      'Please log in again',
      'Check your credentials',
    ],
    HTTP_403: [
      'You may not have permission for this action',
      'Contact an administrator for access',
    ],
    HTTP_404: [
      'The requested resource was not found',
      'Check the URL or ID',
      'The item may have been deleted',
    ],
    HTTP_422: [
      'Check the input data for errors',
      'Some fields may be missing or invalid',
      'Review the validation messages',
    ],
    HTTP_500: [
      'Server error occurred',
      'Try again in a few moments',
      'Contact support if the issue persists',
    ],
    HTTP_503: [
      'Service temporarily unavailable',
      'The system may be under maintenance',
      'Try again shortly',
    ],
    NETWORK_ERROR: [
      'Check your internet connection',
      'The server may be unreachable',
      'Try refreshing the page',
    ],
    VALIDATION_ERROR: [
      'Review the form inputs',
      'Check for required fields',
      'Ensure data formats are correct',
    ],
    TIMEOUT: [
      'The request took too long',
      'Check your connection',
      'Try a smaller operation',
    ],
  };
  
  return suggestions[errorCode] || ['An unexpected error occurred', 'Please try again'];
}

// Default user actions based on error code
function getDefaultUserActions(errorCode: string): string[] {
  const actions: Record<string, string[]> = {
    HTTP_401: ['Login', 'Reset Password'],
    HTTP_403: ['Request Access', 'Contact Admin'],
    HTTP_404: ['Go Back', 'Search Again'],
    HTTP_422: ['Review Form', 'Check Validation'],
    HTTP_500: ['Retry', 'Report Issue'],
    HTTP_503: ['Wait and Retry', 'Check Status'],
    NETWORK_ERROR: ['Retry', 'Check Connection'],
    VALIDATION_ERROR: ['Fix Errors', 'Reset Form'],
    TIMEOUT: ['Retry', 'Use Smaller Data'],
  };
  
  return actions[errorCode] || ['Retry', 'Go Back'];
}

// Format error for user display
export function formatErrorForUser(context: ErrorContext): {
  title: string;
  message: string;
  actions: string[];
} {
  const title = getErrorTitle(context.code);
  const message = context.suggestions?.join(' ') || context.message;
  const actions = context.userActions || ['OK'];
  
  return { title, message, actions };
}

// Get user-friendly error title
function getErrorTitle(errorCode: string): string {
  const titles: Record<string, string> = {
    HTTP_401: 'Authentication Required',
    HTTP_403: 'Access Denied',
    HTTP_404: 'Not Found',
    HTTP_422: 'Validation Error',
    HTTP_500: 'Server Error',
    HTTP_503: 'Service Unavailable',
    NETWORK_ERROR: 'Connection Error',
    VALIDATION_ERROR: 'Invalid Input',
    TIMEOUT: 'Request Timeout',
  };
  
  return titles[errorCode] || 'Error';
}

// Enhanced error handler with context
export async function handleErrorWithContext(
  error: any,
  options?: {
    showNotification?: boolean;
    logError?: boolean;
    fallbackMessage?: string;
  }
): Promise<ErrorContext> {
  const { showNotification = true, logError = true, fallbackMessage } = options || {};
  
  // Get error context
  const context = await getErrorContext(error);
  
  // Log error if needed
  if (logError) {
    logger.error('Error with context:', {
      code: context.code,
      message: context.message,
      details: context.details,
      technical: context.technicalDetails,
    });
  }
  
  // Show notification if needed (would integrate with a notification system)
  if (showNotification) {
    const { title, message, actions } = formatErrorForUser(context);
    // TODO: Integrate with notification system
    console.error(`${title}: ${message}`);
  }
  
  return context;
}

// Create error with code and details
export function createError(code: string, message: string, details?: any): BackendError {
  return {
    code,
    message,
    details,
  };
}

// Check if error is retryable
export function isRetryableError(error: any): boolean {
  const errorCode = extractErrorCode(error);
  const retryableCodes = [
    'HTTP_408', // Request Timeout
    'HTTP_429', // Too Many Requests
    'HTTP_502', // Bad Gateway
    'HTTP_503', // Service Unavailable
    'HTTP_504', // Gateway Timeout
    'NETWORK_ERROR',
    'TIMEOUT',
  ];
  
  return retryableCodes.includes(errorCode);
}

// Clear error context cache
export function clearErrorCache(): void {
  errorContextCache.clear();
}