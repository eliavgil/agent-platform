import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTools, getOutputs, getToolEmoji } from '../lib/googleSheets'
import { Bot, ExternalLink, Search, Quote } from 'lucide-react'

const CARD_HEIGHT = 280

// Priority: output.logoUrl (sheets) → output.logoEmoji (sheets) → getToolEmoji → '🤖'
function resolveDisplay(output) {
  return {
    logoUrl: output.logoUrl || '',
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
          className="flex flex-col items-center justify-center gap-2 py-5"
          style={{
            background: hovered ? 'rgba(249,115,22,0.07)' : '#f8fafc',
            borderBottom: `1px solid ${hovered ? 'rgba(249,115,22,0.15)' : '#f1f5f9'}`,
            minHeight: 96,
          }}
        >
          {logoUrl && !imgFailed ? (
            <img
              src={logoUrl}
              alt={output.aiTool || 'logo'}
              className="max-h-12 max-w-[100px] object-contain"
              onError={() => setImgFailed(true)}
            />
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
          <h3 className="text-sm font-bold leading-snug mb-1" style={{ color: '#0f172a' }}>
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
  const [outputs, setOutputs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('הכל')
  const [search, setSearch] = useState('')

  useEffect(() => {
    getOutputs().then(({ data }) => {
      setOutputs(data || [])
      setLoading(false)
    })
  }, [])

  const categories = ['הכל', ...new Set(outputs.map(o => o.category).filter(Boolean))]

  const filtered = outputs
    .filter(o => filter === 'הכל' || o.category === filter)
    .filter(o => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        o.name?.toLowerCase().includes(q) ||
        o.subject?.toLowerCase().includes(q) ||
        o.topic?.toLowerCase().includes(q) ||
        o.aiTool?.toLowerCase().includes(q) ||
        o.shortDesc?.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q)
      )
    })

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
            <img src="/Logo_promptheus.png" alt="Prometheus" className="h-9 w-9 object-contain" />
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
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold rounded-xl transition-all"
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff' }}
            >
              כניסה
            </Link>
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
          תוצרים אמיתיים שנוצרו בעזרת סוכני ה-AI שלנו — הכנסו להתרשם
        </p>
      </div>

      {/* Filters + Search */}
      <div className="max-w-6xl mx-auto px-6 mb-8 space-y-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חפש תוצר, מקצוע, כלי..."
            className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#0f172a',
            }}
            onFocus={e => (e.target.style.borderColor = 'rgba(249,115,22,0.5)')}
            onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={
                filter === cat
                  ? { background: '#f97316', color: '#fff', border: '1px solid #f97316' }
                  : { background: '#ffffff', color: '#475569', border: '1px solid #e2e8f0' }
              }
            >
              {cat}
            </button>
          ))}
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
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Bot size={48} className="mx-auto mb-4 opacity-20" style={{ color: '#94a3b8' }} />
            <p style={{ color: '#94a3b8' }}>
              {outputs.length === 0 ? 'עדיין אין תוצרים — בקרוב!' : 'לא נמצאו תוצרים תואמים'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map((output, i) => (
              <OutputCard key={i} output={output} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
