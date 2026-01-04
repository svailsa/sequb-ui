import { useCallback, useMemo } from 'react'
import { ReactFlow } from '@xyflow/react'
import {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Node,
  NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useGraphStore } from '@/stores/useGraphStore'
import { UniversalNode } from './UniversalNode'
import { validateDragNodeType, validateNode } from '@/lib/validation/validators'
import { sanitizeNodeType } from '@/lib/validation/sanitizers'

export function GraphCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNode,
  } = useGraphStore()
  
  const nodeTypes = useMemo<NodeTypes>(
    () => ({
      default: UniversalNode,
    }),
    []
  )
  
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id)
  }, [setSelectedNode])
  
  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [setSelectedNode])
  
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      
      const rawNodeType = event.dataTransfer.getData('application/sequb-node')
      if (!rawNodeType) return
      
      // Validate and sanitize the node type
      const validatedNodeType = validateDragNodeType(rawNodeType)
      if (!validatedNodeType) {
        console.error('Invalid node type:', rawNodeType)
        return
      }
      
      const sanitizedNodeType = sanitizeNodeType(validatedNodeType)
      
      const reactFlowBounds = (event.target as HTMLElement)
        .closest('.react-flow')
        ?.getBoundingClientRect()
      
      if (!reactFlowBounds) return
      
      const position = {
        x: Math.max(0, Math.min(5000, event.clientX - reactFlowBounds.left)), // Limit position
        y: Math.max(0, Math.min(5000, event.clientY - reactFlowBounds.top)),
      }
      
      const newNode: Node = {
        id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'default',
        position,
        data: { nodeType: sanitizedNodeType },
      }
      
      try {
        // Validate the entire node structure
        validateNode(newNode)
        useGraphStore.getState().addNode(newNode)
      } catch (error) {
        console.error('Invalid node structure:', error)
      }
    },
    []
  )
  
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])
  
  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap 
          nodeStrokeColor={() => '#666'}
          nodeColor={() => '#fff'}
          nodeBorderRadius={2}
        />
      </ReactFlow>
    </div>
  )
}