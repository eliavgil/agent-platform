import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getOutputs as getOutputsFromSheets, getToolEmoji } from '../lib/googleSheets'
import { getOutputs as getOutputsFromSupabase } from '../lib/supabase'
import { Bot, ExternalLink, Search, Quote, ChevronDown, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// ── Spread outputs — always pick the most-frequent tool that differs from last ─
function spreadByTool(arr) {
  if (arr.length === 0) return []
  const groups = {}
  for (const o of arr) {
    const key = o.aiTool || o.ai_tool || '—'
    if (!groups[key]) groups[key] = []
    groups[key].push(o)
  }
  const result = []
  let lastTool = null
  while (result.length < arr.length) {
    const candidates = Object.entries(groups)
      .filter(([k, v]) => k !== lastTool && v.length > 0)
      .sort((a, b) => b[1].length - a[1].length)
    const [key, items] = candidates.length > 0 ? candidates[0] : Object.entries(groups).find(([, v]) => v.length > 0)
    result.push(items.shift())
    lastTool = key
    if (items.length === 0) delete groups[key]
  }
  return result
}

// ── Filter constants ───────────────────────────────────────────────────────────
const CATEGORIES = [
  'מבחן / בוחן',
  'מבדק / משימה',
  'מצגת',
  'למידה עצמאית',
  'שיר',
  'מערך שיעור',
  'חינוך',
  'אחר',
]

const SUBJECTS = [
  'מתמטיקה', 'עברית', 'אנגלית', 'מדעים', 'היסטוריה', 'גיאוגרפיה',
  'אזרחות', 'ספרות', 'אמנות', 'מוזיקה', 'חינוך גופני', 'מחשבים', 'אחר',
]

const GRADES = ["ז׳", "ח׳", "ט׳", "י׳", "יא׳", "יב׳"]

const VIEW_OPTIONS = [
  { id: 'newest',   label: 'מהחדש לישן' },
  { id: 'ai_tool',  label: 'לפי כלי AI' },
  { id: 'reviewed', label: 'תוצרים שקיבלו ביקורת מורים' },
]

// ── Reusable dropdown ──────────────────────────────────────────────────────────
function FilterDropdown({ label, options, value, onChange, isViewMode = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isActive = value !== null

  // For view-mode the displayed label comes from options array
  const displayLabel = isViewMode
    ? (value ? options.find(o => o.id === value)?.label ?? label : label)
    : (value ?? label)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all whitespace-nowrap"
        style={isActive
          ? { background: '#f97316', color: '#fff', borderColor: '#f97316' }
          : { background: '#fff', color: '#475569', borderColor: '#e2e8f0' }
        }
      >
        {displayLabel}
        {isActive
          ? <X size={13} onClick={e => { e.stopPropagation(); onChange(null) }} className="hover:opacity-70" />
          : <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        }
      </button>

      {open && (
        <div
          className="absolute top-full mt-1.5 right-0 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1 overflow-hidden"
          style={{ minWidth: 180 }}
        >
          {isViewMode ? (
            options.map(opt => (
              <button
                key={opt.id}
                onClick={() => { onChange(opt.id === value ? null : opt.id); setOpen(false) }}
                className="w-full text-right px-4 py-2.5 text-sm transition-colors hover:bg-orange-50"
                style={value === opt.id ? { color: '#f97316', fontWeight: 600 } : { color: '#475569' }}
              >
                {opt.label}
              </button>
            ))
          ) : (
            options.map(opt => (
              <button
                key={opt}
                onClick={() => { onChange(opt === value ? null : opt); setOpen(false) }}
                className="w-full text-right px-4 py-2.5 text-sm transition-colors hover:bg-orange-50"
                style={value === opt ? { color: '#f97316', fontWeight: 600 } : { color: '#475569' }}
              >
                {opt}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

const CARD_HEIGHT = 280

// ── Logo map (same as TeacherToolLibrary) ─────────────────────────────────────
export const TOOL_LOGOS = {
  'Gemini':         'https://upload.wikimedia.org/wikipedia/commons/1/1d/Google_Gemini_icon_2025.svg',
  'NotebookLM':     'https://upload.wikimedia.org/wikipedia/commons/5/57/NotebookLM_logo.svg',
  'StudyWise':      'https://framerusercontent.com/images/4quFySEBAybfqylG0TqkmbAQA0.png',
  'ChatGPT':        'https://upload.wikimedia.org/wikipedia/commons/9/97/OpenAI_logo_2025.svg',
  'Claude':         'https://upload.wikimedia.org/wikipedia/commons/8/8a/Claude_AI_logo.svg',
  'DALL-E':         'https://upload.wikimedia.org/wikipedia/commons/9/97/OpenAI_logo_2025.svg',
  'Grammarly':      'https://upload.wikimedia.org/wikipedia/commons/d/d2/Grammarly_logo.svg',
  'Wolfram Alpha':  'https://upload.wikimedia.org/wikipedia/commons/e/e3/Wolfram_Alpha_2022.svg',
  'Khanmigo':       'https://upload.wikimedia.org/wikipedia/commons/f/f6/Khan_Academy_logo_%282018%29.svg',
  'Khan Academy':   'https://upload.wikimedia.org/wikipedia/commons/f/f6/Khan_Academy_logo_%282018%29.svg',
  'Canva':          'https://upload.wikimedia.org/wikipedia/en/b/bb/Canva_Logo.svg',
  'Slidesgo':       'https://slidesgo.com/images/logos/slidesgo.svg',
  'MagicSchool AI': 'https://cdn.prod.website-files.com/645187265d5e5e386be40629/6960237ddf1dfc1de13a396f_logo.png',
  'MagicSchool':    'https://cdn.prod.website-files.com/645187265d5e5e386be40629/6960237ddf1dfc1de13a396f_logo.png',
  'Diffit':         'https://images.squarespace-cdn.com/content/v1/6417f1e0a6e26c5d06b65171/661b2619-2192-4128-94ee-7f2f59bd6c62/Diffit+Logo.png',
  'Curipod':        'https://curipod.com/og_preview.png',
  'Google Slides':  'https://upload.wikimedia.org/wikipedia/commons/1/16/Google_Slides_2020_Logo.svg',
  'Google Docs':    'https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg',
  'Google Forms':   'https://upload.wikimedia.org/wikipedia/commons/5/5b/Google_Forms_2020_Logo.svg',
  'Perplexity':     'https://upload.wikimedia.org/wikipedia/commons/1/1d/Perplexity_AI_logo.svg',
  'Gamma':          'https://cdn.prod.website-files.com/6456c66fc6a0d27d7e0debfc/64d7a3b649ffb7abc28c0c7c_gamma-webclip.png',
  'Padlet':         'https://padlet.com/favicon.ico',
  'Kahoot':         'https://upload.wikimedia.org/wikipedia/commons/6/68/Kahoot_Logo.png',
  'Quizlet':        'https://upload.wikimedia.org/wikipedia/commons/8/8a/Quizlet_logo_%282022%29.svg',
  'Mentimeter':     'https://upload.wikimedia.org/wikipedia/commons/9/98/Mentimeter_Logo.svg',
}

function getLogoUrl(name = '') {
  if (TOOL_LOGOS[name]) return TOOL_LOGOS[name]
  const key = Object.keys(TOOL_LOGOS).find(k =>
    name.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(name.toLowerCase())
  )
  return key ? TOOL_LOGOS[key] : null
}

// Normalize Supabase snake_case row → camelCase shape the card expects
function normalizeOutput(row) {
  return {
    ...row,
    aiTool: row.ai_tool ?? row.aiTool,
    shortDesc: row.short_desc ?? row.shortDesc,
    fullDesc: row.full_desc ?? row.fullDesc,
    reviewerName: row.reviewer_name ?? row.reviewerName,
    logoUrl: row.logo_url ?? row.logoUrl,
    logoEmoji: row.logo_emoji ?? row.logoEmoji,
  }
}

// Priority: stored logo_url → logo map → emoji fallback
function resolveDisplay(output) {
  return {
    logoUrl: output.logoUrl || getLogoUrl(output.aiTool || '') || '',
    emoji: output.logoEmoji || getToolEmoji(output.aiTool) || '🤖',
  }
}

function OutputCard({ output }) {
  const [hovered, setHovered] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const hasExtra = output.fullDesc || output.review || output.link
  const { logoUrl, emoji } = resolveDisplay(output)

  return (
    <div
      className="relative"
      style={{ height: CARD_HEIGHT }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        dir="rtl"
        className="absolute left-0 right-0 top-0 rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: hovered ? '#fff7ed' : '#ffffff',
          border: `1px solid ${hovered ? 'rgba(249,115,22,0.35)' : '#e2e8f0'}`,
          boxShadow: hovered
            ? '0 8px 32px rgba(249,115,22,0.12), 0 2px 8px rgba(0,0,0,0.06)'
            : '0 1px 3px rgba(0,0,0,0.06)',
          zIndex: hovered ? 30 : 1,
          minHeight: CARD_HEIGHT,
        }}
      >
        {/* Logo / emoji banner */}
        <div
          className="relative h-20 flex items-center justify-center overflow-hidden"
          style={{
            background: hovered ? 'rgba(249,115,22,0.07)' : '#f8fafc',
            borderBottom: `1px solid ${hovered ? 'rgba(249,115,22,0.15)' : '#f1f5f9'}`,
          }}
        >
          {logoUrl && !imgFailed ? (
            <>
              {/* Blurred background — fills the space with the logo's colours */}
              <img
                src={logoUrl}
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover scale-150 blur-2xl opacity-30 pointer-events-none"
              />
              {/* Sharp logo on top */}
              <img
                src={logoUrl}
                alt={output.aiTool || 'logo'}
                className="relative max-h-16 max-w-[82%] object-contain drop-shadow-sm"
                onError={() => setImgFailed(true)}
              />
            </>
          ) : (
            <span className="text-4xl select-none leading-none">{emoji}</span>
          )}
        </div>

        {/* Content */}
        <div className="px-4 pt-3 pb-4">
          {output.category && (
            <span
              className="inline-block mb-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}
            >
              {output.category}
            </span>
          )}
          <h3 className="text-base font-bold leading-snug mb-1" style={{ color: '#0f172a' }}>
            {output.name}
          </h3>
          <p className="text-xs mb-2" style={{ color: '#94a3b8' }}>
            {[output.subject, output.topic, output.grade].filter(Boolean).join(' · ')}
          </p>
          {output.shortDesc && (
            <p
              className="text-xs leading-relaxed"
              style={{
                color: '#475569',
                display: '-webkit-box',
                WebkitLineClamp: hovered ? 'unset' : 2,
                WebkitBoxOrient: 'vertical',
                overflow: hovered ? 'visible' : 'hidden',
              }}
            >
              {output.shortDesc}
            </p>
          )}

          {/* Expanded on hover */}
          {hovered && hasExtra && (
            <div
              className="mt-3 pt-3 space-y-3"
              style={{ borderTop: '1px solid #f1f5f9' }}
            >
              {output.fullDesc && output.fullDesc !== output.shortDesc && (
                <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>
                  {output.fullDesc}
                </p>
              )}

              {output.review && (
                <div
                  className="rounded-xl p-3 space-y-1.5"
                  style={{
                    background: 'rgba(249,115,22,0.05)',
                    border: '1px solid rgba(249,115,22,0.15)',
                  }}
                >
                  <div className="flex items-start gap-1.5">
                    <Quote size={12} className="text-orange-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs italic leading-relaxed" style={{ color: '#64748b' }}>
                      {output.review}
                    </p>
                  </div>
                  {output.reviewerName && (
                    <p className="text-xs font-semibold text-orange-500 text-left">
                      — {output.reviewerName}
                    </p>
                  )}
                </div>
              )}

              {output.link && (
                <a
                  href={output.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff' }}
                >
                  פתח תוצר
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function OutputsPage() {
  const { user, profile } = useAuth()
  const [outputs, setOutputs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Filters
  const [filterCategory, setFilterCategory] = useState(null)
  const [filterSubject,  setFilterSubject]  = useState(null)
  const [filterGrade,    setFilterGrade]    = useState(null)
  const [viewMode,       setViewMode]       = useState(null) // newest | ai_tool | reviewed

  useEffect(() => {
    Promise.all([
      getOutputsFromSupabase(),
      getOutputsFromSheets(),
    ]).then(([{ data: supabaseData }, { data: sheetsData }]) => {
      const fromSupabase = (supabaseData || []).map(normalizeOutput)
      const fromSheets = sheetsData || []
      setOutputs([...fromSupabase, ...fromSheets])
      setLoading(false)
    })
  }, [])

  const filtered = outputs
    .filter(o => {
      if (filterCategory && o.category !== filterCategory) return false
      if (filterSubject  && o.subject  !== filterSubject)  return false
      if (filterGrade) {
        const grades = (o.grade || '').split(',').map(g => g.trim())
        if (!grades.some(g => g.includes(filterGrade.replace('׳', '')) || filterGrade.replace('׳', '').includes(g.replace('׳', '')))) return false
      }
      if (viewMode === 'reviewed' && !o.review) return false
      if (search) {
        const q = search.toLowerCase()
        if (!(
          o.name?.toLowerCase().includes(q) ||
          o.subject?.toLowerCase().includes(q) ||
          o.topic?.toLowerCase().includes(q) ||
          o.aiTool?.toLowerCase().includes(q) ||
          o.shortDesc?.toLowerCase().includes(q) ||
          o.description?.toLowerCase().includes(q)
        )) return false
      }
      return true
    })
    .sort((a, b) => {
      if (viewMode === 'ai_tool') return (a.aiTool || '').localeCompare(b.aiTool || '', 'he')
      if (viewMode === 'newest')  return new Date(b.created_at || 0) - new Date(a.created_at || 0)
      return 0 // keep original order for spread
    })

  const displayed = (viewMode === null || viewMode === undefined)
    ? spreadByTool(filtered)
    : filtered

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: '#f8fafc' }}>

      {/* Navbar — light theme */}
      <nav
        className="sticky top-0 z-40 border-b"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(16px)',
          borderColor: '#e2e8f0',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo3.png" alt="Prometheus" className="h-9 w-9 object-contain" />
            <span className="font-bold text-sm hidden sm:block" style={{ color: '#0f172a' }}>
              פרומפתאוס AI
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="text-sm px-3 py-2 rounded-lg transition-colors"
              style={{ color: '#475569' }}
              onMouseEnter={e => (e.target.style.color = '#0f172a')}
              onMouseLeave={e => (e.target.style.color = '#475569')}
            >
              דף הבית
            </Link>
            {user ? (
              <>
                <span
                  className="px-3 py-1.5 text-sm font-semibold rounded-xl"
                  style={{ background: 'rgba(99,102,241,0.10)', color: '#4338ca', border: '1px solid rgba(99,102,241,0.20)' }}
                >
                  {profile?.full_name?.split(' ')[0] || 'שלום'}
                </span>
                {profile?.role && (
                  <Link
                    to={profile.role === 'admin' ? '/admin' : profile.role === 'agent' ? '/agent' : '/teacher'}
                    className="px-3 py-1.5 text-sm font-semibold rounded-xl transition-colors"
                    style={{
                      background: profile.role === 'agent' ? 'rgba(168,85,247,0.12)' : 'rgba(99,102,241,0.10)',
                      color: profile.role === 'agent' ? '#a855f7' : profile.role === 'admin' ? '#d97706' : '#4338ca',
                      border: `1px solid ${profile.role === 'agent' ? 'rgba(168,85,247,0.30)' : profile.role === 'admin' ? 'rgba(245,158,11,0.30)' : 'rgba(99,102,241,0.20)'}`,
                    }}
                  >
                    {profile.role === 'admin' ? 'ניהול' : profile.role === 'agent' ? 'לאיזור הסוכן' : 'לאיזור המורה'}
                  </Link>
                )}
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold rounded-xl transition-all"
                style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff' }}
              >
                כניסה
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-8 text-center">
        <span
          className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
          style={{
            background: 'rgba(249,115,22,0.1)',
            color: '#ea580c',
            border: '1px solid rgba(249,115,22,0.2)',
          }}
        >
          גלריית תוצרים
        </span>
        <h1 className="text-4xl font-black mb-3" style={{ color: '#0f172a' }}>
          תוצרים ודוגמאות
        </h1>
        <p className="text-base max-w-lg mx-auto" style={{ color: '#64748b' }}>
          מגוון תוצרים שנוצרו בעזרת סוכני ה-AI שלנו — הכנסו להתרשם
        </p>
      </div>

      {/* Search + Filter bar */}
      <div className="max-w-6xl mx-auto px-6 mb-8 space-y-3">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חפש תוצר, מקצוע, כלי..."
            className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a' }}
            onFocus={e => (e.target.style.borderColor = 'rgba(249,115,22,0.5)')}
            onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
          />
        </div>

        {/* "הצג לפי" dropdown bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-500 ml-1">הצג לפי:</span>

          <FilterDropdown
            label="קטגוריות"
            options={CATEGORIES}
            value={filterCategory}
            onChange={setFilterCategory}
          />
          <FilterDropdown
            label="מקצוע"
            options={SUBJECTS}
            value={filterSubject}
            onChange={setFilterSubject}
          />
          <FilterDropdown
            label="כיתה"
            options={GRADES}
            value={filterGrade}
            onChange={setFilterGrade}
          />
          <FilterDropdown
            label="כל התוצרים"
            options={VIEW_OPTIONS}
            value={viewMode}
            onChange={setViewMode}
            isViewMode
          />

          {/* Clear all — visible only when any filter is active */}
          {(filterCategory || filterSubject || filterGrade || viewMode) && (
            <button
              onClick={() => { setFilterCategory(null); setFilterSubject(null); setFilterGrade(null); setViewMode(null) }}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 underline underline-offset-2 transition-colors"
            >
              נקה הכל
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden animate-pulse bg-white"
                style={{ height: CARD_HEIGHT, border: '1px solid #e2e8f0' }}
              >
                <div className="h-24 bg-gray-100" />
                <div className="p-4 space-y-2">
                  <div className="h-3 rounded w-16 bg-gray-100" />
                  <div className="h-4 rounded w-32 bg-gray-100" />
                  <div className="h-3 rounded w-24 bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-24">
            <Bot size={48} className="mx-auto mb-4 opacity-20" style={{ color: '#94a3b8' }} />
            <p style={{ color: '#94a3b8' }}>
              {outputs.length === 0 ? 'עדיין אין תוצרים — בקרוב!' : 'לא נמצאו תוצרים תואמים'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {displayed.map((output, i) => (
              <OutputCard key={i} output={output} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
