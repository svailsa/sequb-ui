'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { i18n, Language, t } from '@/services/i18n/i18n';

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: typeof t;
  isRTL: boolean;
  supportedLanguages: Language[];
  initialized: boolean;
  loading: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(i18n.getCurrentLanguage());
  const [isRTL, setIsRTL] = useState(i18n.isRTL());
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Wait for i18n service to initialize
    const initializeI18n = async () => {
      setLoading(true);
      try {
        await i18n.waitForInitialization();
        setLanguageState(i18n.getCurrentLanguage());
        setIsRTL(i18n.isRTL());
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize i18n:', error);
        // Continue with default state even if initialization fails
        setInitialized(true);
      } finally {
        setLoading(false);
      }
    };

    initializeI18n();

    // Subscribe to language changes
    const unsubscribe = i18n.subscribe(() => {
      const newLang = i18n.getCurrentLanguage();
      setLanguageState(newLang);
      setIsRTL(i18n.isRTL(newLang));
    });

    return unsubscribe;
  }, []);

  const setLanguage = async (newLanguage: Language) => {
    setLoading(true);
    try {
      await i18n.setLanguage(newLanguage);
    } catch (error) {
      console.error('Failed to change language:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: I18nContextValue = {
    language,
    setLanguage,
    t,
    isRTL,
    supportedLanguages: i18n.getSupportedLanguages(),
    initialized,
    loading,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}