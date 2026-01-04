/**
 * Type-safe utility functions and helpers
 */

import { z } from 'zod'
import { ExecutionStatus, EXECUTION_STATUS, ErrorCode, TypedError } from '@/types/strict-schema'

/**
 * Exhaustive type checking
 * This function ensures all cases in a discriminated union are handled
 * TypeScript will error if a case is missing
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled discriminated union member: ${JSON.stringify(value)}`)
}

/**
 * Type-safe exhaustive switch for execution status
 */
export function handleExecutionStatus(status: ExecutionStatus): string {
  switch (status.status) {
    case EXECUTION_STATUS.PENDING:
      return `Pending${status.queuePosition ? ` (Position: ${status.queuePosition})` : ''}`
    case EXECUTION_STATUS.RUNNING:
      return `Running (${status.progress}%)`
    case EXECUTION_STATUS.COMPLETED:
      return `Completed in ${status.duration}ms`
    case EXECUTION_STATUS.FAILED:
      return `Failed: ${status.error.message}`
    case EXECUTION_STATUS.CANCELLED:
      return `Cancelled${status.reason ? `: ${status.reason}` : ''}`
    default:
      return assertNever(status)
  }
}

/**
 * Type guard for checking if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Type guard for non-empty array
 */
export function isNonEmptyArray<T>(arr: T[]): arr is [T, ...T[]] {
  return arr.length > 0
}

/**
 * Type-safe object keys
 */
export function typedKeys<T extends Record<string, unknown>>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>
}

/**
 * Type-safe object entries
 */
export function typedEntries<T extends Record<string, unknown>>(obj: T): Array<[keyof T, T[keyof T]]> {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>
}

/**
 * Type-safe object from entries
 */
export function typedFromEntries<K extends string, V>(
  entries: Array<[K, V]>
): Record<K, V> {
  return Object.fromEntries(entries) as Record<K, V>
}

/**
 * Safe parse with type narrowing
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

/**
 * Parse or throw typed error
 */
export function parseOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMessage = 'Validation failed'
): T {
  const result = schema.safeParse(data)
  if (result.success) {
    return result.data
  }
  throw new TypedError(
    errorMessage,
    ErrorCode.VALIDATION_ERROR,
    result.error.flatten()
  )
}

/**
 * Type-safe pick function
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

/**
 * Type-safe omit function
 */
export function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj }
  keys.forEach(key => {
    delete result[key]
  })
  return result as Omit<T, K>
}

/**
 * Type-safe deep freeze
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
  Object.freeze(obj)
  Object.getOwnPropertyNames(obj).forEach(prop => {
    const value = (obj as any)[prop]
    if (value && typeof value === 'object') {
      deepFreeze(value)
    }
  })
  return obj
}

/**
 * Type predicate for checking object type
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Type-safe array unique by key
 */
export function uniqueBy<T, K extends keyof T>(
  array: T[],
  key: K
): T[] {
  const seen = new Set<T[K]>()
  return array.filter(item => {
    const k = item[key]
    if (seen.has(k)) {
      return false
    }
    seen.add(k)
    return true
  })
}

/**
 * Type-safe groupBy
 */
export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  getKey: (item: T) => K
): Record<K, T[]> {
  return array.reduce((acc, item) => {
    const key = getKey(item)
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key]!.push(item) // Safe because we just created it
    return acc
  }, {} as Record<K, T[]>)
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E }

/**
 * Create success result
 */
export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

/**
 * Create error result
 */
export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error }
}

/**
 * Type-safe async wrapper with error handling
 */
export async function tryCatch<T, E = Error>(
  fn: () => Promise<T>,
  mapError?: (error: unknown) => E
): Promise<Result<T, E>> {
  try {
    const value = await fn()
    return Ok(value)
  } catch (error) {
    return Err(mapError ? mapError(error) : error as E)
  }
}

/**
 * Ensure value matches exactly one of the provided options
 */
export function oneOf<T extends readonly unknown[]>(
  value: unknown,
  options: T
): value is T[number] {
  return options.includes(value)
}

/**
 * Create a type-safe event emitter
 */
export class TypedEventEmitter<Events extends Record<string, any>> {
  private events = new Map<keyof Events, Set<(data: any) => void>>()

  on<K extends keyof Events>(
    event: K,
    handler: (data: Events[K]) => void
  ): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(handler)
    
    // Return unsubscribe function
    return () => {
      this.events.get(event)?.delete(handler)
    }
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    this.events.get(event)?.forEach(handler => handler(data))
  }

  off<K extends keyof Events>(
    event: K,
    handler: (data: Events[K]) => void
  ): void {
    this.events.get(event)?.delete(handler)
  }

  clear(event?: keyof Events): void {
    if (event) {
      this.events.delete(event)
    } else {
      this.events.clear()
    }
  }
}