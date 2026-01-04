import { z } from 'zod'
import * as schemas from './schemas'

/**
 * Validate workflow data before sending to API
 */
export function validateWorkflow(data: unknown): z.infer<typeof schemas.WorkflowSchema> {
  return schemas.WorkflowSchema.parse(data)
}

/**
 * Validate node data
 */
export function validateNode(data: unknown): z.infer<typeof schemas.WorkflowNodeSchema> {
  return schemas.WorkflowNodeSchema.parse(data)
}

/**
 * Validate edge data
 */
export function validateEdge(data: unknown): z.infer<typeof schemas.WorkflowEdgeSchema> {
  return schemas.WorkflowEdgeSchema.parse(data)
}

/**
 * Validate text input
 */
export function validateTextInput(value: unknown): string {
  return schemas.TextInputSchema.parse(value)
}

/**
 * Validate number input
 */
export function validateNumberInput(value: unknown): number {
  return schemas.NumberInputSchema.parse(value)
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File): boolean {
  try {
    schemas.FileUploadSchema.parse({
      name: file.name,
      size: file.size,
      type: file.type,
    })
    return true
  } catch {
    return false
  }
}

/**
 * Validate plugin upload
 */
export function validatePluginUpload(file: File): boolean {
  try {
    schemas.PluginUploadSchema.parse({ file })
    return true
  } catch {
    return false
  }
}

/**
 * Validate drag node type
 */
export function validateDragNodeType(nodeType: unknown): string | null {
  try {
    return schemas.DragNodeTypeSchema.parse(nodeType)
  } catch {
    return null
  }
}

/**
 * Type guard for checking if value is a valid workflow
 */
export function isValidWorkflow(data: unknown): data is z.infer<typeof schemas.WorkflowSchema> {
  return schemas.WorkflowSchema.safeParse(data).success
}

/**
 * Type guard for checking if value is a valid node
 */
export function isValidNode(data: unknown): data is z.infer<typeof schemas.WorkflowNodeSchema> {
  return schemas.WorkflowNodeSchema.safeParse(data).success
}