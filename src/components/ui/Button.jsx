import { forwardRef } from 'react'

const variants = {
  primary: 'bg-accent hover:bg-accent-dark text-white shadow-lg shadow-accent/20 hover:shadow-accent/30',
  secondary: 'bg-dark-700 hover:bg-dark-600 text-gray-200 border border-dark-500',
  ghost: 'hover:bg-dark-700 text-gray-300 hover:text-white',
  danger: 'bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30',
  success: 'bg-success/10 hover:bg-success/20 text-success border border-success/30',
  outline: 'border border-accent/50 text-accent hover:bg-accent/10',
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs rounded-md',
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-2.5 text-base rounded-xl',
}

const Button = forwardRef(({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  icon,
  iconPosition = 'start',
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-150 select-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon && iconPosition === 'start' ? icon : null}
      {children}
      {!loading && icon && iconPosition === 'end' ? icon : null}
    </button>
  )
})

Button.displayName = 'Button'
export default Button
