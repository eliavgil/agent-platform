import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { updateProfile, supabase } from '../../lib/supabase'
import { Camera, Save, Loader2, User } from 'lucide-react'

export default function TeacherProfile() {
  const { profile, refreshProfile } = useAuth()

  const [avatarUrl, setAvatarUrl]       = useState(profile?.avatar_url    || '')
  const [subjects, setSubjects]         = useState(profile?.subjects       || '')
  const [schoolRoles, setSchoolRoles]   = useState(profile?.school_roles   || '')
  const [preferredTools, setPreferredTools] = useState(profile?.preferred_tools || '')
  const [phone, setPhone]               = useState(profile?.phone          || '')
  const [uploading, setUploading]       = useState(false)
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [error, setError]               = useState('')
  const fileRef = useRef()

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const ext = file.name.split('.').pop().toLowerCase()
      const path = `${profile.id}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, cacheControl: '3600' })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(publicUrl)
    } catch {
      setError('שגיאה בהעלאת התמונה.')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const { error: err } = await updateProfile(profile.id, {
        avatar_url: avatarUrl,
        subjects,
        school_roles: schoolRoles,
        preferred_tools: preferredTools,
        phone,
      })
      if (err) throw err
      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError('שגיאה בשמירה.')
    } finally {
      setSaving(false)
    }
  }

  const initials = profile?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2) || '?'

  return (
    <div className="max-w-lg mx-auto py-10 px-4" dir="rtl">
      <h1 className="text-2xl font-black mb-1" style={{ color: '#0f172a' }}>הפרופיל שלי</h1>
      <p className="text-sm mb-8" style={{ color: '#64748b' }}>
        הפרטים שתמלא יעזרו לסוכן להכיר אותך ולהתאים את התוצרים לצרכיך
      </p>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div
          className="relative w-28 h-28 rounded-full cursor-pointer group"
          onClick={() => fileRef.current?.click()}
          style={{ border: '3px solid #e2e8f0', background: '#f8fafc' }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={profile?.full_name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <div className="w-full h-full rounded-full flex items-center justify-center text-3xl font-black"
                 style={{ color: '#6366f1' }}>
              {initials}
            </div>
          )}
          <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
               style={{ background: 'rgba(0,0,0,0.4)' }}>
            {uploading
              ? <Loader2 size={24} className="text-white animate-spin" />
              : <Camera size={24} className="text-white" />}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        <p className="text-xs mt-2" style={{ color: '#94a3b8' }}>
          {uploading ? 'מעלה...' : 'לחץ לשינוי תמונה'}
        </p>
      </div>

      {/* Name (read-only) */}
      <Field label="שם מלא" note="השם מוגדר על ידי המנהל ולא ניתן לשינוי">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm"
             style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}>
          <User size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
          {profile?.full_name}
        </div>
      </Field>

      {/* Subjects */}
      <Field label="מקצועות לימוד" note='לדוגמה: מתמטיקה, אנגלית, תנ"ך'>
        <TextInput value={subjects} onChange={setSubjects} placeholder='מתמטיקה, אנגלית...' />
      </Field>

      {/* School roles */}
      <Field label="תפקידים בבית הספר" note="לדוגמה: מחנך, רכז שכבה, מנהל מקצוע">
        <TextInput value={schoolRoles} onChange={setSchoolRoles} placeholder="מחנך/ת, רכז/ת..." />
      </Field>

      {/* Preferred tools */}
      <Field label="כלי AI מועדפים" note="כלים שאתה משתמש בהם או מעוניין לשלב">
        <TextInput value={preferredTools} onChange={setPreferredTools} placeholder="ChatGPT, Gemini, NotebookLM..." />
      </Field>

      {/* Phone */}
      <Field label="טלפון ליצירת קשר">
        <TextInput value={phone} onChange={setPhone} placeholder="050-0000000" type="tel" />
      </Field>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm"
             style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || uploading}
        className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all mt-2"
        style={{
          background: saved ? '#10b981' : '#6366f1',
          opacity: (saving || uploading) ? 0.7 : 1,
        }}
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saved ? '✓ נשמר בהצלחה' : 'שמור שינויים'}
      </button>
    </div>
  )
}

function Field({ label, note, children }) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>{label}</label>
      {note && <p className="text-xs mb-2" style={{ color: '#94a3b8' }}>{note}</p>}
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-colors"
      style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a' }}
      onFocus={e => e.target.style.borderColor = '#6366f1'}
      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
    />
  )
}
