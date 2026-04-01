import { forwardRef } from 'react'

export const Input = forwardRef(({
  label,
  error,
  hint,
  icon,
  className = '',
  containerClassName = '',
  variant = 'dark',
  ...props
}, ref) => {
  const isLight = variant === 'light'
  return (
    <div className={containerClassName}>
      {label && (
        <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-gray-700' : 'text-dark-200'}`}>
          {label}
          {props.required && <span className="text-danger mr-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className={`absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none ${isLight ? 'text-gray-400' : 'text-dark-400'}`}>
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full border rounded-lg px-3 py-2.5 text-sm
            focus:outline-none focus:ring-2 transition-all
            ${isLight
              ? 'bg-white text-gray-900 placeholder:text-gray-400'
              : 'bg-dark-800 text-gray-100 placeholder:text-dark-400'
            }
            ${error
              ? 'border-danger focus:border-danger focus:ring-danger/20'
              : isLight
                ? 'border-gray-300 focus:border-accent focus:ring-accent/20'
                : 'border-dark-600 focus:border-accent focus:ring-accent/20'
            }
            ${icon ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {hint && !error && <p className={`mt-1 text-xs ${isLight ? 'text-gray-500' : 'text-dark-400'}`}>{hint}</p>}
    </div>
  )
})
Input.displayName = 'Input'

export const Textarea = forwardRef(({
  label,
  error,
  hint,
  className = '',
  containerClassName = '',
  rows = 4,
  variant = 'dark',
  ...props
}, ref) => {
  const isLight = variant === 'light'
  return (
    <div className={containerClassName}>
      {label && (
        <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-gray-700' : 'text-dark-200'}`}>
          {label}
          {props.required && <span className="text-danger mr-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full border rounded-lg px-3 py-2.5 text-sm
          focus:outline-none focus:ring-2 transition-all resize-none
          ${isLight
            ? 'bg-white text-gray-900 placeholder:text-gray-400'
            : 'bg-dark-800 text-gray-100 placeholder:text-dark-400'
          }
          ${error
            ? 'border-danger focus:border-danger focus:ring-danger/20'
            : isLight
              ? 'border-gray-300 focus:border-accent focus:ring-accent/20'
              : 'border-dark-600 focus:border-accent focus:ring-accent/20'
          }
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {hint && !error && <p className={`mt-1 text-xs ${isLight ? 'text-gray-500' : 'text-dark-400'}`}>{hint}</p>}
    </div>
  )
})
Textarea.displayName = 'Textarea'

export const Select = forwardRef(({
  label,
  error,
  hint,
  className = '',
  containerClassName = '',
  children,
  variant = 'dark',
  ...props
}, ref) => {
  const isLight = variant === 'light'
  return (
    <div className={containerClassName}>
      {label && (
        <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-gray-700' : 'text-dark-200'}`}>
          {label}
          {props.required && <span className="text-danger mr-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={`
          w-full border rounded-lg px-3 py-2.5 text-sm
          focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer
          ${isLight
            ? 'bg-white text-gray-900'
            : 'bg-dark-800 text-gray-100'
          }
          ${error
            ? 'border-danger focus:border-danger focus:ring-danger/20'
            : isLight
              ? 'border-gray-300 focus:border-accent focus:ring-accent/20'
              : 'border-dark-600 focus:border-accent focus:ring-accent/20'
          }
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {hint && !error && <p className={`mt-1 text-xs ${isLight ? 'text-gray-500' : 'text-dark-400'}`}>{hint}</p>}
    </div>
  )
})
Select.displayName = 'Select'
