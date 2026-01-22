"use client";

import { useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { useStatusStore } from '@/stores/status-store';
import { Wifi, WifiOff, Server, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StatusIndicatorProps {
  type: 'backend' | 'websocket' | 'compact' | 'full';
  className?: string;
  showLabel?: boolean;
}

export function StatusIndicator({ type, className, showLabel = false }: StatusIndicatorProps) {
  const { systemStatus, startHealthMonitoring, stopHealthMonitoring } = useStatusStore();

  useEffect(() => {
    startHealthMonitoring();
    return () => stopHealthMonitoring();
  }, [startHealthMonitoring, stopHealthMonitoring]);

  const renderBackendStatus = () => {
    const { backend, apiLatency, lastHealthCheck } = systemStatus;
    
    let icon, color, label;
    switch (backend) {
      case 'healthy':
        icon = CheckCircle;
        color = 'text-green-500';
        label = `Backend Healthy${apiLatency ? ` (${apiLatency}ms)` : ''}`;
        break;
      case 'degraded':
        icon = AlertTriangle;
        color = 'text-yellow-500';
        label = 'Backend Degraded';
        break;
      default:
        icon = Server;
        color = 'text-red-500';
        label = 'Backend Unavailable';
    }

    const Icon = icon;
    const tooltip = lastHealthCheck 
      ? `Last checked: ${new Date(lastHealthCheck).toLocaleTimeString()}`
      : 'No health check performed';

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center space-x-2', className)}>
              <Icon className={cn('w-4 h-4', color)} />
              {showLabel && <span className="text-sm">{label}</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderWebSocketStatus = () => {
    const { websocket } = systemStatus;
    
    let icon, color, label;
    switch (websocket) {
      case 'connected':
        icon = Wifi;
        color = 'text-green-500';
        label = 'Real-time Connected';
        break;
      case 'connecting':
      case 'reconnecting':
        icon = Clock;
        color = 'text-yellow-500';
        label = 'Connecting...';
        break;
      default:
        icon = WifiOff;
        color = 'text-red-500';
        label = 'Real-time Disconnected';
    }

    const Icon = icon;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center space-x-2', className)}>
              <Icon className={cn('w-4 h-4', color)} />
              {showLabel && <span className="text-sm">{label}</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>WebSocket Status: {websocket}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderCompactStatus = () => {
    const { backend, websocket } = systemStatus;
    
    let color = 'text-green-500';
    let tooltip = 'All systems operational';
    
    if (backend === 'unavailable' || websocket === 'disconnected') {
      color = 'text-red-500';
      tooltip = 'Service disruption detected';
    } else if (backend === 'degraded' || websocket === 'connecting') {
      color = 'text-yellow-500';
      tooltip = 'Service degraded';
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center space-x-2', className)}>
              <div className={cn('w-3 h-3 rounded-full', color.replace('text-', 'bg-'))} />
              {showLabel && <span className="text-sm">System Status</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>{tooltip}</p>
              <div className="text-xs text-muted-foreground">
                <div>Backend: {backend}</div>
                <div>WebSocket: {websocket}</div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderFullStatus = () => {
    const { backend, websocket, apiLatency, activeExecutions, executionQueue } = systemStatus;

    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">System Status</span>
          {renderCompactStatus()}
        </div>
        
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span>Backend:</span>
            <span className={cn(
              'font-medium',
              backend === 'healthy' ? 'text-green-600' : 
              backend === 'degraded' ? 'text-yellow-600' : 'text-red-600'
            )}>
              {backend}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Real-time:</span>
            <span className={cn(
              'font-medium',
              websocket === 'connected' ? 'text-green-600' : 
              websocket.includes('connecting') ? 'text-yellow-600' : 'text-red-600'
            )}>
              {websocket}
            </span>
          </div>
          
          {apiLatency && (
            <div className="flex items-center justify-between">
              <span>Latency:</span>
              <span className="font-medium">{apiLatency}ms</span>
            </div>
          )}
          
          {activeExecutions > 0 && (
            <div className="flex items-center justify-between">
              <span>Active:</span>
              <span className="font-medium">{activeExecutions} executions</span>
            </div>
          )}
          
          {executionQueue > 0 && (
            <div className="flex items-center justify-between">
              <span>Queued:</span>
              <span className="font-medium">{executionQueue} executions</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  switch (type) {
    case 'backend':
      return renderBackendStatus();
    case 'websocket':
      return renderWebSocketStatus();
    case 'compact':
      return renderCompactStatus();
    case 'full':
      return renderFullStatus();
    default:
      return renderCompactStatus();
  }
}