"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { NodeType } from '@/types/sequb';

interface CustomNodeData {
  nodeType: NodeType;
  inputs: Record<string, any>;
  label: string;
  isConfigured?: boolean;
}

export const CustomNode = memo(({ data, selected, id }: NodeProps<CustomNodeData>) => {
  const { nodeType, label, isConfigured = false } = data;

  const getNodeIcon = (nodeType: NodeType): string => {
    const iconMap: Record<string, string> = {
      'text_input': '📝',
      'http_request': '🌐',
      'email_send': '✉️',
      'ai_completion': '🧠',
      'file_write': '📄',
      'delay': '⏰',
    };
    
    return iconMap[nodeType.id] || '⚙️';
  };

  const getCategoryColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      'Input': 'border-blue-500 bg-blue-50',
      'Output': 'border-green-500 bg-green-50',
      'Network': 'border-orange-500 bg-orange-50',
      'Communication': 'border-purple-500 bg-purple-50',
      'AI': 'border-pink-500 bg-pink-50',
      'File System': 'border-yellow-500 bg-yellow-50',
      'Control Flow': 'border-gray-500 bg-gray-50',
    };
    
    return colorMap[category] || 'border-gray-400 bg-gray-50';
  };

  return (
    <div
      className={cn(
        "min-w-[180px] border-2 rounded-lg bg-background shadow-sm transition-all",
        getCategoryColor(nodeType.category),
        selected && "shadow-lg ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Input Handles */}
      {nodeType.inputs.map((input, index) => (
        <Handle
          key={input.key}
          type="target"
          position={Position.Left}
          id={input.key}
          style={{
            top: 32 + (index * 20),
            background: '#6b7280',
            width: '8px',
            height: '8px',
          }}
          title={input.description}
        />
      ))}

      {/* Node Header */}
      <div className="flex items-center justify-between p-2 border-b border-border/50">
        <div className="flex items-center space-x-2">
          <span className="text-sm">{getNodeIcon(nodeType)}</span>
          <span className="text-sm font-medium truncate">{label}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Settings className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Node Body */}
      <div className="p-2 space-y-1">
        <div className="text-xs text-muted-foreground">
          {nodeType.category}
        </div>
        
        {/* Input/Output Summary */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{nodeType.inputs.length} inputs</span>
          <span>{nodeType.outputs.length} outputs</span>
        </div>

        {/* Configuration Status */}
        <div className="text-xs">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
              isConfigured
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {isConfigured ? 'Configured' : 'Not configured'}
          </span>
        </div>
      </div>

      {/* Output Handles */}
      {nodeType.outputs.map((output, index) => (
        <Handle
          key={output.key}
          type="source"
          position={Position.Right}
          id={output.key}
          style={{
            top: 32 + (index * 20),
            background: '#6b7280',
            width: '8px',
            height: '8px',
          }}
          title={output.description}
        />
      ))}
    </div>
  );
});