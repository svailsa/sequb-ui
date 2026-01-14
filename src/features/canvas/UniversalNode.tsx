import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { useRegistryStore } from '@/stores/useRegistryStore'
import { LucideIcon, Slack, Terminal, Code, Brain, Zap, Database, Send, FileText, Search, Play, AlertCircle } from 'lucide-react'

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

export const UniversalNode = memo<NodeProps>(({ data, selected }) => {
  const registry = useRegistryStore((state) => state.registry)
  
  // Fallback for missing registry or nodeType
  if (!registry || !data['nodeType']) {
    return (
      <div className="p-2 bg-red-100 text-red-500 rounded-md border-2 border-red-300 min-w-[150px]">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Unknown Node</span>
        </div>
      </div>
    )
  }
  
  const nodeType = String(data['nodeType'] || '')
  const nodeDef = registry.nodes[nodeType]
  
  // Fallback for missing plugins (e.g., if a plugin was uninstalled)
  if (!nodeDef) {
    return (
      <div className="p-2 bg-red-100 text-red-500 rounded-md border-2 border-red-300 min-w-[150px]">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Unknown Node: {nodeType}</span>
        </div>
      </div>
    )
  }
  
  const Icon = iconMap[nodeDef.icon || ''] || Terminal
  
  return (
    <div
      className={`
        sequb-node shadow-md rounded-md bg-white border-2 min-w-[200px]
        ${selected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'}
      `}
    >
      {/* HEADER */}
      <div className="flex items-center gap-2 p-2 border-b bg-slate-50 rounded-t-md">
        <Icon className="w-4 h-4 text-slate-600" />
        <span className="font-semibold text-sm">{nodeDef.label}</span>
      </div>

      {/* BODY */}
      <div className="p-3">
        <div className="text-xs text-slate-500">{nodeDef.category}</div>
        
        {/* Show key values if present */}
        {nodeDef.inputs.length > 0 && (
          <div className="mt-2 space-y-1">
            {nodeDef.inputs.slice(0, 2).map((input: any) => {
              const value = data[input.key]
              if (value !== undefined && value !== null && value !== '') {
                return (
                  <div key={input.key} className="text-xs">
                    <span className="text-slate-500">{input.label}:</span>
                    <span className="text-slate-700 ml-1 truncate inline-block max-w-[120px]">
                      {String(value)}
                    </span>
                  </div>
                )
              }
              return null
            })}
          </div>
        )}
      </div>

      {/* INPUT HANDLES - Dynamically positioned */}
      {nodeDef.inputs.map((input: any, i: number) => {
        const totalInputs = nodeDef.inputs.length
        const verticalPosition = ((i + 1) * 100) / (totalInputs + 1)
        
        return (
          <Handle
            key={input.key}
            type="target"
            position={Position.Left}
            id={input.key}
            style={{ top: `${verticalPosition}%` }}
            className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white hover:!bg-gray-600"
            title={input.label}
          />
        )
      })}

      {/* OUTPUT HANDLES - Dynamically positioned */}
      {nodeDef.outputs.map((output: any, i: number) => {
        const totalOutputs = nodeDef.outputs.length
        const verticalPosition = ((i + 1) * 100) / (totalOutputs + 1)
        
        return (
          <Handle
            key={output.key}
            type="source"
            position={Position.Right}
            id={output.key}
            style={{ top: `${verticalPosition}%` }}
            className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white hover:!bg-blue-600"
            title={output.label}
          />
        )
      })}
    </div>
  )
})

UniversalNode.displayName = 'UniversalNode'