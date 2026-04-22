import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Header from '../../components/layout/Header'
import Avatar from '../../components/ui/Avatar'
import { Search, Check } from 'lucide-react'

const ROLES = ['teacher', 'agent', 'admin']

const ROLE_LABELS = {
  teacher: 'מורה',
  agent:   'סוכן',
  admin:   'מנהל',
}

const ROLE_STYLE = {
  teacher: { background: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
  agent:   { background: 'rgba(249,115,22,0.1)',  color: '#f97316' },
  admin:   { background: 'rgba(16,185,129,0.1)',  color: '#10b981' },
}

export default function AdminUsers() {
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [saving, setSaving]     = useState({}) // { [id]: true }
  const [saved, setSaved]       = useState({}) // { [id]: true } — brief green flash

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')
    setUsers(data || [])
    setLoading(false)
  }

  const changeRole = async (userId, newRole) => {
    setSaving(s => ({ ...s, [userId]: true }))
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    setUsers(u => u.map(p => p.id === userId ? { ...p, role: newRole } : p))
    setSaving(s => ({ ...s, [userId]: false }))
    setSaved(s => ({ ...s, [userId]: true }))
    setTimeout(() => setSaved(s => ({ ...s, [userId]: false })), 1500)
  }

  const filtered = users.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    )
  })

  return (
    <>
      <Header
        title="ניהול משתמשים"
        subtitle="שנה תפקידים — מורה, סוכן, מנהל"
      />

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חפש לפי שם או מייל..."
          className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm outline-none border border-gray-200 bg-white focus:border-orange-400 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">טוען...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">לא נמצאו משתמשים</div>
        ) : (
          <table className="w-full" dir="rtl">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="text-right px-5 py-3">משתמש</th>
                <th className="text-right px-5 py-3 hidden sm:table-cell">מייל</th>
                <th className="text-right px-5 py-3">תפקיד</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  {/* Name */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.full_name} size="sm" />
                      <span className="text-sm font-semibold text-gray-800">{user.full_name || '—'}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <span className="text-xs text-gray-400">{user.email || '—'}</span>
                  </td>

                  {/* Role selector */}
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {ROLES.map(role => {
                        const isActive = user.role === role
                        return (
                          <button
                            key={role}
                            onClick={() => !isActive && changeRole(user.id, role)}
                            disabled={saving[user.id]}
                            className="px-3 py-1 rounded-full text-xs font-semibold border transition-all"
                            style={isActive
                              ? { ...ROLE_STYLE[role], borderColor: 'transparent' }
                              : { background: '#f8fafc', color: '#94a3b8', borderColor: '#e2e8f0' }
                            }
                          >
                            {ROLE_LABELS[role]}
                          </button>
                        )
                      })}
                    </div>
                  </td>

                  {/* Saved indicator */}
                  <td className="px-4 py-3 w-8">
                    {saved[user.id] && (
                      <Check size={16} className="text-green-500" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        {filtered.length} משתמשים
      </p>
    </>
  )
}
