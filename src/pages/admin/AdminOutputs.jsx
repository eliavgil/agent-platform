import { useState, useEffect, useRef } from 'react'
import {
  getOutputs, createOutput, updateOutput, deleteOutput, uploadFile,
} from '../../lib/supabase'
import { TOOL_LOGOS } from '../../pages/OutputsPage'
import {
  Plus, Pencil, Trash2, ExternalLink, X, Upload, Search as SearchIcon,
  Image as ImageIcon, Globe, Loader2,
} from 'lucide-react'

// ── logo helpers ────────────────────────────────────────────────────────────
function guessLogoFromTool(toolName = '') {
  if (!toolName) return ''
  const key = Object.keys(TOOL_LOGOS).find(k =>
    toolName.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(toolName.toLowerCase())
  )
  return key ? TOOL_LOGOS[key] : ''
}

async function fetchClearbitLogo(domain) {
  if (!domain) return ''
  const clean = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  const url = `https://logo.clearbit.com/${clean}`
  try {
    const res = await fetch(url)
    if (res.ok) return url
  } catch {}
  return ''
}

// ── empty form state ─────────────────────────────────────────────────────────
const EMPTY = {
  name: '', subject: '', topic: '', grade: '', ai_tool: '', agent: '',
  short_desc: '', full_desc: '', review: '', reviewer_name: '',
  link: '', category: '', logo_url: '', logo_emoji: '',
}

// ── AddEditModal ─────────────────────────────────────────────────────────────
function AddEditModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ?? EMPTY)
  const [logoMode, setLogoMode] = useState('auto') // 'auto' | 'clearbit' | 'upload'
  const [clearbitDomain, setClearbitDomain] = useState('')
  const [clearbitLoading, setClearbitLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  // When AI tool name changes, auto-detect logo
  const handleToolChange = (val) => {
    set('ai_tool', val)
    if (logoMode === 'auto') {
      const guessed = guessLogoFromTool(val)
      set('logo_url', guessed)
    }
  }

  const handleClearbit = async () => {
    if (!clearbitDomain) return
    setClearbitLoading(true)
    const url = await fetchClearbitLogo(clearbitDomain)
    setClearbitLoading(false)
    if (url) set('logo_url', url)
    else setError('Logo not found for that domain')
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadLoading(true)
    try {
      const path = `logos/${Date.now()}_${file.name}`
      const { url } = await uploadFile('output-logos', file, path)
      set('logo_url', url)
    } catch (err) {
      setError('Upload failed: ' + err.message)
    }
    setUploadLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('שם התוצר חובה'); return }
    setSaving(true)
    setError('')
    try {
      if (initial?.id) await updateOutput(initial.id, form)
      else await createOutput(form)
      onSave()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 rounded-xl text-sm outline-none border border-slate-200 focus:border-orange-400 transition-colors bg-white'
  const labelCls = 'block text-xs font-semibold text-slate-500 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-lg text-slate-800">
            {initial?.id ? 'עריכת תוצר' : 'הוספת תוצר חדש'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className={labelCls}>שם התוצר *</label>
            <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="למשל: מחולל שאלות היסטוריה" />
          </div>

          {/* Row: subject / topic / grade */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>מקצוע</label>
              <input className={inputCls} value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="היסטוריה" />
            </div>
            <div>
              <label className={labelCls}>נושא</label>
              <input className={inputCls} value={form.topic} onChange={e => set('topic', e.target.value)} placeholder="מלחמת העולם" />
            </div>
            <div>
              <label className={labelCls}>כיתה</label>
              <input className={inputCls} value={form.grade} onChange={e => set('grade', e.target.value)} placeholder="ט׳" />
            </div>
          </div>

          {/* Row: AI tool / agent / category */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>כלי AI</label>
              <input className={inputCls} value={form.ai_tool} onChange={e => handleToolChange(e.target.value)} placeholder="ChatGPT" />
            </div>
            <div>
              <label className={labelCls}>סוכן</label>
              <input className={inputCls} value={form.agent} onChange={e => set('agent', e.target.value)} placeholder="שם הסוכן" />
            </div>
            <div>
              <label className={labelCls}>קטגוריה</label>
              <input className={inputCls} value={form.category} onChange={e => set('category', e.target.value)} placeholder="מבחנים" />
            </div>
          </div>

          {/* Short desc */}
          <div>
            <label className={labelCls}>תיאור קצר</label>
            <textarea className={inputCls} rows={2} value={form.short_desc} onChange={e => set('short_desc', e.target.value)} placeholder="תיאור מקוצר שיופיע בכרטיסייה" />
          </div>

          {/* Full desc */}
          <div>
            <label className={labelCls}>תיאור מלא</label>
            <textarea className={inputCls} rows={3} value={form.full_desc} onChange={e => set('full_desc', e.target.value)} placeholder="תיאור מורחב שמופיע בהובר" />
          </div>

          {/* Review */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>חוות דעת מורה</label>
              <textarea className={inputCls} rows={2} value={form.review} onChange={e => set('review', e.target.value)} placeholder="ציטוט מהמורה..." />
            </div>
            <div>
              <label className={labelCls}>שם המורה</label>
              <input className={inputCls} value={form.reviewer_name} onChange={e => set('reviewer_name', e.target.value)} placeholder="ד״ר כהן" />
            </div>
          </div>

          {/* Link */}
          <div>
            <label className={labelCls}>קישור לתוצר</label>
            <input className={inputCls} type="url" value={form.link} onChange={e => set('link', e.target.value)} placeholder="https://..." />
          </div>

          {/* ── Logo section ───────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <p className="text-xs font-bold text-slate-600">לוגו</p>

            {/* Mode tabs */}
            <div className="flex gap-2">
              {[
                { key: 'auto', label: 'אוטומטי', icon: <SearchIcon size={13} /> },
                { key: 'clearbit', label: 'לפי דומיין', icon: <Globe size={13} /> },
                { key: 'upload', label: 'העלאת קובץ', icon: <Upload size={13} /> },
              ].map(({ key, label, icon }) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setLogoMode(key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={logoMode === key
                    ? { background: '#f97316', color: '#fff' }
                    : { background: '#f1f5f9', color: '#475569' }}
                >
                  {icon}{label}
                </button>
              ))}
            </div>

            {/* Auto mode info */}
            {logoMode === 'auto' && (
              <p className="text-xs text-slate-400">
                הלוגו יזוהה אוטומטית מתוך שם כלי ה-AI שהזנת למעלה.
                {form.logo_url ? ' נמצא לוגו ✓' : ' הזן שם כלי כדי לזהות לוגו.'}
              </p>
            )}

            {/* Clearbit mode */}
            {logoMode === 'clearbit' && (
              <div className="flex gap-2">
                <input
                  className={inputCls + ' flex-1'}
                  placeholder="openai.com"
                  value={clearbitDomain}
                  onChange={e => setClearbitDomain(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleClearbit}
                  disabled={clearbitLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}
                >
                  {clearbitLoading ? <Loader2 size={13} className="animate-spin" /> : <SearchIcon size={13} />}
                  חפש
                </button>
              </div>
            )}

            {/* Upload mode */}
            {logoMode === 'upload' && (
              <div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border border-dashed border-slate-300 hover:border-orange-400 transition-colors"
                  style={{ color: '#475569' }}
                >
                  {uploadLoading
                    ? <Loader2 size={13} className="animate-spin" />
                    : <ImageIcon size={13} />}
                  {uploadLoading ? 'מעלה...' : 'בחר תמונה'}
                </button>
              </div>
            )}

            {/* Logo preview + manual URL override */}
            <div className="flex items-center gap-3">
              <div
                className="w-16 h-16 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 flex-shrink-0"
              >
                {form.logo_url
                  ? <img src={form.logo_url} alt="preview" className="max-w-full max-h-full object-contain p-1" onError={() => set('logo_url', '')} />
                  : <ImageIcon size={22} className="text-slate-300" />}
              </div>
              <div className="flex-1 space-y-1">
                <label className={labelCls}>URL לוגו (אפשר להדביק ישירות)</label>
                <input
                  className={inputCls}
                  placeholder="https://..."
                  value={form.logo_url}
                  onChange={e => set('logo_url', e.target.value)}
                />
              </div>
            </div>

            {/* Emoji fallback */}
            <div>
              <label className={labelCls}>אמוגי חלופי (אם אין לוגו)</label>
              <input className={inputCls + ' w-20'} value={form.logo_emoji} onChange={e => set('logo_emoji', e.target.value)} placeholder="🤖" />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : null}
              {initial?.id ? 'שמור שינויים' : 'הוסף תוצר'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AdminOutputs() {
  const [outputs, setOutputs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | { mode: 'add' } | { mode: 'edit', output }
  const [deleting, setDeleting] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data } = await getOutputs()
    setOutputs(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = outputs.filter(o => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      o.name?.toLowerCase().includes(q) ||
      o.subject?.toLowerCase().includes(q) ||
      o.ai_tool?.toLowerCase().includes(q) ||
      o.category?.toLowerCase().includes(q)
    )
  })

  const handleDelete = async (id) => {
    if (!window.confirm('למחוק את התוצר?')) return
    setDeleting(id)
    await deleteOutput(id)
    setDeleting(null)
    load()
  }

  const handleSaved = () => {
    setModal(null)
    load()
  }

  return (
    <div dir="rtl" className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">ניהול תוצרים</h1>
          <p className="text-sm text-slate-500 mt-0.5">{outputs.length} תוצרים בגלריה</p>
        </div>
        <button
          onClick={() => setModal({ mode: 'add' })}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}
        >
          <Plus size={16} />
          הוסף תוצר
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <SearchIcon size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חפש תוצר..."
          className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm border border-slate-200 outline-none focus:border-orange-400 transition-colors bg-white"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-orange-400" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100" style={{ background: '#f8fafc' }}>
                <th className="text-right py-3 px-4 font-semibold text-slate-500 text-xs">לוגו</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-500 text-xs">שם</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-500 text-xs">מקצוע</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-500 text-xs">כלי AI</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-500 text-xs">קטגוריה</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-500 text-xs">קישור</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400 text-sm">אין תוצרים</td>
                </tr>
              ) : filtered.map(o => (
                <tr key={o.id} className="border-b border-slate-50 hover:bg-orange-50/40 transition-colors">
                  <td className="py-3 px-4">
                    {o.logo_url
                      ? <img src={o.logo_url} alt="" className="w-8 h-8 object-contain rounded-lg border border-slate-100 bg-white p-0.5" />
                      : <span className="text-xl">{o.logo_emoji || '🤖'}</span>}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 max-w-[180px] truncate">{o.name}</td>
                  <td className="py-3 px-4 text-slate-500">{o.subject || '—'}</td>
                  <td className="py-3 px-4 text-slate-500">{o.ai_tool || '—'}</td>
                  <td className="py-3 px-4">
                    {o.category
                      ? <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>{o.category}</span>
                      : '—'}
                  </td>
                  <td className="py-3 px-4">
                    {o.link
                      ? <a href={o.link} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600 transition-colors">
                          <ExternalLink size={14} />
                        </a>
                      : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setModal({ mode: 'edit', output: o })}
                        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(o.id)}
                        disabled={deleting === o.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-400"
                      >
                        {deleting === o.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <AddEditModal
          initial={modal.mode === 'edit' ? modal.output : null}
          onSave={handleSaved}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
