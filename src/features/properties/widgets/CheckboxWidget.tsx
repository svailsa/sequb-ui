

interface CheckboxWidgetProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  className?: string
}

export function CheckboxWidget({ 
  checked, 
  onChange, 
  label,
  className = '' 
}: CheckboxWidgetProps) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}