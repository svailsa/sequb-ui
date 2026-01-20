"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { ExecutionUpdateMessage, WorkflowEventMessage } from '@/lib/websocket';

interface WebSocketContextType {
  isConnected: boolean;
  isConnecting: boolean;
  connectionState: 'connected' | 'connecting' | 'disconnected';
  lastExecutionUpdate: ExecutionUpdateMessage['data'] | null;
  lastWorkflowEvent: WorkflowEventMessage['data'] | null;
  executionUpdates: Record<string, ExecutionUpdateMessage['data']>;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribeToExecution: (executionId: string) => void;
  unsubscribeFromExecution: (executionId: string) => void;
  subscribeToWorkflowEvents: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}

interface WebSocketProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
}

export function WebSocketProvider({ children, autoConnect = true }: WebSocketProviderProps) {
  const [lastExecutionUpdate, setLastExecutionUpdate] = useState<ExecutionUpdateMessage['data'] | null>(null);
  const [lastWorkflowEvent, setLastWorkflowEvent] = useState<WorkflowEventMessage['data'] | null>(null);

  const {
    connectionState,
    isConnected,
    isConnecting,
    executionUpdates,
    connect,
    disconnect,
    subscribeToExecution,
    unsubscribeFromExecution,
    subscribeToWorkflowEvents
  } = useWebSocket({
    autoConnect,
    onExecutionUpdate: (data) => {
      setLastExecutionUpdate(data);
    },
    onWorkflowEvent: (data) => {
      setLastWorkflowEvent(data);
    },
    onConnected: () => {
      console.log('WebSocket connected to Sequb backend');
      // Auto-subscribe to workflow events
      subscribeToWorkflowEvents();
    },
    onDisconnected: () => {
      console.log('WebSocket disconnected from Sequb backend');
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    }
  });

  const contextValue: WebSocketContextType = {
    isConnected,
    isConnecting,
    connectionState,
    lastExecutionUpdate,
    lastWorkflowEvent,
    executionUpdates,
    connect,
    disconnect,
    subscribeToExecution,
    unsubscribeFromExecution,
    subscribeToWorkflowEvents
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Component to display connection status
export function WebSocketStatus() {
  const { connectionState } = useWebSocketContext();

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="flex items-center space-x-2 text-xs">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-muted-foreground">{getStatusText()}</span>
    </div>
  );
}