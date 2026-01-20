'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { discoveryClient } from '@/lib/discovery';
import { useI18n } from '@/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, Github, Chrome } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [regionRedirect, setRegionRedirect] = useState<{ region_code: string; region_endpoint: string; message: string } | null>(null);

  const loginMutation = useMutation({
    mutationFn: async () => {
      // Validate inputs
      const newErrors: typeof errors = {};
      if (!email) newErrors.email = 'Email is required';
      if (!password) newErrors.password = 'Password is required';
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        throw new Error('Validation failed');
      }

      const response = await api.auth.login(email, password);
      return response.data;
    },
    onSuccess: async (data) => {
      // Handle region redirect
      const redirectResponse = await discoveryClient.handleLoginResponse(data);
      
      if (redirectResponse.status === 'region_redirect') {
        // Show region redirect message
        setRegionRedirect({
          region_code: redirectResponse.region_code,
          region_endpoint: redirectResponse.region_endpoint,
          message: redirectResponse.message || `Please login at your assigned region: ${redirectResponse.region_endpoint}`
        });
        
        // Optionally auto-redirect after a delay
        setTimeout(() => {
          window.location.href = `${redirectResponse.region_endpoint}/login`;
        }, 3000);
        
        return;
      }
      
      // Normal login success
      if (data.token) {
        localStorage.setItem('sequb_token', data.token);
        if (data.region) {
          localStorage.setItem('user_region', data.region);
        }
        if (rememberMe) {
          localStorage.setItem('sequb_remember_email', email);
        }
      }
      
      // Redirect to home or intended destination
      const redirectTo = new URLSearchParams(window.location.search).get('from') || '/';
      router.push(redirectTo as any);
    },
    onError: (error: any) => {
      console.error('Login failed:', error);
      if (error.response?.status === 401) {
        setErrors({ general: 'Invalid email or password' });
      } else if (error.message !== 'Validation failed') {
        setErrors({ general: 'An error occurred during login. Please try again.' });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    loginMutation.mutate();
  };

  const handleSocialLogin = (provider: string) => {
    // Implement OAuth login flow
    console.log(`Login with ${provider}`);
    alert(`Social login with ${provider} coming soon!`);
  };

  // Load saved email if remember me was checked
  useState(() => {
    const savedEmail = localStorage.getItem('sequb_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    
    // Check for any pending region redirect
    const pendingRedirect = discoveryClient.checkForRegionRedirect();
    if (pendingRedirect) {
      setRegionRedirect(pendingRedirect as any);
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Sequb</h1>
          <p className="text-muted-foreground">AI Workflow Orchestration Platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('auth.login')}</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {regionRedirect && (
                <div className="p-3 text-sm bg-warning/10 border border-warning rounded-md space-y-2">
                  <p className="font-medium">{regionRedirect.message}</p>
                  <p className="text-xs text-muted-foreground">
                    Redirecting to {regionRedirect.region_endpoint} in a few seconds...
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = `${regionRedirect.region_endpoint}/login`}
                  >
                    Go to {regionRedirect.region_code.toUpperCase()} region now
                  </Button>
                </div>
              )}
              {errors.general && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {errors.general}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loginMutation.isPending}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Link
                    href={"/forgot-password" as any}
                    className="text-xs text-primary hover:underline"
                  >
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm cursor-pointer">
                  {t('auth.rememberMe')}
                </Label>
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    t('auth.login')
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      {t('auth.or')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialLogin('github')}
                    disabled={loginMutation.isPending}
                  >
                    <Github className="h-4 w-4 mr-2" />
                    GitHub
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialLogin('google')}
                    disabled={loginMutation.isPending}
                  >
                    <Chrome className="h-4 w-4 mr-2" />
                    Google
                  </Button>
                </div>
              </div>
            </CardContent>
          </form>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              {t('auth.dontHaveAccount')}{' '}
              <Link href={"/register" as any} className="text-primary hover:underline">
                {t('auth.register')}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}