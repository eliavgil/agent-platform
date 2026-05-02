import { Link } from 'react-router-dom'
import { Users, Zap, Compass, BookOpen, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const TRACK_ITEMS = [
  {
    icon: <BookOpen size={22} className="flex-shrink-0" style={{ color: '#6366f1' }} />,
    title: 'הכשרה מקצועית',
    desc: 'לימוד פרומפטינג מתקדם, עבודה עם כלי פיתוח כמו Base44, ושימוש בפלטפורמות לימודיות כמו סטאדי-ווייז וקנבה.',
    accent: '#6366f1',
    bg: 'rgba(99,102,241,0.06)',
    border: 'rgba(99,102,241,0.18)',
  },
  {
    icon: <Compass size={22} className="flex-shrink-0" style={{ color: '#f97316' }} />,
    title: 'השראה מהשטח',
    desc: 'סיורים בחברות הטכנולוגיה המובילות (גוגל, מטא, למונייד) ומפגשים עם מומחי תוכן מהתעשייה.',
    accent: '#f97316',
    bg: 'rgba(249,115,22,0.06)',
    border: 'rgba(249,115,22,0.18)',
  },
  {
    icon: <Users size={22} className="flex-shrink-0" style={{ color: '#10b981' }} />,
    title: 'שותפות פדגוגית',
    desc: 'עבודה צמודה עם צוות המורים כדי לזהות צרכים וליצור תוצרים שישפרו את הלמידה לכלל תלמידי הכיתה.',
    accent: '#10b981',
    bg: 'rgba(16,185,129,0.06)',
    border: 'rgba(16,185,129,0.18)',
  },
]

export default function AboutPage() {
  const { user, profile } = useAuth()
  return (
    <div dir="rtl" className="min-h-screen" style={{ background: '#f8fafc' }}>

      {/* Navbar */}
      <nav
        className="sticky top-0 z-40 border-b"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(16px)',
          borderColor: '#e2e8f0',
        }}
      >
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo3.png" alt="Prometheus" className="h-9 w-9 object-contain" />
            <span className="font-bold text-sm hidden sm:block" style={{ color: '#0f172a' }}>
              פרומפתאוס AI
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-colors"
              style={{ color: '#475569' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#0f172a')}
              onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
            >
              <ArrowLeft size={15} />
              דף הבית
            </Link>
            {user ? (
              <Link
                to={profile?.role === 'admin' ? '/admin' : profile?.role === 'agent' ? '/agent' : '/teacher'}
                className="px-4 py-2 text-sm font-semibold rounded-xl transition-all"
                style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff' }}
              >
                {profile?.full_name?.split(' ')[0] || 'לדשבורד'}
              </Link>
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

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-10 text-center">
        <span
          className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5"
          style={{
            background: 'rgba(99,102,241,0.08)',
            color: '#6366f1',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          מי אנחנו
        </span>

        <h1 className="text-4xl sm:text-5xl font-black mb-4" style={{ color: '#0f172a' }}>
          פרומפתאוס AI
        </h1>

        <p className="text-base font-medium" style={{ color: '#64748b' }}>
          נוסדה בפברואר 2026 · יד מרדכי
        </p>
      </div>

      {/* Main story */}
      <div className="max-w-3xl mx-auto px-6 pb-6">
        <div
          className="rounded-3xl p-8 sm:p-10 mb-6"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-start gap-3 mb-5">
            <Zap size={20} style={{ color: '#cc6633', marginTop: '2px', flexShrink: 0 }} />
            <h2 className="text-lg font-black" style={{ color: '#0f172a' }}>הסיפור שלנו</h2>
          </div>
          <p className="text-base leading-loose" style={{ color: '#334155' }}>
            נבחרת פרומפתאוס AI הוקמה מתוך חזון ברור: להשביח את מערכת החינוך באמצעות הטמעה יעילה של
            בינה מלאכותית על ידי התלמידים עצמם.
          </p>
        </div>

        {/* Team composition */}
        <div
          className="rounded-3xl p-8 sm:p-10 mb-6"
          style={{
            background: 'linear-gradient(135deg,rgba(99,102,241,0.05),rgba(204,102,51,0.04))',
            border: '1px solid rgba(99,102,241,0.14)',
            boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-sm"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            >
              15
            </div>
            <h2 className="text-lg font-black" style={{ color: '#0f172a' }}>הנבחרת</h2>
          </div>
          <p className="text-base leading-loose" style={{ color: '#334155' }}>
            הנבחרת מורכבת מ‑15 <strong>"סוכני בינה"</strong> נבחרים משכבות ז' עד י"ב — משוהם ועד יהונתן —
            שעוברים הכשרה אינטנסיבית כדי להפוך למנהיגים טכנולוגיים בבית הספר.
          </p>
        </div>

        {/* Track items */}
        <h2 className="text-lg font-black mb-4 px-1" style={{ color: '#0f172a' }}>המסלול שלנו כולל</h2>
        <div className="space-y-4 mb-6">
          {TRACK_ITEMS.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl p-6"
              style={{
                background: item.bg,
                border: `1px solid ${item.border}`,
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: '#ffffff', border: `1px solid ${item.border}` }}
                >
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1" style={{ color: '#0f172a' }}>
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Closing tagline */}
        <div
          className="rounded-3xl p-8 sm:p-10 text-center"
          style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
          }}
        >
          <p className="text-xl sm:text-2xl font-black leading-relaxed" style={{ color: '#ffffff' }}>
            אנחנו לא רק לומדים על העתיד —
          </p>
          <p className="text-xl sm:text-2xl font-black leading-relaxed mt-1" style={{ color: '#cc6633' }}>
            אנחנו בונים אותו, סוכן אחרי סוכן.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-14">
        <Link
          to="/outputs"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(204,102,51,0.1)', color: '#cc6633', border: '1px solid rgba(204,102,51,0.25)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(204,102,51,0.18)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(204,102,51,0.1)')}
        >
          לגלריית התוצרים שלנו ←
        </Link>
      </div>

      {/* Footer */}
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
