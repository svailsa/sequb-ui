/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  poweredByHeader: false, // Hide X-Powered-By header for security

  // Security headers configuration
  async headers() {
    // Generate a nonce for this deployment (static for build-time assets)
    const generateCSPNonce = () => {
      if (typeof crypto !== 'undefined') {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Buffer.from(array).toString('base64');
      }
      // Fallback for older Node.js versions
      return require('crypto').randomBytes(16).toString('base64');
    };
    
    const buildNonce = generateCSPNonce();
    
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
            value: 'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), serial=(), bluetooth=(), magnetometer=(), gyroscope=(), accelerometer=()'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'nonce-${buildNonce}' 'strict-dynamic' 'wasm-unsafe-eval';
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              img-src 'self' data: blob: https: *.gravatar.com *.githubusercontent.com;
              font-src 'self' data: https://fonts.gstatic.com;
              connect-src 'self' ws: wss: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'} ${process.env.NODE_ENV === 'development' ? 'ws://localhost:3000 wss://localhost:3000' : ''};
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
            `.replace(/\s+/g, ' ').trim()
          },
          {
            key: 'X-XSS-Protection',
            value: '0'  // Disabled in favor of CSP (modern browsers)
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Embedder-Policy', 
            value: 'credentialless'  // Less restrictive than require-corp for better compatibility
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin'  // Allow cross-origin for images and fonts
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'off'
          },
          {
            key: 'X-Download-Options',
            value: 'noopen'
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none'
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