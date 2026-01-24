/**
 * Backend-Driven Preferences Service
 * Gets user preference defaults and constraints from backend
 */

import { api } from '@/services/api/client';
import { logger } from '@/services/monitoring/logger';

interface UserPreferencesDefaults {
  workflow: WorkflowPreferences;
  ui: UiPreferences;
  security: SecurityPreferences;
  notifications: NotificationPreferences;
  advanced: AdvancedPreferences;
}

interface WorkflowPreferences {
  default_timeout: number;
  max_retries: number;
  auto_save_interval: number;
  concurrent_executions_limit: number;
  enable_debug_mode: boolean;
  preferred_node_layout: string;
}

interface UiPreferences {
  theme: string;
  language: string;
  timezone: string;
  date_format: string;
  items_per_page: number;
  enable_animations: boolean;
  sidebar_collapsed: boolean;
  grid_snap: boolean;
}

interface SecurityPreferences {
  session_timeout_minutes: number;
  require_mfa_for_sensitive_operations: boolean;
  auto_logout_on_inactivity: boolean;
  enable_audit_logging: boolean;
  require_approval_for_deletions: boolean;
}

interface NotificationPreferences {
  email_notifications: boolean;
  workflow_completion_notifications: boolean;
  error_notifications: boolean;
  approval_notifications: boolean;
  digest_frequency: string;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

interface AdvancedPreferences {
  cache_ttl_seconds: number;
  telemetry_enabled: boolean;
  debug_logging_enabled: boolean;
  experimental_features_enabled: boolean;
  api_request_timeout: number;
  websocket_reconnect_attempts: number;
}

interface PreferencesConstraints {
  workflow: WorkflowConstraints;
  ui: UiConstraints;
  security: SecurityConstraints;
  notifications: NotificationConstraints;
  advanced: AdvancedConstraints;
}

interface WorkflowConstraints {
  min_timeout: number;
  max_timeout: number;
  max_retries_limit: number;
  max_concurrent_executions: number;
  allowed_node_layouts: string[];
}

interface UiConstraints {
  available_themes: string[];
  available_languages: string[];
  available_timezones: string[];
  min_items_per_page: number;
  max_items_per_page: number;
}

interface SecurityConstraints {
  min_session_timeout: number;
  max_session_timeout: number;
  require_mfa_for_admin: boolean;
  enforce_audit_logging: boolean;
}

interface NotificationConstraints {
  available_frequencies: string[];
  allow_quiet_hours: boolean;
}

interface AdvancedConstraints {
  min_cache_ttl: number;
  max_cache_ttl: number;
  force_telemetry: boolean;
  min_api_timeout: number;
  max_api_timeout: number;
  max_websocket_reconnect_attempts: number;
}

class BackendPreferencesService {
  private defaults: UserPreferencesDefaults | null = null;
  private constraints: PreferencesConstraints | null = null;
  private lastDefaultsFetch = 0;
  private lastConstraintsFetch = 0;
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  /**
   * Get user preferences defaults from backend
   */
  async getDefaults(): Promise<UserPreferencesDefaults> {
    const now = Date.now();
    
    // Use cached defaults if still fresh
    if (this.defaults && (now - this.lastDefaultsFetch) < this.CACHE_TTL) {
      return this.defaults;
    }

    try {
      const response = await api.ui.getPreferencesDefaults();
      this.defaults = response.data.data;
      this.lastDefaultsFetch = now;
      logger.debug('User preferences defaults loaded from backend');
      return this.defaults;
    } catch (error) {
      logger.error('Failed to load preferences defaults from backend', error);
    }

    // Return fallback defaults
    const fallbackDefaults = this.getFallbackDefaults();
    this.defaults = fallbackDefaults;
    return fallbackDefaults;
  }

  /**
   * Get preferences constraints from backend
   */
  async getConstraints(): Promise<PreferencesConstraints> {
    const now = Date.now();
    
    // Use cached constraints if still fresh
    if (this.constraints && (now - this.lastConstraintsFetch) < this.CACHE_TTL) {
      return this.constraints;
    }

    try {
      const response = await api.ui.getPreferencesConstraints();
      this.constraints = response.data.data;
      this.lastConstraintsFetch = now;
      logger.debug('User preferences constraints loaded from backend');
      return this.constraints;
    } catch (error) {
      logger.error('Failed to load preferences constraints from backend', error);
    }

    // Return fallback constraints
    const fallbackConstraints = this.getFallbackConstraints();
    this.constraints = fallbackConstraints;
    return fallbackConstraints;
  }

  /**
   * Get fallback defaults when backend is unavailable
   */
  private getFallbackDefaults(): UserPreferencesDefaults {
    return {
      workflow: {
        default_timeout: 300, // 5 minutes
        max_retries: 3,
        auto_save_interval: 30, // 30 seconds
        concurrent_executions_limit: 5,
        enable_debug_mode: process.env.NODE_ENV !== 'production',
        preferred_node_layout: 'hierarchical',
      },
      ui: {
        theme: 'auto',
        language: 'en',
        timezone: 'UTC',
        date_format: 'YYYY-MM-DD HH:mm:ss',
        items_per_page: 20,
        enable_animations: true,
        sidebar_collapsed: false,
        grid_snap: true,
      },
      security: {
        session_timeout_minutes: 480, // 8 hours
        require_mfa_for_sensitive_operations: true,
        auto_logout_on_inactivity: true,
        enable_audit_logging: true,
        require_approval_for_deletions: false,
      },
      notifications: {
        email_notifications: true,
        workflow_completion_notifications: true,
        error_notifications: true,
        approval_notifications: true,
        digest_frequency: 'immediate',
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
      },
      advanced: {
        cache_ttl_seconds: 3600, // 1 hour
        telemetry_enabled: true,
        debug_logging_enabled: process.env.NODE_ENV !== 'production',
        experimental_features_enabled: false,
        api_request_timeout: 30, // 30 seconds
        websocket_reconnect_attempts: 5,
      },
    };
  }

  /**
   * Get fallback constraints when backend is unavailable
   */
  private getFallbackConstraints(): PreferencesConstraints {
    return {
      workflow: {
        min_timeout: 1,
        max_timeout: 86400, // 24 hours
        max_retries_limit: 10,
        max_concurrent_executions: 50,
        allowed_node_layouts: ['hierarchical', 'grid', 'organic'],
      },
      ui: {
        available_themes: ['light', 'dark', 'auto'],
        available_languages: ['en', 'es', 'fr', 'de', 'ja', 'zh', 'pt', 'ru'],
        available_timezones: [
          'UTC',
          'America/New_York',
          'America/Los_Angeles',
          'Europe/London',
          'Europe/Paris',
          'Asia/Tokyo',
          'Asia/Shanghai',
          'Australia/Sydney',
        ],
        min_items_per_page: 10,
        max_items_per_page: 100,
      },
      security: {
        min_session_timeout: 15, // 15 minutes
        max_session_timeout: 1440, // 24 hours
        require_mfa_for_admin: true,
        enforce_audit_logging: false,
      },
      notifications: {
        available_frequencies: ['immediate', 'hourly', 'daily', 'weekly'],
        allow_quiet_hours: true,
      },
      advanced: {
        min_cache_ttl: 60,
        max_cache_ttl: 86400,
        force_telemetry: false,
        min_api_timeout: 5,
        max_api_timeout: 300,
        max_websocket_reconnect_attempts: 10,
      },
    };
  }

  /**
   * Validate a preference value against constraints
   */
  async validatePreference(category: keyof PreferencesConstraints, key: string, value: any): Promise<{
    valid: boolean;
    error?: string;
    adjustedValue?: any;
  }> {
    const constraints = await this.getConstraints();
    const categoryConstraints = constraints[category] as any;

    switch (category) {
      case 'workflow':
        return this.validateWorkflowPreference(key, value, categoryConstraints);
      case 'ui':
        return this.validateUiPreference(key, value, categoryConstraints);
      case 'security':
        return this.validateSecurityPreference(key, value, categoryConstraints);
      case 'notifications':
        return this.validateNotificationPreference(key, value, categoryConstraints);
      case 'advanced':
        return this.validateAdvancedPreference(key, value, categoryConstraints);
      default:
        return { valid: true };
    }
  }

  private validateWorkflowPreference(key: string, value: any, constraints: WorkflowConstraints) {
    switch (key) {
      case 'default_timeout':
        if (value < constraints.min_timeout) {
          return { valid: false, error: `Timeout must be at least ${constraints.min_timeout} seconds`, adjustedValue: constraints.min_timeout };
        }
        if (value > constraints.max_timeout) {
          return { valid: false, error: `Timeout must be no more than ${constraints.max_timeout} seconds`, adjustedValue: constraints.max_timeout };
        }
        break;
      case 'max_retries':
        if (value > constraints.max_retries_limit) {
          return { valid: false, error: `Max retries cannot exceed ${constraints.max_retries_limit}`, adjustedValue: constraints.max_retries_limit };
        }
        break;
      case 'concurrent_executions_limit':
        if (value > constraints.max_concurrent_executions) {
          return { valid: false, error: `Concurrent executions cannot exceed ${constraints.max_concurrent_executions}`, adjustedValue: constraints.max_concurrent_executions };
        }
        break;
      case 'preferred_node_layout':
        if (!constraints.allowed_node_layouts.includes(value)) {
          return { valid: false, error: `Layout must be one of: ${constraints.allowed_node_layouts.join(', ')}`, adjustedValue: constraints.allowed_node_layouts[0] };
        }
        break;
    }
    return { valid: true };
  }

  private validateUiPreference(key: string, value: any, constraints: UiConstraints) {
    switch (key) {
      case 'theme':
        if (!constraints.available_themes.includes(value)) {
          return { valid: false, error: `Theme must be one of: ${constraints.available_themes.join(', ')}`, adjustedValue: constraints.available_themes[0] };
        }
        break;
      case 'language':
        if (!constraints.available_languages.includes(value)) {
          return { valid: false, error: `Language must be one of: ${constraints.available_languages.join(', ')}`, adjustedValue: 'en' };
        }
        break;
      case 'timezone':
        if (!constraints.available_timezones.includes(value)) {
          return { valid: false, error: `Timezone must be one of the available timezones`, adjustedValue: 'UTC' };
        }
        break;
      case 'items_per_page':
        if (value < constraints.min_items_per_page) {
          return { valid: false, error: `Items per page must be at least ${constraints.min_items_per_page}`, adjustedValue: constraints.min_items_per_page };
        }
        if (value > constraints.max_items_per_page) {
          return { valid: false, error: `Items per page cannot exceed ${constraints.max_items_per_page}`, adjustedValue: constraints.max_items_per_page };
        }
        break;
    }
    return { valid: true };
  }

  private validateSecurityPreference(key: string, value: any, constraints: SecurityConstraints) {
    switch (key) {
      case 'session_timeout_minutes':
        if (value < constraints.min_session_timeout) {
          return { valid: false, error: `Session timeout must be at least ${constraints.min_session_timeout} minutes`, adjustedValue: constraints.min_session_timeout };
        }
        if (value > constraints.max_session_timeout) {
          return { valid: false, error: `Session timeout cannot exceed ${constraints.max_session_timeout} minutes`, adjustedValue: constraints.max_session_timeout };
        }
        break;
      case 'enable_audit_logging':
        if (constraints.enforce_audit_logging && !value) {
          return { valid: false, error: 'Audit logging is required by organization policy', adjustedValue: true };
        }
        break;
    }
    return { valid: true };
  }

  private validateNotificationPreference(key: string, value: any, constraints: NotificationConstraints) {
    switch (key) {
      case 'digest_frequency':
        if (!constraints.available_frequencies.includes(value)) {
          return { valid: false, error: `Frequency must be one of: ${constraints.available_frequencies.join(', ')}`, adjustedValue: 'immediate' };
        }
        break;
    }
    return { valid: true };
  }

  private validateAdvancedPreference(key: string, value: any, constraints: AdvancedConstraints) {
    switch (key) {
      case 'cache_ttl_seconds':
        if (value < constraints.min_cache_ttl) {
          return { valid: false, error: `Cache TTL must be at least ${constraints.min_cache_ttl} seconds`, adjustedValue: constraints.min_cache_ttl };
        }
        if (value > constraints.max_cache_ttl) {
          return { valid: false, error: `Cache TTL cannot exceed ${constraints.max_cache_ttl} seconds`, adjustedValue: constraints.max_cache_ttl };
        }
        break;
      case 'telemetry_enabled':
        if (constraints.force_telemetry && !value) {
          return { valid: false, error: 'Telemetry is required by organization policy', adjustedValue: true };
        }
        break;
      case 'api_request_timeout':
        if (value < constraints.min_api_timeout) {
          return { valid: false, error: `API timeout must be at least ${constraints.min_api_timeout} seconds`, adjustedValue: constraints.min_api_timeout };
        }
        if (value > constraints.max_api_timeout) {
          return { valid: false, error: `API timeout cannot exceed ${constraints.max_api_timeout} seconds`, adjustedValue: constraints.max_api_timeout };
        }
        break;
      case 'websocket_reconnect_attempts':
        if (value > constraints.max_websocket_reconnect_attempts) {
          return { valid: false, error: `Reconnect attempts cannot exceed ${constraints.max_websocket_reconnect_attempts}`, adjustedValue: constraints.max_websocket_reconnect_attempts };
        }
        break;
    }
    return { valid: true };
  }

  /**
   * Get merged preferences with defaults and user overrides
   */
  async getMergedPreferences(userPreferences: Partial<UserPreferencesDefaults>): Promise<UserPreferencesDefaults> {
    const defaults = await this.getDefaults();
    
    return {
      workflow: { ...defaults.workflow, ...userPreferences.workflow },
      ui: { ...defaults.ui, ...userPreferences.ui },
      security: { ...defaults.security, ...userPreferences.security },
      notifications: { ...defaults.notifications, ...userPreferences.notifications },
      advanced: { ...defaults.advanced, ...userPreferences.advanced },
    };
  }

  /**
   * Refresh data from backend
   */
  async refresh(): Promise<void> {
    this.lastDefaultsFetch = 0;
    this.lastConstraintsFetch = 0;
    await Promise.all([this.getDefaults(), this.getConstraints()]);
  }
}

// Export singleton instance
export const backendPreferences = new BackendPreferencesService();