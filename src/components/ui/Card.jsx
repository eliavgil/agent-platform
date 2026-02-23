export default function Card({ children, className = '', hover = false, glow = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-dark-800 border border-dark-600/50 rounded-xl
        ${hover ? 'hover:border-dark-500 hover:bg-dark-750 transition-all duration-200' : ''}
        ${glow ? 'hover:shadow-lg hover:shadow-accent/10 hover:border-accent/30' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 border-b border-dark-600/50 ${className}`}>
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

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-5 py-3 border-t border-dark-600/50 ${className}`}>
      {children}
    </div>
  )
}
