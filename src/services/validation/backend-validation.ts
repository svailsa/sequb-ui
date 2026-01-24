/**
 * Backend-Driven Validation Service
 * Gets validation schemas from backend instead of using hardcoded rules
 */

import { api } from '@/services/api/client';
import { logger } from '@/services/monitoring/logger';

interface ValidationSchema {
  type: string;
  properties: Record<string, PropertySchema>;
  required: string[];
}

interface PropertySchema {
  type: string;
  min_length?: number;
  max_length?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  enum_values?: string[];
  description?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

class BackendValidationService {
  private schemaCache: Map<string, ValidationSchema> = new Map();
  private schemaCacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private availableSchemas: string[] = [];

  constructor() {
    this.loadAvailableSchemas();
  }

  /**
   * Load list of available validation schemas
   */
  private async loadAvailableSchemas(): Promise<void> {
    try {
      const response = await api.ui.getValidationSchemas();
      this.availableSchemas = response.data.data.schemas;
      logger.debug('Available validation schemas loaded', {
        count: this.availableSchemas.length,
        schemas: this.availableSchemas,
      });
    } catch (error) {
      logger.error('Failed to load available validation schemas', error);
    }
  }

  /**
   * Get validation schema for an entity
   */
  async getValidationSchema(entity: string): Promise<ValidationSchema | null> {
    const now = Date.now();
    const cached = this.schemaCache.get(entity);
    const cacheExpiry = this.schemaCacheExpiry.get(entity) || 0;

    // Return cached schema if still valid
    if (cached && now < cacheExpiry) {
      return cached;
    }

    try {
      const response = await api.ui.getValidationSchema(entity);
      const schema = response.data.data;
      this.schemaCache.set(entity, schema);
      this.schemaCacheExpiry.set(entity, now + this.CACHE_TTL);
      return schema;
    } catch (error) {
      logger.warn('Failed to load validation schema from backend', { entity, error });
    }

    // Return fallback for common entities
    return this.getFallbackSchema(entity);
  }

  /**
   * Get fallback schema when backend is unavailable
   */
  private getFallbackSchema(entity: string): ValidationSchema | null {
    const fallbacks: Record<string, ValidationSchema> = {
      'workflow.name': {
        type: 'object',
        properties: {
          value: {
            type: 'string',
            min_length: 1,
            max_length: 100,
            pattern: '^[a-zA-Z0-9_\\-\\s]+$',
            description: 'Workflow name must be 1-100 characters, alphanumeric with spaces, hyphens, and underscores',
          },
        },
        required: ['value'],
      },
      'user.email': {
        type: 'object',
        properties: {
          value: {
            type: 'string',
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
            max_length: 254,
            description: 'Valid email address',
          },
        },
        required: ['value'],
      },
      'user.password': {
        type: 'object',
        properties: {
          value: {
            type: 'string',
            min_length: 8,
            max_length: 128,
            pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z\\d]).+$',
            description: 'Password must be 8-128 characters with uppercase, lowercase, number, and symbol',
          },
        },
        required: ['value'],
      },
    };

    return fallbacks[entity] || null;
  }

  /**
   * Validate a field value against its schema
   */
  async validateField(entity: string, fieldName: string, value: any): Promise<ValidationResult> {
    const schema = await this.getValidationSchema(entity);
    
    if (!schema) {
      logger.warn('No validation schema available for entity', { entity });
      return { valid: true, errors: [] }; // Allow if no schema
    }

    const errors: ValidationError[] = [];
    const property = schema.properties[fieldName];

    if (!property) {
      if (schema.required.includes(fieldName)) {
        errors.push({
          field: fieldName,
          message: `Field '${fieldName}' is required`,
          code: 'required',
        });
      }
      return { valid: errors.length === 0, errors };
    }

    // Check required fields
    if (schema.required.includes(fieldName) && (value === null || value === undefined || value === '')) {
      errors.push({
        field: fieldName,
        message: `${fieldName} is required`,
        code: 'required',
      });
      return { valid: false, errors };
    }

    // Skip validation for empty optional fields
    if (!schema.required.includes(fieldName) && (value === null || value === undefined || value === '')) {
      return { valid: true, errors: [] };
    }

    // Type validation
    if (!this.validateType(value, property.type)) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be of type ${property.type}`,
        code: 'invalid_type',
      });
      return { valid: false, errors };
    }

    // String validations
    if (property.type === 'string' && typeof value === 'string') {
      if (property.min_length && value.length < property.min_length) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at least ${property.min_length} characters`,
          code: 'min_length',
        });
      }

      if (property.max_length && value.length > property.max_length) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be no more than ${property.max_length} characters`,
          code: 'max_length',
        });
      }

      if (property.pattern && !new RegExp(property.pattern).test(value)) {
        errors.push({
          field: fieldName,
          message: property.description || `${fieldName} format is invalid`,
          code: 'invalid_format',
        });
      }

      if (property.enum_values && !property.enum_values.includes(value)) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be one of: ${property.enum_values.join(', ')}`,
          code: 'invalid_enum',
        });
      }
    }

    // Number validations
    if (property.type === 'number' && typeof value === 'number') {
      if (property.minimum !== undefined && value < property.minimum) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at least ${property.minimum}`,
          code: 'min_value',
        });
      }

      if (property.maximum !== undefined && value > property.maximum) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be no more than ${property.maximum}`,
          code: 'max_value',
        });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate an entire object against its schema
   */
  async validateObject(entity: string, data: Record<string, any>): Promise<ValidationResult> {
    const schema = await this.getValidationSchema(entity);
    
    if (!schema) {
      return { valid: true, errors: [] }; // Allow if no schema
    }

    const allErrors: ValidationError[] = [];

    // Check required fields
    for (const requiredField of schema.required) {
      if (!(requiredField in data) || data[requiredField] === null || data[requiredField] === undefined) {
        allErrors.push({
          field: requiredField,
          message: `${requiredField} is required`,
          code: 'required',
        });
      }
    }

    // Validate each provided field
    for (const [fieldName, value] of Object.entries(data)) {
      const fieldResult = await this.validateField(entity, fieldName, value);
      allErrors.push(...fieldResult.errors);
    }

    return { valid: allErrors.length === 0, errors: allErrors };
  }

  /**
   * Type validation helper
   */
  private validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true; // Unknown type, allow
    }
  }

  /**
   * Get available schemas
   */
  getAvailableSchemas(): string[] {
    return this.availableSchemas;
  }

  /**
   * Clear cache for a specific entity or all entities
   */
  clearCache(entity?: string): void {
    if (entity) {
      this.schemaCache.delete(entity);
      this.schemaCacheExpiry.delete(entity);
    } else {
      this.schemaCache.clear();
      this.schemaCacheExpiry.clear();
    }
  }

  /**
   * Refresh schemas from backend
   */
  async refreshSchemas(): Promise<void> {
    this.clearCache();
    await this.loadAvailableSchemas();
  }

  /**
   * Create a validation function for a specific entity
   */
  createValidator(entity: string) {
    return {
      validateField: (field: string, value: any) => this.validateField(entity, field, value),
      validateObject: (data: Record<string, any>) => this.validateObject(entity, data),
      getSchema: () => this.getValidationSchema(entity),
    };
  }
}

// Export singleton instance
export const backendValidation = new BackendValidationService();