'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { discoveryClient, type RegionInfo, formatRegionDisplay, getRegionFlag } from '@/lib/discovery';
import { useI18n } from '@/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, Github, Chrome, Check, X, MapPin, Globe } from 'lucide-react';
import { authService } from '@/lib/auth-service';
import { rateLimiter, RateLimitConfigs } from '@/lib/rate-limiter';
import { sanitizeEmail, sanitizeInput } from '@/lib/sanitizer';
import { csrfService } from '@/lib/csrf';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    regionCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [regions, setRegions] = useState<RegionInfo[]>([]);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: 'Weak',
    color: 'bg-red-500',
  });

  // Fetch available regions on mount
  const regionsQuery = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const regions = await discoveryClient.getRegions();
      setRegions(regions);
      return regions;
    },
  });

  // Auto-detect region on mount
  useEffect(() => {
    const autoDetect = async () => {
      setDetectingLocation(true);
      try {
        const detectedRegion = await discoveryClient.autoDetectRegion();
        if (detectedRegion) {
          setFormData(prev => ({ ...prev, regionCode: detectedRegion.code }));
        } else if (regions.length > 0) {
          // Fallback to first region if auto-detection fails
          setFormData(prev => ({ ...prev, regionCode: regions[0].code }));
        }
      } catch (error) {
        console.error('Failed to auto-detect region:', error);
        // Fallback to first available region
        if (regions.length > 0) {
          setFormData(prev => ({ ...prev, regionCode: regions[0].code }));
        }
      } finally {
        setDetectingLocation(false);
      }
    };

    if (regions.length > 0 && !formData.regionCode) {
      autoDetect();
    }
  }, [regions]);

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const strengthLevels = [
      { min: 0, label: 'Weak', color: 'bg-red-500' },
      { min: 2, label: 'Fair', color: 'bg-orange-500' },
      { min: 4, label: 'Good', color: 'bg-yellow-500' },
      { min: 5, label: 'Strong', color: 'bg-green-500' },
      { min: 6, label: 'Very Strong', color: 'bg-green-600' },
    ];

    const strength = strengthLevels.reverse().find(level => score >= level.min) || strengthLevels[0];
    
    return { score, ...strength };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    setErrors(prev => ({ ...prev, [name]: '' }));
    
    // Update password strength
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!validateForm()) {
        throw new Error('Validation failed');
      }

      // Updated register call with region support
      const response = await api.auth.register(
        formData.email,
        formData.password,
        formData.name,
        formData.regionCode
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Store token if provided
      if (data.token) {
        authService.setToken(data.token, data.refreshToken);
        csrfService.rotateToken();
      }
      
      // Redirect to login or home
      router.push((data.token ? '/' : '/login') as any);
    },
    onError: (error: any) => {
      console.error('Registration failed:', error);
      if (error.response?.status === 409) {
        setErrors({ email: 'This email is already registered' });
      } else if (error.message !== 'Validation failed') {
        setErrors({ general: 'An error occurred during registration. Please try again.' });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate();
  };

  const handleSocialRegister = (provider: string) => {
    console.log(`Register with ${provider}`);
    alert(`Social registration with ${provider} coming soon!`);
  };

  const passwordRequirements = [
    { met: formData.password.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(formData.password), text: 'One uppercase letter' },
    { met: /[a-z]/.test(formData.password), text: 'One lowercase letter' },
    { met: /[0-9]/.test(formData.password), text: 'One number' },
    { met: /[^A-Za-z0-9]/.test(formData.password), text: 'One special character' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Sequb</h1>
          <p className="text-muted-foreground">Create your account to get started</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('auth.register')}</CardTitle>
            <CardDescription>
              Join Sequb to start building powerful workflows
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {errors.general && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {errors.general}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">{t('auth.name')}</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={registerMutation.isPending}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={registerMutation.isPending}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={registerMutation.isPending}
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
                
                {formData.password && (
                  <>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>Password strength:</span>
                        <span className="font-medium">{passwordStrength.label}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-xs">
                      {passwordRequirements.map((req, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          {req.met ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className={req.met ? 'text-green-600' : 'text-muted-foreground'}>
                            {req.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={registerMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">{t('auth.region') || 'Select Your Region'}</Label>
                <Select
                  value={formData.regionCode}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, regionCode: value }))}
                  disabled={registerMutation.isPending || regionsQuery.isLoading || detectingLocation}
                >
                  <SelectTrigger id="region" className="w-full">
                    <SelectValue placeholder="Select a region...">
                      {formData.regionCode ? (
                        <div className="flex items-center gap-2">
                          <span>{getRegionFlag(formData.regionCode)}</span>
                          <span>
                            {regions.find(r => r.code === formData.regionCode)?.name || formData.regionCode}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          {detectingLocation ? 'Detecting your location...' : 'Select a region...'}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {regionsQuery.isLoading ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        Loading regions...
                      </div>
                    ) : regions.length > 0 ? (
                      regions.map((region) => (
                        <SelectItem key={region.code} value={region.code}>
                          <div className="flex items-center gap-2">
                            <span>{getRegionFlag(region.code)}</span>
                            <span>{formatRegionDisplay(region)}</span>
                            {region.status !== 'healthy' && (
                              <span className="text-xs text-orange-500">({region.status})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        No regions available
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {detectingLocation && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Auto-detecting closest region based on your location...
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Your data will be stored in this region. You can change this later in settings.
                </p>
                {errors.region && (
                  <p className="text-xs text-destructive">{errors.region}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm cursor-pointer">
                    I agree to the{' '}
                    <Link href={"/terms" as any} className="text-primary hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href={"/privacy" as any} className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
                {errors.terms && (
                  <p className="text-xs text-destructive">{errors.terms}</p>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={registerMutation.isPending || !agreeToTerms}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    t('auth.register')
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
                    onClick={() => handleSocialRegister('github')}
                    disabled={registerMutation.isPending}
                  >
                    <Github className="h-4 w-4 mr-2" />
                    GitHub
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialRegister('google')}
                    disabled={registerMutation.isPending}
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
              {t('auth.alreadyHaveAccount')}{' '}
              <Link href={"/login" as any} className="text-primary hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}