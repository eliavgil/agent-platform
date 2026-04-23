import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { updateProfile, supabase } from '../../lib/supabase'
import { Camera, Save, Loader2, User } from 'lucide-react'

export default function AgentProfile() {
  const { profile, refreshProfile } = useAuth()
  const [bio, setBio] = useState(profile?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
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
      setError('שגיאה בהעלאת התמונה. ודא שה-bucket "avatars" קיים ב-Supabase.')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (bio.length > 400) { setError('הביוגרפיה ארוכה מדי (מקסימום 400 תווים)'); return }
    setSaving(true)
    setError('')
    try {
      const { error: err } = await updateProfile(profile.id, { bio, avatar_url: avatarUrl })
      if (err) throw err
      refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError('שגיאה בשמירה. ודא שעמודת bio קיימת בטבלת profiles.')
    } finally {
      setSaving(false)
    }
  }

  const initials = profile?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2) || '?'

  return (
    <div className="max-w-lg mx-auto py-10 px-4" dir="rtl">
      <h1 className="text-2xl font-black mb-1" style={{ color: '#0f172a' }}>הפרופיל שלי</h1>
      <p className="text-sm mb-8" style={{ color: '#64748b' }}>
        הפרטים שתמלא יופיעו לצופים בעמוד הבית
      </p>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div
          className="relative w-28 h-28 rounded-full cursor-pointer group"
          onClick={() => fileRef.current?.click()}
          style={{ border: '3px solid #e2e8f0', background: '#f8fafc' }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={profile?.full_name}
              className="w-full h-full rounded-full object-cover"
            />
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
      <div className="mb-5">
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>
          שם מלא
        </label>
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm"
             style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}>
          <User size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
          {profile?.full_name}
        </div>
        <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
          השם מוגדר על ידי המנהל ולא ניתן לשינוי
        </p>
      </div>

      {/* Bio */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>
          כמה מילים עליך
        </label>
        <p className="text-xs mb-2" style={{ color: '#94a3b8' }}>
          תאר את עצמך ואת היכולות שלך כסוכן — מה אתה יודע לעשות, באילו כלים אתה מתמחה
        </p>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          maxLength={400}
          rows={5}
          placeholder={'לדוגמה: תלמיד כיתה יא\' המתמחה ב-ChatGPT ו-Gemini.\nיכול לבנות מבחנים חכמים, מצגות אינטראקטיביות ולהתאים חומר לימודי לכל גיל.\nניסיון בעבודה עם מורים בתחומי תנ"ך, היסטוריה ומדעים.'}
          className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none transition-colors"
          style={{
            border: '1px solid #e2e8f0',
            background: '#fff',
            color: '#0f172a',
            lineHeight: '1.7',
          }}
          onFocus={e => e.target.style.borderColor = '#6366f1'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
        <p className="text-xs mt-1 text-left" style={{ color: bio.length > 350 ? '#f59e0b' : '#94a3b8' }}>
          {bio.length} / 400
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm"
             style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || uploading}
        className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all"
        style={{
          background: saved ? '#10b981' : '#6366f1',
          opacity: (saving || uploading) ? 0.7 : 1,
        }}
      >
        {saving
          ? <Loader2 size={16} className="animate-spin" />
          : <Save size={16} />}
        {saved ? '✓ נשמר בהצלחה' : 'שמור שינויים'}
      </button>
    </div>
  )
}
