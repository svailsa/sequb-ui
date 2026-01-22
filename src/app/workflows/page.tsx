"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { WorkflowList } from "@/components/workflow/workflow-list";
import { WorkflowEditorWithProvider } from "@/components/workflow/workflow-editor";
import { Workflow } from "@/types/sequb";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { api } from "@/services/api";
import { logger } from "@/services/monitoring/logger";
import { validateWorkflow, formatValidationErrors } from "@/services/validation/validation";

type ViewMode = 'list' | 'editor' | 'view';

export default function WorkflowsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const queryClient = useQueryClient();

  // Workflow save mutation
  const saveWorkflowMutation = useMutation({
    mutationFn: async ({ nodes, edges }: { nodes: any[], edges: any[] }) => {
      const workflowData = {
        name: selectedWorkflow?.name || 'New Workflow',
        description: selectedWorkflow?.description || '',
        graph: {
          nodes: nodes.map(node => ({
            id: node.id,
            type: node.data.nodeType.id,
            position: node.position,
            data: node.data.inputs || {},
            label: node.data.label || node.data.nodeType.name,
          })),
          edges: edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            label: edge.label,
          })),
        },
      };

      // Validate workflow against backend schema
      const validation = await validateWorkflow(workflowData);
      if (!validation.valid) {
        const errorMessage = formatValidationErrors(validation.errors);
        logger.error('Workflow validation failed:', errorMessage);
        throw new Error(`Validation failed:\n${errorMessage}`);
      }

      if (selectedWorkflow?.id) {
        // Update existing workflow
        const response = await api.workflows.update(selectedWorkflow.id, workflowData);
        return response.data;
      } else {
        // Create new workflow
        const response = await api.workflows.create(workflowData);
        return response.data;
      }
    },
    onSuccess: (data) => {
      logger.info('Workflow saved successfully:', data);
      // Update the selected workflow with the returned data
      if (data.data) {
        setSelectedWorkflow(data.data);
      }
      // Invalidate workflows cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
    onError: (error) => {
      logger.error('Failed to save workflow:', error);
    },
  });

  // Workflow execute mutation
  const executeWorkflowMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWorkflow?.id) {
        throw new Error('No workflow selected for execution');
      }
      const response = await api.workflows.execute(selectedWorkflow.id);
      return response.data;
    },
    onSuccess: (data) => {
      logger.info('Workflow execution started:', data);
      // Invalidate executions cache to show the new execution
      queryClient.invalidateQueries({ queryKey: ['executions'] });
    },
    onError: (error) => {
      logger.error('Failed to execute workflow:', error);
    },
  });

  const handleSave = async (nodes: any[], edges: any[]) => {
    await saveWorkflowMutation.mutateAsync({ nodes, edges });
  };

  const handleExecute = async () => {
    await executeWorkflowMutation.mutateAsync();
  };

  const handleCreateWorkflow = () => {
    setSelectedWorkflow(null);
    setViewMode('editor');
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setViewMode('editor');
  };

  const handleViewWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setViewMode('view');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedWorkflow(null);
  };

  if (viewMode === 'editor' || viewMode === 'view') {
    return (
      <div className="h-screen w-full flex flex-col">
        {/* Header with back button */}
        <div className="border-b border-border p-4 bg-background">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={handleBackToList}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Workflows
            </Button>
            <div>
              <h1 className="text-lg font-semibold">
                {viewMode === 'editor' 
                  ? (selectedWorkflow ? `Edit: ${selectedWorkflow.name}` : 'New Workflow')
                  : `View: ${selectedWorkflow?.name}`}
              </h1>
              {selectedWorkflow?.description && (
                <p className="text-sm text-muted-foreground">{selectedWorkflow.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Workflow Editor */}
        <div className="flex-1">
          <WorkflowEditorWithProvider
            workflowId={selectedWorkflow?.id}
            onSave={handleSave}
            onExecute={handleExecute}
            isSaving={saveWorkflowMutation.isPending}
            isExecuting={executeWorkflowMutation.isPending}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <WorkflowList
        onCreateWorkflow={handleCreateWorkflow}
        onEditWorkflow={handleEditWorkflow}
        onViewWorkflow={handleViewWorkflow}
      />
    </div>
  );
}