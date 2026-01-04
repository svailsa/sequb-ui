import React, { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { useRegistryStore } from '@/stores/useRegistryStore'
import { LucideIcon, Slack, Terminal, Code, Brain, Zap, Database, Send, FileText, Search, Play } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  slack: Slack,
  terminal: Terminal,
  code: Code,
  brain: Brain,
  trigger: Zap,
  database: Database,
  send: Send,
  file: FileText,
  search: Search,
  play: Play,
}

interface UniversalNodeData {
  nodeType: string
  label?: string
  [key: string]: any
}

export const UniversalNode = memo<NodeProps<UniversalNodeData>>(({ data, selected }) => {
  const registry = useRegistryStore((state) => state.registry)
  
  if (!registry || !data.nodeType) {
    return (
      <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 min-w-[200px]">
        <div className="text-sm text-gray-500">Unknown Node Type</div>
      </div>
    )
  }
  
  const nodeDefinition = registry.nodes[data.nodeType]
  if (!nodeDefinition) {
    return (
      <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 min-w-[200px]">
        <div className="text-sm text-gray-500">Node type not found: {data.nodeType}</div>
      </div>
    )
  }
  
  const Icon = nodeDefinition.icon ? iconMap[nodeDefinition.icon] : Terminal
  
  return (
    <div
      className={`bg-white border-2 rounded-lg shadow-md min-w-[250px] transition-all ${
        selected ? 'border-blue-500 shadow-lg' : 'border-gray-300'
      }`}
    >
      {/* Header */}
      <div className="px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg border-b">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-sm">{data.label || nodeDefinition.label}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">{nodeDefinition.category}</div>
      </div>
      
      {/* Body */}
      <div className="p-4">
        {/* Inputs */}
        <div className="space-y-2">
          {nodeDefinition.inputs.map((input, index) => (
            <div key={input.key} className="relative">
              <Handle
                type="target"
                position={Position.Left}
                id={input.key}
                style={{ top: `${20 + index * 30}px` }}
                className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
              />
              <div className="pl-4 text-xs text-gray-600">{input.label}</div>
              {data[input.key] && (
                <div className="pl-4 text-xs text-gray-800 truncate max-w-[180px]">
                  {String(data[input.key])}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Outputs */}
        {nodeDefinition.outputs.length > 0 && (
          <div className="mt-4 pt-2 border-t space-y-2">
            {nodeDefinition.outputs.map((output, index) => (
              <div key={output.key} className="relative text-right">
                <Handle
                  type="source"
                  position={Position.Right}
                  id={output.key}
                  style={{ 
                    top: `${20 + (nodeDefinition.inputs.length * 30) + 20 + index * 30}px` 
                  }}
                  className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
                />
                <div className="pr-4 text-xs text-gray-600">{output.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

UniversalNode.displayName = 'UniversalNode'