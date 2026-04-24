import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import { LogOut, Shield, Globe, ExternalLink, Home, X } from 'lucide-react'

export default function Sidebar({ navItems, role, mobileOpen = false, onClose }) {
  const { profile, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleNavClick = () => {
    if (onClose) onClose()
  }

  const roleLabels = {
    teacher: 'מורה',
    agent: 'סוכן AI',
    admin: 'מנהל מערכת',
  }

  const roleColors = {
    teacher: 'text-blue-500',
    agent: 'text-purple-500',
    admin: 'text-amber-500',
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        w-64 h-screen bg-white border-l border-gray-200 flex flex-col
        fixed right-0 top-0 z-40
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}
        md:translate-x-0
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm font-bold text-gray-900">פלטפורמת AI</h1>
              <p className={`text-xs font-medium ${roleColors[role]}`}>{roleLabels[role]}</p>
            </div>
            <div className="flex items-center gap-1">
              {/* Close button — mobile only */}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden"
                aria-label="סגור תפריט"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {isAdmin && (
            <div className="mb-3">
              <button
                onClick={() => { navigate('/admin'); handleNavClick() }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                  bg-amber-50 border border-amber-200 text-amber-600
                  hover:bg-amber-100 hover:border-amber-300 transition-all duration-150"
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
                  onClick={handleNavClick}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-150
                    ${isActive
                      ? 'bg-accent/10 text-accent border border-accent/20'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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

          <div className="mt-3 pt-3 border-t border-gray-200">
            <Link
              to="/"
              onClick={handleNavClick}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-150"
            >
              <Home size={16} className="flex-shrink-0" />
              <span>חזרה לעמוד הבית</span>
            </Link>
          </div>

          {role === 'agent' && (
            <div className="mt-1">
              <a
                href="https://ai-leaderboard-tan.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleNavClick}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-150"
              >
                <Globe size={16} className="flex-shrink-0" />
                <span>אתר הנבחרת</span>
                <ExternalLink size={12} className="mr-auto text-gray-400" />
              </a>
            </div>
          )}
        </nav>

        {/* User Profile */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <Avatar name={profile?.full_name || ''} avatarUrl={profile?.avatar_url} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.full_name || 'משתמש'}
              </p>
              <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-gray-500 hover:text-danger"
            icon={<LogOut size={15} />}
            onClick={signOut}
          >
            יציאה
          </Button>
        </div>
      </aside>
    </>
  )
}
