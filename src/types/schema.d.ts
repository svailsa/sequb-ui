export interface NodeInput {
  key: string
  type: 'text' | 'textarea' | 'select' | 'code' | 'model_picker' | 'number' | 'checkbox' | 'any'
  label: string
  required?: boolean
  options?: Array<{ value: string; label: string }>
  default?: any
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