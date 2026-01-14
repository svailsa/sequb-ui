import { useEffect } from 'react'
import { GraphCanvas } from './features/canvas/GraphCanvas'
import { DynamicForm } from './features/properties/DynamicForm'
import { NodePalette } from './features/NodePalette'
import { useRegistryStore } from './stores/useRegistryStore'
import { api } from './lib/api'
import { PlayCircle, Save, FolderOpen, Plus } from 'lucide-react'
import { useGraphStore } from './stores/useGraphStore'
import { Bootloader } from './components/Bootloader'

function AppContent() {
  const { setRegistry, setLoading, setError } = useRegistryStore()
  const { nodes, edges } = useGraphStore()
  
  // Fetch registry on mount (server is guaranteed to be ready)
  useEffect(() => {
    const fetchRegistry = async () => {
      setLoading(true)
      try {
        const { data } = await api.registry.get()
        setRegistry(data)
      } catch (error) {
        console.error('Failed to fetch registry:', error)
        setError('Failed to fetch node registry')
      } finally {
        setLoading(false)
      }
    }
    
    fetchRegistry()
  }, [setRegistry, setLoading, setError])
  
  const handleExecute = async () => {
    if (nodes.length === 0) {
      alert('No nodes to execute')
      return
    }
    
    try {
      // Create a temporary workflow and execute it
      const workflow = {
        name: 'Untitled Workflow',
        nodes: nodes.map(n => ({
          id: n.id,
          type: String(n.data['nodeType'] || 'default'),
          position: n.position,
          data: n.data,
        })),
        edges: edges.map(e => {
          const edge: any = {
            id: e.id,
            source: e.source,
            target: e.target,
          }
          if (e.sourceHandle) edge.sourceHandle = e.sourceHandle
          if (e.targetHandle) edge.targetHandle = e.targetHandle
          return edge
        }),
      }
      
      const { data: createdWorkflow } = await api.workflow.create(workflow)
      const { data: execution } = await api.workflow.execute(createdWorkflow.id)
      
      console.log('Workflow executing with execution_id:', execution.execution_id || execution)
      // TODO: Add execution monitoring UI
    } catch (error) {
      console.error('Failed to execute workflow:', error)
      alert('Failed to execute workflow')
    }
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Node Palette */}
      <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <NodePalette />
      </div>
      
      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExecute}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <PlayCircle className="w-4 h-4" />
              Execute
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <Save className="w-4 h-4" />
              Save
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
              <FolderOpen className="w-4 h-4" />
              Load
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>
        </div>
        
        {/* Canvas Area */}
        <div className="flex-1">
          <GraphCanvas />
        </div>
      </div>
      
      {/* Right Sidebar - Properties Panel */}
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <DynamicForm />
      </div>
    </div>
  )
}

function App() {
  return (
    <Bootloader>
      <AppContent />
    </Bootloader>
  )
}

export default App