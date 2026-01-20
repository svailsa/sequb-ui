"use client";

import { useState } from "react";
import { ExecutionList } from "@/components/execution/execution-list";
import { ExecutionDetails } from "@/components/execution/execution-details";
import { Execution } from "@/types/sequb";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type ViewMode = 'list' | 'details';

export default function ExecutionsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);

  const handleViewExecution = (execution: Execution) => {
    setSelectedExecution(execution);
    setViewMode('details');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedExecution(null);
  };

  if (viewMode === 'details' && selectedExecution) {
    return (
      <div className="h-screen w-full flex flex-col">
        {/* Header with back button */}
        <div className="border-b border-border p-4 bg-background">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={handleBackToList}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Executions
            </Button>
            <div>
              <h1 className="text-lg font-semibold">
                Execution Details
              </h1>
              <p className="text-sm text-muted-foreground">
                {selectedExecution.id}
              </p>
            </div>
          </div>
        </div>

        {/* Execution Details */}
        <div className="flex-1">
          <ExecutionDetails
            execution={selectedExecution}
            onClose={handleBackToList}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <ExecutionList
        onViewExecution={handleViewExecution}
      />
    </div>
  );
}