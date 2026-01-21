"use client";

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { usePreferencesStore, UserPreferences } from '@/stores/preferences-store';
import { logger } from '@/lib/logger';

interface PreferencesContextType {
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  updatePreference: (path: string, value: any) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  savePreferences: () => Promise<void>;
  getPreference: (path: string) => any;
}

const PreferencesContext = createContext<PreferencesContextType | null>(null);

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}

interface PreferencesProviderProps {
  children: ReactNode;
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const {
    preferences,
    isLoading,
    error,
    hasUnsavedChanges,
    loadPreferences,
    updatePreferences,
    updatePreferenceField,
    savePreferences,
    getPreference,
  } = usePreferencesStore();

  // Load preferences on mount
  useEffect(() => {
    loadPreferences().catch((error) => {
      logger.error('Failed to initialize user preferences:', error);
    });
  }, [loadPreferences]);

  // Apply theme changes to document
  useEffect(() => {
    if (preferences?.theme) {
      const root = document.documentElement;
      
      if (preferences.theme === 'dark') {
        root.classList.add('dark');
      } else if (preferences.theme === 'light') {
        root.classList.remove('dark');
      } else {
        // Auto theme - check system preference
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    }
  }, [preferences?.theme]);

  // Apply font size changes
  useEffect(() => {
    if (preferences?.fontSize) {
      const root = document.documentElement;
      
      switch (preferences.fontSize) {
        case 'small':
          root.style.fontSize = '14px';
          break;
        case 'large':
          root.style.fontSize = '18px';
          break;
        default:
          root.style.fontSize = '16px';
      }
    }
  }, [preferences?.fontSize]);

  // Apply compact mode
  useEffect(() => {
    if (preferences?.compactMode !== undefined) {
      const root = document.documentElement;
      if (preferences.compactMode) {
        root.classList.add('compact-mode');
      } else {
        root.classList.remove('compact-mode');
      }
    }
  }, [preferences?.compactMode]);

  // Disable animations if requested
  useEffect(() => {
    if (preferences?.animationsEnabled !== undefined) {
      const root = document.documentElement;
      if (!preferences.animationsEnabled) {
        root.classList.add('no-animations');
      } else {
        root.classList.remove('no-animations');
      }
    }
  }, [preferences?.animationsEnabled]);

  const contextValue: PreferencesContextType = {
    preferences,
    isLoading,
    error,
    hasUnsavedChanges,
    updatePreference: updatePreferenceField,
    updatePreferences,
    savePreferences,
    getPreference,
  };

  return (
    <PreferencesContext.Provider value={contextValue}>
      {children}
    </PreferencesContext.Provider>
  );
}