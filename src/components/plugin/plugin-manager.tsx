'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PluginUpload from './plugin-upload';
import { 
  Package, 
  Upload, 
  Power, 
  PowerOff, 
  Trash2, 
  Settings, 
  Info,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Code,
  Cpu,
  Zap
} from 'lucide-react';

interface Plugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  status: 'active' | 'inactive' | 'error' | 'loading';
  capabilities?: string[];
  runtime?: 'wasm' | 'js' | 'python';
  size?: number;
  created_at: string;
  updated_at: string;
}

export default function PluginManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const queryClient = useQueryClient();

  // Fetch plugins
  const { data: pluginsData, isLoading, error, refetch } = useQuery({
    queryKey: ['plugins'],
    queryFn: async () => {
      try {
        const response = await api.plugins.list();
        return response.data.data;
      } catch (error) {
        console.error('Failed to fetch plugins:', error);
        // Return mock data for demonstration
        return getMockPlugins();
      }
    },
  });

  // Activate plugin mutation
  const activateMutation = useMutation({
    mutationFn: (id: string) => api.plugins.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
    },
  });

  // Deactivate plugin mutation
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.plugins.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
    },
  });

  // Delete plugin mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.plugins.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
    },
  });

  // Filter plugins
  const filteredPlugins = pluginsData?.filter((plugin: Plugin) => {
    const matchesSearch = !searchQuery || 
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || plugin.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleTogglePlugin = (plugin: Plugin) => {
    if (plugin.status === 'active') {
      deactivateMutation.mutate(plugin.id);
    } else {
      activateMutation.mutate(plugin.id);
    }
  };

  const handleDeletePlugin = (plugin: Plugin) => {
    if (confirm(`Are you sure you want to delete "${plugin.name}"?`)) {
      deleteMutation.mutate(plugin.id);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'loading':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return null;
    }
  };

  const getRuntimeIcon = (runtime?: string) => {
    switch (runtime) {
      case 'wasm':
        return <Cpu className="h-4 w-4" />;
      case 'js':
        return <Code className="h-4 w-4" />;
      case 'python':
        return <Code className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  if (showUpload) {
    return (
      <PluginUpload
        onSuccess={() => {
          setShowUpload(false);
          refetch();
        }}
        onCancel={() => setShowUpload(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Plugin Manager</h2>
          <p className="text-muted-foreground">
            Manage and configure plugins to extend functionality
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Plugin
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="error">Error</option>
        </select>

        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Plugins Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading plugins...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-destructive">Failed to load plugins</div>
        </div>
      ) : filteredPlugins.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <div className="text-muted-foreground mb-2">No plugins found</div>
          <p className="text-sm text-muted-foreground max-w-md">
            {searchQuery 
              ? `No plugins match your search "${searchQuery}"`
              : 'Upload your first plugin to extend functionality'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlugins.map((plugin: Plugin) => (
            <Card key={plugin.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getRuntimeIcon(plugin.runtime)}
                    <CardTitle className="text-lg">{plugin.name}</CardTitle>
                  </div>
                  {getStatusIcon(plugin.status)}
                </div>
                <CardDescription>
                  {plugin.description || 'No description available'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-mono">{plugin.version}</span>
                </div>
                
                {plugin.author && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Author</span>
                    <span>{plugin.author}</span>
                  </div>
                )}
                
                {plugin.runtime && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Runtime</span>
                    <span className="uppercase">{plugin.runtime}</span>
                  </div>
                )}
                
                {plugin.size && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Size</span>
                    <span>{formatFileSize(plugin.size)}</span>
                  </div>
                )}

                {plugin.capabilities && plugin.capabilities.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Capabilities</span>
                    <div className="flex flex-wrap gap-1">
                      {plugin.capabilities.map((cap, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex gap-2">
                <Button
                  variant={plugin.status === 'active' ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => handleTogglePlugin(plugin)}
                  disabled={plugin.status === 'loading' || plugin.status === 'error'}
                  className="flex-1"
                >
                  {plugin.status === 'active' ? (
                    <>
                      <PowerOff className="h-4 w-4 mr-1" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4 mr-1" />
                      Activate
                    </>
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPlugin(plugin)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeletePlugin(plugin)}
                  disabled={plugin.status === 'active'}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Plugin Details Modal */}
      {selectedPlugin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Plugin Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPlugin(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto">
                {JSON.stringify(selectedPlugin, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Mock plugins for demonstration
function getMockPlugins(): Plugin[] {
  return [
    {
      id: '1',
      name: 'Data Transformer',
      version: '1.2.0',
      description: 'Advanced data transformation and manipulation plugin',
      author: 'Sequb Team',
      status: 'active',
      capabilities: ['transform', 'filter', 'aggregate'],
      runtime: 'wasm',
      size: 245760,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'API Connector',
      version: '2.0.1',
      description: 'Connect to external APIs with built-in authentication',
      author: 'Community',
      status: 'active',
      capabilities: ['http', 'auth', 'webhooks'],
      runtime: 'js',
      size: 180224,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'ML Predictor',
      version: '0.9.5',
      description: 'Machine learning inference plugin for predictions',
      author: 'AI Labs',
      status: 'inactive',
      capabilities: ['inference', 'ml', 'predictions'],
      runtime: 'python',
      size: 524288,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '4',
      name: 'Database Sync',
      version: '1.0.0',
      description: 'Synchronize data between multiple databases',
      author: 'Data Team',
      status: 'error',
      capabilities: ['database', 'sync', 'replication'],
      runtime: 'wasm',
      size: 307200,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}