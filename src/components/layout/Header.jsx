export default function Header({ title, subtitle, actions, variant = 'light' }) {
  const isLight = variant === 'light'
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{title}</h1>
        {subtitle && <p className={`text-sm mt-0.5 ${isLight ? 'text-gray-500' : 'text-dark-400'}`}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
