"use client";

import { useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { useStatusStore } from '@/stores/status-store';
import { Play, Clock, CheckCircle, XCircle, Square, Loader2, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ExecutionStatusIndicatorProps {
  executionId: string;
  currentStatus?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'waiting_for_approval';
  className?: string;
  showLabel?: boolean;
  showProgress?: boolean;
}

export function ExecutionStatusIndicator({ 
  executionId, 
  currentStatus, 
  className, 
  showLabel = false,
  showProgress = false 
}: ExecutionStatusIndicatorProps) {
  const { executionStatuses, updateExecutionStatus } = useStatusStore();

  // Get real-time status from store, fallback to prop
  const executionStatus = executionStatuses[executionId];
  const status = executionStatus?.status || currentStatus || 'pending';
  const progress = executionStatus?.progress;
  const currentNode = executionStatus?.currentNode;
  const error = executionStatus?.error;

  // Initialize execution status if not in store
  useEffect(() => {
    if (currentStatus && !executionStatus) {
      updateExecutionStatus(executionId, { status: currentStatus });
    }
  }, [executionId, currentStatus, executionStatus, updateExecutionStatus]);

  const getStatusConfig = () => {
    switch (status) {
      case 'running':
        return {
          icon: Loader2,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Running',
          description: currentNode ? `Executing: ${currentNode}` : 'Workflow is running'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Completed',
          description: 'Workflow completed successfully'
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Failed',
          description: error || 'Workflow execution failed'
        };
      case 'cancelled':
        return {
          icon: Square,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Cancelled',
          description: 'Workflow execution was cancelled'
        };
      case 'waiting_for_approval':
        return {
          icon: AlertCircle,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          label: 'Waiting Approval',
          description: 'Waiting for manual approval to continue'
        };
      default: // pending
        return {
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: 'Pending',
          description: 'Waiting to start execution'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const lastUpdated = executionStatus?.updatedAt;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center space-x-2', className)}>
            <div className={cn(
              'flex items-center space-x-2 px-2 py-1 rounded-md border',
              config.bgColor,
              config.borderColor
            )}>
              <Icon className={cn(
                'w-4 h-4',
                config.color,
                status === 'running' ? 'animate-spin' : ''
              )} />
              
              {showLabel && (
                <span className={cn('text-sm font-medium', config.color)}>
                  {config.label}
                </span>
              )}

              {showProgress && progress !== undefined && (
                <span className="text-xs text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{config.label}</p>
            <p className="text-sm">{config.description}</p>
            
            {progress !== undefined && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  Progress: {Math.round(progress)}%
                </div>
                <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn('h-full transition-all duration-300', config.color.replace('text-', 'bg-'))}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {currentNode && (
              <div className="text-xs text-muted-foreground">
                Current: {currentNode}
              </div>
            )}

            {lastUpdated && (
              <div className="text-xs text-muted-foreground">
                Updated: {new Date(lastUpdated).toLocaleTimeString()}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}