'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { i18n, Language, t } from '@/lib/i18n';

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: typeof t;
  isRTL: boolean;
  supportedLanguages: Language[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(i18n.getCurrentLanguage());
  const [isRTL, setIsRTL] = useState(['ar', 'ur'].includes(language));

  useEffect(() => {
    // Subscribe to language changes
    const unsubscribe = i18n.subscribe(() => {
      const newLang = i18n.getCurrentLanguage();
      setLanguageState(newLang);
      setIsRTL(['ar', 'ur'].includes(newLang));
    });

    return unsubscribe;
  }, []);

  const setLanguage = async (newLanguage: Language) => {
    await i18n.setLanguage(newLanguage);
  };

  const value: I18nContextValue = {
    language,
    setLanguage,
    t,
    isRTL,
    supportedLanguages: i18n.getSupportedLanguages(),
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