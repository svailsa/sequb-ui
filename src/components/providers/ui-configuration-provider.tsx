"use client";

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useUIConfigurationStore, UIConfiguration, FeatureFlags } from '@/stores/ui-configuration-store';
import { logger } from '@/services/monitoring/logger';

interface UIConfigurationContextType {
  configuration: UIConfiguration | null;
  featureFlags: FeatureFlags | null;
  isLoading: boolean;
  error: string | null;
  isFeatureEnabled: (feature: string) => boolean;
  getConfigValue: (path: string) => any;
  getSupportedLanguages: () => UIConfiguration['supportedLanguages'];
  getSupportedTimezones: () => UIConfiguration['supportedTimezones'];
  getAvailableThemes: () => UIConfiguration['availableThemes'];
  getChatExamples: (category?: string) => UIConfiguration['chat']['welcomeExamples'];
  refreshConfiguration: () => Promise<void>;
}

const UIConfigurationContext = createContext<UIConfigurationContextType | null>(null);

export function useUIConfiguration() {
  const context = useContext(UIConfigurationContext);
  if (!context) {
    throw new Error('useUIConfiguration must be used within a UIConfigurationProvider');
  }
  return context;
}

interface UIConfigurationProviderProps {
  children: ReactNode;
}

export function UIConfigurationProvider({ children }: UIConfigurationProviderProps) {
  const {
    configuration,
    featureFlags,
    isLoading,
    error,
    loadConfiguration,
    loadFeatureFlags,
    refreshConfiguration,
    isFeatureEnabled,
    getConfigValue,
    getSupportedLanguages,
    getSupportedTimezones,
    getAvailableThemes,
    getChatExamples,
  } = useUIConfigurationStore();

  // Load configuration on mount
  useEffect(() => {
    const initializeConfiguration = async () => {
      try {
        await Promise.all([
          loadConfiguration(),
          loadFeatureFlags(),
        ]);
        logger.info('UI configuration initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize UI configuration:', error);
      }
    };

    initializeConfiguration();
  }, [loadConfiguration, loadFeatureFlags]);

  // Apply dynamic API client timeouts based on configuration
  useEffect(() => {
    if (configuration?.timeouts) {
      const { apiClient } = require('@/services/api');
      
      // Update default timeout
      apiClient.defaults.timeout = configuration.timeouts.default;
      
      logger.info('Applied backend-driven API timeouts', configuration.timeouts);
    }
  }, [configuration?.timeouts]);

  // Apply feature flag driven CSS classes
  useEffect(() => {
    if (typeof window !== 'undefined' && featureFlags) {
      const root = document.documentElement;
      
      // Apply feature-specific CSS classes
      if (isFeatureEnabled('debugMode')) {
        root.classList.add('debug-mode');
      } else {
        root.classList.remove('debug-mode');
      }
      
      if (isFeatureEnabled('experimentalFeatures')) {
        root.classList.add('experimental-features');
      } else {
        root.classList.remove('experimental-features');
      }
      
      if (isFeatureEnabled('advancedWorkflowEditor')) {
        root.classList.add('advanced-workflow-editor');
      } else {
        root.classList.remove('advanced-workflow-editor');
      }
    }
  }, [featureFlags, isFeatureEnabled]);

  // Log configuration changes for debugging
  useEffect(() => {
    if (configuration) {
      logger.debug('UI Configuration updated:', {
        features: Object.keys(configuration.features).filter(
          key => configuration.features[key as keyof typeof configuration.features]
        ),
        limits: configuration.limits,
        supportedLanguages: configuration.supportedLanguages.length,
        supportedTimezones: configuration.supportedTimezones.length,
      });
    }
  }, [configuration]);

  useEffect(() => {
    if (featureFlags) {
      const enabledFlags = Object.entries(featureFlags)
        .filter(([, value]) => Boolean(value))
        .map(([key]) => key);
      
      logger.debug('Feature Flags updated:', { enabled: enabledFlags });
    }
  }, [featureFlags]);

  const contextValue: UIConfigurationContextType = {
    configuration,
    featureFlags,
    isLoading,
    error,
    isFeatureEnabled,
    getConfigValue,
    getSupportedLanguages,
    getSupportedTimezones,
    getAvailableThemes,
    getChatExamples,
    refreshConfiguration,
  };

  return (
    <UIConfigurationContext.Provider value={contextValue}>
      {children}
    </UIConfigurationContext.Provider>
  );
}