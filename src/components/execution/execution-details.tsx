"use client";

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Execution, ExecutionLog } from '@/types/sequb';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { useExecutionMonitor } from '@/hooks/use-websocket';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Square,
  AlertCircle,
  Calendar,
  Timer,
  DollarSign,
  Download,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

interface ExecutionDetailsProps {
  execution: Execution;
  onClose?: () => void;
}

export function ExecutionDetails({
  execution,
  onClose
}: ExecutionDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'inputs' | 'outputs'>('overview');
  
  // Monitor this execution with WebSocket
  const { executionData, logs: realtimeLogs, isMonitoring } = useExecutionMonitor(execution.id);

  // Fetch execution logs
  const { data: logsResponse, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['execution-logs', execution.id],
    queryFn: async () => {
      const response = await api.executions.getLogs(execution.id);
      return response.data;
    },
    refetchInterval: execution.status === 'running' ? 5000 : false, // Refresh logs every 5s if running
  });

  // Combine fetched logs with real-time logs
  const allLogs = [
    ...(logsResponse?.data || []),
    ...realtimeLogs
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const currentExecution = executionData ? { ...execution, ...executionData } : execution;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="w-5 h-5 text-blue-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'cancelled':
        return <Square className="w-5 h-5 text-gray-600" />;
      case 'waiting_for_approval':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'waiting_for_approval':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDuration = () => {
    const start = new Date(currentExecution.started_at);
    const end = currentExecution.completed_at ? new Date(currentExecution.completed_at) : new Date();
    const durationMs = end.getTime() - start.getTime();
    
    if (durationMs < 1000) return '< 1s';
    if (durationMs < 60000) return `${Math.round(durationMs / 1000)}s`;
    if (durationMs < 3600000) return `${Math.round(durationMs / 60000)}m`;
    return `${Math.round(durationMs / 3600000)}h`;
  };

  const downloadLogs = () => {
    const logsText = allLogs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-${execution.id}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatJsonValue = (value: any) => {
    if (typeof value === 'string') return value;
    return JSON.stringify(value, null, 2);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon(currentExecution.status)}
            <div>
              <h2 className="text-xl font-semibold">Execution Details</h2>
              <p className="text-sm text-muted-foreground font-mono">{execution.id}</p>
            </div>
            {isMonitoring && (
              <div className="flex items-center space-x-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs">Live monitoring</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchLogs()}
              disabled={logsLoading}
            >
              <RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadLogs}
              disabled={allLogs.length === 0}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Status and basic info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Status</label>
            <div className={cn(
              "inline-flex items-center px-2 py-1 rounded-full text-xs border font-medium",
              getStatusColor(currentExecution.status)
            )}>
              {currentExecution.status.replace('_', ' ').toUpperCase()}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Started</label>
            <div className="text-sm">{formatDate(currentExecution.started_at)}</div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Duration</label>
            <div className="text-sm">{getDuration()}</div>
          </div>

          {currentExecution.cost && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Cost</label>
              <div className="text-sm">${currentExecution.cost.toFixed(2)}</div>
            </div>
          )}
        </div>

        {/* Progress bar for running executions */}
        {currentExecution.status === 'running' && executionData?.progress && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round(executionData.progress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${executionData.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {currentExecution.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 mb-1">Error</h4>
            <p className="text-sm text-red-700">{currentExecution.error}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-1 px-6">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'logs', label: `Logs (${allLogs.length})` },
            { key: 'inputs', label: 'Inputs' },
            { key: 'outputs', label: 'Outputs' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-6 overflow-auto">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Execution Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Execution ID</label>
                    <div className="font-mono text-sm">{execution.id}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Workflow ID</label>
                    <div className="font-mono text-sm">{execution.workflow_id}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Started At</label>
                    <div className="text-sm">{formatDate(currentExecution.started_at)}</div>
                  </div>
                  {currentExecution.completed_at && (
                    <div>
                      <label className="text-sm text-muted-foreground">Completed At</label>
                      <div className="text-sm">{formatDate(currentExecution.completed_at)}</div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Status</label>
                    <div className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs border font-medium",
                      getStatusColor(currentExecution.status)
                    )}>
                      {currentExecution.status.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Duration</label>
                    <div className="text-sm">{getDuration()}</div>
                  </div>
                  {currentExecution.cost && (
                    <div>
                      <label className="text-sm text-muted-foreground">Cost</label>
                      <div className="text-sm">${currentExecution.cost.toFixed(2)}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Execution Logs</h3>
              <div className="text-sm text-muted-foreground">
                {allLogs.length} log entries
                {logsLoading && <Loader2 className="w-4 h-4 ml-2 inline animate-spin" />}
              </div>
            </div>
            
            <div className="bg-black rounded-lg p-4 font-mono text-sm text-green-400 max-h-96 overflow-auto">
              {allLogs.length === 0 ? (
                <div className="text-muted-foreground">No logs available</div>
              ) : (
                allLogs.map((log, index) => (
                  <div key={`${log.timestamp}-${index}`} className="mb-1">
                    <span className="text-gray-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className={cn(
                      "ml-2",
                      log.level === 'error' && "text-red-400",
                      log.level === 'warn' && "text-yellow-400",
                      log.level === 'info' && "text-blue-400",
                      log.level === 'debug' && "text-gray-400"
                    )}>
                      {log.level.toUpperCase()}:
                    </span>
                    <span className="ml-2">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'inputs' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Input Data</h3>
            {currentExecution.inputs ? (
              <Textarea
                value={formatJsonValue(currentExecution.inputs)}
                readOnly
                className="min-h-96 font-mono text-sm"
              />
            ) : (
              <div className="text-muted-foreground">No input data</div>
            )}
          </div>
        )}

        {activeTab === 'outputs' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Output Data</h3>
            {currentExecution.outputs ? (
              <Textarea
                value={formatJsonValue(currentExecution.outputs)}
                readOnly
                className="min-h-96 font-mono text-sm"
              />
            ) : (
              <div className="text-muted-foreground">No output data available</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}