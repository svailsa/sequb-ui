'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Smartphone, Copy, Check, X, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface MFASetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export default function MFASetup({ onComplete, onCancel }: MFASetupProps) {
  const [step, setStep] = useState<'intro' | 'qr' | 'verify' | 'backup'>('intro');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Mock QR code and secret for demonstration
  const [mfaData] = useState({
    secret: 'JBSWY3DPEHPK3PXP',
    qrCodeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    backupCodes: [
      'ABC123-DEF456',
      'GHI789-JKL012',
      'MNO345-PQR678',
      'STU901-VWX234',
      'YZA567-BCD890',
      'EFG123-HIJ456',
      'KLM789-NOP012',
      'QRS345-TUV678',
    ],
  });

  const setupMutation = useMutation({
    mutationFn: async () => {
      // In real implementation, this would call the MFA setup endpoint
      return new Promise((resolve) => {
        setTimeout(() => {
          setBackupCodes(mfaData.backupCodes);
          resolve({ success: true });
        }, 1000);
      });
    },
    onSuccess: () => {
      setStep('backup');
    },
    onError: () => {
      setError('Invalid verification code. Please try again.');
    },
  });

  const handleVerify = () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    
    setError('');
    setupMutation.mutate();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyAllCodes = () => {
    const allCodes = backupCodes.join('\n');
    navigator.clipboard.writeText(allCodes);
    setCopiedCode('all');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const renderStep = () => {
    switch (step) {
      case 'intro':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Enable Two-Factor Authentication</CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Two-factor authentication (2FA) significantly improves the security of your account
                  by requiring a second verification step when signing in.
                </p>
                
                <div className="space-y-2">
                  <h3 className="font-medium">How it works:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Install an authenticator app on your phone</li>
                    <li>Scan the QR code we provide</li>
                    <li>Enter the verification code from your app</li>
                    <li>Save your backup codes in a secure location</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Recommended authenticator apps:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Google Authenticator</li>
                    <li>Microsoft Authenticator</li>
                    <li>Authy</li>
                    <li>1Password</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep('qr')} className="flex-1">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Continue Setup
                </Button>
                {onCancel && (
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'qr':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Scan QR Code</CardTitle>
              <CardDescription>
                Scan this QR code with your authenticator app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg">
                  <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                    {/* In real implementation, display actual QR code */}
                    <span className="text-gray-500">QR Code</span>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Can't scan the code? Enter this key manually:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-2 bg-muted rounded text-sm font-mono">
                      {mfaData.secret}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyCode(mfaData.secret)}
                    >
                      {copiedCode === mfaData.secret ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep('verify')} className="flex-1">
                  Next
                </Button>
                <Button variant="outline" onClick={() => setStep('intro')}>
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'verify':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Verify Setup</CardTitle>
              <CardDescription>
                Enter the 6-digit code from your authenticator app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                  }}
                  className="text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                />
                {error && (
                  <p className="text-xs text-destructive">{error}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleVerify}
                  className="flex-1"
                  disabled={setupMutation.isPending}
                >
                  {setupMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Enable'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep('qr')}
                  disabled={setupMutation.isPending}
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'backup':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Save Backup Codes</CardTitle>
              <CardDescription>
                Store these codes in a safe place. You can use them to access your account if you lose your phone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Your backup codes:</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAllCodes}
                  >
                    {copiedCode === 'all' ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy All
                      </>
                    )}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-2 bg-background rounded text-sm font-mono"
                    >
                      <span>{code}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleCopyCode(code)}
                      >
                        {copiedCode === code ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Each backup code can only be used once. After using a code, it will be permanently invalidated.
                </p>
              </div>

              <Button
                onClick={onComplete}
                className="w-full"
              >
                I've Saved My Codes
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return renderStep();
}