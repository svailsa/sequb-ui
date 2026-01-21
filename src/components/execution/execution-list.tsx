"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExecutionCard } from './execution-card';
import { api } from '@/lib/api';
import { Execution, PaginatedResponse } from '@/types/sequb';
import { Search, Filter, Loader2, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWebSocketContext } from '@/components/providers/websocket-provider';
import { useStatusStore } from '@/stores/status-store';
import { StatusIndicator } from '@/components/ui/status-indicator';

interface ExecutionListProps {
  onViewExecution?: (execution: Execution) => void;
  workflowId?: string; // Optional filter by specific workflow
}

export function ExecutionList({ 
  onViewExecution,
  workflowId 
}: ExecutionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const queryClient = useQueryClient();
  const { lastExecutionUpdate, isConnected } = useWebSocketContext();
  const { systemStatus, executionStatuses } = useStatusStore();

  // Fetch executions with filters
  const { data, isLoading, error, refetch } = useQuery<PaginatedResponse<Execution>>({
    queryKey: ['executions', page, perPage, statusFilter, workflowId, searchTerm],
    queryFn: async () => {
      const params: any = { page, per_page: perPage };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (workflowId) params.workflow_id = workflowId;
      if (searchTerm) params.search = searchTerm;
      
      const response = await api.executions.list(params);
      return response.data;
    },
    staleTime: 10000, // Cache for 10 seconds
    refetchInterval: isConnected ? false : 30000, // Auto-refresh every 30s if not connected to WebSocket
  });

  // Cancel execution mutation
  const cancelExecutionMutation = useMutation({
    mutationFn: (executionId: string) => api.executions.cancel(executionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions'] });
    },
  });

  const handleCancelExecution = async (execution: Execution) => {
    if (execution.status !== 'running' && execution.status !== 'pending') {
      return;
    }

    if (window.confirm(`Are you sure you want to cancel this execution?`)) {
      try {
        await cancelExecutionMutation.mutateAsync(execution.id);
      } catch (error) {
        console.error('Failed to cancel execution:', error);
      }
    }
  };

  // Real-time updates via WebSocket
  useEffect(() => {
    if (lastExecutionUpdate) {
      // Update the execution in the cache
      queryClient.setQueryData<PaginatedResponse<Execution>>(
        ['executions', page, perPage, statusFilter, workflowId, searchTerm],
        (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            data: oldData.data.map(execution => 
              execution.id === lastExecutionUpdate.execution_id 
                ? { 
                    ...execution, 
                    status: lastExecutionUpdate.status,
                    // Update other fields from WebSocket data if needed
                  }
                : execution
            )
          };
        }
      );
    }
  }, [lastExecutionUpdate, queryClient, page, perPage, statusFilter, workflowId, searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, workflowId]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Failed to load executions</p>
        <Button onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const executions = data?.data || [];
  const totalPages = data ? Math.ceil(data.total / data.per_page) : 0;

  // Group executions by status for better overview
  const executionsByStatus = executions.reduce((acc, execution) => {
    const status = execution.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(execution);
    return acc;
  }, {} as Record<string, Execution[]>);

  const statusCounts = {
    running: executionsByStatus.running?.length || 0,
    pending: executionsByStatus.pending?.length || 0,
    completed: executionsByStatus.completed?.length || 0,
    failed: executionsByStatus.failed?.length || 0,
    cancelled: executionsByStatus.cancelled?.length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {workflowId ? 'Workflow Executions' : 'Executions'}
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage workflow execution runs
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <StatusIndicator type="compact" showLabel />
          
          {systemStatus.activeExecutions > 0 && (
            <div className="text-xs text-muted-foreground">
              {systemStatus.activeExecutions} active
            </div>
          )}
          
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{statusCounts.running}</div>
          <div className="text-xs text-muted-foreground">Running</div>
        </div>
        <div className="bg-card rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </div>
        <div className="bg-card rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
          <div className="text-xs text-muted-foreground">Completed</div>
        </div>
        <div className="bg-card rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{statusCounts.failed}</div>
          <div className="text-xs text-muted-foreground">Failed</div>
        </div>
        <div className="bg-card rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">{statusCounts.cancelled}</div>
          <div className="text-xs text-muted-foreground">Cancelled</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search executions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="waiting_for_approval">Waiting Approval</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg border p-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-48"></div>
                  <div className="h-3 bg-muted rounded w-32"></div>
                </div>
                <div className="h-6 bg-muted rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Executions list */}
      {!isLoading && (
        <>
          {executions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No executions match your filters' 
                  : 'No executions yet'}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {executions.map((execution) => (
                <ExecutionCard
                  key={execution.id}
                  execution={execution}
                  onView={() => onViewExecution?.(execution)}
                  onCancel={() => handleCancelExecution(execution)}
                  isLoading={cancelExecutionMutation.isPending}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, data?.total || 0)} of {data?.total || 0} results
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}