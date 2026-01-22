'use client';

import { useState } from 'react';
import { useI18n } from '@/components/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { Language } from '@/services/i18n/i18n';

const languageNames: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  zh: '中文',
  ja: '日本語',
  ar: 'العربية',
  ur: 'اردو',
};

const languageFlags: Record<Language, string> = {
  en: '🇬🇧',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  zh: '🇨🇳',
  ja: '🇯🇵',
  ar: '🇸🇦',
  ur: '🇵🇰',
};

export default function LanguageSelector() {
  const { language, setLanguage, supportedLanguages } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = async (newLanguage: Language) => {
    await setLanguage(newLanguage);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{languageFlags[language]} {languageNames[language]}</span>
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
                  <span>{languageFlags[lang]}</span>
                  <span className="flex-1 text-left">{languageNames[lang]}</span>
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