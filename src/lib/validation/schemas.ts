import { z } from 'zod'

// Node validation schemas
export const NodePositionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
})

export const NodeDataSchema = z.object({
  nodeType: z.string().min(1).max(100),
  label: z.string().max(255).optional(),
}).passthrough() // Allow additional properties for dynamic node data

export const WorkflowNodeSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.string().min(1).max(50),
  position: NodePositionSchema,
  data: NodeDataSchema,
})

export const WorkflowEdgeSchema = z.object({
  id: z.string().min(1).max(100),
  source: z.string().min(1).max(100),
  target: z.string().min(1).max(100),
  sourceHandle: z.string().max(50).optional(),
  targetHandle: z.string().max(50).optional(),
})

export const WorkflowSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  nodes: z.array(WorkflowNodeSchema).max(1000), // Limit nodes to prevent DoS
  edges: z.array(WorkflowEdgeSchema).max(5000), // Limit edges
})

// Input widget validation schemas
export const TextInputSchema = z.string().max(10000)
export const TextAreaInputSchema = z.string().max(50000)
export const NumberInputSchema = z.number().finite()
export const CheckboxInputSchema = z.boolean()
export const SelectInputSchema = z.string().max(1000)

// File upload validation
export const FileUploadSchema = z.object({
  name: z.string().max(255),
  size: z.number().max(100 * 1024 * 1024), // 100MB max
  type: z.string().max(100),
})

// API request validation
export const ExecuteWorkflowSchema = z.object({
  inputs: z.record(z.string(), z.any()).optional(),
})

// Plugin upload validation
export const PluginUploadSchema = z.object({
  file: z.instanceof(File),
}).refine((data) => {
  const allowedTypes = ['application/wasm', 'application/octet-stream']
  return allowedTypes.includes(data.file.type) || data.file.name.endsWith('.wasm')
}, {
  message: 'Only WASM files are allowed',
}).refine((data) => {
  return data.file.size <= 50 * 1024 * 1024 // 50MB max for plugins
}, {
  message: 'File size must be less than 50MB',
})

// Validate node type from drag event
export const DragNodeTypeSchema = z.string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid node type format')