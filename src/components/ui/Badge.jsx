const statusConfig = {
  pending:     { label: 'ממתין',    className: 'bg-warning/10 text-warning border-warning/30' },
  assigned:    { label: 'הוקצה',    className: 'bg-info/10 text-info border-info/30' },
  in_progress: { label: 'בטיפול',   className: 'bg-accent/10 text-accent-light border-accent/30' },
  completed:   { label: 'הושלם',    className: 'bg-success/10 text-success border-success/30' },
  cancelled:   { label: 'בוטל',     className: 'bg-dark-500/30 text-dark-300 border-dark-500/30' },
}

const priorityConfig = {
  low:    { label: 'נמוכה',   className: 'bg-dark-600/50 text-dark-300 border-dark-500/30' },
  medium: { label: 'בינונית', className: 'bg-info/10 text-info border-info/30' },
  high:   { label: 'גבוהה',   className: 'bg-danger/10 text-danger border-danger/30' },
}

const roleConfig = {
  teacher: { label: 'מורה',  className: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  agent:   { label: 'סוכן',  className: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  admin:   { label: 'מנהל',  className: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
}

export function StatusBadge({ status, className = '' }) {
  const config = statusConfig[status] || statusConfig.pending
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${config.className} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {config.label}
    </span>
  )
}

export function PriorityBadge({ priority, className = '' }) {
  const config = priorityConfig[priority] || priorityConfig.medium
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${config.className} ${className}`}>
      {config.label}
    </span>
  )
}

export function RoleBadge({ role, className = '' }) {
  const config = roleConfig[role] || roleConfig.teacher
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${config.className} ${className}`}>
      {config.label}
    </span>
  )
}

export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-dark-700 text-dark-200 border-dark-500',
    accent: 'bg-accent/10 text-accent-light border-accent/30',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
