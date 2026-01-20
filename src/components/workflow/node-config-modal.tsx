"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NodeType, NodeInput } from '@/types/sequb';
import { X } from 'lucide-react';

interface NodeConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeType: NodeType;
  initialValues: Record<string, any>;
  onSave: (values: Record<string, any>) => void;
}

export function NodeConfigModal({
  open,
  onOpenChange,
  nodeType,
  initialValues,
  onSave
}: NodeConfigModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData(initialValues);
    setErrors({});
  }, [initialValues, open]);

  const validateField = (input: NodeInput, value: any): string | null => {
    if (input.required && (!value || value === '')) {
      return `${input.label} is required`;
    }

    if (input.validation) {
      const { min, max, pattern } = input.validation;
      
      if (input.type === 'number' && value !== '' && value !== null) {
        const numValue = Number(value);
        if (min !== undefined && numValue < min) {
          return `${input.label} must be at least ${min}`;
        }
        if (max !== undefined && numValue > max) {
          return `${input.label} must be at most ${max}`;
        }
      }
      
      if (input.type === 'text' || input.type === 'textarea') {
        if (min !== undefined && String(value).length < min) {
          return `${input.label} must be at least ${min} characters`;
        }
        if (max !== undefined && String(value).length > max) {
          return `${input.label} must be at most ${max} characters`;
        }
        if (pattern && !new RegExp(pattern).test(String(value))) {
          return `${input.label} format is invalid`;
        }
      }
    }

    return null;
  };

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    
    // Clear error for this field
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate all fields
    nodeType.inputs.forEach(input => {
      const error = validateField(input, formData[input.key]);
      if (error) {
        newErrors[input.key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
    onOpenChange(false);
  };

  const renderFormField = (input: NodeInput) => {
    const value = formData[input.key] ?? input.default ?? '';
    const error = errors[input.key];

    switch (input.type) {
      case 'text':
        return (
          <div key={input.key} className="space-y-2">
            <Label htmlFor={input.key} className="text-sm font-medium">
              {input.label}
              {input.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={input.key}
              value={value}
              onChange={(e) => handleFieldChange(input.key, e.target.value)}
              placeholder={input.description}
              className={error ? 'border-red-500' : ''}
            />
            {input.description && !error && (
              <p className="text-xs text-muted-foreground">{input.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={input.key} className="space-y-2">
            <Label htmlFor={input.key} className="text-sm font-medium">
              {input.label}
              {input.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={input.key}
              value={value}
              onChange={(e) => handleFieldChange(input.key, e.target.value)}
              placeholder={input.description}
              rows={3}
              className={error ? 'border-red-500' : ''}
            />
            {input.description && !error && (
              <p className="text-xs text-muted-foreground">{input.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={input.key} className="space-y-2">
            <Label htmlFor={input.key} className="text-sm font-medium">
              {input.label}
              {input.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={input.key}
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(input.key, e.target.value)}
              placeholder={input.description}
              min={input.validation?.min}
              max={input.validation?.max}
              className={error ? 'border-red-500' : ''}
            />
            {input.description && !error && (
              <p className="text-xs text-muted-foreground">{input.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'boolean':
        return (
          <div key={input.key} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={input.key}
                checked={Boolean(value)}
                onCheckedChange={(checked) => handleFieldChange(input.key, checked)}
              />
              <Label htmlFor={input.key} className="text-sm font-medium">
                {input.label}
                {input.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            {input.description && (
              <p className="text-xs text-muted-foreground ml-6">{input.description}</p>
            )}
            {error && <p className="text-xs text-red-500 ml-6">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={input.key} className="space-y-2">
            <Label htmlFor={input.key} className="text-sm font-medium">
              {input.label}
              {input.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={value} onValueChange={(val) => handleFieldChange(input.key, val)}>
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder={input.description || `Select ${input.label}`} />
              </SelectTrigger>
              <SelectContent>
                {input.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {input.description && !error && (
              <p className="text-xs text-muted-foreground">{input.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'code':
      case 'json':
        return (
          <div key={input.key} className="space-y-2">
            <Label htmlFor={input.key} className="text-sm font-medium">
              {input.label}
              {input.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={input.key}
              value={value}
              onChange={(e) => handleFieldChange(input.key, e.target.value)}
              placeholder={input.description}
              rows={6}
              className={`font-mono text-sm ${error ? 'border-red-500' : ''}`}
            />
            {input.description && !error && (
              <p className="text-xs text-muted-foreground">{input.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'file':
        return (
          <div key={input.key} className="space-y-2">
            <Label htmlFor={input.key} className="text-sm font-medium">
              {input.label}
              {input.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={input.key}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                handleFieldChange(input.key, file?.name || '');
              }}
              className={error ? 'border-red-500' : ''}
            />
            {value && (
              <p className="text-xs text-muted-foreground">Selected: {value}</p>
            )}
            {input.description && !error && (
              <p className="text-xs text-muted-foreground">{input.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      default:
        return (
          <div key={input.key} className="space-y-2">
            <Label htmlFor={input.key} className="text-sm font-medium">
              {input.label}
              {input.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={input.key}
              value={value}
              onChange={(e) => handleFieldChange(input.key, e.target.value)}
              placeholder={input.description}
              className={error ? 'border-red-500' : ''}
            />
            {input.description && !error && (
              <p className="text-xs text-muted-foreground">{input.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            Configure {nodeType.name}
          </DialogTitle>
          <DialogDescription>
            {nodeType.description || `Configure the inputs for this ${nodeType.name} node.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {nodeType.inputs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              This node has no configurable inputs.
            </div>
          ) : (
            nodeType.inputs.map(renderFormField)
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}