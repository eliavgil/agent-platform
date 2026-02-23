import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import { LogOut, Bot, Shield } from 'lucide-react'

export default function Sidebar({ navItems, role }) {
  const { profile, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()

  const roleLabels = {
    teacher: 'מורה',
    agent: 'סוכן AI',
    admin: 'מנהל מערכת',
  }

  const roleColors = {
    teacher: 'text-blue-400',
    agent: 'text-purple-400',
    admin: 'text-amber-400',
  }

  return (
    <aside className="w-64 h-screen bg-dark-900 border-l border-dark-700/50 flex flex-col fixed right-0 top-0 z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-dark-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center shadow-lg shadow-accent/20">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">פלטפורמת AI</h1>
            <p className={`text-xs font-medium ${roleColors[role]}`}>{roleLabels[role]}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {isAdmin && (
          <div className="mb-3">
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                bg-amber-500/15 border border-amber-500/30 text-amber-400
                hover:bg-amber-500/25 hover:border-amber-500/50 transition-all duration-150"
            >
              <Shield size={16} className="flex-shrink-0" />
              <span>ניהול</span>
            </button>
          </div>
        )}
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.end}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150
                  ${isActive
                    ? 'bg-accent/15 text-accent-light border border-accent/20'
                    : 'text-dark-300 hover:bg-dark-800 hover:text-gray-200'
                  }
                `}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && (
                  <span className="mr-auto bg-accent text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-dark-700/50">
        <div className="flex items-center gap-3 mb-3">
          <Avatar name={profile?.full_name || ''} avatarUrl={profile?.avatar_url} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">
              {profile?.full_name || 'משתמש'}
            </p>
            <p className="text-xs text-dark-400 truncate">{profile?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-dark-400 hover:text-danger"
          icon={<LogOut size={15} />}
          onClick={signOut}
        >
          יציאה
        </Button>
      </div>
    </aside>
  )
}
