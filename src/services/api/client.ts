import axios, { AxiosError } from 'axios';
import { 
  Workflow, 
  Execution, 
  Registry, 
  Plugin, 
  User, 
  ExecutionLog,
  ApprovalRequest,
  WebhookConfig,
  ApiResponse,
  PaginatedResponse 
} from '@/types/sequb';
import { authService } from '../auth/auth-service';
import { csrfService } from '../auth/csrf';

// Create axios instance
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Reduced from 30s to 10s for security
});

// Request interceptor for auth and CSRF
apiClient.interceptors.request.use((config) => {
  // Add authentication token
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add CSRF token for state-changing requests
  const method = config.method?.toLowerCase();
  if (method && ['post', 'put', 'delete', 'patch'].includes(method)) {
    config.headers['X-CSRF-Token'] = csrfService.getToken();
  }
  
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear auth and redirect to login
      if (typeof window !== 'undefined') {
        authService.clearToken();
        csrfService.clearToken();
        // Preserve the current path for redirect after login
        const currentPath = window.location.pathname;
        window.location.href = `/login?from=${encodeURIComponent(currentPath)}`;
      }
    } else if (error.response?.status === 403) {
      // CSRF token might be invalid, try to rotate it
      if (error.response.data && 
          typeof error.response.data === 'object' && 
          'message' in error.response.data &&
          String(error.response.data.message).toLowerCase().includes('csrf')) {
        csrfService.rotateToken();
      }
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const api = {
  // Health check
  health: {
    check: () => apiClient.get('/api/v1/health'),
  },

  // Authentication
  auth: {
    login: (email: string, password: string) => 
      apiClient.post('/api/v1/auth/login', { email, password }),
    register: (email: string, password: string, name?: string, region_code?: string) => 
      apiClient.post('/api/v1/auth/register', { 
        email, 
        password, 
        username: name,  // Backend expects username not name
        region_code 
      }),
    logout: () => apiClient.post('/api/v1/auth/logout'),
    refresh: () => apiClient.post('/api/v1/auth/refresh'),
    profile: () => apiClient.get<ApiResponse<User>>('/api/v1/auth/profile'),
  },

  // Workflows
  workflows: {
    list: (params?: { page?: number; per_page?: number; status?: string }) => 
      apiClient.get<PaginatedResponse<Workflow>>('/api/v1/workflows', { params }),
    get: (id: string) => 
      apiClient.get<ApiResponse<Workflow>>(`/api/v1/workflows/${id}`),
    create: (data: { name: string; description?: string; graph?: any }) => 
      apiClient.post<ApiResponse<Workflow>>('/api/v1/workflows', data),
    update: (id: string, data: Partial<Workflow>) => 
      apiClient.put<ApiResponse<Workflow>>(`/api/v1/workflows/${id}`, data),
    delete: (id: string) => 
      apiClient.delete(`/api/v1/workflows/${id}`),
    
    // Graph operations
    getGraph: (id: string) => 
      apiClient.get<ApiResponse<any>>(`/api/v1/workflows/${id}/graph`),
    updateGraph: (id: string, graph: any) => 
      apiClient.put<ApiResponse<any>>(`/api/v1/workflows/${id}/graph`, graph),
    
    // Execution
    execute: (id: string, inputs?: Record<string, any>) => 
      apiClient.post<ApiResponse<Execution>>(`/api/v1/workflows/${id}/execute`, { inputs }),
    
    // Status operations
    activate: (id: string) => 
      apiClient.post(`/api/v1/workflows/${id}/activate`),
    pause: (id: string) => 
      apiClient.post(`/api/v1/workflows/${id}/pause`),
    archive: (id: string) => 
      apiClient.post(`/api/v1/workflows/${id}/archive`),
    
    // Versions
    getVersions: (id: string) => 
      apiClient.get<PaginatedResponse<Workflow>>(`/api/v1/workflows/${id}/versions`),
    createVersion: (id: string, name?: string) => 
      apiClient.post<ApiResponse<Workflow>>(`/api/v1/workflows/${id}/versions`, { name }),
    
    // Clone
    clone: (id: string, name: string) => 
      apiClient.post<ApiResponse<Workflow>>(`/api/v1/workflows/${id}/clone`, { name }),
  },

  // Executions
  executions: {
    list: (params?: { page?: number; per_page?: number; workflow_id?: string; status?: string }) => 
      apiClient.get<PaginatedResponse<Execution>>('/api/v1/executions', { params }),
    get: (id: string) => 
      apiClient.get<ApiResponse<Execution>>(`/api/v1/executions/${id}`),
    cancel: (id: string) => 
      apiClient.post(`/api/v1/executions/${id}/cancel`),
    
    // Logs
    getLogs: (id: string, params?: { page?: number; per_page?: number; level?: string }) => 
      apiClient.get<PaginatedResponse<ExecutionLog>>(`/api/v1/executions/${id}/logs`, { params }),
    
    // Approvals
    approve: (id: string, approvalId: string, approved: boolean, notes?: string) => 
      apiClient.post(`/api/v1/executions/${id}/approvals/${approvalId}`, { 
        approved, 
        notes 
      }),
  },

  // Node registry
  registry: {
    get: () => 
      apiClient.get<ApiResponse<Registry>>('/api/v1/nodes/registry'),
    getCategories: () => 
      apiClient.get<ApiResponse<string[]>>('/api/v1/nodes/categories'),
    getNodeType: (type: string) => 
      apiClient.get<ApiResponse<any>>(`/api/v1/nodes/registry/${type}`),
  },

  // Plugins
  plugins: {
    list: () => 
      apiClient.get<PaginatedResponse<Plugin>>('/api/v1/plugins'),
    upload: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post<ApiResponse<Plugin>>('/api/v1/plugins', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    delete: (id: string) => 
      apiClient.delete(`/api/v1/plugins/${id}`),
    activate: (id: string) => 
      apiClient.post(`/api/v1/plugins/${id}/activate`),
    deactivate: (id: string) => 
      apiClient.post(`/api/v1/plugins/${id}/deactivate`),
  },

  // Webhooks
  webhooks: {
    list: (workflowId?: string) => 
      apiClient.get<PaginatedResponse<WebhookConfig>>('/api/v1/webhooks', {
        params: workflowId ? { workflow_id: workflowId } : undefined
      }),
    create: (data: Omit<WebhookConfig, 'id' | 'created_at' | 'updated_at'>) => 
      apiClient.post<ApiResponse<WebhookConfig>>('/api/v1/webhooks', data),
    update: (id: string, data: Partial<WebhookConfig>) => 
      apiClient.put<ApiResponse<WebhookConfig>>(`/api/v1/webhooks/${id}`, data),
    delete: (id: string) => 
      apiClient.delete(`/api/v1/webhooks/${id}`),
  },

  // Approvals
  approvals: {
    list: (params?: { page?: number; per_page?: number; status?: string }) => 
      apiClient.get<PaginatedResponse<ApprovalRequest>>('/api/v1/approvals', { params }),
    get: (id: string) => 
      apiClient.get<ApiResponse<ApprovalRequest>>(`/api/v1/approvals/${id}`),
    respond: (id: string, approved: boolean, notes?: string) => 
      apiClient.post(`/api/v1/approvals/${id}/respond`, { approved, notes }),
  },

  // Chat/NLP (if implemented)
  chat: {
    sendMessage: (message: string, sessionId?: string) => 
      apiClient.post<ApiResponse<any>>('/api/v1/chat/message', { 
        message, 
        session_id: sessionId 
      }),
    getSessions: () => 
      apiClient.get<PaginatedResponse<any>>('/api/v1/chat/sessions'),
    createSession: () => 
      apiClient.post<ApiResponse<any>>('/api/v1/chat/sessions'),
    getSession: (id: string) =>
      apiClient.get<ApiResponse<any>>(`/api/v1/chat/sessions/${id}`),
    getMessages: (sessionId: string) =>
      apiClient.get<PaginatedResponse<any>>(`/api/v1/chat/sessions/${sessionId}/messages`),
    deleteSession: (id: string) =>
      apiClient.delete(`/api/v1/chat/sessions/${id}`),
    updateSession: (id: string, data: { title?: string }) =>
      apiClient.patch<ApiResponse<any>>(`/api/v1/chat/sessions/${id}`, data),
  },

  // Metrics
  metrics: {
    getOverview: (params: { timeRange: string }) => 
      apiClient.get<ApiResponse<any>>('/api/v1/metrics/overview', { params }),
    getExecutionTrends: (params: { timeRange: string }) => 
      apiClient.get<ApiResponse<any>>('/api/v1/metrics/execution-trends', { params }),
    getWorkflowDistribution: (params: { timeRange: string }) => 
      apiClient.get<ApiResponse<any>>('/api/v1/metrics/workflow-distribution', { params }),
    getPerformance: (params: { timeRange: string }) => 
      apiClient.get<ApiResponse<any>>('/api/v1/metrics/performance', { params }),
  },

  // User Preferences
  preferences: {
    get: () => 
      apiClient.get<ApiResponse<any>>('/api/v1/user/preferences'),
    update: (preferences: Record<string, any>) => 
      apiClient.put<ApiResponse<any>>('/api/v1/user/preferences', preferences),
    updatePartial: (preferences: Partial<Record<string, any>>) => 
      apiClient.patch<ApiResponse<any>>('/api/v1/user/preferences', preferences),
  },

  // User Profile
  profile: {
    update: (profile: Partial<User>) => 
      apiClient.put<ApiResponse<User>>('/api/v1/user/profile', profile),
    uploadAvatar: (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return apiClient.post<ApiResponse<{ url: string }>>('/api/v1/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    changePassword: (data: { currentPassword: string; newPassword: string }) => 
      apiClient.post<ApiResponse<void>>('/api/v1/user/change-password', data),
  },

  // UI Configuration
  ui: {
    getConfiguration: () => 
      apiClient.get<ApiResponse<any>>('/api/v1/ui/configuration'),
    getChatExamples: (context?: string) => 
      apiClient.get<ApiResponse<any>>('/api/v1/ui/chat/examples', { 
        params: context ? { context } : undefined 
      }),
    getFeatureFlags: () => 
      apiClient.get<ApiResponse<any>>('/api/v1/ui/feature-flags'),
    getErrorContext: (errorCode: string, details?: any) => 
      apiClient.post<ApiResponse<any>>(`/api/v1/ui/errors/${errorCode}`, { details }),
    getValidationSchema: (entityType: string, entityId?: string) => 
      apiClient.get<ApiResponse<any>>(`/api/v1/ui/validation/${entityType}${entityId ? `/${entityId}` : ''}`),
  },

  // System Configuration
  system: {
    getConfiguration: () => 
      apiClient.get<ApiResponse<any>>('/api/v1/system/configuration'),
    getTimezones: () => 
      apiClient.get<ApiResponse<any>>('/api/v1/system/timezones'),
    getLanguages: () => 
      apiClient.get<ApiResponse<any>>('/api/v1/system/languages'),
    getThemes: () => 
      apiClient.get<ApiResponse<any>>('/api/v1/system/themes'),
  },
};