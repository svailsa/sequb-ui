'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { authService } from '@/services/auth/auth-service';
import { api } from '@/services/api';
import { logger } from '@/services/monitoring/logger';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  verifyWithBackend?: boolean;
}

export default function AuthGuard({ 
  children, 
  requireAuth = true,
  redirectTo = '/login',
  verifyWithBackend = false
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = authService.getToken();
        
        if (requireAuth) {
          if (!token) {
            // No token and auth required - redirect to login
            const redirectUrl = `${redirectTo}?from=${encodeURIComponent(pathname)}`;
            router.push(redirectUrl as any);
            return;
          }
          
          // Check if token is expired
          if (authService.isTokenExpired(token)) {
            // Token expired - clear and redirect
            authService.clearToken();
            const redirectUrl = `${redirectTo}?from=${encodeURIComponent(pathname)}`;
            router.push(redirectUrl as any);
            return;
          }
          
          // Optional: Verify token with backend
          if (verifyWithBackend) {
            try {
              await api.auth.profile();
              // Token is valid
            } catch (error) {
              // Token is invalid on server - clear and redirect
              logger.error('Token validation failed:', error);
              authService.clearToken();
              const redirectUrl = `${redirectTo}?from=${encodeURIComponent(pathname)}`;
              router.push(redirectUrl as any);
              return;
            }
          }
        }

        if (!requireAuth && token && !authService.isTokenExpired(token)) {
          // Has valid token but on public page (login/register) - redirect to home
          router.push('/');
          return;
        }

        setIsAuthenticated(!!token && !authService.isTokenExpired(token));
        setIsLoading(false);
      } catch (error) {
        logger.error('Auth check failed:', error);
        if (requireAuth) {
          const redirectUrl = `${redirectTo}?from=${encodeURIComponent(pathname)}`;
          router.push(redirectUrl as any);
        } else {
          setIsLoading(false);
        }
      }
    };

    checkAuth();
    
    // Set up interval to check token expiration periodically
    const interval = setInterval(() => {
      if (requireAuth && authService.isAuthenticated()) {
        const expirationTime = authService.getTokenExpirationTime();
        if (expirationTime !== null && expirationTime <= 0) {
          // Token expired during session
          authService.clearToken();
          const redirectUrl = `${redirectTo}?from=${encodeURIComponent(pathname)}`;
          router.push(redirectUrl as any);
        }
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [requireAuth, redirectTo, router, pathname, verifyWithBackend]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}