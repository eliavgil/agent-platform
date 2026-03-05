import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children, size = 'md', variant = 'dark' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  const isLight = variant === 'light'
  const panelClass = isLight
    ? 'bg-white border border-gray-200 shadow-2xl'
    : 'bg-dark-800 border border-dark-600 shadow-2xl'
  const headerClass = isLight
    ? 'border-b border-gray-200'
    : 'border-b border-dark-600'
  const titleClass = isLight ? 'text-gray-900' : 'text-gray-100'
  const closeClass = isLight
    ? 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
    : 'hover:bg-dark-700 text-dark-300 hover:text-gray-100'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative w-full ${sizes[size]} ${panelClass} rounded-2xl`}>
        {title && (
          <div className={`flex items-center justify-between px-6 py-4 ${headerClass}`}>
            <h2 className={`text-lg font-semibold ${titleClass}`}>{title}</h2>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${closeClass}`}
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}
