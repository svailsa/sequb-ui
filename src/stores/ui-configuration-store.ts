import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';

export interface UIConfiguration {
  // API Configuration
  timeouts: {
    default: number;
    upload: number;
    longRunning: number;
  };
  
  // UI Limits
  limits: {
    maxWorkflowNodes: number;
    maxExecutionTime: number;
    maxFileSize: number;
    maxChatHistory: number;
    paginationDefaults: {
      executions: number;
      workflows: number;
      logs: number;
    };
  };
  
  // Feature availability
  features: {
    darkMode: boolean;
    experimentalFeatures: boolean;
    advancedWorkflowEditor: boolean;
    realTimeCollaboration: boolean;
    aiAssistedWorkflows: boolean;
    pluginSystem: boolean;
    webhookSupport: boolean;
    approvalWorkflows: boolean;
  };
  
  // Available options
  supportedLanguages: Array<{
    code: string;
    name: string;
    nativeName: string;
    available: boolean;
  }>;
  
  supportedTimezones: Array<{
    code: string;
    name: string;
    offset: string;
    region: string;
  }>;
  
  availableThemes: Array<{
    id: string;
    name: string;
    description: string;
    available: boolean;
  }>;
  
  // Chat configuration
  chat: {
    welcomeExamples: Array<{
      id: string;
      title: string;
      description: string;
      prompt: string;
      category: string;
      icon: string;
    }>;
    maxMessageLength: number;
    suggestionDelay: number;
  };
  
  // Workflow editor
  workflowEditor: {
    defaultNodeSpacing: { x: number; y: number };
    snapToGrid: boolean;
    gridSize: number;
    maxZoom: number;
    minZoom: number;
    autosaveInterval: number;
  };
  
  // Execution monitoring
  execution: {
    refreshIntervals: {
      list: number;
      details: number;
      logs: number;
    };
    maxLogLines: number;
    statusPollingInterval: number;
  };
}

export interface FeatureFlags {
  [key: string]: boolean | string | number;
}

interface UIConfigurationStore {
  configuration: UIConfiguration | null;
  featureFlags: FeatureFlags | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  
  // Actions
  loadConfiguration: () => Promise<void>;
  loadFeatureFlags: () => Promise<void>;
  refreshConfiguration: () => Promise<void>;
  isFeatureEnabled: (feature: string) => boolean;
  getConfigValue: (path: string) => any;
  
  // Helper methods
  getSupportedLanguages: () => UIConfiguration['supportedLanguages'];
  getSupportedTimezones: () => UIConfiguration['supportedTimezones'];
  getAvailableThemes: () => UIConfiguration['availableThemes'];
  getChatExamples: (category?: string) => UIConfiguration['chat']['welcomeExamples'];
}

// Default configuration for offline fallback
const DEFAULT_CONFIGURATION: UIConfiguration = {
  timeouts: {
    default: 10000,
    upload: 30000,
    longRunning: 120000,
  },
  limits: {
    maxWorkflowNodes: 100,
    maxExecutionTime: 3600,
    maxFileSize: 10485760, // 10MB
    maxChatHistory: 100,
    paginationDefaults: {
      executions: 20,
      workflows: 12,
      logs: 50,
    },
  },
  features: {
    darkMode: true,
    experimentalFeatures: false,
    advancedWorkflowEditor: true,
    realTimeCollaboration: false,
    aiAssistedWorkflows: false,
    pluginSystem: true,
    webhookSupport: true,
    approvalWorkflows: true,
  },
  supportedLanguages: [
    { code: 'en', name: 'English', nativeName: 'English', available: true },
    { code: 'es', name: 'Spanish', nativeName: 'Español', available: true },
    { code: 'fr', name: 'French', nativeName: 'Français', available: true },
    { code: 'de', name: 'German', nativeName: 'Deutsch', available: true },
    { code: 'zh', name: 'Chinese', nativeName: '中文', available: true },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', available: true },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', available: true },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', available: true },
  ],
  supportedTimezones: [
    { code: 'UTC', name: 'Coordinated Universal Time', offset: '+00:00', region: 'Global' },
    { code: 'America/New_York', name: 'Eastern Time', offset: '-05:00', region: 'North America' },
    { code: 'America/Chicago', name: 'Central Time', offset: '-06:00', region: 'North America' },
    { code: 'America/Denver', name: 'Mountain Time', offset: '-07:00', region: 'North America' },
    { code: 'America/Los_Angeles', name: 'Pacific Time', offset: '-08:00', region: 'North America' },
    { code: 'Europe/London', name: 'Greenwich Mean Time', offset: '+00:00', region: 'Europe' },
    { code: 'Europe/Paris', name: 'Central European Time', offset: '+01:00', region: 'Europe' },
    { code: 'Asia/Tokyo', name: 'Japan Standard Time', offset: '+09:00', region: 'Asia' },
  ],
  availableThemes: [
    { id: 'light', name: 'Light', description: 'Clean light interface', available: true },
    { id: 'dark', name: 'Dark', description: 'Easy on the eyes', available: true },
    { id: 'auto', name: 'System', description: 'Follow system preference', available: true },
  ],
  chat: {
    welcomeExamples: [
      {
        id: 'weather_workflow',
        title: 'Daily Weather Report',
        description: 'Get weather updates delivered to your inbox',
        prompt: 'Create a workflow that sends me a daily weather report',
        category: 'automation',
        icon: '📧',
      },
      {
        id: 'photo_backup',
        title: 'Photo Backup',
        description: 'Automatically backup photos on a schedule',
        prompt: 'Set up an automation to backup my photos weekly',
        category: 'backup',
        icon: '📸',
      },
      {
        id: 'email_summarizer',
        title: 'Email Summarizer',
        description: 'Get AI-powered summaries of your emails',
        prompt: 'Build a workflow that summarizes my emails',
        category: 'ai',
        icon: '📨',
      },
    ],
    maxMessageLength: 4000,
    suggestionDelay: 1000,
  },
  workflowEditor: {
    defaultNodeSpacing: { x: 200, y: 150 },
    snapToGrid: true,
    gridSize: 20,
    maxZoom: 2.0,
    minZoom: 0.1,
    autosaveInterval: 30000,
  },
  execution: {
    refreshIntervals: {
      list: 5000,
      details: 2000,
      logs: 1000,
    },
    maxLogLines: 1000,
    statusPollingInterval: 2000,
  },
};

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  experimentalNodeTypes: false,
  advancedMetrics: true,
  realTimeCollaboration: false,
  aiWorkflowSuggestions: false,
  betaFeatures: false,
  debugMode: false,
};

// Helper function to get nested configuration values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export const useUIConfigurationStore = create<UIConfigurationStore>()(
  persist(
    (set, get) => ({
      configuration: null,
      featureFlags: null,
      isLoading: false,
      error: null,
      lastUpdated: null,

      loadConfiguration: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.ui.getConfiguration();
          const serverConfig = response.data.data;

          // Merge with defaults to ensure all properties exist
          const configuration: UIConfiguration = {
            ...DEFAULT_CONFIGURATION,
            ...serverConfig,
            limits: {
              ...DEFAULT_CONFIGURATION.limits,
              ...serverConfig.limits,
            },
            features: {
              ...DEFAULT_CONFIGURATION.features,
              ...serverConfig.features,
            },
            chat: {
              ...DEFAULT_CONFIGURATION.chat,
              ...serverConfig.chat,
              welcomeExamples: serverConfig.chat?.welcomeExamples || DEFAULT_CONFIGURATION.chat.welcomeExamples,
            },
            workflowEditor: {
              ...DEFAULT_CONFIGURATION.workflowEditor,
              ...serverConfig.workflowEditor,
            },
            execution: {
              ...DEFAULT_CONFIGURATION.execution,
              ...serverConfig.execution,
            },
          };

          set({
            configuration,
            isLoading: false,
            lastUpdated: new Date().toISOString(),
            error: null,
          });

          logger.info('UI configuration loaded from backend');
        } catch (error) {
          logger.error('Failed to load UI configuration:', error);

          // Fall back to defaults
          set({
            configuration: DEFAULT_CONFIGURATION,
            isLoading: false,
            error: 'Using default configuration - backend unavailable',
          });
        }
      },

      loadFeatureFlags: async () => {
        try {
          const response = await api.ui.getFeatureFlags();
          const serverFlags = response.data.data;

          const featureFlags: FeatureFlags = {
            ...DEFAULT_FEATURE_FLAGS,
            ...serverFlags,
          };

          set({ featureFlags });
          logger.info('Feature flags loaded from backend');
        } catch (error) {
          logger.error('Failed to load feature flags:', error);

          // Fall back to defaults
          set({ featureFlags: DEFAULT_FEATURE_FLAGS });
        }
      },

      refreshConfiguration: async () => {
        await Promise.all([
          get().loadConfiguration(),
          get().loadFeatureFlags(),
        ]);
      },

      isFeatureEnabled: (feature: string) => {
        const { featureFlags, configuration } = get();
        
        // Check feature flags first
        if (featureFlags && feature in featureFlags) {
          return Boolean(featureFlags[feature]);
        }
        
        // Check configuration features
        if (configuration?.features && feature in configuration.features) {
          return Boolean(configuration.features[feature as keyof typeof configuration.features]);
        }
        
        return false;
      },

      getConfigValue: (path: string) => {
        const { configuration } = get();
        if (!configuration) return undefined;
        return getNestedValue(configuration, path);
      },

      getSupportedLanguages: () => {
        const { configuration } = get();
        return configuration?.supportedLanguages || DEFAULT_CONFIGURATION.supportedLanguages;
      },

      getSupportedTimezones: () => {
        const { configuration } = get();
        return configuration?.supportedTimezones || DEFAULT_CONFIGURATION.supportedTimezones;
      },

      getAvailableThemes: () => {
        const { configuration } = get();
        return configuration?.availableThemes || DEFAULT_CONFIGURATION.availableThemes;
      },

      getChatExamples: (category?: string) => {
        const { configuration } = get();
        const examples = configuration?.chat.welcomeExamples || DEFAULT_CONFIGURATION.chat.welcomeExamples;
        
        if (category) {
          return examples.filter(example => example.category === category);
        }
        
        return examples;
      },
    }),
    {
      name: 'ui-configuration',
      partialize: (state) => ({
        // Only persist configuration and flags for offline use
        configuration: state.configuration,
        featureFlags: state.featureFlags,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);