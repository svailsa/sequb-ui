'use client';

import { useState } from 'react';
import { useI18n } from '@/components/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { Language, LANGUAGE_INFO } from '@/services/i18n/i18n';

// Flag mappings for all 26 supported languages
const languageFlags: Record<Language, string> = {
  en: '🇬🇧',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  zh: '🇨🇳',
  'zh-tw': '🇹🇼',
  ja: '🇯🇵',
  ko: '🇰🇷',
  ar: '🇸🇦',
  ur: '🇵🇰',
  hi: '🇮🇳',
  ru: '🇷🇺',
  pt: '🇵🇹',
  'pt-br': '🇧🇷',
  it: '🇮🇹',
  nl: '🇳🇱',
  sv: '🇸🇪',
  no: '🇳🇴',
  da: '🇩🇰',
  fi: '🇫🇮',
  pl: '🇵🇱',
  tr: '🇹🇷',
  he: '🇮🇱',
  th: '🇹🇭',
  vi: '🇻🇳',
  id: '🇮🇩',
};

export default function LanguageSelector() {
  const { language, setLanguage, supportedLanguages, loading, initialized } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = async (newLanguage: Language) => {
    try {
      await setLanguage(newLanguage);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  // Show loading state if not initialized
  if (!initialized) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="flex items-center gap-2"
      >
        <Globe className="h-4 w-4 animate-spin" />
        <span className="hidden sm:inline">Loading...</span>
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2"
      >
        <Globe className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">
          {languageFlags[language]} {LANGUAGE_INFO[language]?.nativeName || language}
        </span>
        <span className="sm:hidden">{languageFlags[language]}</span>
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-48 bg-background border rounded-lg shadow-lg">
            <div className="p-1">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors ${
                    language === lang ? 'bg-muted' : ''
                  }`}
                >
                  <span>{languageFlags[lang] || '🌐'}</span>
                  <span className="flex-1 text-left">{LANGUAGE_INFO[lang]?.nativeName || lang}</span>
                  {language === lang && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}