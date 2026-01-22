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
import { api } from '@/services/api';
import { usePreferences } from '@/components/providers/preferences-provider';
import { useUIConfiguration } from '@/components/providers/ui-configuration-provider';
import { StatusIndicator } from '@/components/ui/status-indicator';

type SettingsTab = 'general' | 'profile' | 'notifications' | 'security' | 'appearance' | 'language' | 'api' | 'advanced';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const queryClient = useQueryClient();
  
  const {
    preferences,
    isLoading: prefsLoading,
    error: prefsError,
    hasUnsavedChanges,
    updatePreference,
    savePreferences,
  } = usePreferences();

  const {
    getSupportedLanguages,
    getSupportedTimezones,
    getAvailableThemes,
    isFeatureEnabled,
    getConfigValue,
  } = useUIConfiguration();

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
    mutationFn: async () => {
      await savePreferences();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      // Show success notification instead of alert
    },
    onError: (error) => {
      console.error('Failed to save settings:', error);
      // Show error notification instead of alert
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
    saveSettingsMutation.mutate();
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
                  <Label htmlFor="default-timeout">Default Execution Timeout (seconds)</Label>
                  <Input
                    id="default-timeout"
                    type="number"
                    placeholder="300"
                    value={preferences?.workflow.defaultTimeout || 300}
                    max={getConfigValue('limits.maxExecutionTime') || 3600}
                    onChange={(e) => updatePreference('workflow.defaultTimeout', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum: {getConfigValue('limits.maxExecutionTime') || 3600} seconds
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-retries">Maximum Retry Attempts</Label>
                  <Input
                    id="max-retries"
                    type="number"
                    placeholder="3"
                    value={preferences?.workflow.maxRetries || 3}
                    min={0}
                    max={10}
                    onChange={(e) => updatePreference('workflow.maxRetries', parseInt(e.target.value))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-save"
                    checked={preferences?.workflow.autoSave ?? true}
                    onCheckedChange={(checked) => updatePreference('workflow.autoSave', checked)}
                  />
                  <Label htmlFor="auto-save">Enable auto-save for workflows</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="debug-mode"
                    checked={preferences?.workflow.debugMode ?? false}
                    onCheckedChange={(checked) => updatePreference('workflow.debugMode', checked)}
                  />
                  <Label htmlFor="debug-mode">Enable debug mode</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'profile':
        return <UserPreferences userData={userData} onUpdate={() => {}} />;

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
                      checked={preferences?.notifications.email.workflowUpdates ?? true}
                      onCheckedChange={(checked) => updatePreference('notifications.email.workflowUpdates', checked)}
                    />
                    <Label htmlFor="email-workflow">Workflow updates</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email-execution"
                      checked={preferences?.notifications.email.executionAlerts ?? true}
                      onCheckedChange={(checked) => updatePreference('notifications.email.executionAlerts', checked)}
                    />
                    <Label htmlFor="email-execution">Execution alerts</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email-approval"
                      checked={preferences?.notifications.email.approvalRequests ?? true}
                      onCheckedChange={(checked) => updatePreference('notifications.email.approvalRequests', checked)}
                    />
                    <Label htmlFor="email-approval">Approval requests</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email-system"
                      checked={preferences?.notifications.email.systemUpdates ?? true}
                      onCheckedChange={(checked) => updatePreference('notifications.email.systemUpdates', checked)}
                    />
                    <Label htmlFor="email-system">System updates</Label>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-medium">In-App Notifications</h3>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="push-enabled"
                      checked={preferences?.notifications.inApp.enabled ?? true}
                      onCheckedChange={(checked) => updatePreference('notifications.inApp.enabled', checked)}
                    />
                    <Label htmlFor="push-enabled">Enable push notifications</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sound-enabled"
                      checked={preferences?.notifications.inApp.sound ?? true}
                      onCheckedChange={(checked) => updatePreference('notifications.inApp.sound', checked)}
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
                    onChange={() => {}}
                  />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="New password"
                    onChange={() => {}}
                  />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    onChange={() => {}}
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
                    value={preferences?.theme || 'light'}
                    onChange={(e) => updatePreference('theme', e.target.value)}
                  >
                    {getAvailableThemes().map((theme) => (
                      <option key={theme.id} value={theme.id} disabled={!theme.available}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-size">Font Size</Label>
                  <select
                    id="font-size"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    value={preferences?.fontSize || 'medium'}
                    onChange={(e) => updatePreference('fontSize', e.target.value)}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="compact-mode"
                    checked={preferences?.compactMode ?? false}
                    onCheckedChange={(checked) => updatePreference('compactMode', checked)}
                  />
                  <Label htmlFor="compact-mode">Compact mode</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="animations"
                    checked={preferences?.animationsEnabled ?? true}
                    onCheckedChange={(checked) => updatePreference('animationsEnabled', checked)}
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
                    value={preferences?.language || 'en'}
                    onChange={(e) => updatePreference('language', e.target.value)}
                  >
                    {getSupportedLanguages().map((language) => (
                      <option 
                        key={language.code} 
                        value={language.code} 
                        disabled={!language.available}
                      >
                        {language.nativeName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    value={preferences?.timezone || 'UTC'}
                    onChange={(e) => updatePreference('timezone', e.target.value)}
                  >
                    {getSupportedTimezones()
                      .sort((a, b) => a.region.localeCompare(b.region))
                      .map((timezone) => (
                        <option key={timezone.code} value={timezone.code}>
                          {timezone.name} ({timezone.offset})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <select
                    id="date-format"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    value={preferences?.dateFormat || 'MM/DD/YYYY'}
                    onChange={(e) => updatePreference('dateFormat', e.target.value)}
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
                    value={preferences?.timeFormat || '12h'}
                    onChange={(e) => updatePreference('timeFormat', e.target.value)}
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
                    value={preferences?.advanced.cacheTtl || 3600}
                    min={60}
                    max={86400}
                    onChange={(e) => updatePreference('advanced.cacheTtl', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Range: 60 to 86,400 seconds (1 minute to 24 hours)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="log-level">Log Level</Label>
                  <select
                    id="log-level"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    value={preferences?.advanced.logLevel || 'info'}
                    onChange={(e) => updatePreference('advanced.logLevel', e.target.value)}
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
                    checked={preferences?.advanced.telemetryEnabled ?? true}
                    onCheckedChange={(checked) => updatePreference('advanced.telemetryEnabled', checked)}
                  />
                  <Label htmlFor="telemetry">Share anonymous usage data</Label>
                </div>

                {isFeatureEnabled('experimentalFeatures') && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="experimental"
                      checked={preferences?.advanced.experimentalFeatures ?? false}
                      onCheckedChange={(checked) => updatePreference('advanced.experimentalFeatures', checked)}
                    />
                    <Label htmlFor="experimental">Enable experimental features</Label>
                  </div>
                )}

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
          <StatusIndicator type="backend" showLabel />
        </div>
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
          {prefsLoading || isLoadingUser ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Loading settings...</div>
            </div>
          ) : (
            renderTabContent()
          )}

          {/* Save Bar */}
          {hasUnsavedChanges && (
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
              <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm">
                    You have unsaved changes
                    {prefsError && (
                      <span className="text-red-600 ml-2">- {prefsError}</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={saveSettingsMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
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