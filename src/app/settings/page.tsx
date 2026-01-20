'use client';

import { useState } from 'react';
import UserPreferences from '@/components/settings/user-preferences';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Key,
  Database,
  Zap,
  Info,
  ChevronRight,
  Save,
  RefreshCw
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

type SettingsTab = 'general' | 'profile' | 'notifications' | 'security' | 'appearance' | 'language' | 'api' | 'advanced';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      try {
        const response = await api.auth.profile();
        return response.data.data;
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Return mock data for demonstration
        return {
          id: '1',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'admin',
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: {
              email: true,
              push: false,
              workflow_updates: true,
              execution_alerts: true,
            },
            timezone: 'UTC',
          },
        };
      }
    },
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      // In a real implementation, this would call appropriate API endpoints
      console.log('Saving settings:', settings);
      return settings;
    },
    onSuccess: () => {
      setUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      alert('Settings saved successfully!');
    },
    onError: (error) => {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    },
  });

  const settingsTabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'language', label: 'Language & Region', icon: Globe },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'advanced', label: 'Advanced', icon: Database },
  ];

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(userData);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure general application preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workspace-name">Workspace Name</Label>
                  <Input
                    id="workspace-name"
                    placeholder="My Workspace"
                    defaultValue="Default Workspace"
                    onChange={() => setUnsavedChanges(true)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default-timeout">Default Execution Timeout (seconds)</Label>
                  <Input
                    id="default-timeout"
                    type="number"
                    placeholder="300"
                    defaultValue="300"
                    onChange={() => setUnsavedChanges(true)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-retries">Maximum Retry Attempts</Label>
                  <Input
                    id="max-retries"
                    type="number"
                    placeholder="3"
                    defaultValue="3"
                    onChange={() => setUnsavedChanges(true)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-save"
                    defaultChecked
                    onCheckedChange={() => setUnsavedChanges(true)}
                  />
                  <Label htmlFor="auto-save">Enable auto-save for workflows</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="debug-mode"
                    onCheckedChange={() => setUnsavedChanges(true)}
                  />
                  <Label htmlFor="debug-mode">Enable debug mode</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'profile':
        return <UserPreferences userData={userData} onUpdate={() => setUnsavedChanges(true)} />;

      case 'notifications':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Email Notifications</h3>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email-workflow"
                      defaultChecked={(userData as any)?.preferences?.notifications?.workflow_updates}
                      onCheckedChange={() => setUnsavedChanges(true)}
                    />
                    <Label htmlFor="email-workflow">Workflow updates</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email-execution"
                      defaultChecked={(userData as any)?.preferences?.notifications?.execution_alerts}
                      onCheckedChange={() => setUnsavedChanges(true)}
                    />
                    <Label htmlFor="email-execution">Execution alerts</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email-approval"
                      defaultChecked
                      onCheckedChange={() => setUnsavedChanges(true)}
                    />
                    <Label htmlFor="email-approval">Approval requests</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email-system"
                      defaultChecked
                      onCheckedChange={() => setUnsavedChanges(true)}
                    />
                    <Label htmlFor="email-system">System updates</Label>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-medium">In-App Notifications</h3>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="push-enabled"
                      defaultChecked
                      onCheckedChange={() => setUnsavedChanges(true)}
                    />
                    <Label htmlFor="push-enabled">Enable push notifications</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sound-enabled"
                      defaultChecked
                      onCheckedChange={() => setUnsavedChanges(true)}
                    />
                    <Label htmlFor="sound-enabled">Play notification sounds</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Two-Factor Authentication</Label>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                    <Button variant="outline">
                      Enable 2FA
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current-password">Change Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="Current password"
                    onChange={() => setUnsavedChanges(true)}
                  />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="New password"
                    onChange={() => setUnsavedChanges(true)}
                  />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    onChange={() => setUnsavedChanges(true)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sessions</Label>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Manage active sessions and devices
                    </p>
                    <Button variant="outline">
                      View Sessions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the look and feel of the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <select
                    id="theme"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    defaultValue={(userData as any)?.preferences?.theme || 'light'}
                    onChange={() => setUnsavedChanges(true)}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">System</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-size">Font Size</Label>
                  <select
                    id="font-size"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    defaultValue="medium"
                    onChange={() => setUnsavedChanges(true)}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="compact-mode"
                    onCheckedChange={() => setUnsavedChanges(true)}
                  />
                  <Label htmlFor="compact-mode">Compact mode</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="animations"
                    defaultChecked
                    onCheckedChange={() => setUnsavedChanges(true)}
                  />
                  <Label htmlFor="animations">Enable animations</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'language':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Language & Region</CardTitle>
                <CardDescription>
                  Set your preferred language and regional settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    defaultValue={(userData as any)?.preferences?.language || 'en'}
                    onChange={() => setUnsavedChanges(true)}
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="zh">中文</option>
                    <option value="ja">日本語</option>
                    <option value="ar">العربية</option>
                    <option value="ur">اردو</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    defaultValue={(userData as any)?.preferences?.timezone || 'UTC'}
                    onChange={() => setUnsavedChanges(true)}
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <select
                    id="date-format"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    defaultValue="MM/DD/YYYY"
                    onChange={() => setUnsavedChanges(true)}
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time-format">Time Format</Label>
                  <select
                    id="time-format"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    defaultValue="12h"
                    onChange={() => setUnsavedChanges(true)}
                  >
                    <option value="12h">12-hour</option>
                    <option value="24h">24-hour</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Manage your API keys for programmatic access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <Button variant="default">
                    <Key className="h-4 w-4 mr-2" />
                    Generate New API Key
                  </Button>

                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Production Key</p>
                        <p className="text-sm text-muted-foreground">
                          Created on Jan 15, 2024
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm">
                          Revoke
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 px-3 py-2 bg-muted rounded text-sm">
                        sk_live_••••••••••••••••••••••••••••••••
                      </code>
                      <Button variant="outline" size="sm">
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Development Key</p>
                        <p className="text-sm text-muted-foreground">
                          Created on Dec 10, 2023
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm">
                          Revoke
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 px-3 py-2 bg-muted rounded text-sm">
                        sk_test_••••••••••••••••••••••••••••••••
                      </code>
                      <Button variant="outline" size="sm">
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Configure advanced system settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cache-ttl">Cache TTL (seconds)</Label>
                  <Input
                    id="cache-ttl"
                    type="number"
                    placeholder="3600"
                    defaultValue="3600"
                    onChange={() => setUnsavedChanges(true)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="log-level">Log Level</Label>
                  <select
                    id="log-level"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    defaultValue="info"
                    onChange={() => setUnsavedChanges(true)}
                  >
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="warn">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="telemetry"
                    defaultChecked
                    onCheckedChange={() => setUnsavedChanges(true)}
                  />
                  <Label htmlFor="telemetry">Share anonymous usage data</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="experimental"
                    onCheckedChange={() => setUnsavedChanges(true)}
                  />
                  <Label htmlFor="experimental">Enable experimental features</Label>
                </div>

                <div className="pt-4 space-y-2">
                  <Button variant="outline" className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    Export All Data
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    <Zap className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                  
                  <Button variant="destructive" className="w-full">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Sidebar Navigation */}
        <div className="col-span-12 md:col-span-3">
          <nav className="space-y-1">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </div>
                  {activeTab === tab.id && (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="col-span-12 md:col-span-9">
          {isLoadingUser ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Loading settings...</div>
            </div>
          ) : (
            renderTabContent()
          )}

          {/* Save Bar */}
          {unsavedChanges && (
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
              <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm">You have unsaved changes</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setUnsavedChanges(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={saveSettingsMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}