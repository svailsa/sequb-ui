'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function AuthGuard({ 
  children, 
  requireAuth = true,
  redirectTo = '/login'
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('sequb_token');
      
      if (requireAuth && !token) {
        // No token and auth required - redirect to login
        const redirectUrl = `${redirectTo}?from=${encodeURIComponent(pathname)}`;
        router.push(redirectUrl as any);
        return;
      }

      if (!requireAuth && token) {
        // Has token but on public page (login/register) - redirect to home
        router.push('/');
        return;
      }

      setIsAuthenticated(!!token);
      setIsLoading(false);
    };

    checkAuth();
  }, [requireAuth, redirectTo, router, pathname]);

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