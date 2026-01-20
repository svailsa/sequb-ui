import { create } from 'zustand';
import { Registry, NodeType } from '@/types/sequb';
import { api } from '@/lib/api';

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
      
      // Fallback to mock data if backend is unavailable
      const mockNodeTypes: NodeType[] = [
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
                { value: 'POST', label: 'POST' },
                { value: 'PUT', label: 'PUT' },
                { value: 'DELETE', label: 'DELETE' }
              ],
              description: 'HTTP method to use'
            },
            {
              key: 'headers',
              label: 'Headers',
              type: 'json',
              required: false,
              description: 'HTTP headers to include'
            },
            {
              key: 'body',
              label: 'Body',
              type: 'textarea',
              required: false,
              description: 'Request body (for POST/PUT)'
            }
          ],
          outputs: [
            {
              key: 'response',
              label: 'Response',
              type: 'object',
              description: 'The HTTP response'
            },
            {
              key: 'status_code',
              label: 'Status Code',
              type: 'number',
              description: 'HTTP status code'
            }
          ]
        },
        {
          id: 'email_send',
          name: 'Send Email',
          category: 'Communication',
          description: 'Send an email message',
          icon: 'Mail',
          inputs: [
            {
              key: 'to',
              label: 'To',
              type: 'text',
              required: true,
              description: 'Recipient email address'
            },
            {
              key: 'subject',
              label: 'Subject',
              type: 'text',
              required: true,
              description: 'Email subject line'
            },
            {
              key: 'body',
              label: 'Body',
              type: 'textarea',
              required: true,
              description: 'Email message content'
            }
          ],
          outputs: [
            {
              key: 'message_id',
              label: 'Message ID',
              type: 'string',
              description: 'Unique identifier for the sent message'
            }
          ]
        },
        {
          id: 'ai_completion',
          name: 'AI Completion',
          category: 'AI',
          description: 'Generate text using AI models',
          icon: 'Brain',
          inputs: [
            {
              key: 'prompt',
              label: 'Prompt',
              type: 'textarea',
              required: true,
              description: 'The prompt to send to the AI model'
            },
            {
              key: 'model',
              label: 'Model',
              type: 'select',
              required: true,
              default: 'gpt-4',
              options: [
                { value: 'gpt-4', label: 'GPT-4' },
                { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
                { value: 'claude-3', label: 'Claude 3' }
              ],
              description: 'AI model to use'
            },
            {
              key: 'max_tokens',
              label: 'Max Tokens',
              type: 'number',
              required: false,
              default: 1000,
              validation: {
                min: 1,
                max: 4000
              },
              description: 'Maximum number of tokens to generate'
            }
          ],
          outputs: [
            {
              key: 'completion',
              label: 'Completion',
              type: 'string',
              description: 'The AI-generated text'
            },
            {
              key: 'usage',
              label: 'Usage',
              type: 'object',
              description: 'Token usage information'
            }
          ]
        },
        {
          id: 'file_write',
          name: 'Write File',
          category: 'File System',
          description: 'Write content to a file',
          icon: 'FileText',
          inputs: [
            {
              key: 'path',
              label: 'File Path',
              type: 'text',
              required: true,
              description: 'Path where to write the file'
            },
            {
              key: 'content',
              label: 'Content',
              type: 'textarea',
              required: true,
              description: 'Content to write to the file'
            },
            {
              key: 'encoding',
              label: 'Encoding',
              type: 'select',
              required: false,
              default: 'utf8',
              options: [
                { value: 'utf8', label: 'UTF-8' },
                { value: 'ascii', label: 'ASCII' },
                { value: 'base64', label: 'Base64' }
              ],
              description: 'File encoding'
            }
          ],
          outputs: [
            {
              key: 'bytes_written',
              label: 'Bytes Written',
              type: 'number',
              description: 'Number of bytes written to the file'
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

      const mockRegistry: Registry = {
        version: '0.1.0-mock',
        updated_at: new Date().toISOString(),
        categories: [...new Set(mockNodeTypes.map(n => n.category))].sort(),
        node_types: mockNodeTypes.reduce((acc, node) => {
          acc[node.id] = node;
          return acc;
        }, {} as Record<string, NodeType>)
      };

      set({
        registry: mockRegistry,
        nodeTypes: mockNodeTypes,
        categories: mockRegistry.categories,
        isLoading: false,
        error: 'Using mock data - backend not available',
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