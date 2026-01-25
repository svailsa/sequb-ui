/**
 * Next.js Middleware for Security Headers and CSP Nonce Generation
 * Generates unique nonces per request for enhanced CSP security
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateCSPNonce } from '@/lib/utils/csp-nonce';

/**
 * Middleware function that runs on every request
 */
export function middleware(request: NextRequest) {
  // Generate a unique nonce for this request
  const nonce = generateCSPNonce();
  
  // Get the response
  const response = NextResponse.next();
  
  // Only apply CSP to HTML pages (not API routes or static assets)
  const isPageRoute = !request.nextUrl.pathname.startsWith('/api') && 
                     !request.nextUrl.pathname.startsWith('/_next') &&
                     !request.nextUrl.pathname.includes('.');

  if (isPageRoute) {
    // Create a more restrictive CSP with nonce for this specific request
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval';
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: blob: https: *.gravatar.com *.githubusercontent.com;
      font-src 'self' data: https://fonts.gstatic.com;
      connect-src 'self' ws: wss: ${process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000'} ${process.env['NODE_ENV'] === 'development' ? 'ws://localhost:3000 wss://localhost:3000' : ''};
      media-src 'none';
      object-src 'none';
      frame-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      manifest-src 'self';
      worker-src 'self' blob:;
      child-src 'none';
      upgrade-insecure-requests;
    `.replace(/\s+/g, ' ').trim();

    // Set the CSP header with the unique nonce
    response.headers.set('Content-Security-Policy', cspHeader);
    
    // Set the nonce in a custom header for the client to access
    response.headers.set('X-CSP-Nonce', nonce);
  }

  // Additional security headers for all routes
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  
  // Only set HSTS in production
  if (process.env['NODE_ENV'] === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  return response;
}

/**
 * Configure which routes this middleware runs on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)',
  ],
};