/**
 * Branded Types for Type Safety
 * 
 * Branded types prevent mixing up primitive types that have the same
 * underlying representation but different semantic meanings.
 */

// Brand type helper
declare const brand: unique symbol
type Brand<T, B> = T & { [brand]: B }

// Branded ID types
export type NodeId = Brand<string, 'NodeId'>
export type EdgeId = Brand<string, 'EdgeId'>
export type WorkflowId = Brand<string, 'WorkflowId'>
export type RunId = Brand<string, 'RunId'>
export type PluginId = Brand<string, 'PluginId'>
export type UserId = Brand<string, 'UserId'>

// Branded numeric types
export type Port = Brand<number, 'Port'>
export type Timestamp = Brand<number, 'Timestamp'>
export type Percentage = Brand<number, 'Percentage'>

// Branded string types with validation
export type Email = Brand<string, 'Email'>
export type URL = Brand<string, 'URL'>
export type JSONString = Brand<string, 'JSONString'>
export type NodeType = Brand<string, 'NodeType'>
export type SHA256Hash = Brand<string, 'SHA256Hash'>

// Constructor functions with validation
export function createNodeId(id: string): NodeId {
  if (!isValidId(id)) throw new Error(`Invalid NodeId: ${id}`)
  return id as NodeId
}

export function createEdgeId(id: string): EdgeId {
  if (!isValidId(id)) throw new Error(`Invalid EdgeId: ${id}`)
  return id as EdgeId
}

export function createWorkflowId(id: string): WorkflowId {
  if (!isValidUuid(id) && !isValidId(id)) throw new Error(`Invalid WorkflowId: ${id}`)
  return id as WorkflowId
}

export function createRunId(id: string): RunId {
  if (!isValidId(id)) throw new Error(`Invalid RunId: ${id}`)
  return id as RunId
}

export function createPluginId(id: string): PluginId {
  if (!isValidId(id)) throw new Error(`Invalid PluginId: ${id}`)
  return id as PluginId
}

export function createPort(port: number): Port {
  if (port < 1 || port > 65535) throw new Error(`Invalid port: ${port}`)
  return port as Port
}

export function createTimestamp(ts: number): Timestamp {
  if (ts < 0 || !Number.isInteger(ts)) throw new Error(`Invalid timestamp: ${ts}`)
  return ts as Timestamp
}

export function createPercentage(percent: number): Percentage {
  if (percent < 0 || percent > 100) throw new Error(`Invalid percentage: ${percent}`)
  return percent as Percentage
}

export function createEmail(email: string): Email {
  if (!isValidEmail(email)) throw new Error(`Invalid email: ${email}`)
  return email as Email
}

export function createURL(url: string): URL {
  if (!isValidUrl(url)) throw new Error(`Invalid URL: ${url}`)
  return url as URL
}

export function createNodeType(type: string): NodeType {
  if (!isValidNodeType(type)) throw new Error(`Invalid node type: ${type}`)
  return type as NodeType
}

export function createSHA256Hash(hash: string): SHA256Hash {
  if (!isValidSHA256(hash)) throw new Error(`Invalid SHA256 hash: ${hash}`)
  return hash as SHA256Hash
}

// Type guards
export function isNodeId(value: unknown): value is NodeId {
  return typeof value === 'string' && isValidId(value)
}

export function isEdgeId(value: unknown): value is EdgeId {
  return typeof value === 'string' && isValidId(value)
}

export function isWorkflowId(value: unknown): value is WorkflowId {
  return typeof value === 'string' && (isValidUuid(value) || isValidId(value))
}

export function isRunId(value: unknown): value is RunId {
  return typeof value === 'string' && isValidId(value)
}

export function isPluginId(value: unknown): value is PluginId {
  return typeof value === 'string' && isValidId(value)
}

export function isPort(value: unknown): value is Port {
  return typeof value === 'number' && value >= 1 && value <= 65535
}

export function isTimestamp(value: unknown): value is Timestamp {
  return typeof value === 'number' && value >= 0 && Number.isInteger(value)
}

export function isPercentage(value: unknown): value is Percentage {
  return typeof value === 'number' && value >= 0 && value <= 100
}

export function isEmail(value: unknown): value is Email {
  return typeof value === 'string' && isValidEmail(value)
}

export function isURL(value: unknown): value is URL {
  return typeof value === 'string' && isValidUrl(value)
}

export function isNodeType(value: unknown): value is NodeType {
  return typeof value === 'string' && isValidNodeType(value)
}

export function isSHA256Hash(value: unknown): value is SHA256Hash {
  return typeof value === 'string' && isValidSHA256(value)
}

// Validation helpers
function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length > 0 && id.length <= 100
}

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new window.URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

function isValidNodeType(type: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(type) && type.length <= 100
}

function isValidSHA256(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash)
}