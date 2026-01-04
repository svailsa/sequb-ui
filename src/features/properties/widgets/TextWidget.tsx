

interface TextWidgetProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function TextWidget({ value, onChange, placeholder, className = '' }: TextWidgetProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  )
}