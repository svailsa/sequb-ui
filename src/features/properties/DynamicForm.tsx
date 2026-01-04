import React from 'react'
import { NodeInput } from '@/types/schema'
import { useGraphStore } from '@/stores/useGraphStore'
import { useRegistryStore } from '@/stores/useRegistryStore'
import { TextWidget } from './widgets/TextWidget'
import { TextAreaWidget } from './widgets/TextAreaWidget'
import { SelectWidget } from './widgets/SelectWidget'
import { NumberWidget } from './widgets/NumberWidget'
import { CheckboxWidget } from './widgets/CheckboxWidget'
import { validateTextInput, validateNumberInput } from '@/lib/validation/validators'
import { sanitizeText } from '@/lib/validation/sanitizers'

export function DynamicForm() {
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId)
  const nodes = useGraphStore((state) => state.nodes)
  const updateNode = useGraphStore((state) => state.updateNode)
  const registry = useRegistryStore((state) => state.registry)
  
  const selectedNode = nodes.find((n) => n.id === selectedNodeId)
  
  if (!selectedNode || !registry) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Select a node to view its properties
      </div>
    )
  }
  
  const nodeType = selectedNode.data.nodeType
  const nodeDefinition = registry.nodes[nodeType]
  
  if (!nodeDefinition) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Node definition not found
      </div>
    )
  }
  
  const handleChange = (key: string, value: any, inputType: string) => {
    try {
      let validatedValue = value
      
      // Validate based on input type
      switch (inputType) {
        case 'text':
        case 'textarea':
        case 'code':
          validatedValue = validateTextInput(sanitizeText(value))
          break
        case 'number':
          validatedValue = validateNumberInput(value)
          break
        case 'select':
        case 'model_picker':
          validatedValue = sanitizeText(value)
          break
        case 'checkbox':
          validatedValue = Boolean(value)
          break
      }
      
      updateNode(selectedNodeId, { [key]: validatedValue })
    } catch (error) {
      console.error(`Invalid input for ${key}:`, error)
      // Optionally show user-friendly error message
    }
  }
  
  const renderWidget = (input: NodeInput) => {
    const value = selectedNode.data[input.key] ?? input.defaultValue ?? ''
    
    switch (input.widget) {
      case 'text':
        return (
          <TextWidget
            value={value}
            onChange={(val) => handleChange(input.key, val, 'text')}
            placeholder={input.label}
          />
        )
      
      case 'textarea':
        return (
          <TextAreaWidget
            value={value}
            onChange={(val) => handleChange(input.key, val, 'textarea')}
            placeholder={input.label}
          />
        )
      
      case 'select':
      case 'model_picker':
        return (
          <SelectWidget
            value={value}
            onChange={(val) => handleChange(input.key, val, input.widget)}
            options={input.options || []}
            placeholder={`Select ${input.label}`}
          />
        )
      
      case 'number':
        return (
          <NumberWidget
            value={value}
            onChange={(val) => handleChange(input.key, val, 'number')}
            placeholder={input.label}
          />
        )
      
      case 'checkbox':
        return (
          <CheckboxWidget
            checked={value}
            onChange={(val) => handleChange(input.key, val, 'checkbox')}
            label={input.label}
          />
        )
      
      case 'code':
        return (
          <TextAreaWidget
            value={value}
            onChange={(val) => handleChange(input.key, val, 'code')}
            placeholder={input.label}
            className="font-mono text-xs"
          />
        )
      
      default:
        return (
          <TextWidget
            value={value}
            onChange={(val) => handleChange(input.key, val, 'text')}
            placeholder={input.label}
          />
        )
    }
  }
  
  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{nodeDefinition.label}</h3>
        <p className="text-sm text-gray-500">{nodeDefinition.category}</p>
      </div>
      
      <div className="space-y-4">
        {nodeDefinition.inputs.map((input) => (
          <div key={input.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {input.label}
            </label>
            {renderWidget(input)}
          </div>
        ))}
      </div>
    </div>
  )
}