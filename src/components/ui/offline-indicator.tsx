'use client';

import React from 'react';
import { useOffline } from '@/services/offline/offline';
import { WifiOff, Wifi, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function OfflineIndicator() {
  const offlineState = useOffline();
  
  if (offlineState.isOnline && offlineState.connectionQuality === 'good') {
    // Don't show indicator when connection is good
    return null;
  }
  
  const getIcon = () => {
    if (!offlineState.isOnline) {
      return <WifiOff className="h-4 w-4" />;
    }
    if (offlineState.connectionQuality === 'poor') {
      return <AlertTriangle className="h-4 w-4" />;
    }
    return <Wifi className="h-4 w-4" />;
  };
  
  const getColor = () => {
    if (!offlineState.isOnline) return 'text-destructive';
    if (offlineState.connectionQuality === 'poor') return 'text-warning';
    if (offlineState.connectionQuality === 'degraded') return 'text-yellow-500';
    return 'text-muted-foreground';
  };
  
  const getMessage = () => {
    if (!offlineState.isOnline) {
      const duration = offlineState.offlineSince
        ? formatDuration(new Date(offlineState.offlineSince))
        : '';
      return `Offline${duration ? ` for ${duration}` : ''}`;
    }
    if (offlineState.connectionQuality === 'poor') {
      return 'Poor connection';
    }
    if (offlineState.connectionQuality === 'degraded') {
      return 'Slow connection';
    }
    return 'Connected';
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'flex items-center space-x-1 px-2 py-1 rounded-md transition-colors',
            !offlineState.isOnline && 'bg-destructive/10',
            offlineState.connectionQuality === 'poor' && 'bg-warning/10',
            offlineState.connectionQuality === 'degraded' && 'bg-yellow-500/10'
          )}>
            <span className={cn('animate-pulse', getColor())}>
              {getIcon()}
            </span>
            <span className={cn('text-xs font-medium', getColor())}>
              {getMessage()}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <div>Status: {offlineState.isOnline ? 'Online' : 'Offline'}</div>
            <div>Quality: {offlineState.connectionQuality}</div>
            {offlineState.lastOnline && (
              <div>Last online: {new Date(offlineState.lastOnline).toLocaleTimeString()}</div>
            )}
            {!offlineState.isOnline && (
              <div className="mt-2 text-muted-foreground">
                Some features may be limited offline
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function formatDuration(since: Date): string {
  const now = new Date();
  const diff = now.getTime() - since.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'just now';
}