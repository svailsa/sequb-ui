import { apiClient } from '@/services/api/client';

// Comprehensive language support aligned with backend (26 languages)
export type Language = 
  | 'en'    // English
  | 'es'    // Spanish
  | 'fr'    // French
  | 'de'    // German
  | 'zh'    // Chinese (Simplified)
  | 'zh-tw' // Chinese (Traditional)
  | 'ja'    // Japanese
  | 'ko'    // Korean
  | 'ar'    // Arabic
  | 'ur'    // Urdu
  | 'hi'    // Hindi
  | 'ru'    // Russian
  | 'pt'    // Portuguese
  | 'pt-br' // Portuguese (Brazil)
  | 'it'    // Italian
  | 'nl'    // Dutch
  | 'sv'    // Swedish
  | 'no'    // Norwegian
  | 'da'    // Danish
  | 'fi'    // Finnish
  | 'pl'    // Polish
  | 'tr'    // Turkish
  | 'he'    // Hebrew
  | 'th'    // Thai
  | 'vi'    // Vietnamese
  | 'id';   // Indonesian

// Language metadata for UI display
export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  isRTL: boolean;
  region?: string;
}

export const LANGUAGE_INFO: Record<Language, LanguageInfo> = {
  en: { code: 'en', name: 'English', nativeName: 'English', isRTL: false },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', isRTL: false },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', isRTL: false },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', isRTL: false },
  zh: { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', isRTL: false },
  'zh-tw': { code: 'zh-tw', name: 'Chinese (Traditional)', nativeName: '繁體中文', isRTL: false },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', isRTL: false },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어', isRTL: false },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRTL: true },
  ur: { code: 'ur', name: 'Urdu', nativeName: 'اردو', isRTL: true },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isRTL: false },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', isRTL: false },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', isRTL: false },
  'pt-br': { code: 'pt-br', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', isRTL: false },
  it: { code: 'it', name: 'Italian', nativeName: 'Italiano', isRTL: false },
  nl: { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', isRTL: false },
  sv: { code: 'sv', name: 'Swedish', nativeName: 'Svenska', isRTL: false },
  no: { code: 'no', name: 'Norwegian', nativeName: 'Norsk', isRTL: false },
  da: { code: 'da', name: 'Danish', nativeName: 'Dansk', isRTL: false },
  fi: { code: 'fi', name: 'Finnish', nativeName: 'Suomi', isRTL: false },
  pl: { code: 'pl', name: 'Polish', nativeName: 'Polski', isRTL: false },
  tr: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', isRTL: false },
  he: { code: 'he', name: 'Hebrew', nativeName: 'עברית', isRTL: true },
  th: { code: 'th', name: 'Thai', nativeName: 'ไทย', isRTL: false },
  vi: { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', isRTL: false },
  id: { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', isRTL: false },
};

export interface TranslationData {
  [key: string]: string | TranslationData;
}

export interface I18nConfig {
  defaultLanguage: Language;
  fallbackLanguage: Language;
  supportedLanguages: Language[];
  translations: Record<Language, TranslationData>;
}

export interface BackendI18nConfig {
  supportedLanguages: Language[];
  defaultLanguage: Language;
  fallbackLanguage: Language;
  translationVersion: string;
  rtlLanguages: Language[];
}

// Mock translations for demonstration (only includes the 8 original languages for fallback)
const mockTranslations: Partial<Record<Language, TranslationData>> = {
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      search: 'Search',
      filter: 'Filter',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      close: 'Close',
    },
    nav: {
      home: 'Home',
      chat: 'Chat',
      workflows: 'Workflows',
      executions: 'Executions',
      templates: 'Templates',
      settings: 'Settings',
      plugins: 'Plugins',
      help: 'Help',
      logout: 'Logout',
    },
    chat: {
      title: 'Chat Assistant',
      placeholder: 'Type your message...',
      send: 'Send',
      newChat: 'New Chat',
      history: 'Chat History',
      welcome: 'Welcome! How can I help you today?',
      examples: {
        title: 'Try these examples:',
        example1: 'Create a data processing workflow',
        example2: 'Monitor API endpoints',
        example3: 'Schedule automated tasks',
      },
    },
    workflows: {
      title: 'Workflows',
      description: 'Manage and create your automation workflows',
      create: 'Create Workflow',
      edit: 'Edit Workflow',
      delete: 'Delete Workflow',
      execute: 'Execute',
      status: {
        active: 'Active',
        paused: 'Paused',
        archived: 'Archived',
      },
    },
    executions: {
      title: 'Executions',
      description: 'Monitor your workflow executions',
      status: {
        running: 'Running',
        completed: 'Completed',
        failed: 'Failed',
        cancelled: 'Cancelled',
      },
      cancel: 'Cancel Execution',
      retry: 'Retry',
      logs: 'View Logs',
    },
    templates: {
      title: 'Template Library',
      description: 'Browse and import pre-built workflow templates',
      import: 'Use Template',
      export: 'Export',
      upload: 'Upload Template',
      create: 'Create Template',
    },
    settings: {
      title: 'Settings',
      description: 'Manage your account settings and preferences',
      general: 'General',
      profile: 'Profile',
      notifications: 'Notifications',
      security: 'Security',
      appearance: 'Appearance',
      language: 'Language & Region',
      api: 'API Keys',
      advanced: 'Advanced',
    },
    auth: {
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      forgotPassword: 'Forgot Password?',
      resetPassword: 'Reset Password',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      name: 'Name',
      rememberMe: 'Remember Me',
      signInWith: 'Sign in with',
      or: 'or',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
    },
  },
  es: {
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      create: 'Crear',
      search: 'Buscar',
      filter: 'Filtrar',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      confirm: 'Confirmar',
      back: 'Atrás',
      next: 'Siguiente',
      previous: 'Anterior',
      close: 'Cerrar',
    },
    nav: {
      home: 'Inicio',
      chat: 'Chat',
      workflows: 'Flujos de trabajo',
      executions: 'Ejecuciones',
      templates: 'Plantillas',
      settings: 'Configuración',
      plugins: 'Plugins',
      help: 'Ayuda',
      logout: 'Cerrar sesión',
    },
    // ... other Spanish translations
  },
  fr: {
    common: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      create: 'Créer',
      search: 'Rechercher',
      filter: 'Filtrer',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      confirm: 'Confirmer',
      back: 'Retour',
      next: 'Suivant',
      previous: 'Précédent',
      close: 'Fermer',
    },
    nav: {
      home: 'Accueil',
      chat: 'Chat',
      workflows: 'Flux de travail',
      executions: 'Exécutions',
      templates: 'Modèles',
      settings: 'Paramètres',
      plugins: 'Plugins',
      help: 'Aide',
      logout: 'Déconnexion',
    },
    // ... other French translations
  },
  de: {
    common: {
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      create: 'Erstellen',
      search: 'Suchen',
      filter: 'Filtern',
      loading: 'Laden...',
      error: 'Fehler',
      success: 'Erfolg',
      confirm: 'Bestätigen',
      back: 'Zurück',
      next: 'Weiter',
      previous: 'Zurück',
      close: 'Schließen',
    },
    nav: {
      home: 'Startseite',
      chat: 'Chat',
      workflows: 'Arbeitsabläufe',
      executions: 'Ausführungen',
      templates: 'Vorlagen',
      settings: 'Einstellungen',
      plugins: 'Plugins',
      help: 'Hilfe',
      logout: 'Abmelden',
    },
    // ... other German translations
  },
  zh: {
    common: {
      save: '保存',
      cancel: '取消',
      delete: '删除',
      edit: '编辑',
      create: '创建',
      search: '搜索',
      filter: '筛选',
      loading: '加载中...',
      error: '错误',
      success: '成功',
      confirm: '确认',
      back: '返回',
      next: '下一个',
      previous: '上一个',
      close: '关闭',
    },
    nav: {
      home: '首页',
      chat: '聊天',
      workflows: '工作流程',
      executions: '执行',
      templates: '模板',
      settings: '设置',
      plugins: '插件',
      help: '帮助',
      logout: '登出',
    },
    // ... other Chinese translations
  },
  ja: {
    common: {
      save: '保存',
      cancel: 'キャンセル',
      delete: '削除',
      edit: '編集',
      create: '作成',
      search: '検索',
      filter: 'フィルター',
      loading: '読み込み中...',
      error: 'エラー',
      success: '成功',
      confirm: '確認',
      back: '戻る',
      next: '次へ',
      previous: '前へ',
      close: '閉じる',
    },
    nav: {
      home: 'ホーム',
      chat: 'チャット',
      workflows: 'ワークフロー',
      executions: '実行',
      templates: 'テンプレート',
      settings: '設定',
      plugins: 'プラグイン',
      help: 'ヘルプ',
      logout: 'ログアウト',
    },
    // ... other Japanese translations
  },
  ar: {
    common: {
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تحرير',
      create: 'إنشاء',
      search: 'بحث',
      filter: 'تصفية',
      loading: 'جار التحميل...',
      error: 'خطأ',
      success: 'نجاح',
      confirm: 'تأكيد',
      back: 'رجوع',
      next: 'التالي',
      previous: 'السابق',
      close: 'إغلاق',
    },
    nav: {
      home: 'الرئيسية',
      chat: 'المحادثة',
      workflows: 'تدفقات العمل',
      executions: 'التنفيذات',
      templates: 'القوالب',
      settings: 'الإعدادات',
      plugins: 'الإضافات',
      help: 'المساعدة',
      logout: 'تسجيل الخروج',
    },
    // ... other Arabic translations
  },
  ur: {
    common: {
      save: 'محفوظ کریں',
      cancel: 'منسوخ کریں',
      delete: 'حذف کریں',
      edit: 'ترمیم',
      create: 'بنائیں',
      search: 'تلاش',
      filter: 'فلٹر',
      loading: 'لوڈ ہو رہا ہے...',
      error: 'خرابی',
      success: 'کامیابی',
      confirm: 'تصدیق',
      back: 'واپس',
      next: 'اگلا',
      previous: 'پچھلا',
      close: 'بند کریں',
    },
    nav: {
      home: 'ہوم',
      chat: 'چیٹ',
      workflows: 'ورک فلوز',
      executions: 'عملدرآمد',
      templates: 'ٹیمپلیٹس',
      settings: 'ترتیبات',
      plugins: 'پلگ انز',
      help: 'مدد',
      logout: 'لاگ آوٹ',
    },
    // ... other Urdu translations
  },
};

class I18nService {
  private currentLanguage: Language = 'en';
  private translations: Partial<Record<Language, TranslationData>> = {};
  private listeners: Set<() => void> = new Set();
  private supportedLanguages: Language[] = [];
  private backendConfig: BackendI18nConfig | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // First, get the backend i18n configuration
      await this.loadBackendConfig();
      
      // Load saved language preference or detect browser language
      if (typeof window !== 'undefined') {
        const savedLanguage = localStorage.getItem('sequb_language') as Language;
        if (savedLanguage && this.isSupported(savedLanguage)) {
          this.currentLanguage = savedLanguage;
        } else {
          // Try browser language with region code first
          let browserLang = navigator.language.toLowerCase() as Language;
          if (!this.isSupported(browserLang)) {
            // Fall back to base language
            browserLang = navigator.language.split('-')[0] as Language;
          }
          
          if (this.isSupported(browserLang)) {
            this.currentLanguage = browserLang;
          } else if (this.backendConfig?.defaultLanguage) {
            this.currentLanguage = this.backendConfig.defaultLanguage;
          }
        }
      }

      // Load initial translations
      await this.loadTranslations(this.currentLanguage);
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize i18n service, falling back to English:', error);
      this.currentLanguage = 'en';
      this.supportedLanguages = ['en'];
      this.translations.en = mockTranslations.en || {};
      this.initialized = true;
    }
  }

  private async loadBackendConfig(): Promise<void> {
    try {
      const response = await apiClient.get<{ data: BackendI18nConfig }>('/api/v1/system/i18n/config');
      this.backendConfig = response.data.data;
      this.supportedLanguages = this.backendConfig.supportedLanguages;
    } catch (error) {
      console.warn('Failed to load backend i18n config, using default configuration');
      this.supportedLanguages = Object.keys(LANGUAGE_INFO) as Language[];
      this.backendConfig = {
        supportedLanguages: this.supportedLanguages,
        defaultLanguage: 'en',
        fallbackLanguage: 'en',
        translationVersion: '1.0',
        rtlLanguages: ['ar', 'ur', 'he'],
      };
    }
  }

  async loadTranslations(language: Language): Promise<void> {
    try {
      // Try to fetch translations from backend
      const response = await apiClient.get(`/api/v1/system/i18n/translations/${language}`);
      if (response.data?.data) {
        this.translations[language] = response.data.data;
        return;
      }
    } catch (error) {
      console.warn(`Failed to load translations for ${language}, using mock data if available`);
    }

    // Use mock translations as fallback if available
    if (mockTranslations[language]) {
      this.translations[language] = mockTranslations[language];
    } else if (language !== 'en' && mockTranslations.en) {
      // Ultimate fallback to English mock data
      this.translations[language] = mockTranslations.en;
    }
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  async setLanguage(language: Language): Promise<void> {
    if (!this.isSupported(language)) {
      throw new Error(`Language ${language} is not supported`);
    }

    this.currentLanguage = language;
    
    // Save preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('sequb_language', language);
      
      // Update document attributes for RTL support
      const isRTL = this.isRTL(language);
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }

    // Load translations if not cached
    if (!this.translations[language]) {
      await this.loadTranslations(language);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener());
  }

  getSupportedLanguages(): Language[] {
    return this.supportedLanguages.length > 0 
      ? this.supportedLanguages 
      : Object.keys(LANGUAGE_INFO) as Language[];
  }

  isSupported(language: string): boolean {
    return this.getSupportedLanguages().includes(language as Language);
  }

  isRTL(language?: Language): boolean {
    const lang = language || this.currentLanguage;
    if (this.backendConfig?.rtlLanguages) {
      return this.backendConfig.rtlLanguages.includes(lang);
    }
    return LANGUAGE_INFO[lang]?.isRTL || false;
  }

  getLanguageInfo(language?: Language): LanguageInfo | undefined {
    const lang = language || this.currentLanguage;
    return LANGUAGE_INFO[lang];
  }

  async waitForInitialization(): Promise<void> {
    while (!this.initialized) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  translate(key: string, params?: Record<string, string>): string {
    const keys = key.split('.');
    let value: any = this.translations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English
        value = this.getFallbackTranslation(key);
        break;
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation not found for key: ${key}`);
      return key;
    }

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, val]) => {
        value = value.replace(`{${param}}`, val);
      });
    }

    return value;
  }

  private getFallbackTranslation(key: string): string {
    // Try configured fallback language first
    const fallbackLang = this.backendConfig?.fallbackLanguage || 'en';
    if (fallbackLang !== this.currentLanguage && this.translations[fallbackLang]) {
      const keys = key.split('.');
      let value: any = this.translations[fallbackLang];

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          break;
        }
      }

      if (typeof value === 'string') {
        return value;
      }
    }

    // Fall back to English if different from fallback language
    if (fallbackLang !== 'en' && this.translations.en) {
      const keys = key.split('.');
      let value: any = this.translations.en;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          break;
        }
      }

      if (typeof value === 'string') {
        return value;
      }
    }

    // Last resort: return the key itself
    return key;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async getTranslationCoverage(language: Language): Promise<number> {
    try {
      const response = await apiClient.get(`/api/v1/system/i18n/coverage/${language}`);
      return response.data?.data?.coverage || response.data?.coverage || 0;
    } catch {
      // Calculate coverage from local translations
      const langKeys = this.countKeys(this.translations[language] || {});
      const enKeys = this.countKeys(this.translations.en || mockTranslations.en || {});
      return enKeys > 0 ? Math.round((langKeys / enKeys) * 100) : 0;
    }
  }

  private countKeys(obj: any): number {
    let count = 0;
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        count++;
      } else if (typeof obj[key] === 'object') {
        count += this.countKeys(obj[key]);
      }
    }
    return count;
  }
}

// Export singleton instance
export const i18n = new I18nService();

// Convenience function
export const t = (key: string, params?: Record<string, string>) => 
  i18n.translate(key, params);