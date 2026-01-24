import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/services/api';
import { logger } from '@/services/monitoring/logger';

export interface UserPreferences {
  // Appearance
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  animationsEnabled: boolean;
  
  // Language & Region
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  
  // Notifications
  notifications: {
    email: {
      workflowUpdates: boolean;
      executionAlerts: boolean;
      approvalRequests: boolean;
      systemUpdates: boolean;
    };
    inApp: {
      enabled: boolean;
      sound: boolean;
      desktop: boolean;
    };
  };
  
  // Workflow Preferences
  workflow: {
    defaultTimeout: number;
    maxRetries: number;
    autoSave: boolean;
    debugMode: boolean;
  };
  
  // Advanced
  advanced: {
    cacheTtl: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    telemetryEnabled: boolean;
    experimentalFeatures: boolean;
  };
  
  // Editor preferences
  editor: {
    autoFormat: boolean;
    showMinimap: boolean;
    showLineNumbers: boolean;
    tabSize: number;
  };
}

interface PreferencesStore {
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
  lastSynced: string | null;
  hasUnsavedChanges: boolean;
  
  // Actions
  loadPreferences: () => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  updatePreferenceField: (path: string, value: any) => void;
  savePreferences: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
  markAsChanged: () => void;
  markAsSaved: () => void;
  
  // Getters
  getPreference: (path: string) => any;
}

// Legacy defaults - will be replaced by backend-driven preferences
const FALLBACK_PREFERENCES: UserPreferences = {
  theme: 'auto',
  fontSize: 'medium',
  compactMode: false,
  animationsEnabled: true,
  
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  
  notifications: {
    email: {
      workflowUpdates: true,
      executionAlerts: true,
      approvalRequests: true,
      systemUpdates: true,
    },
    inApp: {
      enabled: true,
      sound: true,
      desktop: true,
    },
  },
  
  workflow: {
    defaultTimeout: 300,
    maxRetries: 3,
    autoSave: true,
    debugMode: false,
  },
  
  advanced: {
    cacheTtl: 3600,
    logLevel: 'info',
    telemetryEnabled: true,
    experimentalFeatures: false,
  },
  
  editor: {
    autoFormat: true,
    showMinimap: true,
    showLineNumbers: true,
    tabSize: 2,
  },
};

// Helper function to set nested object values
function setNestedValue(obj: any, path: string, value: any) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set, get) => ({
      preferences: null,
      isLoading: false,
      error: null,
      lastSynced: null,
      hasUnsavedChanges: false,
      
      loadPreferences: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Load backend-driven defaults first
          let backendDefaults;
          try {
            const { backendPreferences } = await import('@/services/preferences/backend-preferences');
            backendDefaults = await backendPreferences.getDefaults();
          } catch (error) {
            logger.warn('Failed to load backend preference defaults, using fallback', error);
            backendDefaults = FALLBACK_PREFERENCES;
          }

          // Then load user preferences from backend
          const response = await api.preferences.get();
          const serverPreferences = response.data.data;
          
          // Merge backend defaults with user preferences
          const mergedPreferences = {
            ...backendDefaults,
            ...serverPreferences,
            notifications: {
              ...backendDefaults.notifications,
              ...serverPreferences.notifications,
              email: {
                ...backendDefaults.notifications?.email,
                ...serverPreferences.notifications?.email,
              },
              inApp: {
                ...backendDefaults.notifications?.inApp,
                ...serverPreferences.notifications?.inApp,
              },
            },
            workflow: {
              ...backendDefaults.workflow,
              ...serverPreferences.workflow,
            },
            advanced: {
              ...backendDefaults.advanced,
              ...serverPreferences.advanced,
            },
            editor: {
              ...backendDefaults.editor,
              ...serverPreferences.editor,
            },
          };
          
          set({
            preferences: mergedPreferences,
            isLoading: false,
            error: null,
            lastSynced: new Date().toISOString(),
            hasUnsavedChanges: false,
          });
          
          logger.info('User preferences loaded from backend');
        } catch (error) {
          logger.error('Failed to load preferences from backend:', error);
          
          // Fall back to defaults on error
          set({
            preferences: { ...FALLBACK_PREFERENCES },
            isLoading: false,
            error: 'Failed to load preferences from server. Using defaults.',
            hasUnsavedChanges: false,
          });
        }
      },
      
      updatePreferences: async (updates: Partial<UserPreferences>) => {
        const currentPrefs = get().preferences;
        if (!currentPrefs) return;
        
        const updatedPreferences = {
          ...currentPrefs,
          ...updates,
        };
        
        set({
          preferences: updatedPreferences,
          hasUnsavedChanges: true,
        });
        
        try {
          await api.preferences.updatePartial(updates);
          set({
            lastSynced: new Date().toISOString(),
            hasUnsavedChanges: false,
            error: null,
          });
          
          logger.info('Preferences updated successfully');
        } catch (error) {
          logger.error('Failed to update preferences:', error);
          set({ error: 'Failed to save preferences to server' });
          
          // Don't revert local changes - allow retry
        }
      },
      
      updatePreferenceField: (path: string, value: any) => {
        const currentPrefs = get().preferences;
        if (!currentPrefs) return;
        
        const updatedPreferences = { ...currentPrefs };
        setNestedValue(updatedPreferences, path, value);
        
        set({
          preferences: updatedPreferences,
          hasUnsavedChanges: true,
        });
      },
      
      savePreferences: async () => {
        const { preferences } = get();
        if (!preferences) return;
        
        set({ isLoading: true, error: null });
        
        try {
          await api.preferences.update(preferences);
          set({
            isLoading: false,
            lastSynced: new Date().toISOString(),
            hasUnsavedChanges: false,
            error: null,
          });
          
          logger.info('All preferences saved to backend');
        } catch (error) {
          logger.error('Failed to save preferences:', error);
          set({
            isLoading: false,
            error: 'Failed to save preferences to server',
          });
        }
      },
      
      resetToDefaults: async () => {
        // Load backend defaults and reset to them
        try {
          const { backendPreferences } = await import('@/services/preferences/backend-preferences');
          const backendDefaults = await backendPreferences.getDefaults();
          
          set({
            preferences: { ...backendDefaults },
            hasUnsavedChanges: true,
          });
        } catch (error) {
          logger.warn('Failed to load backend defaults for reset, using fallback', error);
          set({
            preferences: { ...FALLBACK_PREFERENCES },
            hasUnsavedChanges: true,
          });
        }
      },
      
      markAsChanged: () => {
        set({ hasUnsavedChanges: true });
      },
      
      markAsSaved: () => {
        set({ hasUnsavedChanges: false });
      },
      
      getPreference: (path: string) => {
        const { preferences } = get();
        if (!preferences) return undefined;
        return getNestedValue(preferences, path);
      },
    }),
    {
      name: 'user-preferences',
      partialize: (state) => ({
        // Only persist essential preferences for offline use
        preferences: state.preferences,
        lastSynced: state.lastSynced,
      }),
    }
  )
);