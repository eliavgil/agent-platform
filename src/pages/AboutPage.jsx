import { Link } from 'react-router-dom'
import { Users, Zap, BookOpen, GraduationCap, Heart, ArrowLeft, Sparkles, School } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Player } from '@remotion/player'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'

// ── Stats Counter composition ──────────────────────────────────────────────────
const STATS = [
  { value: 13, label: 'סוכנים',   color: '#6366f1', arc: 'rgba(99,102,241,0.18)'  },
  { value: 50, label: 'תוצרים',   color: '#f97316', arc: 'rgba(249,115,22,0.18)', plus: true },
  { value: 1,  label: 'בית ספר',  color: '#10b981', arc: 'rgba(16,185,129,0.18)'  },
]

function StatsCounter() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <AbsoluteFill style={{ background: '#ffffff', alignItems: 'center', justifyContent: 'center', gap: 48, flexDirection: 'row', direction: 'rtl' }}>
      {STATS.map((stat, i) => {
        const delay = i * 14
        const sc = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 100 } })
        const displayed  = Math.round(interpolate(sc, [0, 1], [0, stat.value]))
        const opacity    = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        const scale      = interpolate(sc, [0, 0.8, 1], [0.5, 1.08, 1])
        const circumference = 2 * Math.PI * 38
        const dashOffset = circumference * (1 - interpolate(sc, [0, 1], [0, 0.75]))
        return (
          <div key={stat.label} style={{ opacity, transform: `scale(${scale})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', width: 100, height: 100 }}>
              <svg width="100" height="100" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="38" fill="none" stroke={stat.arc} strokeWidth="8" />
                <circle cx="50" cy="50" r="38" fill="none" stroke={stat.color} strokeWidth="8"
                        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: stat.color, fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {displayed}{stat.plus ? '+' : ''}
                </span>
              </div>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#475569', fontFamily: 'Inter, system-ui, sans-serif' }}>
              {stat.label}
            </span>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}

const TOOLS = [
  { name: 'Gemini',     logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Google_Gemini_icon_2025.svg' },
  { name: 'NotebookLM', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/57/NotebookLM_logo.svg' },
  { name: 'StudyWise',  logo: 'https://framerusercontent.com/images/4quFySEBAybfqylG0TqkmbAQA0.png' },
  { name: 'Base44',     logo: 'https://base44.com/apple-touch-icon.png' },
]

export default function AboutPage() {
  const { user, profile } = useAuth()

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: '#f8fafc' }}>

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 border-b"
           style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)', borderColor: '#e2e8f0' }}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo3.png" alt="Prometheus" className="h-7 w-7 object-contain" />
            <span className="font-bold text-sm" style={{ color: '#0f172a' }}>פרומפתאוס AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-colors"
                  style={{ color: '#475569' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#0f172a')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
              <ArrowLeft size={14} />
              דף הבית
            </Link>
            {user ? (
              <Link to={profile?.role === 'admin' ? '/admin' : profile?.role === 'agent' ? '/agent' : '/teacher'}
                    className="px-4 py-1.5 text-sm font-semibold rounded-xl transition-all"
                    style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff' }}>
                {profile?.full_name?.split(' ')[0] || 'לדשבורד'}
              </Link>
            ) : (
              <Link to="/login"
                    className="px-4 py-1.5 text-sm font-semibold rounded-xl transition-all"
                    style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff' }}>
                כניסה
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5"
              style={{ background: 'rgba(249,115,22,0.1)', color: '#ea580c', border: '1px solid rgba(249,115,22,0.22)' }}>
          הסיפור שלנו
        </span>
        <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight" style={{ color: '#0f172a' }}>
          נבחרת פרומפתאוס<span style={{ color: '#f97316' }}>.ai</span>
        </h1>
        <p className="text-xl font-semibold mb-3" style={{ color: '#475569' }}>
          תלמידים מביאים את הבינה לכיתה
        </p>
        <p className="text-sm" style={{ color: '#94a3b8' }}>
          בית הספר שקמה דרכא · יד מרדכי · 2025
        </p>
      </div>

      {/* ── Stats Counter ──────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6 mb-2">
        <div className="rounded-3xl overflow-hidden"
             style={{ border: '1px solid #e2e8f0', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <Player
            component={StatsCounter}
            durationInFrames={90}
            compositionWidth={600}
            compositionHeight={200}
            fps={30}
            style={{ width: '100%', display: 'block' }}
            loop
            autoPlay
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-6 space-y-5">

        {/* ── The Insight ──────────────────────────────────────────────────── */}
        <div className="rounded-3xl p-8 sm:p-10"
             style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 20px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
                 style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
              <Zap size={16} color="#fff" />
            </div>
            <h2 className="text-xl font-black" style={{ color: '#0f172a' }}>רקע ורעיון</h2>
          </div>
          <p className="text-base leading-loose mb-4" style={{ color: '#334155' }}>
            נבחרת פרומפתאוס.ai הוקמה מתוך הבנה כי בינה מלאכותית יכולה לייצר שינוי עמוק וחיובי במערכת
            החינוך – ומתוך הכרה בקושי האמיתי להטמיע AI בבתי ספר. מורים פועלים בעומס מתמשך, ולרוב
            אינם פנויים ללמוד, להתנסות ולאמץ כלים חדשים.
          </p>
          <div className="rounded-2xl p-5"
               style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.18)' }}>
            <p className="text-base leading-loose font-medium" style={{ color: '#334155' }}>
              מתוך תובנות אלו נולד <strong style={{ color: '#ea580c' }}>רעיון הפוך מהמקובל</strong>: במקום
              להטמיע AI באמצעות המורים – לעשות זאת באמצעות התלמידים. תלמידים סקרנים, בעלי מוטיבציה
              ויכולת, שמצויים בעולמות הדיגיטל וה-AI, ויש להם גם את הזמן והגמישות ללמוד,
              להתנסות ולייצר פתרונות.
            </p>
          </div>
        </div>

        {/* ── The Team ─────────────────────────────────────────────────────── */}
        <div className="rounded-3xl p-8 sm:p-10"
             style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.05),rgba(139,92,246,0.04))',
                      border: '1px solid rgba(99,102,241,0.16)', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                 style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              13
            </div>
            <h2 className="text-xl font-black" style={{ color: '#0f172a' }}>הסוכנים וההכשרה</h2>
          </div>
          <p className="text-base leading-loose mb-5" style={{ color: '#334155' }}>
            לנבחרת גויסו 13 תלמידים נהדרים בעלי עניין ויכולת, שעברו תהליך הכשרה ייעודי הכולל
            למידה פרונטלית, מפגשים מקוונים, סדנאות, הרצאות, סיורים לימודיים ותחרויות נושאות פרסים.
          </p>
          <p className="text-sm font-semibold mb-3" style={{ color: '#6366f1' }}>
            הכלים שאיתם עובדים:
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            {TOOLS.map(t => (
              <div key={t.name} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                   style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <img src={t.logo} alt={t.name} className="w-5 h-5 object-contain"
                     onError={e => { e.target.style.display = 'none' }} />
                <span className="text-sm font-semibold" style={{ color: '#334155' }}>{t.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Dual Value ───────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-xl font-black mb-4 px-1" style={{ color: '#0f172a' }}>ערך חינוכי כפול</h2>
          <div className="grid sm:grid-cols-2 gap-4">

            {/* Teachers */}
            <div className="rounded-2xl p-6"
                 style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                     style={{ background: 'rgba(16,185,129,0.1)' }}>
                  <School size={16} style={{ color: '#10b981' }} />
                </div>
                <span className="font-bold text-sm" style={{ color: '#10b981' }}>המורים מקבלים</span>
              </div>
              <ul className="space-y-2.5">
                {['פתרונות AI ישימים, מותאמים לצרכים אמיתיים','חשיפה לאפשרויות השונות של כלי AI','חיסכון בזמן יקר'].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#10b981' }} />
                    <span className="text-sm leading-relaxed" style={{ color: '#475569' }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Students */}
            <div className="rounded-2xl p-6"
                 style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                     style={{ background: 'rgba(99,102,241,0.1)' }}>
                  <GraduationCap size={16} style={{ color: '#6366f1' }} />
                </div>
                <span className="font-bold text-sm" style={{ color: '#6366f1' }}>התלמידים רוכשים</span>
              </div>
              <ul className="space-y-2.5">
                {['היכרות מעמיקה עם עולם ה-AI','פיתוח יצירתיות ופתרון בעיות','עבודת צוות ולמידה עצמאית ויישומית'].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#6366f1' }} />
                    <span className="text-sm leading-relaxed" style={{ color: '#475569' }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Response quote */}
          <div className="mt-4 rounded-2xl px-6 py-4 flex items-center gap-3"
               style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.18)' }}>
            <Sparkles size={16} style={{ color: '#f97316', flexShrink: 0 }} />
            <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>
              הפעילות זוכה לתגובות <strong style={{ color: '#ea580c' }}>חיוביות ומתמשכות</strong> ממורים, תלמידים ואנשי חינוך.
            </p>
          </div>
        </div>

        {/* ── Support ──────────────────────────────────────────────────────── */}
        <div className="rounded-3xl p-8 sm:p-10"
             style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
                 style={{ background: 'rgba(245,158,11,0.12)' }}>
              <Heart size={16} style={{ color: '#d97706' }} />
            </div>
            <h2 className="text-xl font-black" style={{ color: '#0f172a' }}>ליווי ותמיכה</h2>
          </div>
          <p className="text-base leading-loose mb-5" style={{ color: '#334155' }}>
            הקמת הנבחרת והפעילות השוטפת זכו בליווי ומימון על ידי שני גורמים מרכזיים:
          </p>
          <div className="space-y-3">
            {[
              { title: 'הקרן לעידוד יוזמות חינוכיות', desc: 'ליווי ומימון לפעילות הנבחרת', color: '#d97706', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.22)' },
              { title: 'בית הספר שקמה דרכא יד מרדכי', desc: 'תמיכה ומימון מצד הנהלת בית הספר, בראשה מנהלת בית הספר נופר מלכה', color: '#6366f1', bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.18)' },
            ].map(s => (
              <div key={s.title} className="rounded-2xl px-5 py-4"
                   style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <p className="font-bold text-sm mb-0.5" style={{ color: s.color }}>{s.title}</p>
                <p className="text-sm" style={{ color: '#475569' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Closing tagline ───────────────────────────────────────────────── */}
        <div className="rounded-3xl p-8 sm:p-10 text-center"
             style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users size={18} color="rgba(255,255,255,0.5)" />
          </div>
          <p className="text-xl sm:text-2xl font-black leading-relaxed mb-2" style={{ color: '#ffffff' }}>
            מודל חדשני להטמעת AI בבתי ספר
          </p>
          <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
            המבוסס על שותפות יעילה בין תלמידים למורים,
            ושאיפה ארוכת טווח להשפיע על דמותה של מערכת החינוך בישראל.
          </p>
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <div className="text-center py-14 flex items-center justify-center gap-3">
        <Link to="/outputs"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(249,115,22,0.1)', color: '#ea580c', border: '1px solid rgba(249,115,22,0.25)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.18)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.1)')}>
          לגלריית התוצרים ←
        </Link>
        <Link to="/"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}>
          לדף הבית ←
        </Link>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#03040a', borderTop: '1px solid rgba(255,255,255,0.06)' }} className="py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/logo3.png" alt="Prometheus" className="h-7 w-7 object-contain opacity-70" />
            <p className="text-white font-bold text-sm">פרומפתאוס AI</p>
          </div>
          <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
            יד מרדכי · {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  )
}
