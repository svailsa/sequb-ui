import { create } from 'zustand'
import { Registry } from '@/types/schema'

interface RegistryStore {
  registry: Registry | null
  isLoading: boolean
  error: string | null
  
  setRegistry: (registry: Registry) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
}

export const useRegistryStore = create<RegistryStore>((set) => ({
  registry: null,
  isLoading: false,
  error: null,
  
  setRegistry: (registry) => set({ registry, isLoading: false, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
}))