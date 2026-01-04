/**
 * Type-safe Zustand store with Immer
 */

import { create, StateCreator } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'
import { Connection, NodeChange, EdgeChange } from '@xyflow/react'
import { 
  NodeId, EdgeId, WorkflowId, NodeType,
  createNodeId, createEdgeId
} from '@/types/branded'
import { 
  WorkflowNode, WorkflowEdge, Workflow,
  WorkflowNodeSchema, WorkflowEdgeSchema
} from '@/types/strict-schema'
import { parseOrThrow, isDefined } from '@/lib/type-helpers'

/**
 * Graph store state interface with strict types
 */
export interface GraphState {
  // Core state
  readonly nodes: Map<NodeId, WorkflowNode>
  readonly edges: Map<EdgeId, WorkflowEdge>
  readonly selectedNodeIds: Set<NodeId>
  readonly hoveredNodeId: NodeId | null
  
  // Workflow metadata
  readonly workflowId: WorkflowId | null
  readonly workflowName: string
  readonly isDirty: boolean
  
  // Validation state
  readonly validationErrors: Map<NodeId, string[]>
  
  // History for undo/redo
  readonly history: {
    past: Array<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }>
    future: Array<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }>
  }
}

/**
 * Graph store actions with strict typing
 */
export interface GraphActions {
  // Node operations
  addNode: (node: Omit<WorkflowNode, 'id'>) => NodeId
  updateNode: (id: NodeId, updates: Partial<WorkflowNode['data']>) => void
  deleteNode: (id: NodeId) => void
  deleteNodes: (ids: NodeId[]) => void
  
  // Edge operations  
  addEdge: (edge: Omit<WorkflowEdge, 'id'>) => EdgeId
  updateEdge: (id: EdgeId, updates: Partial<WorkflowEdge>) => void
  deleteEdge: (id: EdgeId) => void
  deleteEdges: (ids: EdgeId[]) => void
  
  // Selection
  selectNode: (id: NodeId, multi?: boolean) => void
  selectNodes: (ids: NodeId[]) => void
  clearSelection: () => void
  
  // Hover
  setHoveredNode: (id: NodeId | null) => void
  
  // Workflow operations
  loadWorkflow: (workflow: Workflow) => void
  clearWorkflow: () => void
  markClean: () => void
  
  // Validation
  validateNode: (id: NodeId) => void
  validateAllNodes: () => void
  
  // History
  undo: () => void
  redo: () => void
  saveSnapshot: () => void
  
  // ReactFlow handlers (type-safe)
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  
  // Getters (computed values)
  getNode: (id: NodeId) => WorkflowNode | undefined
  getEdge: (id: EdgeId) => WorkflowEdge | undefined
  getNodesByType: (type: NodeType) => WorkflowNode[]
  getConnectedEdges: (nodeId: NodeId) => WorkflowEdge[]
  canUndo: () => boolean
  canRedo: () => boolean
}

export type GraphStore = GraphState & GraphActions

/**
 * Create the store with all middleware
 */
const storeCreator: StateCreator<
  GraphStore,
  [['zustand/immer', never], ['zustand/devtools', never], ['zustand/subscribeWithSelector', never]],
  [],
  GraphStore
> = (set, get) => ({
  // Initial state
  nodes: new Map(),
  edges: new Map(),
  selectedNodeIds: new Set(),
  hoveredNodeId: null,
  workflowId: null,
  workflowName: 'Untitled Workflow',
  isDirty: false,
  validationErrors: new Map(),
  history: {
    past: [],
    future: []
  },
  
  // Node operations
  addNode: (nodeData) => {
    const id = createNodeId(`node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
    const node: WorkflowNode = {
      ...nodeData,
      id,
      type: 'default' as const
    }
    
    // Validate node structure
    parseOrThrow(WorkflowNodeSchema, node)
    
    set((state) => {
      state.nodes.set(id, node)
      state.isDirty = true
    })
    
    get().saveSnapshot()
    return id
  },
  
  updateNode: (id, updates) => {
    set((state) => {
      const node = state.nodes.get(id)
      if (node) {
        // Type-safe update
        const updated: WorkflowNode = {
          ...node,
          data: {
            ...node.data,
            ...updates
          }
        }
        state.nodes.set(id, updated)
        state.isDirty = true
      }
    })
  },
  
  deleteNode: (id) => {
    set((state) => {
      state.nodes.delete(id)
      state.selectedNodeIds.delete(id)
      if (state.hoveredNodeId === id) {
        state.hoveredNodeId = null
      }
      
      // Delete connected edges
      const edgesToDelete: EdgeId[] = []
      state.edges.forEach((edge, edgeId) => {
        if (edge.source === id || edge.target === id) {
          edgesToDelete.push(edgeId)
        }
      })
      edgesToDelete.forEach(edgeId => state.edges.delete(edgeId))
      
      state.validationErrors.delete(id)
      state.isDirty = true
    })
    
    get().saveSnapshot()
  },
  
  deleteNodes: (ids) => {
    ids.forEach(id => get().deleteNode(id))
  },
  
  // Edge operations
  addEdge: (edgeData) => {
    const id = createEdgeId(
      `${edgeData.source}-${edgeData.sourceHandle || 'default'}-${edgeData.target}-${edgeData.targetHandle || 'default'}`
    )
    const edge: WorkflowEdge = {
      ...edgeData,
      id
    }
    
    // Validate edge structure
    parseOrThrow(WorkflowEdgeSchema, edge)
    
    set((state) => {
      state.edges.set(id, edge)
      state.isDirty = true
    })
    
    get().saveSnapshot()
    return id
  },
  
  updateEdge: (id, updates) => {
    set((state) => {
      const edge = state.edges.get(id)
      if (edge) {
        const updated: WorkflowEdge = {
          ...edge,
          ...updates
        }
        state.edges.set(id, updated)
        state.isDirty = true
      }
    })
  },
  
  deleteEdge: (id) => {
    set((state) => {
      state.edges.delete(id)
      state.isDirty = true
    })
    get().saveSnapshot()
  },
  
  deleteEdges: (ids) => {
    ids.forEach(id => get().deleteEdge(id))
  },
  
  // Selection
  selectNode: (id, multi = false) => {
    set((state) => {
      if (!multi) {
        state.selectedNodeIds.clear()
      }
      state.selectedNodeIds.add(id)
    })
  },
  
  selectNodes: (ids) => {
    set((state) => {
      state.selectedNodeIds = new Set(ids)
    })
  },
  
  clearSelection: () => {
    set((state) => {
      state.selectedNodeIds.clear()
    })
  },
  
  setHoveredNode: (id) => {
    set((state) => {
      state.hoveredNodeId = id
    })
  },
  
  // Workflow operations
  loadWorkflow: (workflow) => {
    set((state) => {
      state.nodes.clear()
      state.edges.clear()
      state.selectedNodeIds.clear()
      state.validationErrors.clear()
      
      workflow.nodes.forEach(node => {
        state.nodes.set(node.id, node)
      })
      
      workflow.edges.forEach(edge => {
        state.edges.set(edge.id, edge)
      })
      
      state.workflowId = workflow.id
      state.workflowName = workflow.name
      state.isDirty = false
      state.history = { past: [], future: [] }
    })
  },
  
  clearWorkflow: () => {
    set((state) => {
      state.nodes.clear()
      state.edges.clear()
      state.selectedNodeIds.clear()
      state.validationErrors.clear()
      state.workflowId = null
      state.workflowName = 'Untitled Workflow'
      state.isDirty = false
      state.history = { past: [], future: [] }
    })
  },
  
  markClean: () => {
    set((state) => {
      state.isDirty = false
    })
  },
  
  // Validation
  validateNode: (id) => {
    const node = get().nodes.get(id)
    if (!node) return
    
    const errors: string[] = []
    
    // Add validation logic here
    if (!node.data.nodeType) {
      errors.push('Node type is required')
    }
    
    set((state) => {
      if (errors.length > 0) {
        state.validationErrors.set(id, errors)
      } else {
        state.validationErrors.delete(id)
      }
    })
  },
  
  validateAllNodes: () => {
    get().nodes.forEach((_, id) => get().validateNode(id))
  },
  
  // History
  saveSnapshot: () => {
    const nodes = Array.from(get().nodes.values())
    const edges = Array.from(get().edges.values())
    
    set((state) => {
      state.history.past.push({ nodes, edges })
      if (state.history.past.length > 50) {
        state.history.past.shift()
      }
      state.history.future = []
    })
  },
  
  undo: () => {
    const { past } = get().history
    if (past.length === 0) return
    
    const previous = past[past.length - 1]
    if (!previous) return
    
    const current = {
      nodes: Array.from(get().nodes.values()),
      edges: Array.from(get().edges.values())
    }
    
    set((state) => {
      state.history.past.pop()
      state.history.future.push(current)
      
      state.nodes.clear()
      state.edges.clear()
      
      previous.nodes.forEach(node => {
        state.nodes.set(node.id, node)
      })
      
      previous.edges.forEach(edge => {
        state.edges.set(edge.id, edge)
      })
      
      state.isDirty = true
    })
  },
  
  redo: () => {
    const { future } = get().history
    if (future.length === 0) return
    
    const next = future[future.length - 1]
    if (!next) return
    
    const current = {
      nodes: Array.from(get().nodes.values()),
      edges: Array.from(get().edges.values())
    }
    
    set((state) => {
      state.history.future.pop()
      state.history.past.push(current)
      
      state.nodes.clear()
      state.edges.clear()
      
      next.nodes.forEach(node => {
        state.nodes.set(node.id, node)
      })
      
      next.edges.forEach(edge => {
        state.edges.set(edge.id, edge)
      })
      
      state.isDirty = true
    })
  },
  
  // ReactFlow handlers - these would need proper implementation
  onNodesChange: () => {
    // Implementation depends on ReactFlow integration
  },
  
  onEdgesChange: () => {
    // Implementation depends on ReactFlow integration
  },
  
  onConnect: (connection) => {
    if (!connection.source || !connection.target) return
    
    get().addEdge({
      source: connection.source as NodeId,
      target: connection.target as NodeId,
      sourceHandle: connection.sourceHandle || undefined,
      targetHandle: connection.targetHandle || undefined
    })
  },
  
  // Getters
  getNode: (id) => get().nodes.get(id),
  
  getEdge: (id) => get().edges.get(id),
  
  getNodesByType: (type) => {
    return Array.from(get().nodes.values()).filter(
      node => node.data.nodeType === type
    )
  },
  
  getConnectedEdges: (nodeId) => {
    return Array.from(get().edges.values()).filter(
      edge => edge.source === nodeId || edge.target === nodeId
    )
  },
  
  canUndo: () => get().history.past.length > 0,
  
  canRedo: () => get().history.future.length > 0
})

/**
 * Create the store with all middleware
 */
export const useGraphStore = create<GraphStore>()(
  devtools(
    immer(storeCreator),
    {
      name: 'graph-store'
    }
  )
)

/**
 * Selectors for efficient re-renders
 */
export const graphSelectors = {
  nodes: (state: GraphStore) => Array.from(state.nodes.values()),
  edges: (state: GraphStore) => Array.from(state.edges.values()),
  selectedNodes: (state: GraphStore) => 
    Array.from(state.selectedNodeIds)
      .map(id => state.nodes.get(id))
      .filter(isDefined),
  nodeCount: (state: GraphStore) => state.nodes.size,
  edgeCount: (state: GraphStore) => state.edges.size,
  hasSelection: (state: GraphStore) => state.selectedNodeIds.size > 0,
  hasValidationErrors: (state: GraphStore) => state.validationErrors.size > 0
}