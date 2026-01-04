import React, { useEffect, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { GraphCanvas } from './features/canvas/GraphCanvas'
import { DynamicForm } from './features/properties/DynamicForm'
import { NodePalette } from './features/NodePalette'
import { useRegistryStore } from './stores/useRegistryStore'
import { api, initializeApiClient } from './lib/api'
import { PlayCircle, Save, FolderOpen, Plus } from 'lucide-react'
import { useGraphStore } from './stores/useGraphStore'

function App() {
  const [isServerReady, setIsServerReady] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const { setRegistry, setLoading, setError } = useRegistryStore()
  const { nodes, edges } = useGraphStore()
  
  // Wait for server to be ready
  useEffect(() => {
    let unsubscribe: any
    
    const setupListener = async () => {
      unsubscribe = await listen('server-ready', async (event) => {
        console.log('Server ready on port:', event.payload)
        await initializeApiClient()
        setIsServerReady(true)
      })
    }
    
    setupListener()
    
    // Also try to connect immediately in case server is already running
    const checkServer = async () => {
      try {
        await initializeApiClient()
        await api.health.check()
        setIsServerReady(true)
      } catch (error) {
        console.log('Server not ready yet, waiting for event...')
      }
    }
    
    checkServer()
    
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])
  
  // Fetch registry once server is ready
  useEffect(() => {
    if (!isServerReady) return
    
    const fetchRegistry = async () => {
      setLoading(true)
      try {
        const { data } = await api.registry.get()
        setRegistry(data)
        setConnectionError(null)
      } catch (error) {
        console.error('Failed to fetch registry:', error)
        setError('Failed to fetch node registry')
        setConnectionError('Failed to connect to Sequb server. Make sure the backend is running.')
      }
    }
    
    fetchRegistry()
  }, [isServerReady, setRegistry, setLoading, setError])
  
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
          type: n.data.nodeType,
          position: n.position,
          data: n.data,
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
        })),
      }
      
      const { data: createdWorkflow } = await api.workflow.create(workflow)
      const { data: execution } = await api.workflow.execute(createdWorkflow.id)
      
      console.log('Workflow executing with runId:', execution.runId)
      // TODO: Add execution monitoring UI
    } catch (error) {
      console.error('Failed to execute workflow:', error)
      alert('Failed to execute workflow')
    }
  }
  
  if (!isServerReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Starting Sequb Server...</p>
        </div>
      </div>
    )
  }
  
  if (connectionError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
          <p className="text-gray-600">{connectionError}</p>
        </div>
      </div>
    )
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

export default App