import { useState, useEffect, useRef } from 'react'
import { supabase, getSurveyResponses, updateProfile } from '../../lib/supabase'
import Header from '../../components/layout/Header'
import Avatar from '../../components/ui/Avatar'
import { Search, Check, ChevronDown, ChevronUp, ClipboardList, Camera, Loader2, Save } from 'lucide-react'

const ROLES = ['teacher', 'agent', 'admin']
const ROLE_LABELS = { teacher: 'מורה', agent: 'סוכן', admin: 'מנהל' }
const ROLE_STYLE = {
  teacher: { background: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
  agent:   { background: 'rgba(249,115,22,0.1)',  color: '#f97316' },
  admin:   { background: 'rgba(16,185,129,0.1)',  color: '#10b981' },
}

const TOOLS_MATRIX_KEYS = [
  'כלי שמייצר ובודק מבחנים ומחזיר ציון ומשוב (כולל שאלות פתוחות)',
  'כלי שמייצר עזרים ללמידה עצמאית כגון סיכום החומר, פודקסט, כרטיסיות למידה, שאלות לבחינה עצמית ועוד',
  'כלי שמייצר מצגות מרהיבות על בסיס החומר הלימודי',
  'כלי שבונה מערכי שיעור בהתאמה אישית',
  'כלי שמייצר שירים/תמונות בהתאמה אישית',
]
const MATRIX_RATINGS = ['כלל לא', 'מעט', 'רלוונטי', 'מאד רלוונטי']

function SurveyPanel({ survey }) {
  if (!survey) return (
    <p className="text-xs text-gray-400 italic">לא מילא/ה סקר עדיין</p>
  )
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
      <Field label="מקצועות" value={survey.subjects} />
      <Field label="שנות ותק" value={survey.seniority} />
      <Field label="תפקידים נוספים" value={survey.roles} />
      <Field label="תדירות שימוש AI" value={survey.ai_frequency} />
      <Field label="רצון לשלב AI" value={survey.ai_desire ? `${survey.ai_desire} / 5` : null} />
      <Field label="חסם עיקרי" value={survey.main_obstacle} />
      <Field label="נכונות לשיתוף פעולה" value={survey.collaboration ? `${survey.collaboration} / 5` : null} />
      {survey.comments && <Field label="הערות" value={survey.comments} className="sm:col-span-2" />}

      {/* Tools matrix */}
      {survey.tools_matrix && typeof survey.tools_matrix === 'object' && (
        <div className="sm:col-span-2 mt-1">
          <p className="text-xs font-semibold text-gray-500 mb-2">רלוונטיות כלים</p>
          <div className="flex flex-col gap-1.5">
            {TOOLS_MATRIX_KEYS.map(tool => {
              const ri = survey.tools_matrix[tool] ?? null
              const label = ri !== null ? MATRIX_RATINGS[ri] : '—'
              return (
                <div key={tool} className="flex justify-between items-start gap-4 text-xs">
                  <span className="text-gray-600 leading-snug flex-1">{tool}</span>
                  <span className="font-semibold text-indigo-600 whitespace-nowrap">{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, className = '' }) {
  if (!value) return null
  return (
    <div className={className}>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  )
}

function AgentEditPanel({ user, onUpdated }) {
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '')
  const [bio, setBio]             = useState(user.bio || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState('')
  const fileRef = useRef()

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const ext = file.name.split('.').pop().toLowerCase()
      const path = `${user.id}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, cacheControl: '3600' })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(publicUrl)
    } catch (err) {
      console.error('avatar upload error:', err)
      setError(err?.message || JSON.stringify(err) || 'שגיאה בהעלאת התמונה.')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const { error: err } = await updateProfile(user.id, { avatar_url: avatarUrl, bio })
      if (err) throw err
      onUpdated(user.id, { avatar_url: avatarUrl, bio })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('שגיאה בשמירה.')
    } finally {
      setSaving(false)
    }
  }

  const initials = user.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2) || '?'

  return (
    <div dir="rtl">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">עריכת פרופיל סוכן</p>

      {/* Avatar upload */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className="relative w-20 h-20 rounded-full cursor-pointer group flex-shrink-0"
          onClick={() => fileRef.current?.click()}
          style={{ border: '3px solid #e2e8f0', background: '#f8fafc' }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <div className="w-full h-full rounded-full flex items-center justify-center text-2xl font-black"
                 style={{ color: '#f97316' }}>{initials}</div>
          )}
          <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
               style={{ background: 'rgba(0,0,0,0.4)' }}>
            {uploading
              ? <Loader2 size={18} className="text-white animate-spin" />
              : <Camera size={18} className="text-white" />}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
        <div>
          <p className="text-sm font-semibold text-gray-700">{user.full_name}</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs mt-1 underline underline-offset-2"
            style={{ color: '#f97316' }}
          >
            {uploading ? 'מעלה...' : 'החלף תמונה'}
          </button>
        </div>
      </div>

      {/* Bio */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-500 mb-1">ביו / תיאור הסוכן</label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={3}
          maxLength={400}
          placeholder="תיאור קצר של הסוכן, תחומי התמחות..."
          className="w-full px-3 py-2 rounded-xl text-sm resize-none focus:outline-none border border-gray-200 focus:border-orange-400 transition-colors"
        />
      </div>

      {error && (
        <p className="text-xs text-red-500 mb-3">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || uploading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
        style={{ background: saved ? '#10b981' : '#f97316' }}
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {saved ? '✓ נשמר' : 'שמור'}
      </button>
    </div>
  )
}

export default function AdminUsers() {
  const [users, setUsers]       = useState([])
  const [surveys, setSurveys]   = useState({}) // { user_id: survey }
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [saving, setSaving]     = useState({})
  const [saved, setSaved]       = useState({})
  const [expanded, setExpanded] = useState({}) // { user_id: bool }

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    const [{ data: profiles }, { data: surveyRows }] = await Promise.all([
      supabase.from('profiles').select('*').order('full_name'),
      getSurveyResponses(),
    ])
    setUsers(profiles || [])
    const map = {}
    for (const s of (surveyRows || [])) {
      if (s.user_id && !map[s.user_id]) map[s.user_id] = s
    }
    setSurveys(map)
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

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  const handleAgentUpdated = (userId, patch) => {
    setUsers(u => u.map(p => p.id === userId ? { ...p, ...patch } : p))
  }

  const filtered = users.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  })

  return (
    <>
      <Header title="ניהול משתמשים" subtitle="פרופילים, תפקידים ותשובות סקר" />

      <div className="relative max-w-sm mb-6">
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חפש לפי שם או מייל..."
          className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm outline-none border border-gray-200 bg-white focus:border-orange-400 transition-colors"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">טוען...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">לא נמצאו משתמשים</div>
        ) : (
          <div className="divide-y divide-gray-100" dir="rtl">
            {filtered.map(user => {
              const isOpen = !!expanded[user.id]
              const survey = surveys[user.id]
              const isTeacher = user.role === 'teacher'

              return (
                <div key={user.id}>
                  {/* Main row */}
                  <div className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">

                    {/* Avatar + name */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <Avatar name={user.full_name} size="sm" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{user.full_name || '—'}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email || '—'}</p>
                      </div>
                    </div>

                    {/* Survey badge */}
                    {isTeacher && (
                      <span className={`hidden sm:flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        survey
                          ? 'bg-green-50 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <ClipboardList size={11} />
                        {survey ? 'מילא סקר' : 'לא מילא'}
                      </span>
                    )}

                    {/* Role selector */}
                    <div className="flex gap-1.5 flex-wrap">
                      {ROLES.map(role => {
                        const isActive = user.role === role
                        return (
                          <button key={role}
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

                    {/* Saved / expand */}
                    <div className="w-6 flex-shrink-0">
                      {saved[user.id] ? (
                        <Check size={16} className="text-green-500" />
                      ) : (
                        <button onClick={() => toggle(user.id)}
                          className="text-gray-300 hover:text-gray-500 transition-colors">
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isOpen && (
                    <div className="px-6 pb-5 pt-3 bg-gray-50 border-t border-gray-100">
                      {user.role === 'agent' && (
                        <AgentEditPanel user={user} onUpdated={handleAgentUpdated} />
                      )}
                      {isTeacher && (
                        <>
                          {user.bio && (
                            <div className="mb-4">
                              <p className="text-xs text-gray-400 mb-1">ביו</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{user.bio}</p>
                            </div>
                          )}
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            תשובות סקר
                          </p>
                          <SurveyPanel survey={survey} />
                        </>
                      )}
                      {!isTeacher && !user.bio && (
                        <p className="text-xs text-gray-400 italic">אין מידע נוסף</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">{filtered.length} משתמשים</p>
    </>
  )
}
