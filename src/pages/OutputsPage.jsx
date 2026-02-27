import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTools, getOutputs, getToolEmoji } from '../lib/googleSheets'
import { Bot, ExternalLink, Search, Quote } from 'lucide-react'

const DARK = { background: '#07080f' }
const CARD_BG = 'rgba(255,255,255,0.04)'
const CARD_BORDER = 'rgba(255,255,255,0.08)'
const CARD_HEIGHT = 260

const TOOL_LOGOS = {
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
  'MagicSchool AI': 'https://cdn.prod.website-files.com/645187265d5e5e386be40629/6960237ddf1dfc1de13a396f_logo.png',
  'MagicSchool':    'https://cdn.prod.website-files.com/645187265d5e5e386be40629/6960237ddf1dfc1de13a396f_logo.png',
}

function getLogoUrl(name = '') {
  if (TOOL_LOGOS[name]) return TOOL_LOGOS[name]
  const key = Object.keys(TOOL_LOGOS).find(k =>
    name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(name.toLowerCase())
  )
  return key ? TOOL_LOGOS[key] : null
}

function OutputCard({ output, emoji }) {
  const [hovered, setHovered] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const hasExtra = output.fullDesc || output.review || output.link
  const logoUrl = getLogoUrl(output.aiTool || '')

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
          background: hovered ? '#141620' : CARD_BG,
          border: `1px solid ${hovered ? 'rgba(249,115,22,0.45)' : CARD_BORDER}`,
          boxShadow: hovered ? '0 24px 48px rgba(0,0,0,0.6)' : 'none',
          zIndex: hovered ? 30 : 1,
          minHeight: CARD_HEIGHT,
        }}
      >
        {/* Logo / emoji banner */}
        <div
          className="flex flex-col items-center justify-center gap-2 py-5"
          style={{ background: hovered ? 'rgba(249,115,22,0.1)' : 'rgba(249,115,22,0.06)' }}
        >
          {logoUrl && !imgFailed ? (
            <img
              src={logoUrl}
              alt={output.aiTool}
              className="h-10 max-w-[80px] object-contain"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span className="text-4xl select-none leading-none">{emoji}</span>
          )}
          {output.aiTool && (
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: 'rgba(249,115,22,0.2)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.25)' }}
            >
              {output.aiTool}
            </span>
          )}
        </div>

        {/* Base content — always visible */}
        <div className="px-4 pt-3 pb-4">
          {output.category && (
            <span
              className="inline-block mb-1.5 text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
            >
              {output.category}
            </span>
          )}
          <h3 className="text-sm font-bold text-white leading-snug mb-1">{output.name}</h3>
          <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {[output.subject, output.topic, output.grade].filter(Boolean).join(' · ')}
          </p>
          {output.shortDesc && (
            <p
              className="text-xs leading-relaxed"
              style={{
                color: 'rgba(255,255,255,0.55)',
                display: '-webkit-box',
                WebkitLineClamp: hovered ? 'unset' : 2,
                WebkitBoxOrient: 'vertical',
                overflow: hovered ? 'visible' : 'hidden',
              }}
            >
              {output.shortDesc}
            </p>
          )}

          {/* Expanded content — only on hover */}
          {hovered && hasExtra && (
            <div
              className="mt-3 pt-3 space-y-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
              {output.fullDesc && output.fullDesc !== output.shortDesc && (
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {output.fullDesc}
                </p>
              )}

              {output.review && (
                <div
                  className="rounded-xl p-3 space-y-1.5"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="flex items-start gap-1.5">
                    <Quote size={12} className="text-orange-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      {output.review}
                    </p>
                  </div>
                  {output.reviewerName && (
                    <p className="text-xs font-semibold text-orange-400 text-left">
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
  const [emojiMap, setEmojiMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('הכל')
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([getOutputs(), getTools()]).then(([outRes, toolRes]) => {
      setOutputs(outRes.data || [])
      const map = {}
      for (const tool of (toolRes.data || [])) {
        if (tool.name && tool.logoEmoji) map[tool.name.toLowerCase()] = tool.logoEmoji
      }
      setEmojiMap(map)
      setLoading(false)
    })
  }, [])

  const getEmoji = (output) =>
    output.logoEmoji || emojiMap[output.aiTool?.toLowerCase()] || getToolEmoji(output.aiTool) || '🤖'

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
    <div dir="rtl" className="min-h-screen" style={DARK}>

      {/* Navbar */}
      <nav
        className="sticky top-0 z-40 border-b"
        style={{ background: 'rgba(7,8,15,0.88)', backdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/Logo_promptheus.png" alt="Prometheus" className="h-9 w-9 object-contain" />
            <span className="font-bold text-white text-sm hidden sm:block">פרומפתאוס AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="text-sm px-3 py-2 rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.55)' }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.55)'}
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
          style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.2)' }}
        >
          גלריית תוצרים
        </span>
        <h1 className="text-4xl font-black text-white mb-3">תוצרים ודוגמאות</h1>
        <p className="text-base max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
          תוצרים אמיתיים שנוצרו בעזרת סוכני ה-AI שלנו — הכנסו להתרשם
        </p>
      </div>

      {/* Filters + Search */}
      <div className="max-w-6xl mx-auto px-6 mb-8 space-y-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חפש תוצר, מקצוע, כלי..."
            className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={filter === cat
                ? { background: '#f97316', color: '#fff' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }
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
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ height: CARD_HEIGHT, background: 'rgba(255,255,255,0.04)' }}>
                <div className="h-24" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="p-4 space-y-2">
                  <div className="h-3 rounded w-16" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="h-4 rounded w-32" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="h-3 rounded w-24" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Bot size={48} className="mx-auto mb-4 opacity-20 text-white" />
            <p style={{ color: 'rgba(255,255,255,0.35)' }}>
              {outputs.length === 0 ? 'עדיין אין תוצרים — בקרוב!' : 'לא נמצאו תוצרים תואמים'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map((output, i) => (
              <OutputCard key={i} output={output} emoji={getEmoji(output)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
