import { Link } from 'react-router-dom'
import { Player } from '@remotion/player'
import {
  AbsoluteFill, useCurrentFrame, useVideoConfig,
  interpolate, spring, Sequence,
} from 'remotion'

// ─────────────────────────────────────────────────────────────
// COMPOSITION 1 — Hero Title Reveal
// Idea: replaces the static hero text with a cinematic entrance.
// Each word springs in from below, with an orange glow at peak.
// ─────────────────────────────────────────────────────────────
function HeroReveal() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const words = ['נבחרת', 'פרומפתאוס', '.ai']
  const colors = ['#ffffff', '#ffffff', '#f97316']

  return (
    <AbsoluteFill style={{ background: '#07080f', alignItems: 'center', justifyContent: 'center', direction: 'rtl' }}>

      {/* Subtle radial glow */}
      <div style={{
        position: 'absolute', width: 480, height: 480, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        opacity: interpolate(frame, [10, 50], [0, 1], { extrapolateRight: 'clamp' }),
      }} />

      {/* Words */}
      <div style={{ display: 'flex', gap: 18, alignItems: 'baseline' }}>
        {words.map((word, i) => {
          const delay = i * 10
          const sc = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 120 } })
          const opacity = interpolate(frame - delay, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const y = interpolate(sc, [0, 1], [40, 0])
          const isAi = word === '.ai'
          return (
            <span key={word} style={{
              fontSize: isAi ? 64 : 80,
              fontWeight: 900,
              color: colors[i],
              fontFamily: 'Inter, system-ui, sans-serif',
              opacity,
              transform: `translateY(${y}px)`,
              display: 'inline-block',
              textShadow: isAi ? '0 0 40px rgba(249,115,22,0.7)' : 'none',
              letterSpacing: isAi ? '-1px' : '-2px',
            }}>
              {word}
            </span>
          )
        })}
      </div>

      {/* Subtitle */}
      {(() => {
        const delay = 35
        const op = interpolate(frame - delay, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        const y  = interpolate(frame - delay, [0, 20], [12, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        return (
          <p style={{
            position: 'absolute', bottom: 70,
            color: 'rgba(255,255,255,0.55)', fontSize: 22,
            fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 500,
            opacity: op, transform: `translateY(${y}px)`,
          }}>
            תלמידים מביאים את הבינה לכיתה
          </p>
        )
      })()}

      {/* Bottom bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg,transparent,#f97316,#6366f1,transparent)',
        opacity: interpolate(frame, [50, 70], [0, 1], { extrapolateRight: 'clamp' }),
      }} />
    </AbsoluteFill>
  )
}

// ─────────────────────────────────────────────────────────────
// COMPOSITION 2 — New Output Notification
// Idea: when an agent submits a new output, this badge pops up.
// Could appear as a toast / floating card on the homepage.
// ─────────────────────────────────────────────────────────────
function NewOutputBadge() {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  // Slide in → hold → slide out
  const enterEnd = 20
  const exitStart = durationInFrames - 20

  const sc = spring({ frame, fps, config: { damping: 18, stiffness: 130 } })
  const enterX = interpolate(sc, [0, 1], [340, 0])

  const exitProgress = interpolate(frame, [exitStart, durationInFrames], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const exitX = interpolate(exitProgress, [0, 1], [0, 340])

  const x = frame < exitStart ? enterX : exitX
  const opacity = frame < exitStart
    ? interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' })
    : interpolate(frame, [exitStart, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' })

  // Checkmark draw
  const checkProgress = interpolate(frame, [enterEnd, enterEnd + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const dashLen = checkProgress * 30

  // Avatar pulse ring
  const pulse = spring({ frame: frame - enterEnd, fps, config: { damping: 10, stiffness: 80 } })
  const ringScale = interpolate(pulse, [0, 1], [0.6, 1])

  const tools = [
    { name: 'NotebookLM', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/57/NotebookLM_logo.svg' },
    { name: 'Gemini',     logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Google_Gemini_icon_2025.svg' },
    { name: 'ChatGPT',    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/97/OpenAI_logo_2025.svg' },
  ]
  const toolIdx = Math.floor(frame / 30) % tools.length
  const tool = tools[toolIdx]

  return (
    <AbsoluteFill style={{ background: '#f8fafc', alignItems: 'center', justifyContent: 'center', direction: 'rtl' }}>

      {/* Main card */}
      <div style={{
        transform: `translateX(${x}px)`,
        opacity,
        background: '#ffffff',
        borderRadius: 20,
        padding: '20px 24px',
        width: 360,
        boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        {/* Tool logo with pulse ring */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            position: 'absolute', inset: -6,
            borderRadius: '50%',
            border: '2px solid rgba(249,115,22,0.4)',
            transform: `scale(${frame > enterEnd ? ringScale : 0})`,
          }} />
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <img src={tool.logo} alt={tool.name} style={{ width: 30, height: 30, objectFit: 'contain' }} />
          </div>
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', fontFamily: 'Inter, system-ui', fontWeight: 500 }}>
            תוצר חדש הועלה
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 15, color: '#0f172a', fontFamily: 'Inter, system-ui', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            מחולל שאלות · {tool.name}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b', fontFamily: 'Inter, system-ui' }}>
            דנה כהן · מתמטיקה
          </p>
        </div>

        {/* Animated checkmark */}
        <svg width="28" height="28" viewBox="0 0 28 28" style={{ flexShrink: 0 }}>
          <circle cx="14" cy="14" r="12" fill="rgba(249,115,22,0.12)" />
          <polyline
            points="8,14 12,18 20,10"
            fill="none"
            stroke="#f97316"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="30"
            strokeDashoffset={30 - dashLen}
          />
        </svg>
      </div>

      {/* Background decorative dots */}
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: 6, height: 6, borderRadius: '50%',
          background: i % 2 === 0 ? 'rgba(249,115,22,0.2)' : 'rgba(99,102,241,0.2)',
          top: `${20 + i * 12}%`,
          left: `${10 + i * 14}%`,
          opacity: interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' }),
        }} />
      ))}
    </AbsoluteFill>
  )
}

// ─────────────────────────────────────────────────────────────
// COMPOSITION 3 — Stats Counter
// Idea: hero/about section animated stats.
// Numbers count up with spring, rings fill around them.
// ─────────────────────────────────────────────────────────────
const STATS = [
  { value: 13, label: 'סוכנים', color: '#6366f1', accent: 'rgba(99,102,241,0.12)' },
  { value: 50, label: 'תוצרים', color: '#f97316', accent: 'rgba(249,115,22,0.12)', plus: true },
  { value: 1,  label: 'בית ספר', color: '#10b981', accent: 'rgba(16,185,129,0.12)' },
]

function StatsCounter() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <AbsoluteFill style={{ background: '#ffffff', alignItems: 'center', justifyContent: 'center', gap: 40, flexDirection: 'row', direction: 'rtl' }}>

      {STATS.map((stat, i) => {
        const delay = i * 15
        const sc = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 100 } })
        const displayed = Math.round(interpolate(sc, [0, 1], [0, stat.value]))
        const opacity = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        const scale = interpolate(sc, [0, 0.8, 1], [0.5, 1.08, 1])

        // Ring arc (SVG circle)
        const circumference = 2 * Math.PI * 38
        const ringProgress = interpolate(sc, [0, 1], [0, 0.75])
        const dashOffset = circumference * (1 - ringProgress)

        return (
          <div key={stat.label} style={{ opacity, transform: `scale(${scale})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            {/* Ring + number */}
            <div style={{ position: 'relative', width: 100, height: 100 }}>
              <svg width="100" height="100" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="38" fill="none" stroke={stat.accent} strokeWidth="8" />
                <circle cx="50" cy="50" r="38" fill="none" stroke={stat.color} strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{
                  fontSize: 28, fontWeight: 900, color: stat.color,
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}>
                  {displayed}{stat.plus ? '+' : ''}
                </span>
              </div>
            </div>
            {/* Label */}
            <span style={{ fontSize: 16, fontWeight: 700, color: '#475569', fontFamily: 'Inter, system-ui, sans-serif' }}>
              {stat.label}
            </span>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}

// ─────────────────────────────────────────────────────────────
// COMPOSITION 4 — Branded Loading Screen
// Idea: replaces the spinner in LoadingScreen.jsx with a
// Prometheus logo + orbiting accent ring.
// ─────────────────────────────────────────────────────────────
function BrandedLoader() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const sc = spring({ frame, fps, config: { damping: 18, stiffness: 80 } })
  const logoScale = interpolate(sc, [0, 1], [0, 1])
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' })

  // Orbit angle (continuous)
  const angle = (frame / 60) * 360
  const orbitR = 46

  // Pulse
  const pulse = Math.sin((frame / 30) * Math.PI) * 0.08 + 0.92

  return (
    <AbsoluteFill style={{ background: '#07080f', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer glow */}
      <div style={{
        position: 'absolute', width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%)',
        transform: `scale(${pulse})`,
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
      }} />

      {/* Orbit ring track */}
      <svg width="120" height="120" style={{ position: 'absolute' }}>
        <circle cx="60" cy="60" r={orbitR} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
      </svg>

      {/* Orbiting dot */}
      {(() => {
        const rad = (angle * Math.PI) / 180
        const dx = Math.cos(rad) * orbitR
        const dy = Math.sin(rad) * orbitR
        const dotOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: 'clamp' })
        return (
          <div style={{
            position: 'absolute',
            width: 10, height: 10, borderRadius: '50%',
            background: 'linear-gradient(135deg,#f97316,#ea580c)',
            boxShadow: '0 0 12px rgba(249,115,22,0.8)',
            transform: `translate(${dx}px, ${dy}px)`,
            opacity: dotOpacity,
          }} />
        )
      })()}

      {/* Logo */}
      <img
        src="/logo3.png"
        alt="Prometheus"
        style={{
          width: 52, height: 52, objectFit: 'contain',
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
          position: 'relative', zIndex: 1,
        }}
      />

      {/* Text */}
      <p style={{
        position: 'absolute', bottom: 60,
        color: 'rgba(255,255,255,0.4)', fontSize: 13,
        fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.12em',
        opacity: interpolate(frame, [20, 40], [0, 1], { extrapolateRight: 'clamp' }),
      }}>
        טוען...
      </p>
    </AbsoluteFill>
  )
}

// ─────────────────────────────────────────────────────────────
// Demo page
// ─────────────────────────────────────────────────────────────
const DEMOS = [
  {
    id: 'hero',
    title: 'כותרת Hero קולנועית',
    where: 'דף הבית — סקשן הפתיחה',
    desc: 'במקום כותרת סטטית — כל מילה "קופצת" פנימה בזו אחר זו עם אפקט גלו כתום. מייצר רושם ראשוני חזק.',
    comp: HeroReveal,
    w: 900, h: 380, fps: 30, dur: 120,
    bg: '#07080f',
  },
  {
    id: 'badge',
    title: 'נוטיפיקציית תוצר חדש',
    where: 'דף הבית / גלריה — כשתוצר חדש נוסף',
    desc: 'כרטיס toast שמחליק מהצד עם checkmark מאונימציה. ניתן להפעיל כשסוכן מעלה תוצר חדש דרך Supabase Realtime.',
    comp: NewOutputBadge,
    w: 560, h: 200, fps: 30, dur: 120,
    bg: '#f8fafc',
  },
  {
    id: 'stats',
    title: 'מוני סטטיסטיקות',
    where: 'דף אודות / Hero — קטע "מספרים"',
    desc: 'מספרים "סופרים" עם spring animation, טבעת צבעונית שמתמלאת סביבם. אפקטיבי במיוחד בגלילה לאלמנט.',
    comp: StatsCounter,
    w: 600, h: 240, fps: 30, dur: 90,
    bg: '#ffffff',
  },
  {
    id: 'loader',
    title: 'מסך טעינה ממותג',
    where: 'מסך הטעינה הראשי (LoadingScreen)',
    desc: 'נקודה כתומה מקיפה את הלוגו במסלול. מחליף את הספינר הגנרי בחוויה ממותגת.',
    comp: BrandedLoader,
    w: 400, h: 300, fps: 60, dur: 180,
    bg: '#07080f',
  },
]

export default function RemotionDemo() {
  return (
    <div dir="rtl" className="min-h-screen" style={{ background: '#0d1117' }}>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b"
           style={{ background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo3.png" alt="" className="h-7 w-7 object-contain opacity-80" />
            <span className="font-bold text-sm text-white">Remotion · דף ניסוי</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(249,115,22,0.2)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' }}>
              לא בפרודקשן
            </span>
          </div>
          <Link to="/" className="text-sm px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: 'rgba(255,255,255,0.5)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
            ← דף הבית
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-14 pb-10 text-center">
        <h1 className="text-4xl font-black text-white mb-3">
          אנימציות Remotion <span style={{ color: '#f97316' }}>— ניסוי</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)' }} className="text-base max-w-xl mx-auto">
          4 רעיונות לאפקטי וידאו שניתן להוסיף לאתר.
          כל אחד רץ ישירות בדפדפן — אין קבצי mp4, אין שרת.
        </p>
      </div>

      {/* Demos */}
      <div className="max-w-5xl mx-auto px-6 pb-20 space-y-12">
        {DEMOS.map(demo => (
          <div key={demo.id} className="rounded-3xl overflow-hidden"
               style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.08)' }}>

            {/* Player */}
            <div style={{ background: demo.bg }}>
              <Player
                component={demo.comp}
                durationInFrames={demo.dur}
                compositionWidth={demo.w}
                compositionHeight={demo.h}
                fps={demo.fps}
                style={{ width: '100%', display: 'block' }}
                loop
                autoPlay
                controls
              />
            </div>

            {/* Info */}
            <div className="p-7">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="text-xl font-black text-white">{demo.title}</h2>
                <span className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
                  {demo.where}
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.55)' }} className="text-sm leading-relaxed">
                {demo.desc}
              </p>
              <div className="mt-4 flex items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                <span>{demo.fps} fps</span>
                <span>·</span>
                <span>{(demo.dur / demo.fps).toFixed(1)}s</span>
                <span>·</span>
                <span>{demo.w}×{demo.h}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
