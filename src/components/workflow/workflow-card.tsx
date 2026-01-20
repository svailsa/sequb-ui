"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Workflow } from '@/types/sequb';
import { 
  Play, 
  Pause, 
  Archive, 
  Edit, 
  Eye, 
  MoreHorizontal, 
  Copy, 
  Trash2,
  Calendar,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatRelativeTime } from '@/lib/utils';

interface WorkflowCardProps {
  workflow: Workflow;
  onEdit?: () => void;
  onView?: () => void;
  onDelete?: () => void;
  onClone?: () => void;
  onStatusChange?: (status: 'active' | 'paused' | 'archived') => void;
  isLoading?: boolean;
}

export function WorkflowCard({
  workflow,
  onEdit,
  onView,
  onDelete,
  onClone,
  onStatusChange,
  isLoading = false
}: WorkflowCardProps) {
  const [showActions, setShowActions] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-3 h-3" />;
      case 'paused':
        return <Pause className="w-3 h-3" />;
      case 'archived':
        return <Archive className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const nodeCount = workflow.graph?.nodes?.length || 0;
  const edgeCount = workflow.graph?.edges?.length || 0;

  return (
    <div 
      className={cn(
        "bg-card rounded-lg border p-6 hover:shadow-md transition-shadow",
        isLoading && "opacity-50 pointer-events-none"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate" title={workflow.name}>
            {workflow.name}
          </h3>
          {workflow.description && (
            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
              {workflow.description}
            </p>
          )}
        </div>
        
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowActions(!showActions)}
            className="ml-2"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
          
          {showActions && (
            <div className="absolute right-0 top-8 bg-background border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
              <button
                onClick={() => {
                  onView?.();
                  setShowActions(false);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-muted text-sm flex items-center"
              >
                <Eye className="w-3 h-3 mr-2" />
                View
              </button>
              <button
                onClick={() => {
                  onEdit?.();
                  setShowActions(false);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-muted text-sm flex items-center"
              >
                <Edit className="w-3 h-3 mr-2" />
                Edit
              </button>
              <button
                onClick={() => {
                  onClone?.();
                  setShowActions(false);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-muted text-sm flex items-center"
              >
                <Copy className="w-3 h-3 mr-2" />
                Clone
              </button>
              <div className="border-t my-1"></div>
              <button
                onClick={() => {
                  onDelete?.();
                  setShowActions(false);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-muted text-sm flex items-center text-red-600"
              >
                <Trash2 className="w-3 h-3 mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status and Tags */}
      <div className="flex items-center space-x-2 mb-4">
        <span
          className={cn(
            "inline-flex items-center px-2 py-1 rounded-full text-xs border",
            getStatusColor(workflow.status)
          )}
        >
          {getStatusIcon(workflow.status)}
          <span className="ml-1 capitalize">{workflow.status}</span>
        </span>
        
        {workflow.tags && workflow.tags.length > 0 && (
          <div className="flex items-center space-x-1">
            <Tag className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {workflow.tags.slice(0, 2).join(', ')}
              {workflow.tags.length > 2 && ` +${workflow.tags.length - 2}`}
            </span>
          </div>
        )}
      </div>

      {/* Workflow Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-2 bg-muted/30 rounded">
          <div className="text-lg font-semibold">{nodeCount}</div>
          <div className="text-xs text-muted-foreground">Nodes</div>
        </div>
        <div className="text-center p-2 bg-muted/30 rounded">
          <div className="text-lg font-semibold">{edgeCount}</div>
          <div className="text-xs text-muted-foreground">Connections</div>
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center">
          <Calendar className="w-3 h-3 mr-2" />
          <span>Created {formatRelativeTime(workflow.created_at)}</span>
        </div>
        {workflow.last_executed_at && (
          <div className="flex items-center">
            <Play className="w-3 h-3 mr-2" />
            <span>Last run {formatRelativeTime(workflow.last_executed_at)}</span>
          </div>
        )}
        <div>Version {workflow.version}</div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={onView}
          className="flex-1"
        >
          <Eye className="w-3 h-3 mr-1" />
          View
        </Button>
        
        {workflow.status === 'active' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange?.('paused')}
          >
            <Pause className="w-3 h-3" />
          </Button>
        ) : workflow.status === 'paused' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange?.('active')}
          >
            <Play className="w-3 h-3" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange?.('active')}
          >
            <Play className="w-3 h-3" />
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
        >
          <Edit className="w-3 h-3" />
        </Button>
      </div>

      {/* Click outside handler */}
      {showActions && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
}