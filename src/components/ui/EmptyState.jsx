export default function EmptyState({ icon, title, description, action, variant = 'dark' }) {
  const isLight = variant === 'light'
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {icon && (
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isLight ? 'bg-gray-200 text-gray-500' : 'bg-dark-700 text-dark-400'}`}>
          {icon}
        </div>
      )}
      <h3 className={`text-base font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>{title}</h3>
      {description && <p className={`text-sm max-w-xs ${isLight ? 'text-gray-500' : 'text-dark-400'}`}>{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
