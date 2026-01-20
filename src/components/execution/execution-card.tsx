"use client";

import { Execution } from '@/types/sequb';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Square,
  AlertCircle,
  Calendar,
  Timer,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatRelativeTime } from '@/lib/utils';

interface ExecutionCardProps {
  execution: Execution;
  onView?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ExecutionCard({
  execution,
  onView,
  onCancel,
  isLoading = false
}: ExecutionCardProps) {

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="w-4 h-4 text-blue-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled':
        return <Square className="w-4 h-4 text-gray-600" />;
      case 'waiting_for_approval':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'waiting_for_approval':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDuration = () => {
    const start = new Date(execution.started_at);
    const end = execution.completed_at ? new Date(execution.completed_at) : new Date();
    const durationMs = end.getTime() - start.getTime();
    
    if (durationMs < 1000) return '< 1s';
    if (durationMs < 60000) return `${Math.round(durationMs / 1000)}s`;
    if (durationMs < 3600000) return `${Math.round(durationMs / 60000)}m`;
    return `${Math.round(durationMs / 3600000)}h`;
  };

  const canCancel = execution.status === 'running' || execution.status === 'pending';

  return (
    <div 
      className={cn(
        "bg-card rounded-lg border p-4 hover:shadow-sm transition-shadow",
        isLoading && "opacity-50 pointer-events-none"
      )}
    >
      <div className="flex items-center justify-between">
        {/* Left side - Status and basic info */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            {getStatusIcon(execution.status)}
            <span
              className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs border font-medium",
                getStatusColor(execution.status)
              )}
            >
              {execution.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm text-muted-foreground truncate">
                {execution.id}
              </span>
              {execution.workflow_id && (
                <span className="text-xs text-muted-foreground">
                  → {execution.workflow_id.slice(0, 8)}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{formatRelativeTime(execution.started_at)}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Timer className="w-3 h-3" />
                <span>{getDuration()}</span>
              </div>

              {execution.cost && (
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-3 h-3" />
                  <span>${execution.cost.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Error message and actions */}
        <div className="flex items-center space-x-2">
          {execution.error && (
            <div className="max-w-xs">
              <p className="text-xs text-red-600 truncate" title={execution.error}>
                {execution.error}
              </p>
            </div>
          )}

          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onView}
            >
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>

            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={isLoading}
              >
                <Square className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar for running executions */}
      {execution.status === 'running' && (
        <div className="mt-3">
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 animate-pulse"
              style={{ width: '60%' }} // TODO: Use actual progress from execution data
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">
              Executing...
            </span>
            <span className="text-xs text-muted-foreground">
              {/* TODO: Show current node or step */}
              {execution.metadata?.current_node || 'Processing'}
            </span>
          </div>
        </div>
      )}

      {/* Input/Output summary for completed executions */}
      {(execution.status === 'completed' || execution.status === 'failed') && execution.outputs && (
        <div className="mt-3 pt-3 border-t">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Inputs:</span>
              <div className="font-mono text-xs text-muted-foreground">
                {execution.inputs ? Object.keys(execution.inputs).length : 0} fields
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Outputs:</span>
              <div className="font-mono text-xs text-muted-foreground">
                {Object.keys(execution.outputs).length} fields
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}