import { forwardRef } from 'react'

export const Input = forwardRef(({
  label,
  error,
  hint,
  icon,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-dark-200 mb-1.5">
          {label}
          {props.required && <span className="text-danger mr-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-dark-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-dark-800 border text-gray-100 rounded-lg px-3 py-2.5 text-sm
            placeholder:text-dark-400 focus:outline-none focus:ring-2 transition-all
            ${error
              ? 'border-danger focus:border-danger focus:ring-danger/20'
              : 'border-dark-600 focus:border-accent focus:ring-accent/20'
            }
            ${icon ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-dark-400">{hint}</p>}
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
  ...props
}, ref) => {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-dark-200 mb-1.5">
          {label}
          {props.required && <span className="text-danger mr-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full bg-dark-800 border text-gray-100 rounded-lg px-3 py-2.5 text-sm
          placeholder:text-dark-400 focus:outline-none focus:ring-2 transition-all resize-none
          ${error
            ? 'border-danger focus:border-danger focus:ring-danger/20'
            : 'border-dark-600 focus:border-accent focus:ring-accent/20'
          }
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-dark-400">{hint}</p>}
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
  ...props
}, ref) => {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-dark-200 mb-1.5">
          {label}
          {props.required && <span className="text-danger mr-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={`
          w-full bg-dark-800 border text-gray-100 rounded-lg px-3 py-2.5 text-sm
          focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer
          ${error
            ? 'border-danger focus:border-danger focus:ring-danger/20'
            : 'border-dark-600 focus:border-accent focus:ring-accent/20'
          }
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-dark-400">{hint}</p>}
    </div>
  )
})
Select.displayName = 'Select'
