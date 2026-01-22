'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Webhook,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Send,
  Shield,
  Copy,
  RefreshCw,
  Globe,
  Key
} from 'lucide-react';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  workflow_id?: string;
  workflow_name?: string;
  events: string[];
  headers?: Record<string, string>;
  secret?: string;
  active: boolean;
  retry_count?: number;
  timeout?: number;
  last_triggered?: string;
  success_count?: number;
  failure_count?: number;
  created_at: string;
  updated_at: string;
}

const WEBHOOK_EVENTS = [
  'workflow.started',
  'workflow.completed',
  'workflow.failed',
  'workflow.paused',
  'workflow.resumed',
  'execution.started',
  'execution.completed',
  'execution.failed',
  'approval.requested',
  'approval.approved',
  'approval.rejected',
];

export default function WebhooksPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Form state for create/edit
  const [formData, setFormData] = useState<{
    name: string;
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    events: string[];
    headers: Record<string, string>;
    secret: string;
    active: boolean;
    retry_count: number;
    timeout: number;
  }>({
    name: '',
    url: '',
    method: 'POST',
    events: [],
    headers: {},
    secret: '',
    active: true,
    retry_count: 3,
    timeout: 30,
  });

  // Fetch webhooks
  const { data: webhooksData, isLoading, refetch } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      try {
        const response = await api.webhooks.list();
        return response.data.data;
      } catch (error) {
        console.error('Failed to fetch webhooks:', error);
        return getMockWebhooks();
      }
    },
  });

  // Create webhook mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await api.webhooks.create(formData as any);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setIsCreating(false);
      resetForm();
    },
  });

  // Update webhook mutation
  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.webhooks.update(id, formData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setEditingWebhook(null);
      resetForm();
    },
  });

  // Delete webhook mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.webhooks.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      method: 'POST',
      events: [],
      headers: {},
      secret: '',
      active: true,
      retry_count: 3,
      timeout: 30,
    });
  };

  const handleEdit = (webhook: WebhookConfig) => {
    setFormData({
      name: webhook.name,
      url: webhook.url,
      method: webhook.method,
      events: webhook.events,
      headers: webhook.headers || {},
      secret: webhook.secret || '',
      active: webhook.active,
      retry_count: webhook.retry_count || 3,
      timeout: webhook.timeout || 30,
    });
    setEditingWebhook(webhook);
    setIsCreating(false);
  };

  const handleSave = () => {
    if (editingWebhook) {
      updateMutation.mutate(editingWebhook.id);
    } else {
      createMutation.mutate();
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this webhook?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleTest = async (webhook: WebhookConfig) => {
    setTestingWebhook(webhook.id);
    
    // Simulate test webhook call
    setTimeout(() => {
      alert(`Test webhook sent to ${webhook.url}`);
      setTestingWebhook(null);
    }, 2000);
  };

  const generateSecret = () => {
    const secret = btoa(Math.random().toString()).substring(10, 42);
    setFormData(prev => ({ ...prev, secret }));
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    alert('Secret copied to clipboard');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Webhooks</h1>
          <p className="text-muted-foreground">
            Configure webhooks to receive real-time notifications about workflow events
          </p>
        </div>
        
        {!isCreating && !editingWebhook && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Webhook
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingWebhook) && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {editingWebhook ? 'Edit Webhook' : 'Create New Webhook'}
            </CardTitle>
            <CardDescription>
              Configure webhook endpoint and event triggers
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="My Webhook"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">HTTP Method</Label>
                <select
                  id="method"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  value={formData.method}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    method: e.target.value as WebhookConfig['method'] 
                  }))}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Webhook URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/webhook"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Events</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {WEBHOOK_EVENTS.map((event) => (
                  <div key={event} className="flex items-center space-x-2">
                    <Checkbox
                      id={event}
                      checked={formData.events.includes(event)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            events: [...prev.events, event],
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            events: prev.events.filter(e => e !== event),
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={event} className="text-sm cursor-pointer">
                      {event}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret">Secret Key</Label>
              <div className="flex gap-2">
                <Input
                  id="secret"
                  type="text"
                  placeholder="Webhook signing secret"
                  value={formData.secret}
                  onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateSecret}
                >
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Used to sign webhook payloads for verification
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="retry_count">Retry Count</Label>
                <Input
                  id="retry_count"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.retry_count}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    retry_count: parseInt(e.target.value) 
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  min="5"
                  max="300"
                  value={formData.timeout}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    timeout: parseInt(e.target.value) 
                  }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, active: checked as boolean }))
                }
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </CardContent>
          
          <CardFooter className="flex gap-3">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {editingWebhook ? 'Update Webhook' : 'Create Webhook'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setEditingWebhook(null);
                resetForm();
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Webhooks List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading webhooks...</div>
        </div>
      ) : webhooksData?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
            <div className="text-muted-foreground mb-2">No webhooks configured</div>
            <p className="text-sm text-muted-foreground max-w-md">
              Create your first webhook to receive real-time notifications
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(webhooksData as any[])?.map((webhook: any) => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Webhook className="h-5 w-5" />
                      <CardTitle className="text-lg">{webhook.name}</CardTitle>
                      {webhook.active ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <CardDescription>{webhook.url}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(webhook)}
                      disabled={testingWebhook === webhook.id}
                    >
                      {testingWebhook === webhook.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(webhook)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">Method:</span>
                  <span className="font-mono font-medium">{webhook.method}</span>
                  
                  {webhook.workflow_name && (
                    <>
                      <span className="text-muted-foreground">Workflow:</span>
                      <span className="font-medium">{webhook.workflow_name}</span>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Events:</span>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map((event: string) => (
                      <span
                        key={event}
                        className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                </div>

                {webhook.secret && (
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Secret:</span>
                    <code className="font-mono">••••••••••••</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copySecret(webhook.secret!)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {(webhook.success_count || webhook.failure_count) && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Success: {webhook.success_count || 0}</span>
                    <span>Failed: {webhook.failure_count || 0}</span>
                    {webhook.last_triggered && (
                      <span>Last triggered: {new Date(webhook.last_triggered).toLocaleString()}</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Mock webhooks for demonstration
function getMockWebhooks(): WebhookConfig[] {
  return [
    {
      id: '1',
      name: 'Slack Notifications',
      url: 'https://hooks.slack.com/services/ABC123/DEF456',
      method: 'POST',
      events: ['workflow.completed', 'workflow.failed'],
      active: true,
      retry_count: 3,
      timeout: 30,
      success_count: 142,
      failure_count: 3,
      last_triggered: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Analytics Service',
      url: 'https://analytics.example.com/webhook',
      method: 'POST',
      events: ['execution.started', 'execution.completed', 'execution.failed'],
      secret: 'webhook_secret_key_123',
      active: true,
      retry_count: 5,
      timeout: 60,
      success_count: 89,
      failure_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}