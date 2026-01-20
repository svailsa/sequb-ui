"use client";

import { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Connection,
  ReactFlowProvider,
  ReactFlowInstance,
  NodeMouseHandler,
} from 'reactflow';
import { Button } from '@/components/ui/button';
import { Save, Play, Trash2 } from 'lucide-react';
import { useNodeRegistryStore } from '@/stores/node-registry-store';
import { WorkflowNode as SequbWorkflowNode, NodeType } from '@/types/sequb';
import { NodePalette } from './node-palette';
import { CustomNode } from './custom-node';
import { NodeConfigModal } from './node-config-modal';

import 'reactflow/dist/style.css';

const nodeTypes = {
  customNode: CustomNode,
};

interface WorkflowEditorProps {
  workflowId?: string;
  onSave?: (nodes: SequbWorkflowNode[], edges: any[]) => Promise<void>;
  onExecute?: () => Promise<void>;
}

export function WorkflowEditor({ workflowId, onSave, onExecute }: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance>();
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Node configuration modal state
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType | null>(null);
  const [selectedNodeConfig, setSelectedNodeConfig] = useState<Record<string, any>>({});
  
  const { getNodeType } = useNodeRegistryStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeTypeId = event.dataTransfer.getData('application/reactflow');
      const nodeType = getNodeType(nodeTypeId);

      if (typeof nodeTypeId === 'undefined' || !nodeType || !reactFlowWrapper.current) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance?.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      if (!position) return;

      const newNode: Node = {
        id: `${nodeTypeId}_${Date.now()}`,
        type: 'customNode',
        position,
        data: {
          nodeType: nodeType,
          inputs: {},
          label: nodeType.name,
          isConfigured: false,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, getNodeType, setNodes]
  );

  const onNodeDoubleClick: NodeMouseHandler = useCallback((event, node) => {
    const nodeType = node.data.nodeType;
    if (nodeType) {
      setSelectedNodeId(node.id);
      setSelectedNodeType(nodeType);
      setSelectedNodeConfig(node.data.inputs || {});
      setConfigModalOpen(true);
    }
  }, []);

  const handleNodeConfigSave = useCallback((config: Record<string, any>) => {
    if (selectedNodeId) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  inputs: config,
                  isConfigured: Object.keys(config).length > 0,
                }
              }
            : node
        )
      );
    }
    setSelectedNodeId(null);
    setSelectedNodeType(null);
    setSelectedNodeConfig({});
  }, [selectedNodeId, setNodes]);

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      const sequbNodes: SequbWorkflowNode[] = nodes.map(node => ({
        id: node.id,
        type: node.data.nodeType.id,
        position: node.position,
        data: node.data.inputs || {},
        label: node.data.label,
      }));

      const sequbEdges = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
      }));

      await onSave(sequbNodes, sequbEdges);
    } catch (error) {
      console.error('Failed to save workflow:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecute = async () => {
    if (!onExecute) return;

    setIsExecuting(true);
    try {
      await onExecute();
    } catch (error) {
      console.error('Failed to execute workflow:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const clearWorkflow = () => {
    setNodes([]);
    setEdges([]);
  };

  return (
    <div className="h-full flex">
      {/* Node Palette */}
      <div className="w-64 border-r border-border">
        <NodePalette />
      </div>

      {/* Workflow Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b border-border p-3 flex items-center justify-between bg-muted/30">
          <div className="flex items-center space-x-2">
            <h2 className="font-semibold">Workflow Editor</h2>
            {workflowId && (
              <span className="text-sm text-muted-foreground">ID: {workflowId}</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearWorkflow}
              disabled={nodes.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || nodes.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              size="sm"
              onClick={handleExecute}
              disabled={isExecuting || nodes.length === 0}
            >
              <Play className="w-4 h-4 mr-2" />
              {isExecuting ? 'Running...' : 'Execute'}
            </Button>
          </div>
        </div>

        {/* React Flow */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={onInit}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeDoubleClick={onNodeDoubleClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="top-right"
          >
            <MiniMap />
            <Controls />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>

        {/* Status Bar */}
        <div className="border-t border-border p-2 bg-muted/30 text-xs text-muted-foreground flex items-center justify-between">
          <div>
            Nodes: {nodes.length} | Connections: {edges.length}
          </div>
          <div>
            Drag nodes from the palette to build your workflow
          </div>
        </div>
      </div>

      {/* Node Configuration Modal */}
      {selectedNodeType && (
        <NodeConfigModal
          open={configModalOpen}
          onOpenChange={setConfigModalOpen}
          nodeType={selectedNodeType}
          initialValues={selectedNodeConfig}
          onSave={handleNodeConfigSave}
        />
      )}
    </div>
  );
}

export function WorkflowEditorWithProvider(props: WorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <WorkflowEditor {...props} />
    </ReactFlowProvider>
  );
}