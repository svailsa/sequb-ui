"use client";

import { useState } from "react";
import { WorkflowList } from "@/components/workflow/workflow-list";
import { WorkflowEditorWithProvider } from "@/components/workflow/workflow-editor";
import { Workflow } from "@/types/sequb";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type ViewMode = 'list' | 'editor' | 'view';

export default function WorkflowsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  const handleSave = async (nodes: any[], edges: any[]) => {
    console.log('Saving workflow:', { nodes, edges });
    // TODO: Implement actual workflow save logic using API
    return Promise.resolve();
  };

  const handleExecute = async () => {
    console.log('Executing workflow...');
    // TODO: Implement actual workflow execution logic using API
    return Promise.resolve();
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