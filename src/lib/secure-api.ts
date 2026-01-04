import axios, { AxiosError } from 'axios'
import { Registry, Workflow, ExecutionStatus } from '@/types/schema'
import { invoke } from '@tauri-apps/api/core'
import { validateWorkflow, validatePluginUpload } from './validation/validators'
import { sanitizeText, sanitizeUrl } from './validation/sanitizers'

// Get port from Tauri backend
let API_URL = 'http://localhost:3000/api/v1'
let REQUEST_COUNT = 0
const MAX_REQUESTS_PER_MINUTE = 100

// Rate limiting
const rateLimiter = {
  requests: new Map<string, number[]>(),
  
  canMakeRequest(endpoint: string): boolean {
    const now = Date.now()
    const minute = 60 * 1000
    const requests = this.requests.get(endpoint) || []
    
    // Filter out old requests
    const recentRequests = requests.filter(time => now - time < minute)
    
    if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
      return false
    }
    
    recentRequests.push(now)
    this.requests.set(endpoint, recentRequests)
    return true
  }
}

export async function initializeSecureApiClient() {
  try {
    const port = await invoke<number>('get_server_port')
    // Validate port number
    if (port < 1 || port > 65535) {
      throw new Error('Invalid port number')
    }
    API_URL = `http://localhost:${port}/api/v1`
  } catch (error) {
    console.warn('Could not get server port, using default', error)
  }
}

// Create axios instance with security configurations
export const secureClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
  maxContentLength: 50 * 1024 * 1024, // 50MB max response size
  maxBodyLength: 10 * 1024 * 1024, // 10MB max request size
})

// Request interceptor for auth and rate limiting
secureClient.interceptors.request.use((config) => {
  // Rate limiting check
  if (!rateLimiter.canMakeRequest(config.url || '')) {
    throw new Error('Rate limit exceeded')
  }
  
  // Add auth token securely
  const authToken = sessionStorage.getItem('sequb-auth-token') // Use sessionStorage instead of localStorage
  if (authToken) {
    config.headers['x-sequb-auth'] = authToken
  }
  
  // Add CSRF token
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
  if (csrfToken) {
    config.headers['x-csrf-token'] = csrfToken
  }
  
  // Add request ID for tracking
  config.headers['x-request-id'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  return config
}, (error) => {
  return Promise.reject(error)
})

// Response interceptor for error handling
secureClient.interceptors.response.use(
  (response) => {
    // Validate response structure
    if (response.data && typeof response.data === 'object') {
      // Check for suspicious content
      const dataStr = JSON.stringify(response.data)
      if (dataStr.includes('<script>') || dataStr.includes('javascript:')) {
        console.error('Suspicious content detected in response')
        throw new Error('Security: Suspicious content in response')
      }
    }
    return response
  },
  (error: AxiosError) => {
    // Log security-relevant errors
    if (error.response?.status === 401) {
      // Clear auth token on unauthorized
      sessionStorage.removeItem('sequb-auth-token')
    }
    
    // Sanitize error messages before displaying
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as any
      if (data.message) {
        data.message = sanitizeText(data.message)
      }
    }
    
    return Promise.reject(error)
  }
)

export const secureApi = {
  health: {
    check: () => secureClient.get('/health'),
  },
  
  registry: {
    get: async () => {
      const response = await secureClient.get<Registry>('/nodes/registry')
      // Additional validation could be added here
      return response
    },
  },
  
  workflow: {
    list: () => secureClient.get<Workflow[]>('/workflows'),
    
    get: (id: string) => {
      // Validate ID format
      if (!/^[a-zA-Z0-9-_]+$/.test(id)) {
        throw new Error('Invalid workflow ID')
      }
      return secureClient.get<Workflow>(`/workflows/${id}`)
    },
    
    create: (data: Partial<Workflow>) => {
      // Validate workflow data before sending
      const validated = validateWorkflow(data)
      return secureClient.post<Workflow>('/workflows', validated)
    },
    
    update: (id: string, data: Partial<Workflow>) => {
      if (!/^[a-zA-Z0-9-_]+$/.test(id)) {
        throw new Error('Invalid workflow ID')
      }
      const validated = validateWorkflow(data)
      return secureClient.put<Workflow>(`/workflows/${id}`, validated)
    },
    
    delete: (id: string) => {
      if (!/^[a-zA-Z0-9-_]+$/.test(id)) {
        throw new Error('Invalid workflow ID')
      }
      return secureClient.delete(`/workflows/${id}`)
    },
    
    execute: (id: string, inputs?: Record<string, any>) => {
      if (!/^[a-zA-Z0-9-_]+$/.test(id)) {
        throw new Error('Invalid workflow ID')
      }
      
      // Sanitize inputs
      const sanitizedInputs = inputs ? Object.keys(inputs).reduce((acc, key) => {
        const sanitizedKey = sanitizeText(key)
        acc[sanitizedKey] = typeof inputs[key] === 'string' 
          ? sanitizeText(inputs[key])
          : inputs[key]
        return acc
      }, {} as Record<string, any>) : undefined
      
      return secureClient.post<{ runId: string }>(`/workflows/${id}/execute`, { inputs: sanitizedInputs })
    },
  },
  
  execution: {
    getStatus: (runId: string) => {
      if (!/^[a-zA-Z0-9-_]+$/.test(runId)) {
        throw new Error('Invalid run ID')
      }
      return secureClient.get<ExecutionStatus>(`/executions/${runId}`)
    },
    
    getLogs: (runId: string) => {
      if (!/^[a-zA-Z0-9-_]+$/.test(runId)) {
        throw new Error('Invalid run ID')
      }
      return secureClient.get<string[]>(`/executions/${runId}/logs`)
    },
    
    cancel: (runId: string) => {
      if (!/^[a-zA-Z0-9-_]+$/.test(runId)) {
        throw new Error('Invalid run ID')
      }
      return secureClient.post(`/executions/${runId}/cancel`)
    },
  },
  
  plugins: {
    list: () => secureClient.get('/plugins'),
    
    upload: async (file: File) => {
      // Validate file before upload
      if (!validatePluginUpload(file)) {
        throw new Error('Invalid plugin file')
      }
      
      // Check file magic bytes for WASM
      const buffer = await file.arrayBuffer()
      const bytes = new Uint8Array(buffer, 0, 4)
      const wasmMagic = [0x00, 0x61, 0x73, 0x6d] // \0asm
      
      if (!wasmMagic.every((byte, i) => byte === bytes[i])) {
        throw new Error('File is not a valid WASM module')
      }
      
      const formData = new FormData()
      formData.append('plugin', file)
      
      return secureClient.post('/plugins', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    
    delete: (id: string) => {
      if (!/^[a-zA-Z0-9-_]+$/.test(id)) {
        throw new Error('Invalid plugin ID')
      }
      return secureClient.delete(`/plugins/${id}`)
    },
  },
}