import { useState, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import { LogOut, Shield, Globe, ExternalLink, Bell, Home } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function Sidebar({ navItems, role }) {
  const { profile, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!profile?.id) return
    const lastSeen = localStorage.getItem(`lastSeenMessages_${profile.id}`) || '2020-01-01T00:00:00Z'
    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .neq('sender_id', profile.id)
      .gt('created_at', lastSeen)
      .then(({ count }) => setUnreadCount(count || 0))
  }, [profile?.id])

  const handleBellClick = () => {
    if (profile?.id) {
      localStorage.setItem(`lastSeenMessages_${profile.id}`, new Date().toISOString())
      setUnreadCount(0)
    }
    const requestsItem = navItems.find(item =>
      item.label?.includes('בקשות') || item.label?.includes('הודעות')
    )
    navigate(requestsItem?.path || (role === 'admin' ? '/admin' : role === 'agent' ? '/agent' : '/teacher'))
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-white">פלטפורמת AI</h1>
            <p className={`text-xs font-medium ${roleColors[role]}`}>{roleLabels[role]}</p>
          </div>
          <button
            onClick={handleBellClick}
            className="relative p-2 rounded-lg hover:bg-dark-800 transition-colors"
            title="הודעות"
          >
            <Bell size={18} className="text-dark-300" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white font-bold"
                style={{ fontSize: '9px' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
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

        <div className="mt-3 pt-3 border-t border-dark-700/50">
          <Link
            to="/"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              text-dark-300 hover:bg-dark-800 hover:text-gray-200 transition-all duration-150"
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
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                text-dark-300 hover:bg-dark-800 hover:text-gray-200 transition-all duration-150"
            >
              <Globe size={16} className="flex-shrink-0" />
              <span>אתר הנבחרת</span>
              <ExternalLink size={12} className="mr-auto text-dark-500" />
            </a>
          </div>
        )}
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
