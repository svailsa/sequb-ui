import { useEffect, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { api, initializeApiClient } from '../lib/api'
import axios from 'axios'

interface BootloaderProps {
  children: React.ReactNode
}

interface BootState {
  status: 'spawning' | 'waiting' | 'ready' | 'error'
  message: string
  port?: number
  token?: string
}

declare global {
  interface Window {
    SEQUB_AUTH_TOKEN?: string
    SEQUB_SERVER_PORT?: number
  }
}

export function Bootloader({ children }: BootloaderProps) {
  const [bootState, setBootState] = useState<BootState>({
    status: 'spawning',
    message: 'Starting Sequb Server...'
  })

  useEffect(() => {
    let unsubscribe: (() => void) | null = null
    let healthCheckInterval: NodeJS.Timeout | null = null
    let timeout: NodeJS.Timeout | null = null

    const bootSequence = async () => {
      try {
        // Listen for server ready event from Tauri backend
        unsubscribe = await listen<{ port: number; token?: string }>('server-ready', (event) => {
          console.log('Server ready event received:', event.payload)
          
          const { port, token } = event.payload
          
          // Store auth token in memory (not localStorage for security)
          if (token) {
            window.SEQUB_AUTH_TOKEN = token
            axios.defaults.headers.common['x-sequb-auth'] = token
          }
          
          window.SEQUB_SERVER_PORT = port
          
          // Update API client with correct port and token
          initializeApiClient()
          
          setBootState({
            status: 'ready',
            message: 'Server ready',
            port,
            ...(token && { token })
          })
          
          // Clear intervals
          if (healthCheckInterval) clearInterval(healthCheckInterval)
          if (timeout) clearTimeout(timeout)
        })

        // Also listen for server stdout for auth token
        unsubscribe = await listen<string>('server-stdout', (event) => {
          const line = event.payload
          
          // Parse server startup messages
          if (line.includes('SEQUB_AUTH_TOKEN=')) {
            const tokenStr = line.split('SEQUB_AUTH_TOKEN=')[1]?.trim()
            if (tokenStr) {
              window.SEQUB_AUTH_TOKEN = tokenStr
              if (tokenStr) {
                axios.defaults.headers.common['x-sequb-auth'] = tokenStr
              }
            }
          }
          
          if (line.includes('SERVER_STARTED_PORT=')) {
            const match = line.match(/SERVER_STARTED_PORT=(\d+)/)
            if (match && match[1]) {
              const port = parseInt(match[1])
              window.SEQUB_SERVER_PORT = port
            }
          }
        })

        // Start health checks after a short delay
        setTimeout(() => {
          setBootState(prev => ({
            ...prev,
            status: 'waiting',
            message: 'Waiting for server to be healthy...'
          }))
          
          healthCheckInterval = setInterval(async () => {
            try {
              await initializeApiClient()
              const response = await api.health.check()
              
              if (response.data.status === 'ok' || response.data.healthy === true) {
                const readyState: BootState = {
                  status: 'ready',
                  message: 'Server is healthy'
                }
                if (window.SEQUB_SERVER_PORT) {
                  readyState.port = window.SEQUB_SERVER_PORT
                }
                if (window.SEQUB_AUTH_TOKEN) {
                  readyState.token = window.SEQUB_AUTH_TOKEN
                }
                setBootState(readyState)
                
                if (healthCheckInterval) clearInterval(healthCheckInterval)
                if (timeout) clearTimeout(timeout)
              }
            } catch (error) {
              // Server not ready yet, continue checking
              console.debug('Health check failed, retrying...', error)
            }
          }, 500)
        }, 1000)

        // Set timeout for server startup
        timeout = setTimeout(() => {
          if (healthCheckInterval) clearInterval(healthCheckInterval)
          
          setBootState({
            status: 'error',
            message: 'Server failed to start within 30 seconds. Please check the logs.'
          })
        }, 30000)

      } catch (error) {
        console.error('Boot sequence error:', error)
        setBootState({
          status: 'error',
          message: `Failed to start server: ${error}`
        })
      }
    }

    bootSequence()

    // Cleanup
    return () => {
      if (unsubscribe) unsubscribe()
      if (healthCheckInterval) clearInterval(healthCheckInterval)
      if (timeout) clearTimeout(timeout as any)
    }
  }, [])

  // Render based on boot state
  if (bootState.status === 'error') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Startup Error</h2>
          <p className="text-gray-600">{bootState.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (bootState.status !== 'ready') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{bootState.message}</p>
          {bootState.status === 'waiting' && (
            <p className="text-sm text-gray-500 mt-2">
              {bootState.port && `Port: ${bootState.port}`}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Server is ready, render children
  return <>{children}</>
}