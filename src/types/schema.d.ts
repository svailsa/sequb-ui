export interface NodeInput {
  key: string
  widget: 'text' | 'textarea' | 'select' | 'code' | 'model_picker' | 'number' | 'checkbox'
  label: string
  options?: Array<{ value: string; label: string }>
  defaultValue?: any
}

export interface NodeOutput {
  key: string
  label: string
}

export interface NodeDefinition {
  label: string
  category: string
  icon?: string
  inputs: NodeInput[]
  outputs: NodeOutput[]
}

export interface Registry {
  categories: string[]
  nodes: Record<string, NodeDefinition>
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