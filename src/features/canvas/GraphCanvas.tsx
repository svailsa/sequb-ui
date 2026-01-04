import React, { useCallback, useMemo } from 'react'
import ReactFlow, {
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
      
      const nodeType = event.dataTransfer.getData('application/sequb-node')
      if (!nodeType) return
      
      const reactFlowBounds = (event.target as HTMLElement)
        .closest('.react-flow')
        ?.getBoundingClientRect()
      
      if (!reactFlowBounds) return
      
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      }
      
      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'default',
        position,
        data: { nodeType },
      }
      
      useGraphStore.getState().addNode(newNode)
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
          nodeStrokeColor={(n) => '#666'}
          nodeColor={(n) => '#fff'}
          nodeBorderRadius={2}
        />
      </ReactFlow>
    </div>
  )
}