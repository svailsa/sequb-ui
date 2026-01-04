import React from 'react'
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

export function NodePalette() {
  const registry = useRegistryStore((state) => state.registry)
  
  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/sequb-node', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }
  
  if (!registry) {
    return (
      <div className="p-4">
        <div className="text-sm text-gray-500">Loading nodes...</div>
      </div>
    )
  }
  
  // Group nodes by category
  const nodesByCategory = Object.entries(registry.nodes).reduce((acc, [key, node]) => {
    if (!acc[node.category]) {
      acc[node.category] = []
    }
    acc[node.category].push({ key, ...node })
    return acc
  }, {} as Record<string, Array<{ key: string } & typeof registry.nodes[string]>>)
  
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Node Palette</h2>
      
      {Object.entries(nodesByCategory).map(([category, nodes]) => (
        <div key={category} className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">{category}</h3>
          <div className="space-y-2">
            {nodes.map((node) => {
              const Icon = node.icon ? iconMap[node.icon] : Terminal
              
              return (
                <div
                  key={node.key}
                  draggable
                  onDragStart={(e) => handleDragStart(e, node.key)}
                  className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 cursor-move transition-colors"
                >
                  <Icon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">{node.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}