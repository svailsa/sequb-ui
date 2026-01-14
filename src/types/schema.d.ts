export interface NodeInput {
  key: string
  type: 'text' | 'textarea' | 'select' | 'code' | 'model_picker' | 'number' | 'checkbox' | 'any'
  label: string
  required?: boolean
  options?: Array<{ value: string; label: string }>
  default?: any
  // Support for dynamic options fetched from backend
  dynamicOptions?: {
    endpoint: string // e.g., "/api/v1/options/slack_channels"
    dependsOn?: string // e.g., "connection_id" - re-fetch when this input changes
    cache?: boolean // Whether to cache the fetched options (default: true)
  }
}

export interface NodeOutput {
  key: string
  label: string
  type: 'text' | 'number' | 'object' | 'any'
}

export interface NodeDefinition {
  id: string
  label: string
  category: string
  icon?: string
  inputs: NodeInput[]
  outputs: NodeOutput[]
}

export interface Registry {
  nodes: Record<string, NodeDefinition>
  plugins: string[]
}

export interface WorkflowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, any>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

export interface Workflow {
  id: string
  name: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export interface ExecutionStatus {
  runId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress?: number
  logs?: string[]
  error?: string
}