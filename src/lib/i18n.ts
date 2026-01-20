import { apiClient } from './api';

export type Language = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'ar' | 'ur';

export interface TranslationData {
  [key: string]: string | TranslationData;
}

export interface I18nConfig {
  defaultLanguage: Language;
  fallbackLanguage: Language;
  supportedLanguages: Language[];
  translations: Record<Language, TranslationData>;
}

// Mock translations for demonstration
const mockTranslations: Record<Language, TranslationData> = {
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
  private translations: Record<Language, TranslationData> = mockTranslations;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Load saved language preference
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('sequb_language') as Language;
      if (savedLanguage && this.isSupported(savedLanguage)) {
        this.currentLanguage = savedLanguage;
      } else {
        // Detect browser language
        const browserLang = navigator.language.split('-')[0] as Language;
        if (this.isSupported(browserLang)) {
          this.currentLanguage = browserLang;
        }
      }
    }
  }

  async loadTranslations(language: Language): Promise<void> {
    try {
      // Try to fetch translations from backend
      const response = await apiClient.get(`/api/v1/i18n/translations/${language}`);
      if (response.data) {
        this.translations[language] = response.data;
      }
    } catch (error) {
      console.warn(`Failed to load translations for ${language}, using mock data`);
      // Use mock translations as fallback
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
      const isRTL = ['ar', 'ur'].includes(language);
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
    return ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ar', 'ur'];
  }

  isSupported(language: string): boolean {
    return this.getSupportedLanguages().includes(language as Language);
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
    const keys = key.split('.');
    let value: any = this.translations.en;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async getTranslationCoverage(language: Language): Promise<number> {
    try {
      const response = await apiClient.get(`/api/v1/i18n/coverage/${language}`);
      return response.data.coverage || 0;
    } catch {
      // Calculate coverage from local translations
      const langKeys = this.countKeys(this.translations[language] || {});
      const enKeys = this.countKeys(this.translations.en);
      return Math.round((langKeys / enKeys) * 100);
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