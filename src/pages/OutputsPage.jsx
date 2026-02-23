import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTools } from '../lib/googleSheets'
import { Bot, ExternalLink, X, Search } from 'lucide-react'

const DARK = { background: '#07080f' }
const CARD_BG = 'rgba(255,255,255,0.04)'
const CARD_BORDER = 'rgba(255,255,255,0.08)'

function OutputCard({ example, onClick }) {
  const isImg = /\.(jpg|jpeg|png|gif|webp|svg)/i.test(example.url || '')
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <div
      onClick={() => onClick(example)}
      className="rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-1"
      style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)'
        e.currentTarget.style.background = 'rgba(249,115,22,0.06)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = CARD_BORDER
        e.currentTarget.style.background = CARD_BG
      }}
    >
      {/* Preview */}
      <div className="h-40 flex items-center justify-center overflow-hidden"
           style={{ background: 'rgba(255,255,255,0.02)' }}>
        {isImg && !imgFailed ? (
          <img src={example.url} alt={example.caption}
               className="w-full h-full object-cover"
               onError={() => setImgFailed(true)} />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-40">
            <ExternalLink size={28} className="text-orange-400" />
            <span className="text-xs text-white/50">לחץ לפתיחה</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <span className="text-xs font-semibold text-orange-400 block mb-1">{example.toolName}</span>
        <h3 className="text-sm font-bold text-white leading-snug">{example.caption}</h3>
        {example.category && (
          <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
            {example.category}
          </span>
        )}
      </div>
    </div>
  )
}

function OutputModal({ example, onClose }) {
  const isImg = /\.(jpg|jpeg|png|gif|webp|svg)/i.test(example.url || '')
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
           style={{ background: '#141620', border: '1px solid rgba(255,255,255,0.12)' }}>
        <button onClick={onClose}
                className="absolute top-4 left-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
          <X size={15} className="text-white" />
        </button>

        {/* Preview */}
        <div className="h-56 flex items-center justify-center overflow-hidden"
             style={{ background: 'rgba(255,255,255,0.02)' }}>
          {isImg && !imgFailed ? (
            <img src={example.url} alt={example.caption}
                 className="w-full h-full object-cover"
                 onError={() => setImgFailed(true)} />
          ) : (
            <div className="text-center opacity-50">
              <ExternalLink size={40} className="text-orange-400 mx-auto mb-2" />
              <p className="text-sm text-white/50">תצוגה מקדימה לא זמינה</p>
            </div>
          )}
        </div>

        <div className="p-6 space-y-3">
          <div>
            <span className="text-xs font-semibold text-orange-400">{example.toolName}</span>
            <h2 className="text-xl font-bold text-white mt-0.5">{example.caption}</h2>
          </div>
          {example.description && (
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {example.description}
            </p>
          )}
          <a href={example.url} target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
             style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff' }}>
            פתח דוגמה
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}

export default function OutputsPage() {
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('הכל')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getTools().then(({ data }) => { setTools(data || []); setLoading(false) })
  }, [])

  const allExamples = tools.flatMap(tool => {
    const items = []
    if (tool.example1Url) items.push({
      url: tool.example1Url,
      caption: tool.example1Caption || `דוגמה מ-${tool.name}`,
      toolName: tool.name,
      category: tool.category,
      description: tool.description,
    })
    if (tool.example2Url) items.push({
      url: tool.example2Url,
      caption: tool.example2Caption || `דוגמה מ-${tool.name}`,
      toolName: tool.name,
      category: tool.category,
      description: tool.description,
    })
    return items
  })

  const categories = ['הכל', ...new Set(tools.map(t => t.category).filter(Boolean))]
  const filtered = allExamples
    .filter(e => filter === 'הכל' || e.category === filter)
    .filter(e => !search || e.caption.includes(search) || e.toolName.includes(search))

  return (
    <div dir="rtl" className="min-h-screen" style={DARK}>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b"
           style={{ background: 'rgba(7,8,15,0.88)', backdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/Logo_promptheus.png" alt="Prometheus" className="h-9 w-9 object-contain" />
            <span className="font-bold text-white text-sm hidden sm:block">פרומפתאוס AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-sm px-3 py-2 rounded-lg transition-colors"
                  style={{ color: 'rgba(255,255,255,0.55)' }}
                  onMouseEnter={e => e.target.style.color = '#fff'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.55)'}>
              דף הבית
            </Link>
            <Link to="/login"
                  className="px-4 py-2 text-sm font-semibold rounded-xl transition-all"
                  style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff' }}>
              כניסה
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-8 text-center">
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
              style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.2)' }}>
          גלריית תוצרים
        </span>
        <h1 className="text-4xl font-black text-white mb-3">תוצרים ודוגמאות</h1>
        <p className="text-base max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
          תוצרים אמיתיים שנוצרו בעזרת סוכני ה-AI שלנו — הכנסו להתרשם
        </p>
      </div>

      {/* Filters + Search */}
      <div className="max-w-6xl mx-auto px-6 mb-8 space-y-4">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חפש תוצר..."
            className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>
        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
                    className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                    style={filter === cat
                      ? { background: '#f97316', color: '#fff' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }
                    }>
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
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse"
                   style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="h-40" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="p-4 space-y-2">
                  <div className="h-3 rounded w-16" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="h-4 rounded w-32" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Bot size={48} className="mx-auto mb-4 opacity-20 text-white" />
            <p style={{ color: 'rgba(255,255,255,0.35)' }}>
              {allExamples.length === 0 ? 'עדיין אין תוצרים — בקרוב!' : 'לא נמצאו תוצרים תואמים'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map((ex, i) => (
              <OutputCard key={i} example={ex} onClick={setSelected} />
            ))}
          </div>
        )}
      </div>

      {selected && <OutputModal example={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
