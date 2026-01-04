

interface NumberWidgetProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  min?: number
  max?: number
  step?: number
  className?: string
}

export function NumberWidget({ 
  value, 
  onChange, 
  placeholder,
  min,
  max,
  step,
  className = '' 
}: NumberWidgetProps) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  )
}