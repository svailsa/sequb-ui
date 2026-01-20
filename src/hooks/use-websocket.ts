"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { wsService, WSMessage, ExecutionUpdateMessage, WorkflowEventMessage } from '@/lib/websocket';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  onMessage?: (message: WSMessage) => void;
  onExecutionUpdate?: (data: ExecutionUpdateMessage['data']) => void;
  onWorkflowEvent?: (data: WorkflowEventMessage['data']) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    onMessage,
    onExecutionUpdate,
    onWorkflowEvent,
    onConnected,
    onDisconnected,
    onError
  } = options;

  const [connectionState, setConnectionState] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const [executionUpdates, setExecutionUpdates] = useState<Record<string, ExecutionUpdateMessage['data']>>({});

  // Use refs to store callback functions to avoid re-subscribing on every render
  const onMessageRef = useRef(onMessage);
  const onExecutionUpdateRef = useRef(onExecutionUpdate);
  const onWorkflowEventRef = useRef(onWorkflowEvent);
  const onConnectedRef = useRef(onConnected);
  const onDisconnectedRef = useRef(onDisconnected);
  const onErrorRef = useRef(onError);

  // Update refs when props change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onExecutionUpdateRef.current = onExecutionUpdate;
    onWorkflowEventRef.current = onWorkflowEvent;
    onConnectedRef.current = onConnected;
    onDisconnectedRef.current = onDisconnected;
    onErrorRef.current = onError;
  }, [onMessage, onExecutionUpdate, onWorkflowEvent, onConnected, onDisconnected, onError]);

  const connect = useCallback(async () => {
    try {
      setConnectionState('connecting');
      await wsService.connect();
    } catch (error) {
      setConnectionState('disconnected');
      onErrorRef.current?.(error);
    }
  }, []);

  const disconnect = useCallback(() => {
    wsService.disconnect();
    setConnectionState('disconnected');
  }, []);

  const sendMessage = useCallback((message: Omit<WSMessage, 'timestamp'>) => {
    wsService.send({
      ...message,
      timestamp: new Date().toISOString()
    });
  }, []);

  const subscribeToExecution = useCallback((executionId: string) => {
    wsService.subscribeToExecution(executionId);
  }, []);

  const unsubscribeFromExecution = useCallback((executionId: string) => {
    wsService.unsubscribeFromExecution(executionId);
  }, []);

  const subscribeToWorkflowEvents = useCallback(() => {
    wsService.subscribeToWorkflowEvents();
  }, []);

  // Set up event listeners
  useEffect(() => {
    const handleConnected = () => {
      setConnectionState('connected');
      onConnectedRef.current?.();
    };

    const handleDisconnected = () => {
      setConnectionState('disconnected');
      onDisconnectedRef.current?.();
    };

    const handleError = (error: any) => {
      setConnectionState('disconnected');
      onErrorRef.current?.(error);
    };

    const handleMessage = (message: WSMessage) => {
      setLastMessage(message);
      onMessageRef.current?.(message);
    };

    const handleExecutionUpdate = (data: ExecutionUpdateMessage['data']) => {
      setExecutionUpdates(prev => ({
        ...prev,
        [data.execution_id]: data
      }));
      onExecutionUpdateRef.current?.(data);
    };

    const handleWorkflowEvent = (data: WorkflowEventMessage['data']) => {
      onWorkflowEventRef.current?.(data);
    };

    wsService.on('connected', handleConnected);
    wsService.on('disconnected', handleDisconnected);
    wsService.on('error', handleError);
    wsService.on('message', handleMessage);
    wsService.on('execution_update', handleExecutionUpdate);
    wsService.on('workflow_event', handleWorkflowEvent);

    return () => {
      wsService.off('connected', handleConnected);
      wsService.off('disconnected', handleDisconnected);
      wsService.off('error', handleError);
      wsService.off('message', handleMessage);
      wsService.off('execution_update', handleExecutionUpdate);
      wsService.off('workflow_event', handleWorkflowEvent);
    };
  }, []);

  // Auto-connect when component mounts
  useEffect(() => {
    if (autoConnect && connectionState === 'disconnected') {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (connectionState === 'connected') {
        disconnect();
      }
    };
  }, [autoConnect, connect, disconnect, connectionState]);

  // Update connection state based on actual WebSocket state
  useEffect(() => {
    const updateState = () => {
      const actualState = wsService.getConnectionState();
      if (actualState !== connectionState) {
        setConnectionState(actualState);
      }
    };

    const interval = setInterval(updateState, 1000);
    return () => clearInterval(interval);
  }, [connectionState]);

  return {
    connectionState,
    lastMessage,
    executionUpdates,
    connect,
    disconnect,
    sendMessage,
    subscribeToExecution,
    unsubscribeFromExecution,
    subscribeToWorkflowEvents,
    isConnected: connectionState === 'connected',
    isConnecting: connectionState === 'connecting',
    isDisconnected: connectionState === 'disconnected'
  };
}

// Hook for monitoring a specific execution
export function useExecutionMonitor(executionId: string | null) {
  const [executionData, setExecutionData] = useState<ExecutionUpdateMessage['data'] | null>(null);
  const [logs, setLogs] = useState<Array<{
    level: string;
    message: string;
    timestamp: string;
  }>>([]);

  const { subscribeToExecution, unsubscribeFromExecution, isConnected } = useWebSocket({
    onExecutionUpdate: (data) => {
      if (data.execution_id === executionId) {
        setExecutionData(data);
        if (data.logs) {
          setLogs(prev => [...prev, ...data.logs!]);
        }
      }
    }
  });

  useEffect(() => {
    if (executionId && isConnected) {
      subscribeToExecution(executionId);
      return () => {
        unsubscribeFromExecution(executionId);
      };
    }
  }, [executionId, isConnected, subscribeToExecution, unsubscribeFromExecution]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    executionData,
    logs,
    clearLogs,
    isMonitoring: !!executionId && isConnected
  };
}