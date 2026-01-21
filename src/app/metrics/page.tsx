'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Calendar,
  BarChart3,
  LineChart,
  PieChart,
  Users,
  Cpu,
  HardDrive,
  Zap
} from 'lucide-react';

interface MetricData {
  label: string;
  value: number;
  change?: number;
  unit?: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

export default function MetricsPage() {
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);

  // Fetch metrics data from backend
  const { data: metrics, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useQuery({
    queryKey: ['metrics', timeRange],
    queryFn: async () => {
      try {
        const response = await api.metrics.getOverview({ timeRange });
        return response.data.data;
      } catch (error) {
        logger.error('Failed to fetch metrics:', error);
        // Return fallback data if API fails
        return getMockMetrics();
      }
    },
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false,
    staleTime: 10000, // 10 seconds
  });

  // Fetch execution trends
  const { data: executionTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['metrics', 'execution-trends', timeRange],
    queryFn: async () => {
      try {
        const response = await api.metrics.getExecutionTrends({ timeRange });
        return response.data.data;
      } catch (error) {
        logger.error('Failed to fetch execution trends:', error);
        return getMockExecutionTrends();
      }
    },
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false,
    staleTime: 10000,
  });

  // Fetch workflow distribution
  const { data: workflowDistribution, isLoading: distributionLoading } = useQuery({
    queryKey: ['metrics', 'workflow-distribution', timeRange],
    queryFn: async () => {
      try {
        const response = await api.metrics.getWorkflowDistribution({ timeRange });
        return response.data.data;
      } catch (error) {
        logger.error('Failed to fetch workflow distribution:', error);
        return getMockWorkflowDistribution();
      }
    },
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false,
    staleTime: 10000,
  });

  const isLoading = metricsLoading || trendsLoading || distributionLoading;

  // Auto-refresh is handled by React Query refetchInterval

  const formatNumber = (num: number, decimals = 0) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(decimals)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(decimals)}K`;
    }
    return num.toFixed(decimals);
  };

  const getChangeIcon = (change?: number) => {
    if (!change) return null;
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getChangeColor = (change?: number) => {
    if (!change) return '';
    if (change > 0) return 'text-green-500';
    return 'text-red-500';
  };

  const handleExport = () => {
    if (!metrics) return;
    
    // Create CSV content from metrics data
    const csvContent = [
      'Metric,Value,Time Range',
      `Total Executions,${metrics.overview?.totalExecutions || 0},${timeRange}`,
      `Success Rate,${metrics.overview?.successRate || 0}%,${timeRange}`,
      `Avg Execution Time,${metrics.overview?.avgExecutionTime || 0}s,${timeRange}`,
      `Active Workflows,${metrics.overview?.activeWorkflows || 0},${timeRange}`,
      `CPU Usage,${metrics.performance?.cpuUsage || 0}%,${timeRange}`,
      `Memory Usage,${metrics.performance?.memoryUsage || 0}%,${timeRange}`,
      `Disk Usage,${metrics.performance?.diskUsage || 0}%,${timeRange}`,
      `Network Throughput,${metrics.performance?.networkThroughput || 0} MB/s,${timeRange}`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sequb-metrics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefresh = () => {
    refetchMetrics();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Metrics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor system performance and workflow statistics
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>

          {/* Refresh Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              Auto {autoRefresh ? 'ON' : 'OFF'}
            </Button>
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                className="px-2 py-1 border rounded text-sm bg-background"
              >
                <option value="10">10s</option>
                <option value="30">30s</option>
                <option value="60">1m</option>
                <option value="300">5m</option>
              </select>
            )}
          </div>

          {/* Export Button */}
          <Button onClick={handleExport} variant="outline" disabled={!metrics}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && !metrics && (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="text-lg">Loading metrics...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {metricsError && (
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-destructive mb-4">Failed to load metrics</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Executions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {formatNumber(metrics.overview?.totalExecutions || 0)}
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${getChangeColor(metrics.overview?.totalExecutionsChange)}`}>
                    {getChangeIcon(metrics.overview?.totalExecutionsChange)}
                    <span>{metrics.overview?.totalExecutionsChange ? `${metrics.overview.totalExecutionsChange > 0 ? '+' : ''}${metrics.overview.totalExecutionsChange}%` : '--'}</span>
                  </div>
                </div>
                <Activity className="h-8 w-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Success Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {(metrics.overview?.successRate || 0).toFixed(1)}%
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${getChangeColor(metrics.overview?.successRateChange)}`}>
                    {getChangeIcon(metrics.overview?.successRateChange)}
                    <span>{metrics.overview?.successRateChange ? `${metrics.overview.successRateChange > 0 ? '+' : ''}${metrics.overview.successRateChange.toFixed(1)}%` : '--'}</span>
                  </div>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Execution Time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {(metrics.overview?.avgExecutionTime || 0).toFixed(1)}s
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${getChangeColor(metrics.overview?.avgExecutionTimeChange)}`}>
                    {getChangeIcon(metrics.overview?.avgExecutionTimeChange)}
                    <span>{metrics.overview?.avgExecutionTimeChange ? `${metrics.overview.avgExecutionTimeChange > 0 ? '+' : ''}${metrics.overview.avgExecutionTimeChange.toFixed(1)}s` : '--'}</span>
                  </div>
                </div>
                <Clock className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {metrics.overview?.activeWorkflows || 0}
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${getChangeColor(metrics.overview?.activeWorkflowsChange)}`}>
                    {getChangeIcon(metrics.overview?.activeWorkflowsChange)}
                    <span>{metrics.overview?.activeWorkflowsChange ? `${metrics.overview.activeWorkflowsChange > 0 ? '+' : ''}${metrics.overview.activeWorkflowsChange}` : '--'}</span>
                  </div>
                </div>
                <Zap className="h-8 w-8 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Execution Trends */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Execution Trends</CardTitle>
                <LineChart className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : executionTrends?.labels ? (
                <>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {executionTrends.labels.map((label: string, idx: number) => (
                      <div key={label} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex flex-col-reverse gap-1">
                          {executionTrends.datasets?.map((dataset: any, dataIdx: number) => (
                            <div
                              key={dataIdx}
                              className="w-full rounded"
                              style={{
                                height: `${((dataset.data[idx] || 0) / (Math.max(...dataset.data) || 1)) * 200}px`,
                                backgroundColor: dataset.color || '#6366f1',
                                opacity: 0.8,
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-4">
                    {executionTrends.datasets?.map((dataset: any) => (
                      <div key={dataset.label} className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded"
                          style={{ backgroundColor: dataset.color || '#6366f1' }}
                        />
                        <span className="text-sm text-muted-foreground">{dataset.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <span className="text-muted-foreground">No execution trend data available</span>
                </div>
              )}
            </CardContent>
          </Card>

        {/* Workflow Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Workflow Distribution</CardTitle>
              <PieChart className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {distributionLoading ? (
              <div className="h-64 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : workflowDistribution?.labels ? (
              <>
                <div className="h-64 flex items-center justify-center">
                  <div className="relative h-48 w-48">
                    {/* Simple pie chart representation */}
                    {workflowDistribution.colors?.map((color: string, idx: number) => (
                      <div
                        key={idx}
                        className="absolute inset-0 rounded-full border-8"
                        style={{
                          borderColor: color,
                          transform: `rotate(${(workflowDistribution.data[idx] || 0) * 3.6}deg)`,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {workflowDistribution.labels.map((label: string, idx: number) => (
                    <div key={label} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded"
                        style={{ backgroundColor: workflowDistribution.colors?.[idx] || '#6366f1' }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {label} ({workflowDistribution.data?.[idx] || 0}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <span className="text-muted-foreground">No workflow distribution data available</span>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      )}

      {/* System Performance */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <CardDescription>CPU Usage</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {(metrics.performance?.cpuUsage || 0).toFixed(1)}%
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${metrics.performance?.cpuUsage || 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <CardDescription>Memory Usage</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {(metrics.performance?.memoryUsage || 0).toFixed(1)}%
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${metrics.performance?.memoryUsage || 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <CardDescription>Disk Usage</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {(metrics.performance?.diskUsage || 0).toFixed(1)}%
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 transition-all"
                    style={{ width: `${metrics.performance?.diskUsage || 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <CardDescription>Network</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {(metrics.performance?.networkThroughput || 0).toFixed(1)} MB/s
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all"
                    style={{ width: `${Math.min((metrics.performance?.networkThroughput || 0) / 2, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Summary */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Error Summary</CardTitle>
            <CardDescription>
              Overview of system errors and warnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total Errors</p>
                  <p className="text-2xl font-bold">{metrics.errors?.total || 0}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500 opacity-20" />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Critical</p>
                  <p className="text-2xl font-bold text-red-500">
                    {metrics.errors?.critical || 0}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-500 opacity-20" />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Warnings</p>
                  <p className="text-2xl font-bold text-yellow-500">
                    {metrics.errors?.warnings || 0}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500 opacity-20" />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Info</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {metrics.errors?.info || 0}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Fallback mock data functions
function getMockMetrics() {
  return {
    overview: {
      totalExecutions: 1847,
      successRate: 94.2,
      avgExecutionTime: 3.7,
      activeWorkflows: 23,
      totalExecutionsChange: 12.5,
      successRateChange: 2.1,
      avgExecutionTimeChange: -0.5,
      activeWorkflowsChange: 3,
    },
    performance: {
      cpuUsage: 42.3,
      memoryUsage: 68.5,
      diskUsage: 35.2,
      networkThroughput: 125.4,
    },
    errors: {
      total: 43,
      critical: 5,
      warnings: 12,
      info: 26,
    },
  };
}

function getMockExecutionTrends() {
  return {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Successful',
        data: [245, 312, 289, 334, 298, 276, 301],
        color: 'rgb(34, 197, 94)',
      },
      {
        label: 'Failed',
        data: [12, 19, 15, 21, 17, 14, 16],
        color: 'rgb(239, 68, 68)',
      },
    ],
  };
}

function getMockWorkflowDistribution() {
  return {
    labels: ['Data Processing', 'API Integration', 'Monitoring', 'Automation', 'Other'],
    data: [35, 25, 20, 15, 5],
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  };
}