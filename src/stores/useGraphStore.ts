import { create } from 'zustand'
import { Node, Edge, Connection, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react'

interface GraphStore {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  
  // Node operations
  addNode: (node: Node) => void
  updateNode: (nodeId: string, data: any) => void
  deleteNode: (nodeId: string) => void
  onNodesChange: (changes: NodeChange[]) => void
  
  // Edge operations
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  
  // Selection
  setSelectedNode: (nodeId: string | null) => void
  
  // Workflow operations
  loadWorkflow: (nodes: Node[], edges: Edge[]) => void
  clearWorkflow: () => void
}

export const useGraphStore = create<GraphStore>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  
  addNode: (node) => {
    set((state) => ({
      nodes: [...state.nodes, node],
    }))
  },
  
  updateNode: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
    }))
  },
  
  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }))
  },
  
  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }))
  },
  
  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }))
  },
  
  onConnect: (connection) => {
    if (!connection.source || !connection.target) return
    
    const id = `${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}`
    const newEdge: Edge = {
      id,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    }
    
    set((state) => ({
      edges: [...state.edges, newEdge],
    }))
  },
  
  setSelectedNode: (nodeId) => {
    set({ selectedNodeId: nodeId })
  },
  
  loadWorkflow: (nodes, edges) => {
    set({ nodes, edges, selectedNodeId: null })
  },
  
  clearWorkflow: () => {
    set({ nodes: [], edges: [], selectedNodeId: null })
  },
}))