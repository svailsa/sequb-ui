/**
 * Type-safe Tauri IPC communication layer
 */

import { invoke as tauriInvoke } from '@tauri-apps/api/core'
import { listen as tauriListen, UnlistenFn } from '@tauri-apps/api/event'
import { z } from 'zod'
import { Port } from '@/types/branded'
import { parseOrThrow } from './type-helpers'

/**
 * Define all Tauri commands with their input and output types
 */
export interface TauriCommands {
  get_server_port: {
    args: void
    returns: Port
  }
  verify_binary_integrity: {
    args: { path: string; hash: string }
    returns: boolean
  }
  get_system_info: {
    args: void
    returns: {
      os: string
      arch: string
      version: string
    }
  }
}

/**
 * Define all Tauri events with their payload types
 */
export interface TauriEvents {
  'server-ready': Port
  'server-error': { message: string; code?: string }
  'server-log': { level: 'info' | 'warn' | 'error'; message: string }
  'workflow-progress': { runId: string; progress: number }
  'workflow-completed': { runId: string; result: unknown }
  'workflow-failed': { runId: string; error: string }
}

/**
 * Type-safe invoke wrapper
 */
export async function invoke<K extends keyof TauriCommands>(
  command: K,
  args?: TauriCommands[K]['args']
): Promise<TauriCommands[K]['returns']> {
  try {
    const result = await tauriInvoke(command, args || {})
    return result as TauriCommands[K]['returns']
  } catch (error) {
    console.error(`Tauri command ${command} failed:`, error)
    throw error
  }
}

/**
 * Type-safe event listener
 */
export async function listen<K extends keyof TauriEvents>(
  event: K,
  handler: (payload: TauriEvents[K]) => void
): Promise<UnlistenFn> {
  return tauriListen(event, (e) => {
    handler(e.payload as TauriEvents[K])
  })
}

/**
 * Schema validators for Tauri responses
 */
const PortSchema = z.number().min(1).max(65535).transform(p => p as Port)

const SystemInfoSchema = z.object({
  os: z.string(),
  arch: z.string(),
  version: z.string()
})

/**
 * Validated invoke wrapper - adds runtime validation
 */
export const safeInvoke = {
  async getServerPort(): Promise<Port> {
    const result = await tauriInvoke('get_server_port')
    return parseOrThrow(PortSchema, result, 'Invalid port from server')
  },

  async verifyBinaryIntegrity(path: string, hash: string): Promise<boolean> {
    const result = await tauriInvoke('verify_binary_integrity', { path, hash })
    return z.boolean().parse(result)
  },

  async getSystemInfo() {
    const result = await tauriInvoke('get_system_info')
    return parseOrThrow(SystemInfoSchema, result, 'Invalid system info')
  }
}

/**
 * Event emitter with type safety
 */
export class TauriEventEmitter {
  private listeners = new Map<keyof TauriEvents, UnlistenFn>()

  async on<K extends keyof TauriEvents>(
    event: K,
    handler: (payload: TauriEvents[K]) => void
  ): Promise<void> {
    // Remove existing listener if any
    await this.off(event)
    
    const unlisten = await listen(event, handler)
    this.listeners.set(event, unlisten)
  }

  async off(event: keyof TauriEvents): Promise<void> {
    const unlisten = this.listeners.get(event)
    if (unlisten) {
      unlisten()
      this.listeners.delete(event)
    }
  }

  async cleanup(): Promise<void> {
    for (const unlisten of this.listeners.values()) {
      unlisten()
    }
    this.listeners.clear()
  }
}

/**
 * Create a type-safe channel for bi-directional communication
 */
export class TauriChannel<
  Request extends Record<string, unknown>,
  Response extends Record<string, unknown>
> {
  constructor(
    private readonly channelName: string,
    private readonly requestSchema: z.ZodSchema<Request>,
    private readonly responseSchema: z.ZodSchema<Response>
  ) {}

  async send(request: Request): Promise<Response> {
    // Validate request
    const validatedRequest = this.requestSchema.parse(request)
    
    // Send via Tauri
    const response = await tauriInvoke(this.channelName, validatedRequest)
    
    // Validate response
    return this.responseSchema.parse(response)
  }

  async listen(
    handler: (request: Request) => Promise<Response> | Response
  ): Promise<UnlistenFn> {
    return tauriListen(`${this.channelName}:request`, async (e) => {
      try {
        const request = this.requestSchema.parse(e.payload)
        const response = await handler(request)
        const validatedResponse = this.responseSchema.parse(response)
        
        // Send response back
        await tauriInvoke(`${this.channelName}:response`, {
          id: (e as any).id,
          data: validatedResponse
        })
      } catch (error) {
        console.error(`Channel ${this.channelName} handler error:`, error)
        // Send error response
        await tauriInvoke(`${this.channelName}:error`, {
          id: (e as any).id,
          error: String(error)
        })
      }
    })
  }
}

/**
 * Type-safe window manager
 */
export interface WindowConfig {
  title: string
  width: number
  height: number
  minWidth?: number
  minHeight?: number
  resizable?: boolean
  fullscreen?: boolean
  alwaysOnTop?: boolean
  decorations?: boolean
}

export async function createWindow(config: WindowConfig): Promise<void> {
  await tauriInvoke('create_window', config as unknown as Record<string, unknown>)
}

export async function closeWindow(label?: string): Promise<void> {
  await tauriInvoke('close_window', { label })
}

/**
 * Type-safe file dialog
 */
export interface FileFilter {
  name: string
  extensions: string[]
}

export interface OpenDialogOptions {
  multiple?: boolean
  directory?: boolean
  filters?: FileFilter[]
  defaultPath?: string
}

export interface SaveDialogOptions {
  filters?: FileFilter[]
  defaultPath?: string
}

export async function openFileDialog(
  options: OpenDialogOptions = {}
): Promise<string | string[] | null> {
  return tauriInvoke('open_file_dialog', options as Record<string, unknown>)
}

export async function saveFileDialog(
  options: SaveDialogOptions = {}
): Promise<string | null> {
  return tauriInvoke('save_file_dialog', options as Record<string, unknown>)
}