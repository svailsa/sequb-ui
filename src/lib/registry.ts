import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import { Registry } from '@/types/schema'

export function useRegistry() {
  return useQuery({
    queryKey: ['registry'],
    queryFn: async () => {
      const { data } = await api.registry.get()
      return data
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    retry: 3,
  })
}

export function getNodeDefinition(registry: Registry | undefined, nodeType: string) {
  if (!registry) return null
  return registry.nodes[nodeType] || null
}