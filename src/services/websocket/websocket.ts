"use client";

import { EventEmitter } from 'events';
import { safeJsonParse } from '@/lib/utils/safe-json';
import { logger } from '@/services/monitoring/logger';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface ExecutionUpdateMessage {
  type: 'execution_update';
  data: {
    execution_id: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    progress?: number;
    current_node?: string;
    error?: string;
    logs?: Array<{
      level: string;
      message: string;
      timestamp: string;
    }>;
  };
}

export interface WorkflowEventMessage {
  type: 'workflow_event';
  data: {
    event: 'created' | 'updated' | 'deleted' | 'executed';
    workflow_id: string;
    data?: any;
  };
}

export type WSMessage = ExecutionUpdateMessage | WorkflowEventMessage | WebSocketMessage;

class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnected = false;
  private token: string | null = null;

  constructor(url?: string) {
    super();
    this.url = url || this.getWebSocketUrl();
  }

  private getWebSocketUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const wsUrl = baseUrl.replace(/^http/, 'ws');
    return `${wsUrl}/api/v1/ws`;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    // Use auth service for token management
    const { authService } = require('@/services/auth/auth-service');
    return authService.getToken();
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Don't pass token in URL for security
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          logger.info('WebSocket connected');
          this.isConnected = true;
          
          // Send authentication as first message after connection
          this.token = this.getToken();
          if (this.token) {
            this.send({
              type: 'auth',
              data: { token: this.token },
              timestamp: new Date().toISOString()
            });
          }
          
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          const message = safeJsonParse<WSMessage>(event.data);
          if (message) {
            this.handleMessage(message);
          } else {
            logger.warn('Received invalid WebSocket message');
          }
        };

        this.ws.onclose = (event) => {
          logger.info('WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.stopHeartbeat();
          this.emit('disconnected', event);

          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          logger.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.stopHeartbeat();
    this.isConnected = false;
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling WebSocket reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect().catch(error => {
          console.error('Reconnect failed:', error);
        });
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping',
          data: null,
          timestamp: new Date().toISOString()
        });
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleMessage(message: WSMessage): void {
    switch (message.type) {
      case 'execution_update':
        this.emit('execution_update', message.data);
        break;
      case 'workflow_event':
        this.emit('workflow_event', message.data);
        break;
      case 'pong':
        // Heartbeat response
        break;
      default:
        this.emit('message', message);
        break;
    }
  }

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }

  subscribeToExecution(executionId: string): void {
    this.send({
      type: 'subscribe',
      data: { type: 'execution', id: executionId },
      timestamp: new Date().toISOString()
    });
  }

  unsubscribeFromExecution(executionId: string): void {
    this.send({
      type: 'unsubscribe',
      data: { type: 'execution', id: executionId },
      timestamp: new Date().toISOString()
    });
  }

  subscribeToWorkflowEvents(): void {
    this.send({
      type: 'subscribe',
      data: { type: 'workflow_events' },
      timestamp: new Date().toISOString()
    });
  }

  getConnectionState(): 'connected' | 'connecting' | 'disconnected' {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      default:
        return 'disconnected';
    }
  }
}

// Singleton instance
export const wsService = new WebSocketService();

// React hook for using WebSocket service
export function useWebSocket() {
  return wsService;
}