"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WorkflowCard } from './workflow-card';
import { api } from '@/services/api';
import { Workflow, PaginatedResponse } from '@/types/sequb';
import { Plus, Search, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WorkflowListProps {
  onCreateWorkflow?: () => void;
  onEditWorkflow?: (workflow: Workflow) => void;
  onViewWorkflow?: (workflow: Workflow) => void;
}

export function WorkflowList({ 
  onCreateWorkflow, 
  onEditWorkflow, 
  onViewWorkflow 
}: WorkflowListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const perPage = 12;

  const queryClient = useQueryClient();

  // Fetch workflows with filters
  const { data, isLoading, error } = useQuery<PaginatedResponse<Workflow>>({
    queryKey: ['workflows', page, perPage, statusFilter, searchTerm],
    queryFn: async () => {
      const params: any = { page, per_page: perPage };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      
      const response = await api.workflows.list(params);
      return response.data;
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  // Delete workflow mutation
  const deleteWorkflowMutation = useMutation({
    mutationFn: (workflowId: string) => api.workflows.delete(workflowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  // Clone workflow mutation
  const cloneWorkflowMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => 
      api.workflows.clone(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  // Status change mutations
  const activateWorkflowMutation = useMutation({
    mutationFn: (workflowId: string) => api.workflows.activate(workflowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const pauseWorkflowMutation = useMutation({
    mutationFn: (workflowId: string) => api.workflows.pause(workflowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const archiveWorkflowMutation = useMutation({
    mutationFn: (workflowId: string) => api.workflows.archive(workflowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const handleDeleteWorkflow = async (workflow: Workflow) => {
    if (window.confirm(`Are you sure you want to delete "${workflow.name}"?`)) {
      try {
        await deleteWorkflowMutation.mutateAsync(workflow.id);
      } catch (error) {
        console.error('Failed to delete workflow:', error);
      }
    }
  };

  const handleCloneWorkflow = async (workflow: Workflow) => {
    const newName = prompt('Enter name for cloned workflow:', `${workflow.name} (Copy)`);
    if (newName && newName.trim()) {
      try {
        await cloneWorkflowMutation.mutateAsync({ id: workflow.id, name: newName.trim() });
      } catch (error) {
        console.error('Failed to clone workflow:', error);
      }
    }
  };

  const handleStatusChange = async (workflow: Workflow, newStatus: 'active' | 'paused' | 'archived') => {
    try {
      switch (newStatus) {
        case 'active':
          await activateWorkflowMutation.mutateAsync(workflow.id);
          break;
        case 'paused':
          await pauseWorkflowMutation.mutateAsync(workflow.id);
          break;
        case 'archived':
          await archiveWorkflowMutation.mutateAsync(workflow.id);
          break;
      }
    } catch (error) {
      console.error('Failed to change workflow status:', error);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Failed to load workflows</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['workflows'] })}>
          Retry
        </Button>
      </div>
    );
  }

  const workflows = data?.data || [];
  const totalPages = data ? Math.ceil(data.total / data.per_page) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">
            Manage and monitor your workflow automations
          </p>
        </div>
        <Button onClick={onCreateWorkflow}>
          <Plus className="w-4 h-4 mr-2" />
          New Workflow
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search workflows..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg border p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          ))}
        </div>
      )}

      {/* Workflows grid */}
      {!isLoading && (
        <>
          {workflows.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No workflows match your filters' 
                  : 'No workflows yet'}
              </div>
              {(!searchTerm && statusFilter === 'all') && (
                <Button onClick={onCreateWorkflow}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first workflow
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onEdit={() => onEditWorkflow?.(workflow)}
                  onView={() => onViewWorkflow?.(workflow)}
                  onDelete={() => handleDeleteWorkflow(workflow)}
                  onClone={() => handleCloneWorkflow(workflow)}
                  onStatusChange={(status) => handleStatusChange(workflow, status)}
                  isLoading={
                    deleteWorkflowMutation.isPending || 
                    cloneWorkflowMutation.isPending ||
                    activateWorkflowMutation.isPending ||
                    pauseWorkflowMutation.isPending ||
                    archiveWorkflowMutation.isPending
                  }
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