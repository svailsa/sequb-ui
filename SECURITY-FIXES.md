# Security Fixes Implementation Guide

## Priority 1: Critical Fixes (Implement Immediately)

### 1. Secure Token Storage Implementation

Create new file `src/lib/auth-service.ts`:
```typescript
import { api } from './api';

class AuthService {
  private readonly TOKEN_KEY = 'sequb_token';
  private tokenInMemory: string | null = null;

  // Store token in memory only (for this session)
  setToken(token: string): void {
    this.tokenInMemory = token;
    // For persistence across tabs, use sessionStorage (still XSS vulnerable but better than localStorage)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  getToken(): string | null {
    if (this.tokenInMemory) return this.tokenInMemory;
    
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem(this.TOKEN_KEY);
      if (token) {
        this.tokenInMemory = token;
        return token;
      }
    }
    return null;
  }

  clearToken(): void {
    this.tokenInMemory = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_KEY); // Clear old localStorage tokens
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}

export const authService = new AuthService();
```

### 2. Add Security Headers Configuration

Update `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  poweredByHeader: false, // Hide X-Powered-By header
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=()'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob: https:;
              font-src 'self' data:;
              connect-src 'self' ws: wss: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'};
              media-src 'none';
              object-src 'none';
              frame-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'none';
              upgrade-insecure-requests;
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ];
  },
  
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
```

### 3. Fix WebSocket Authentication

Update `src/lib/websocket.ts`:
```typescript
// Replace lines 64-72 with:
connect(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Don't pass token in URL
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        
        // Send authentication as first message
        const token = this.getToken();
        if (token) {
          this.send({
            type: 'auth',
            data: { token },
            timestamp: new Date().toISOString()
          });
        }
        
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('connected');
        resolve();
      };
      // ... rest of the connection logic
    } catch (error) {
      reject(error);
    }
  });
}
```

### 4. Add Input Sanitization

Install DOMPurify:
```bash
npm install dompurify @types/dompurify
```

Create `src/lib/sanitizer.ts`:
```typescript
import DOMPurify from 'dompurify';

export const sanitizeHtml = (dirty: string): string => {
  if (typeof window === 'undefined') return dirty;
  return DOMPurify.sanitize(dirty, { 
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

export const sanitizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    // Only allow http(s) protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
};
```

### 5. Implement CSRF Protection

Create `src/lib/csrf.ts`:
```typescript
export class CSRFService {
  private token: string | null = null;

  generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    this.token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Store in sessionStorage for this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('csrf_token', this.token);
    }
    
    return this.token;
  }

  getToken(): string {
    if (this.token) return this.token;
    
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('csrf_token');
      if (stored) {
        this.token = stored;
        return stored;
      }
    }
    
    return this.generateToken();
  }

  validateToken(token: string): boolean {
    return token === this.getToken();
  }
}

export const csrfService = new CSRFService();
```

Update `src/lib/api.ts` to include CSRF token:
```typescript
// Add to request interceptor (line 25)
apiClient.interceptors.request.use((config) => {
  const token = authService.getToken(); // Use new auth service
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add CSRF token for state-changing requests
  if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '')) {
    config.headers['X-CSRF-Token'] = csrfService.getToken();
  }
  
  return config;
});
```

## Priority 2: File Upload Security

Update `src/components/plugin/plugin-upload.tsx`:
```typescript
// Add more robust validation (line 79)
const validateFile = (file: File): { isValid: boolean; error?: string } => {
  const validExtensions = ['.wasm', '.js', '.py', '.zip'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  // Check file extension
  const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!validExtensions.includes(extension)) {
    return { 
      isValid: false, 
      error: `Invalid file type. Supported: ${validExtensions.join(', ')}` 
    };
  }
  
  // Check file size
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: `File size exceeds 10MB limit` 
    };
  }
  
  // Check file name for path traversal attempts
  if (file.name.includes('../') || file.name.includes('..\\')) {
    return {
      isValid: false,
      error: 'Invalid file name'
    };
  }
  
  // Check for suspicious patterns in filename
  const suspiciousPatterns = [
    /^\./, // Hidden files
    /\0/, // Null bytes
    /<script/i, // Script tags
    /javascript:/i, // JavaScript protocol
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    return {
      isValid: false,
      error: 'File name contains suspicious patterns'
    };
  }
  
  return { isValid: true };
};
```

## Priority 3: Authentication Guard Enhancement

Update `src/components/auth/auth-guard.tsx`:
```typescript
import { authService } from '@/lib/auth-service';

// Replace checkAuth function (line 24)
const checkAuth = async () => {
  const token = authService.getToken();
  
  if (requireAuth) {
    if (!token) {
      // No token and auth required - redirect to login
      const redirectUrl = `${redirectTo}?from=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl as any);
      return;
    }
    
    // Validate token expiration
    if (authService.isTokenExpired(token)) {
      authService.clearToken();
      const redirectUrl = `${redirectTo}?from=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl as any);
      return;
    }
    
    // Optional: Verify token with backend
    try {
      await api.auth.profile();
    } catch (error) {
      authService.clearToken();
      const redirectUrl = `${redirectTo}?from=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl as any);
      return;
    }
  }
  
  if (!requireAuth && token && !authService.isTokenExpired(token)) {
    // Has valid token but on public page - redirect to home
    router.push('/');
    return;
  }
  
  setIsAuthenticated(!!token);
  setIsLoading(false);
};
```

## Priority 4: Rate Limiting Implementation

Create `src/lib/rate-limiter.ts`:
```typescript
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < config.windowMs);
    
    if (validRequests.length >= config.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup(config.windowMs);
    }
    
    return true;
  }
  
  private cleanup(windowMs: number): void {
    const now = Date.now();
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => now - time < windowMs);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Usage in components:
// if (!rateLimiter.isAllowed('login', { maxRequests: 5, windowMs: 60000 })) {
//   throw new Error('Too many requests. Please try again later.');
// }
```

## Testing Checklist

After implementing these fixes, test:

1. [ ] Authentication flow with new token storage
2. [ ] CSP headers don't break functionality
3. [ ] WebSocket connections with new auth method
4. [ ] File uploads with enhanced validation
5. [ ] Rate limiting on login attempts
6. [ ] Input sanitization doesn't break legitimate inputs
7. [ ] Security headers are present in responses
8. [ ] Token expiration handling works correctly
9. [ ] CSRF protection doesn't block legitimate requests
10. [ ] Cross-browser compatibility

## Deployment Considerations

1. **Staging First**: Deploy to staging environment first
2. **Monitor Logs**: Watch for increased error rates
3. **Gradual Rollout**: Consider feature flags for gradual enablement
4. **Rollback Plan**: Have a quick rollback strategy ready
5. **Security Testing**: Run security scans after deployment

## Next Steps

1. Implement server-side validation for all inputs
2. Add Web Application Firewall (WAF)
3. Set up security monitoring and alerting
4. Implement audit logging
5. Regular security assessments

---

*Implementation Guide Created: January 21, 2026*
*Estimated Implementation Time: 2-3 days for critical fixes*