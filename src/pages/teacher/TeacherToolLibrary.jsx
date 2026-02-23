import { useState, useEffect } from 'react'
import { ExternalLink, X, Video, FileText } from 'lucide-react'
import { getTools } from '../../lib/googleSheets'

// ── Logo map ──────────────────────────────────────────────────────────────────
const TOOL_LOGOS = {
  'Gemini':        'https://upload.wikimedia.org/wikipedia/commons/1/1d/Google_Gemini_icon_2025.svg',
  'NotebookLM':    'https://upload.wikimedia.org/wikipedia/commons/5/57/NotebookLM_logo.svg',
  'StudyWise':     'https://framerusercontent.com/images/4quFySEBAybfqylG0TqkmbAQA0.png',
  'ChatGPT':       'https://upload.wikimedia.org/wikipedia/commons/9/97/OpenAI_logo_2025.svg',
  'Claude':        'https://upload.wikimedia.org/wikipedia/commons/8/8a/Claude_AI_logo.svg',
  'DALL-E':        'https://upload.wikimedia.org/wikipedia/commons/9/97/OpenAI_logo_2025.svg',
  'Grammarly':     'https://upload.wikimedia.org/wikipedia/commons/d/d2/Grammarly_logo.svg',
  'Wolfram Alpha': 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Wolfram_Alpha_2022.svg',
  'Khanmigo':      'https://upload.wikimedia.org/wikipedia/commons/f/f6/Khan_Academy_logo_%282018%29.svg',
  'Khan Academy':  'https://upload.wikimedia.org/wikipedia/commons/f/f6/Khan_Academy_logo_%282018%29.svg',
  'Canva':         'https://upload.wikimedia.org/wikipedia/en/b/bb/Canva_Logo.svg',
  'Slidesgo':      'https://slidesgo.com/images/logos/slidesgo.svg',
  'MagicSchool AI':'https://cdn.prod.website-files.com/645187265d5e5e386be40629/6960237ddf1dfc1de13a396f_logo.png',
  'MagicSchool':   'https://cdn.prod.website-files.com/645187265d5e5e386be40629/6960237ddf1dfc1de13a396f_logo.png',
  'Diffit':        'https://images.squarespace-cdn.com/content/v1/6417f1e0a6e26c5d06b65171/661b2619-2192-4128-94ee-7f2f59bd6c62/Diffit+Logo.png',
  'Curipod':       'https://curipod.com/og_preview.png',
}

const DIFFICULTY_STYLE = {
  'קל':     { bg: '#dcfce7', text: '#16a34a' },
  'בינוני': { bg: '#fef9c3', text: '#ca8a04' },
  'מתקדם':  { bg: '#fee2e2', text: '#dc2626' },
}

function getLogoUrl(name = '') {
  if (TOOL_LOGOS[name]) return TOOL_LOGOS[name]
  const key = Object.keys(TOOL_LOGOS).find(k =>
    name.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(name.toLowerCase())
  )
  return key ? TOOL_LOGOS[key] : null
}

// ── ToolCard ──────────────────────────────────────────────────────────────────
function ToolCard({ tool, onClick }) {
  const logoUrl = getLogoUrl(tool.name)
  const [imgFailed, setImgFailed] = useState(false)
  const diff = DIFFICULTY_STYLE[tool.difficulty]

  return (
    <div
      onClick={() => onClick(tool)}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer border border-gray-100
                 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
    >
      <div className="bg-gray-50 h-40 flex items-center justify-center p-6">
        {logoUrl && !imgFailed ? (
          <img
            src={logoUrl}
            alt={tool.name}
            className="max-h-20 max-w-full object-contain"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="text-5xl select-none">{tool.logoEmoji || '🤖'}</span>
        )}
      </div>
      <div className="p-4">
        {tool.category && (
          <span className="text-xs font-semibold text-indigo-500 block mb-1">{tool.category}</span>
        )}
        <h3 className="font-bold text-gray-900 text-sm leading-snug">{tool.name}</h3>
        {tool.tagline && (
          <p className="text-xs text-gray-400 mt-1 leading-snug line-clamp-2">{tool.tagline}</p>
        )}
        {diff && (
          <span
            className="inline-block mt-2.5 text-xs font-medium px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: diff.bg, color: diff.text }}
          >
            {tool.difficulty}
          </span>
        )}
      </div>
    </div>
  )
}

// ── ToolModal ─────────────────────────────────────────────────────────────────
function ToolModal({ tool, onClose }) {
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    setImgFailed(false)
    const handleKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [tool, onClose])

  if (!tool) return null
  const logoUrl = getLogoUrl(tool.name)
  const diff = DIFFICULTY_STYLE[tool.difficulty]
  const hasLinks = tool.videoUrl || tool.presentationUrl
  const hasExamples = tool.example1Url || tool.example2Url

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[88vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 border border-gray-200
                     flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <X size={15} className="text-gray-500" />
        </button>
        <div className="bg-gray-50 rounded-t-3xl flex flex-col items-center pt-10 pb-6 px-6">
          {logoUrl && !imgFailed ? (
            <img
              src={logoUrl} alt={tool.name}
              className="h-20 max-w-[180px] object-contain mb-4"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span className="text-6xl mb-4 select-none">{tool.logoEmoji || '🤖'}</span>
          )}
          <h2 className="text-xl font-bold text-gray-900 text-center">{tool.name}</h2>
          {tool.tagline && (
            <p className="text-sm text-gray-500 mt-1 text-center leading-snug">{tool.tagline}</p>
          )}
          <div className="flex gap-2 mt-3 flex-wrap justify-center">
            {tool.category && (
              <span className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
                {tool.category}
              </span>
            )}
            {diff && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: diff.bg, color: diff.text }}>
                {tool.difficulty}
              </span>
            )}
          </div>
        </div>
        <div className="p-6 space-y-5">
          {tool.description && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">תיאור</p>
              <p className="text-sm text-gray-700 leading-relaxed">{tool.description}</p>
            </div>
          )}
          {tool.howToUse && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">איך להשתמש</p>
              <p className="text-sm text-gray-700 leading-relaxed">{tool.howToUse}</p>
            </div>
          )}
          {hasExamples && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">דוגמאות</p>
              <div className="space-y-2">
                {tool.example1Url && (
                  <a href={tool.example1Url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors">
                    <ExternalLink size={14} className="flex-shrink-0" />
                    {tool.example1Caption || 'דוגמה 1'}
                  </a>
                )}
                {tool.example2Url && (
                  <a href={tool.example2Url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors">
                    <ExternalLink size={14} className="flex-shrink-0" />
                    {tool.example2Caption || 'דוגמה 2'}
                  </a>
                )}
              </div>
            </div>
          )}
          {hasLinks && (
            <div className="flex gap-2 pt-1">
              {tool.videoUrl && (
                <a href={tool.videoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 text-gray-700 transition-colors">
                  <Video size={14} /> סרטון
                </a>
              )}
              {tool.presentationUrl && (
                <a href={tool.presentationUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 text-gray-700 transition-colors">
                  <FileText size={14} /> מצגת
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── ToolsLibraryContent — reusable in homepage + teacher page ─────────────────
export function ToolsLibraryContent() {
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('הכל')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getTools().then(({ data }) => {
      setTools(data || [])
      setLoading(false)
    })
  }, [])

  const categories = ['הכל', ...new Set(tools.map(t => t.category).filter(Boolean))]
  const filtered = category === 'הכל' ? tools : tools.filter(t => t.category === category)

  return (
    <>
      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-7">
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              category === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse border border-gray-100">
              <div className="bg-gray-100 h-40" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-14" />
                <div className="h-4 bg-gray-100 rounded w-24" />
                <div className="h-3 bg-gray-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">לא נמצאו כלים</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(tool => (
            <ToolCard key={tool.id || tool.name} tool={tool} onClick={setSelected} />
          ))}
        </div>
      )}

      <ToolModal tool={selected} onClose={() => setSelected(null)} />
    </>
  )
}

// ── Default export — teacher page with light wrapper ──────────────────────────
export default function TeacherToolLibrary() {
  return (
    <div className="-mx-6 -my-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-gray-900">ספריית כלי AI</h1>
          <p className="text-sm text-gray-500 mt-1">גלה את הכלים הזמינים לסיוע בהוראה</p>
        </div>
        <ToolsLibraryContent />
      </div>
    </div>
  )
}
