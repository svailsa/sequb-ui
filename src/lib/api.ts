import axios from 'axios'
import { Registry, Workflow, ExecutionStatus } from '@/types/schema'
import { invoke } from '@tauri-apps/api/core'

// Get port from Tauri backend - default to sequb-protocol standard port
let API_URL = 'http://localhost:3000'

export async function initializeApiClient() {
  try {
    const port = await invoke<number>('get_server_port')
    API_URL = `http://localhost:${port}`
    
    // Use the in-memory token if available
    if (window.SEQUB_AUTH_TOKEN) {
      client.defaults.headers.common['x-sequb-auth'] = window.SEQUB_AUTH_TOKEN
    }
    
    // Update the base URL
    client.defaults.baseURL = API_URL
  } catch (error) {
    console.warn('Could not get server port, using default', error)
  }
}

export const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token from memory (not localStorage for security)
client.interceptors.request.use((config) => {
  // Prefer in-memory token over localStorage
  const authToken = window.SEQUB_AUTH_TOKEN || localStorage.getItem('sequb-auth-token')
  if (authToken) {
    config.headers['x-sequb-auth'] = authToken
  }
  
  // Ensure we're using the correct base URL
  if (window.SEQUB_SERVER_PORT) {
    config.baseURL = `http://localhost:${window.SEQUB_SERVER_PORT}`
  }
  
  return config
})

export const api = {
  health: {
    check: () => client.get('/health'),
  },
  
  // The backend doesn't have a registry endpoint yet, so we'll return mock data
  registry: {
    get: async () => {
      // Mock registry data based on the backend node types
      const mockRegistry: Registry = {
        nodes: {
          llm: {
            id: 'llm',
            label: 'LLM',
            category: 'AI',
            icon: 'brain',
            inputs: [
              { key: 'prompt', label: 'Prompt', type: 'textarea', required: true },
              { key: 'model', label: 'Model', type: 'select', required: true, options: [
                { value: 'gpt-4', label: 'GPT-4' },
                { value: 'claude-3', label: 'Claude 3' },
                { value: 'llama-2', label: 'Llama 2' }
              ]},
              { key: 'temperature', label: 'Temperature', type: 'number', required: false, default: 0.7 },
              { key: 'max_tokens', label: 'Max Tokens', type: 'number', required: false, default: 1000 }
            ],
            outputs: [
              { key: 'response', label: 'Response', type: 'text' },
              { key: 'usage', label: 'Token Usage', type: 'object' }
            ],
          },
          http: {
            id: 'http',
            label: 'HTTP Request',
            category: 'Network',
            icon: 'send',
            inputs: [
              { key: 'url', label: 'URL', type: 'text', required: true },
              { key: 'method', label: 'Method', type: 'select', required: true, options: [
                { value: 'GET', label: 'GET' },
                { value: 'POST', label: 'POST' },
                { value: 'PUT', label: 'PUT' },
                { value: 'DELETE', label: 'DELETE' }
              ]},
              { key: 'headers', label: 'Headers', type: 'code', required: false },
              { key: 'body', label: 'Body', type: 'code', required: false }
            ],
            outputs: [
              { key: 'response', label: 'Response', type: 'object' },
              { key: 'status', label: 'Status Code', type: 'number' }
            ],
          },
          trigger: {
            id: 'trigger',
            label: 'Workflow Trigger',
            category: 'Control',
            icon: 'play',
            inputs: [],
            outputs: [
              { key: 'timestamp', label: 'Timestamp', type: 'text' },
              { key: 'inputs', label: 'Input Data', type: 'object' }
            ],
          },
          condition: {
            id: 'condition',
            label: 'Conditional',
            category: 'Control',
            icon: 'code',
            inputs: [
              { key: 'condition', label: 'Condition', type: 'code', required: true },
              { key: 'if_true', label: 'If True', type: 'any', required: false },
              { key: 'if_false', label: 'If False', type: 'any', required: false }
            ],
            outputs: [
              { key: 'result', label: 'Result', type: 'any' }
            ],
          },
          transform: {
            id: 'transform',
            label: 'Data Transform',
            category: 'Data',
            icon: 'database',
            inputs: [
              { key: 'data', label: 'Input Data', type: 'any', required: true },
              { key: 'expression', label: 'Transform Expression', type: 'code', required: true }
            ],
            outputs: [
              { key: 'result', label: 'Transformed Data', type: 'any' }
            ],
          },
          delay: {
            id: 'delay',
            label: 'Delay',
            category: 'Control',
            icon: 'terminal',
            inputs: [
              { key: 'duration', label: 'Duration (ms)', type: 'number', required: true },
              { key: 'data', label: 'Pass-through Data', type: 'any', required: false }
            ],
            outputs: [
              { key: 'data', label: 'Pass-through Data', type: 'any' }
            ],
          },
        },
        plugins: [],
      }
      
      return { data: mockRegistry }
    },
  },
  
  workflow: {
    list: () => client.get<Workflow[]>('/workflows'),
    get: (id: string) => client.get<Workflow>(`/workflows/${id}`),
    create: (data: { name: string; description?: string; nodes?: any; edges?: any }) => 
      client.post<{ id: string }>('/workflows', data),
    update: (id: string, data: Partial<Workflow>) => 
      client.put<Workflow>(`/workflows/${id}`, data),
    delete: (id: string) => client.delete(`/workflows/${id}`),
    
    // Graph operations
    getGraph: (id: string) => client.get(`/workflows/${id}/graph`),
    saveGraph: (id: string, graph: any) => 
      client.put(`/workflows/${id}/graph`, graph),
    
    // Workflow operations
    execute: (id: string, inputs?: Record<string, any>) => 
      client.post<{ execution_id: string }>(`/workflows/${id}/execute`, inputs ? { inputs } : {}),
    activate: (id: string) => client.post(`/workflows/${id}/activate`),
    pause: (id: string) => client.post(`/workflows/${id}/pause`),
    archive: (id: string) => client.post(`/workflows/${id}/archive`),
    clone: (id: string, newName: string) => 
      client.post(`/workflows/${id}/clone`, { new_name: newName }),
  },
  
  execution: {
    getStatus: (id: string) => client.get<ExecutionStatus>(`/executions/${id}`),
    cancel: (id: string) => client.post(`/executions/${id}/cancel`),
    approve: (id: string, data: {
      approval_id: string,
      approved: boolean,
      notes?: string,
      modified_data?: any
    }) => client.post(`/executions/${id}/approve`, data),
  },
  
  plugins: {
    list: () => client.get('/plugins'),
    load: (path: string) => client.post('/plugins', { path }),
    unload: (id: string) => client.delete(`/plugins/${id}`),
  },
}