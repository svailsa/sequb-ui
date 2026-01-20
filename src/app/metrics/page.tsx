'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
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

  // Mock metrics data
  const [metrics] = useState({
    overview: {
      totalExecutions: 1847,
      successRate: 94.2,
      avgExecutionTime: 3.7,
      activeWorkflows: 23,
    },
    performance: {
      cpuUsage: 42.3,
      memoryUsage: 68.5,
      diskUsage: 35.2,
      networkThroughput: 125.4,
    },
    workflows: {
      created: 12,
      updated: 34,
      deleted: 2,
      executed: 567,
    },
    errors: {
      total: 43,
      critical: 5,
      warnings: 12,
      info: 26,
    },
  });

  // Mock chart data
  const executionTrends: ChartData = {
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

  const workflowDistribution = {
    labels: ['Data Processing', 'API Integration', 'Monitoring', 'Automation', 'Other'],
    data: [35, 25, 20, 15, 5],
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  };

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Refresh metrics
      console.log('Refreshing metrics...');
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

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
    // Export metrics to CSV
    alert('Exporting metrics to CSV...');
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

          {/* Auto Refresh Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
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
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Executions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics.overview.totalExecutions)}
                </div>
                <div className={`flex items-center gap-1 text-sm ${getChangeColor(12.5)}`}>
                  {getChangeIcon(12.5)}
                  <span>+12.5%</span>
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
                  {metrics.overview.successRate}%
                </div>
                <div className={`flex items-center gap-1 text-sm ${getChangeColor(2.1)}`}>
                  {getChangeIcon(2.1)}
                  <span>+2.1%</span>
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
                  {metrics.overview.avgExecutionTime}s
                </div>
                <div className={`flex items-center gap-1 text-sm ${getChangeColor(-0.5)}`}>
                  {getChangeIcon(-0.5)}
                  <span>-0.5s</span>
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
                  {metrics.overview.activeWorkflows}
                </div>
                <div className={`flex items-center gap-1 text-sm ${getChangeColor(3)}`}>
                  {getChangeIcon(3)}
                  <span>+3</span>
                </div>
              </div>
              <Zap className="h-8 w-8 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
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
            <div className="h-64 flex items-end justify-between gap-2">
              {executionTrends.labels.map((label, idx) => (
                <div key={label} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col-reverse gap-1">
                    {executionTrends.datasets.map((dataset, dataIdx) => (
                      <div
                        key={dataIdx}
                        className="w-full rounded"
                        style={{
                          height: `${(dataset.data[idx] / 400) * 200}px`,
                          backgroundColor: dataset.color,
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
              {executionTrends.datasets.map((dataset) => (
                <div key={dataset.label} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded"
                    style={{ backgroundColor: dataset.color }}
                  />
                  <span className="text-sm text-muted-foreground">{dataset.label}</span>
                </div>
              ))}
            </div>
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
            <div className="h-64 flex items-center justify-center">
              <div className="relative h-48 w-48">
                {/* Mock pie chart */}
                <div className="absolute inset-0 rounded-full border-8 border-blue-500" />
                <div className="absolute inset-0 rounded-full border-8 border-green-500 border-l-transparent border-b-transparent" />
                <div className="absolute inset-0 rounded-full border-8 border-yellow-500 border-l-transparent border-t-transparent border-r-transparent" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {workflowDistribution.labels.map((label, idx) => (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded"
                    style={{ backgroundColor: workflowDistribution.colors[idx] }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {label} ({workflowDistribution.data[idx]}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Performance */}
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
                {metrics.performance.cpuUsage}%
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${metrics.performance.cpuUsage}%` }}
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
                {metrics.performance.memoryUsage}%
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${metrics.performance.memoryUsage}%` }}
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
                {metrics.performance.diskUsage}%
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 transition-all"
                  style={{ width: `${metrics.performance.diskUsage}%` }}
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
                {metrics.performance.networkThroughput} MB/s
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all"
                  style={{ width: '65%' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Summary */}
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
                <p className="text-2xl font-bold">{metrics.errors.total}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500 opacity-20" />
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-500">
                  {metrics.errors.critical}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500 opacity-20" />
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {metrics.errors.warnings}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500 opacity-20" />
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Info</p>
                <p className="text-2xl font-bold text-blue-500">
                  {metrics.errors.info}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}