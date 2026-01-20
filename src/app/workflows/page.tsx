import { Suspense } from "react";
import { WorkflowEditorWithProvider } from "@/components/workflow/workflow-editor";

export default function WorkflowsPage() {
  const handleSave = async (nodes: any[], edges: any[]) => {
    console.log('Saving workflow:', { nodes, edges });
    // TODO: Implement actual workflow save logic
    return Promise.resolve();
  };

  const handleExecute = async () => {
    console.log('Executing workflow...');
    // TODO: Implement actual workflow execution logic
    return Promise.resolve();
  };

  return (
    <div className="h-screen w-full">
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Loading workflow editor...</div>
        </div>
      }>
        <WorkflowEditorWithProvider
          onSave={handleSave}
          onExecute={handleExecute}
        />
      </Suspense>
    </div>
  );
}