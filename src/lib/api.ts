import axios from 'axios'
import { Registry, Workflow, ExecutionStatus } from '@/types/schema'
import { invoke } from '@tauri-apps/api/core'

// Get port from Tauri backend
let API_URL = 'http://localhost:3000/api/v1'

export async function initializeApiClient() {
  try {
    const port = await invoke<number>('get_server_port')
    API_URL = `http://localhost:${port}/api/v1`
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

// Add auth token if server provides one
client.interceptors.request.use((config) => {
  const authToken = localStorage.getItem('sequb-auth-token')
  if (authToken) {
    config.headers['x-sequb-auth'] = authToken
  }
  return config
})

export const api = {
  health: {
    check: () => client.get('/health'),
  },
  
  registry: {
    get: () => client.get<Registry>('/nodes/registry'),
  },
  
  workflow: {
    list: () => client.get<Workflow[]>('/workflows'),
    get: (id: string) => client.get<Workflow>(`/workflows/${id}`),
    create: (data: Partial<Workflow>) => client.post<Workflow>('/workflows', data),
    update: (id: string, data: Partial<Workflow>) => 
      client.put<Workflow>(`/workflows/${id}`, data),
    delete: (id: string) => client.delete(`/workflows/${id}`),
    execute: (id: string, inputs?: Record<string, any>) => 
      client.post<{ runId: string }>(`/workflows/${id}/execute`, { inputs }),
  },
  
  execution: {
    getStatus: (runId: string) => client.get<ExecutionStatus>(`/executions/${runId}`),
    getLogs: (runId: string) => client.get<string[]>(`/executions/${runId}/logs`),
    cancel: (runId: string) => client.post(`/executions/${runId}/cancel`),
  },
  
  plugins: {
    list: () => client.get('/plugins'),
    upload: (file: File) => {
      const formData = new FormData()
      formData.append('plugin', file)
      return client.post('/plugins', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    delete: (id: string) => client.delete(`/plugins/${id}`),
  },
}