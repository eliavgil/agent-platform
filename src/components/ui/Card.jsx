export default function Card({ children, className = '', hover = false, glow = false, onClick, variant = 'dark' }) {
  const isLight = variant === 'light'
  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl
        ${isLight
          ? 'bg-white border border-gray-200 shadow-sm'
          : 'bg-dark-800 border border-dark-600/50'}
        ${hover
          ? isLight
            ? 'hover:border-gray-300 hover:shadow-md transition-all duration-200'
            : 'hover:border-dark-500 hover:bg-dark-750 transition-all duration-200'
          : ''}
        ${glow ? 'hover:shadow-lg hover:shadow-accent/10 hover:border-accent/30' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', variant = 'dark' }) {
  const borderClass = variant === 'light' ? 'border-b border-gray-200' : 'border-b border-dark-600/50'
  return (
    <div className={`px-5 py-4 ${borderClass} ${className}`}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '', variant = 'dark' }) {
  const borderClass = variant === 'light' ? 'border-t border-gray-200' : 'border-t border-dark-600/50'
  return (
    <div className={`px-5 py-3 ${borderClass} ${className}`}>
      {children}
    </div>
  )
}
