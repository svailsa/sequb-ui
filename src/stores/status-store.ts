import { create } from 'zustand';
import { wsService } from '@/services/websocket';
import { api } from '@/services/api';

export interface SystemStatus {
  backend: 'healthy' | 'degraded' | 'unavailable';
  websocket: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
  lastHealthCheck: string | null;
  executionQueue: number;
  activeExecutions: number;
  apiLatency: number | null;
}

export interface ExecutionStatus {
  [executionId: string]: {
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'waiting_for_approval';
    progress?: number;
    currentNode?: string;
    error?: string;
    updatedAt: string;
  };
}

interface StatusStore {
  systemStatus: SystemStatus;
  executionStatuses: ExecutionStatus;
  
  // Actions
  updateSystemStatus: (status: Partial<SystemStatus>) => void;
  updateExecutionStatus: (executionId: string, status: Partial<ExecutionStatus[string]>) => void;
  clearExecutionStatus: (executionId: string) => void;
  checkBackendHealth: () => Promise<void>;
  startHealthMonitoring: () => void;
  stopHealthMonitoring: () => void;
}

let healthCheckInterval: NodeJS.Timeout | null = null;

export const useStatusStore = create<StatusStore>((set, get) => ({
  systemStatus: {
    backend: 'unavailable',
    websocket: 'disconnected',
    lastHealthCheck: null,
    executionQueue: 0,
    activeExecutions: 0,
    apiLatency: null,
  },
  executionStatuses: {},

  updateSystemStatus: (status) => {
    set((state) => ({
      systemStatus: { ...state.systemStatus, ...status }
    }));
  },

  updateExecutionStatus: (executionId, status) => {
    set((state) => ({
      executionStatuses: {
        ...state.executionStatuses,
        [executionId]: {
          ...state.executionStatuses[executionId],
          ...status,
          updatedAt: new Date().toISOString()
        }
      }
    }));
  },

  clearExecutionStatus: (executionId) => {
    set((state) => {
      const newStatuses = { ...state.executionStatuses };
      delete newStatuses[executionId];
      return { executionStatuses: newStatuses };
    });
  },

  checkBackendHealth: async () => {
    const startTime = Date.now();
    
    try {
      await api.health.check();
      const latency = Date.now() - startTime;
      
      get().updateSystemStatus({
        backend: 'healthy',
        lastHealthCheck: new Date().toISOString(),
        apiLatency: latency
      });
    } catch (error) {
      console.error('Health check failed:', error);
      
      // Determine status based on error type
      let status: SystemStatus['backend'] = 'unavailable';
      if (error && typeof error === 'object' && 'response' in error) {
        const statusCode = (error as any).response?.status;
        if (statusCode >= 500 && statusCode < 600) {
          status = 'degraded';
        }
      }
      
      get().updateSystemStatus({
        backend: status,
        lastHealthCheck: new Date().toISOString(),
        apiLatency: null
      });
    }
  },

  startHealthMonitoring: () => {
    // Initial health check
    get().checkBackendHealth();
    
    // Start periodic health checks
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
    }
    
    healthCheckInterval = setInterval(() => {
      get().checkBackendHealth();
    }, 30000); // Check every 30 seconds

    // WebSocket connection monitoring
    wsService.on('connected', () => {
      get().updateSystemStatus({ websocket: 'connected' });
    });

    wsService.on('disconnected', () => {
      get().updateSystemStatus({ websocket: 'disconnected' });
    });

    wsService.on('error', () => {
      get().updateSystemStatus({ websocket: 'disconnected' });
    });

    // Listen for execution updates
    wsService.on('execution_update', (data) => {
      get().updateExecutionStatus(data.execution_id, {
        status: data.status,
        progress: data.progress,
        currentNode: data.current_node,
        error: data.error
      });
    });

    // Start WebSocket connection if not already connected
    if (wsService.getConnectionState() === 'disconnected') {
      wsService.connect().catch((error) => {
        console.error('Failed to connect WebSocket:', error);
      });
    }
  },

  stopHealthMonitoring: () => {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = null;
    }
    wsService.removeAllListeners();
  }
}));