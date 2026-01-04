

interface TextAreaWidgetProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  rows?: number
}

export function TextAreaWidget({ 
  value, 
  onChange, 
  placeholder, 
  className = '',
  rows = 3 
}: TextAreaWidgetProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y ${className}`}
    />
  )
}