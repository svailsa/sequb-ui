import { api } from '@/lib/api';
import { logger } from '@/lib/logger';

export interface ValidationSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, ValidationSchema>;
  items?: ValidationSchema;
  required?: string[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  enum?: any[];
  format?: string;
  description?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  value?: any;
}

// Cache for validation schemas from backend
const schemaCache = new Map<string, ValidationSchema>();

// Fetch validation schema from backend
export async function getValidationSchema(schemaType: string): Promise<ValidationSchema | null> {
  if (schemaCache.has(schemaType)) {
    return schemaCache.get(schemaType)!;
  }

  try {
    const response = await api.ui.getValidationSchema(schemaType);
    const schema = response.data.data;
    schemaCache.set(schemaType, schema);
    return schema;
  } catch (error) {
    logger.error(`Failed to fetch validation schema for ${schemaType}:`, error);
    
    // Fallback to default schemas
    return getDefaultSchema(schemaType);
  }
}

// Default schemas for offline/fallback
function getDefaultSchema(schemaType: string): ValidationSchema | null {
  const defaultSchemas: Record<string, ValidationSchema> = {
    workflow: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
          description: 'Workflow name'
        },
        description: {
          type: 'string',
          maxLength: 500,
          description: 'Workflow description'
        },
        graph: {
          type: 'object',
          properties: {
            nodes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  data: { type: 'object' },
                  position: { type: 'object' }
                },
                required: ['id', 'type', 'data', 'position']
              }
            },
            edges: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  source: { type: 'string' },
                  target: { type: 'string' }
                },
                required: ['id', 'source', 'target']
              }
            }
          },
          required: ['nodes', 'edges']
        }
      },
      required: ['name', 'graph']
    },
    nodeConfig: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        type: { type: 'string' },
        config: { type: 'object' }
      },
      required: ['id', 'type']
    },
    chatMessage: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          minLength: 1,
          maxLength: 4000,
          description: 'Message content'
        }
      },
      required: ['content']
    }
  };

  return defaultSchemas[schemaType] || null;
}

// Validate data against schema
export function validateData(data: any, schema: ValidationSchema, path = ''): ValidationResult {
  const errors: ValidationError[] = [];

  if (schema.type === 'object' && schema.properties) {
    if (typeof data !== 'object' || data === null) {
      errors.push({
        path,
        message: `Expected object but got ${typeof data}`,
        value: data
      });
      return { valid: false, errors };
    }

    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          errors.push({
            path: path ? `${path}.${field}` : field,
            message: `Field is required`
          });
        }
      }
    }

    // Validate each property
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (key in data) {
        const result = validateData(
          data[key],
          propSchema,
          path ? `${path}.${key}` : key
        );
        errors.push(...result.errors);
      }
    }
  } else if (schema.type === 'array' && schema.items) {
    if (!Array.isArray(data)) {
      errors.push({
        path,
        message: `Expected array but got ${typeof data}`,
        value: data
      });
      return { valid: false, errors };
    }

    // Validate each item
    data.forEach((item, index) => {
      const result = validateData(
        item,
        schema.items!,
        path ? `${path}[${index}]` : `[${index}]`
      );
      errors.push(...result.errors);
    });
  } else if (schema.type === 'string') {
    if (typeof data !== 'string') {
      errors.push({
        path,
        message: `Expected string but got ${typeof data}`,
        value: data
      });
    } else {
      if (schema.minLength && data.length < schema.minLength) {
        errors.push({
          path,
          message: `String must be at least ${schema.minLength} characters`,
          value: data
        });
      }
      if (schema.maxLength && data.length > schema.maxLength) {
        errors.push({
          path,
          message: `String must not exceed ${schema.maxLength} characters`,
          value: data
        });
      }
      if (schema.pattern) {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(data)) {
          errors.push({
            path,
            message: `String does not match pattern ${schema.pattern}`,
            value: data
          });
        }
      }
      if (schema.enum && !schema.enum.includes(data)) {
        errors.push({
          path,
          message: `Value must be one of: ${schema.enum.join(', ')}`,
          value: data
        });
      }
    }
  } else if (schema.type === 'number') {
    if (typeof data !== 'number') {
      errors.push({
        path,
        message: `Expected number but got ${typeof data}`,
        value: data
      });
    } else {
      if (schema.minimum !== undefined && data < schema.minimum) {
        errors.push({
          path,
          message: `Value must be at least ${schema.minimum}`,
          value: data
        });
      }
      if (schema.maximum !== undefined && data > schema.maximum) {
        errors.push({
          path,
          message: `Value must not exceed ${schema.maximum}`,
          value: data
        });
      }
    }
  } else if (schema.type === 'boolean') {
    if (typeof data !== 'boolean') {
      errors.push({
        path,
        message: `Expected boolean but got ${typeof data}`,
        value: data
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Validate workflow before save/execute
export async function validateWorkflow(workflow: any): Promise<ValidationResult> {
  const schema = await getValidationSchema('workflow');
  if (!schema) {
    return {
      valid: false,
      errors: [{ path: '', message: 'No validation schema available' }]
    };
  }

  return validateData(workflow, schema);
}

// Validate node configuration
export async function validateNodeConfig(nodeType: string, config: any): Promise<ValidationResult> {
  const schema = await getValidationSchema(`node.${nodeType}`);
  if (!schema) {
    // No specific schema for this node type, use generic validation
    return { valid: true, errors: [] };
  }

  return validateData(config, schema);
}

// Format validation errors for display
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  
  return errors
    .map(error => {
      const location = error.path ? `${error.path}: ` : '';
      return `${location}${error.message}`;
    })
    .join('\n');
}