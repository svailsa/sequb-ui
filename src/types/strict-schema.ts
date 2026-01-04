import { z } from 'zod'
import { 
  NodeId, EdgeId, WorkflowId, RunId, PluginId,
  NodeType, Percentage, Timestamp
} from './branded'

/**
 * Strict type definitions with runtime validation
 * These types are automatically inferred from Zod schemas
 */

// Widget types as const for exhaustive checking
export const WIDGET_TYPES = [
  'text',
  'textarea', 
  'select',
  'code',
  'model_picker',
  'number',
  'checkbox'
] as const

export type WidgetType = typeof WIDGET_TYPES[number]

// Execution status as discriminated union
export const EXECUTION_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
} as const

export type ExecutionStatusType = typeof EXECUTION_STATUS[keyof typeof EXECUTION_STATUS]

// Node Input Schema with strict validation
export const NodeInputSchema = z.object({
  key: z.string().min(1).max(50),
  widget: z.enum(WIDGET_TYPES),
  label: z.string().min(1).max(255),
  required: z.boolean().optional(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string()
  })).optional(),
  defaultValue: z.unknown().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional()
  }).optional()
})

export type NodeInput = z.infer<typeof NodeInputSchema>

// Node Output Schema
export const NodeOutputSchema = z.object({
  key: z.string().min(1).max(50),
  label: z.string().min(1).max(255),
  type: z.enum(['string', 'number', 'boolean', 'object', 'array']).optional()
})

export type NodeOutput = z.infer<typeof NodeOutputSchema>

// Node Definition Schema
export const NodeDefinitionSchema = z.object({
  label: z.string().min(1).max(255),
  category: z.string().min(1).max(100),
  icon: z.string().optional(),
  description: z.string().optional(),
  inputs: z.array(NodeInputSchema),
  outputs: z.array(NodeOutputSchema),
  maxInstances: z.number().optional(),
  deprecated: z.boolean().optional()
})

export type NodeDefinition = z.infer<typeof NodeDefinitionSchema>

// Registry Schema
export const RegistrySchema = z.object({
  version: z.string(),
  categories: z.array(z.string()),
  nodes: z.record(z.string(), NodeDefinitionSchema)
})

export type Registry = z.infer<typeof RegistrySchema>

// Position Schema
export const PositionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite()
})

export type Position = z.infer<typeof PositionSchema>

// Workflow Node Schema with branded types
export const WorkflowNodeSchema = z.object({
  id: z.string().transform(id => id as NodeId),
  type: z.literal('default'),
  position: PositionSchema,
  data: z.object({
    nodeType: z.string().transform(type => type as NodeType),
    label: z.string().optional(),
    // Dynamic properties based on node definition
    properties: z.record(z.string(), z.unknown()).optional()
  })
})

export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>

// Workflow Edge Schema with branded types
export const WorkflowEdgeSchema = z.object({
  id: z.string().transform(id => id as EdgeId),
  source: z.string().transform(id => id as NodeId),
  target: z.string().transform(id => id as NodeId),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  animated: z.boolean().optional(),
  style: z.record(z.string(), z.unknown()).optional()
})

export type WorkflowEdge = z.infer<typeof WorkflowEdgeSchema>

// Workflow Schema
export const WorkflowSchema = z.object({
  id: z.string().transform(id => id as WorkflowId),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  nodes: z.array(WorkflowNodeSchema).max(1000),
  edges: z.array(WorkflowEdgeSchema).max(5000),
  metadata: z.object({
    createdAt: z.number().transform(ts => ts as Timestamp),
    updatedAt: z.number().transform(ts => ts as Timestamp),
    version: z.string(),
    tags: z.array(z.string()).optional()
  }).optional()
})

export type Workflow = z.infer<typeof WorkflowSchema>

// Execution Status Schema as discriminated union
export const ExecutionStatusSchema = z.discriminatedUnion('status', [
  z.object({
    runId: z.string().transform(id => id as RunId),
    status: z.literal(EXECUTION_STATUS.PENDING),
    queuePosition: z.number().optional()
  }),
  z.object({
    runId: z.string().transform(id => id as RunId),
    status: z.literal(EXECUTION_STATUS.RUNNING),
    progress: z.number().transform(p => p as Percentage),
    currentNode: z.string().transform(id => id as NodeId).optional(),
    startedAt: z.number().transform(ts => ts as Timestamp)
  }),
  z.object({
    runId: z.string().transform(id => id as RunId),
    status: z.literal(EXECUTION_STATUS.COMPLETED),
    result: z.unknown(),
    startedAt: z.number().transform(ts => ts as Timestamp),
    completedAt: z.number().transform(ts => ts as Timestamp),
    duration: z.number()
  }),
  z.object({
    runId: z.string().transform(id => id as RunId),
    status: z.literal(EXECUTION_STATUS.FAILED),
    error: z.object({
      message: z.string(),
      code: z.string().optional(),
      nodeId: z.string().transform(id => id as NodeId).optional(),
      stack: z.string().optional()
    }),
    startedAt: z.number().transform(ts => ts as Timestamp),
    failedAt: z.number().transform(ts => ts as Timestamp)
  }),
  z.object({
    runId: z.string().transform(id => id as RunId),
    status: z.literal(EXECUTION_STATUS.CANCELLED),
    cancelledAt: z.number().transform(ts => ts as Timestamp),
    reason: z.string().optional()
  })
])

export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>

// Plugin Schema
export const PluginSchema = z.object({
  id: z.string().transform(id => id as PluginId),
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  checksum: z.string(),
  size: z.number(),
  nodeTypes: z.array(z.string().transform(type => type as NodeType)),
  permissions: z.array(z.string()).optional(),
  uploadedAt: z.number().transform(ts => ts as Timestamp),
  enabled: z.boolean()
})

export type Plugin = z.infer<typeof PluginSchema>

// API Response wrappers
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.unknown().optional()
  }).optional(),
  metadata: z.object({
    requestId: z.string(),
    timestamp: z.number().transform(ts => ts as Timestamp),
    version: z.string()
  }).optional()
})

export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: unknown
  }
  metadata?: {
    requestId: string
    timestamp: Timestamp
    version: string
  }
}

// Type-safe error types
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT'
}

export class TypedError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'TypedError'
  }
}