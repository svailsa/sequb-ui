import { create } from 'zustand';
import { Registry, NodeType } from '@/types/sequb';
import { api } from '@/services/api';

interface NodeRegistryStore {
  registry: Registry | null;
  nodeTypes: NodeType[];
  categories: string[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  
  // Actions
  loadRegistry: () => Promise<void>;
  getNodesByCategory: (category: string) => NodeType[];
  getNodeType: (nodeId: string) => NodeType | undefined;
  refreshRegistry: () => Promise<void>;
}

export const useNodeRegistryStore = create<NodeRegistryStore>((set, get) => ({
  registry: null,
  nodeTypes: [],
  categories: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  loadRegistry: async () => {
    const { registry, lastUpdated } = get();
    
    // Skip loading if we have recent data (within 5 minutes)
    if (registry && lastUpdated) {
      const lastUpdateTime = new Date(lastUpdated).getTime();
      const now = new Date().getTime();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (now - lastUpdateTime < fiveMinutes) {
        return;
      }
    }

    set({ isLoading: true, error: null });

    try {
      const response = await api.registry.get();
      const registryData: Registry = response.data.data;
      
      const nodeTypesArray = Object.values(registryData.node_types);
      const categoriesArray = [...new Set(nodeTypesArray.map(node => node.category))].sort();
      
      set({
        registry: registryData,
        nodeTypes: nodeTypesArray,
        categories: categoriesArray,
        isLoading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to load node registry:', error);
      
      // Minimal fallback nodes for offline development
      const basicNodeTypes: NodeType[] = getBasicNodeTypes();

      const mockRegistry: Registry = {
        version: '0.1.0-offline',
        updated_at: new Date().toISOString(),
        categories: [...new Set(basicNodeTypes.map(n => n.category))].sort(),
        node_types: basicNodeTypes.reduce((acc, node) => {
          acc[node.id] = node;
          return acc;
        }, {} as Record<string, NodeType>)
      };

      set({
        registry: mockRegistry,
        nodeTypes: basicNodeTypes,
        categories: mockRegistry.categories,
        isLoading: false,
        error: 'Backend unavailable - limited nodes available',
        lastUpdated: new Date().toISOString()
      });
    }
  },

  getNodesByCategory: (category: string) => {
    const { nodeTypes } = get();
    return nodeTypes.filter(node => node.category === category);
  },

  getNodeType: (nodeId: string) => {
    const { nodeTypes } = get();
    return nodeTypes.find(node => node.id === nodeId);
  },

  refreshRegistry: async () => {
    set({ lastUpdated: null });
    await get().loadRegistry();
  }
}));

// Minimal essential node types for offline development
function getBasicNodeTypes(): NodeType[] {
  return [
    {
      id: 'text_input',
      name: 'Text Input',
      category: 'Input',
      description: 'Accept text input from the user',
      icon: 'Type',
      inputs: [
        {
          key: 'prompt',
          label: 'Prompt',
          type: 'textarea',
          required: true,
          description: 'Text to display to the user'
        }
      ],
      outputs: [
        {
          key: 'text',
          label: 'Text Output',
          type: 'string',
          description: 'The text input provided by the user'
        }
      ]
    },
    {
      id: 'http_request',
      name: 'HTTP Request',
      category: 'Network',
      description: 'Make HTTP requests to APIs',
      icon: 'Globe',
      inputs: [
        {
          key: 'url',
          label: 'URL',
          type: 'text',
          required: true,
          description: 'The URL to make the request to'
        },
        {
          key: 'method',
          label: 'Method',
          type: 'select',
          required: true,
          default: 'GET',
          options: [
            { value: 'GET', label: 'GET' },
            { value: 'POST', label: 'POST' }
          ],
          description: 'HTTP method to use'
        }
      ],
      outputs: [
        {
          key: 'response',
          label: 'Response',
          type: 'object',
          description: 'The HTTP response'
        }
      ]
    },
    {
      id: 'delay',
      name: 'Delay',
      category: 'Control Flow',
      description: 'Wait for a specified amount of time',
      icon: 'Clock',
      inputs: [
        {
          key: 'duration',
          label: 'Duration (seconds)',
          type: 'number',
          required: true,
          default: 1,
          validation: {
            min: 0.1,
            max: 3600
          },
          description: 'Time to wait in seconds'
        }
      ],
      outputs: [
        {
          key: 'completed_at',
          label: 'Completed At',
          type: 'string',
          description: 'Timestamp when the delay completed'
        }
      ]
    }
  ];
}