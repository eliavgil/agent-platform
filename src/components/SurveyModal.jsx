import React, { useState } from 'react'
import { X, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react'

const STORAGE_KEY = 'prometheus_survey_done'

// Replace with your deployed Apps Script URL after publishing
const APPS_SCRIPT_URL = import.meta.env.VITE_SURVEY_SCRIPT_URL || ''

const TOOLS_MATRIX = [
  'כלי שמייצר ובודק מבחנים ומחזיר ציון ומשוב (כולל שאלות פתוחות)',
  'כלי שמייצר עזרים ללמידה עצמאית כגון סיכום החומר, פודקסט, כרטיסיות למידה, שאלות לבחינה עצמית ועוד',
  'כלי שמייצר מצגות מרהיבות על בסיס החומר הלימודי',
  'כלי שבונה מערכי שיעור בהתאמה אישית',
  'כלי שמייצר שירים/תמונות בהתאמה אישית',
]

const MATRIX_RATINGS = ['כלל לא', 'מעט', 'רלוונטי', 'מאד רלוונטי']

const OBSTACLES = [
  'חוסר ידע טכני',
  'חוסר זמן ללמידה',
  'חשש מדיוק / אמינות התוצרים',
  'היעדר תמיכה מוסדית',
  'לא ברור לי מה הייתי מרוויח',
]

function ProgressBar({ step, total }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
      <div
        className="h-1.5 rounded-full transition-all duration-500"
        style={{
          width: `${((step) / total) * 100}%`,
          background: 'linear-gradient(90deg,#6366f1,#f97316)',
        }}
      />
    </div>
  )
}

function ScaleSelector({ value, onChange, min = 1, max = 5, labels }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2 justify-center">
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className="w-10 h-10 rounded-full font-bold text-sm transition-all border-2"
            style={
              value === n
                ? { background: 'linear-gradient(135deg,#6366f1,#f97316)', color: '#fff', borderColor: 'transparent' }
                : { background: '#f8fafc', color: '#475569', borderColor: '#e2e8f0' }
            }
          >
            {n}
          </button>
        ))}
      </div>
      {labels && (
        <div className="flex justify-between w-full text-xs text-gray-400 px-1">
          <span>{labels[0]}</span>
          <span>{labels[1]}</span>
        </div>
      )}
    </div>
  )
}

export default function SurveyModal({ onClose }) {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const [form, setForm] = useState({
    name: '',
    subjects: '',
    seniority: '',
    roles: '',
    aiFrequency: '',
    aiDesire: 3,
    mainObstacle: '',
    otherObstacle: '',
    toolsMatrix: {},   // { toolName: ratingIndex }
    collaboration: 3,
    comments: '',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const TOTAL_STEPS = 7

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const matrixText = TOOLS_MATRIX.map(t =>
        `${t}: ${MATRIX_RATINGS[form.toolsMatrix[t] ?? 0]}`
      ).join(' | ')

      const payload = {
        timestamp: new Date().toISOString(),
        name: form.name,
        subjects: form.subjects,
        seniority: form.seniority,
        roles: form.roles,
        aiFrequency: form.aiFrequency,
        aiDesire: form.aiDesire,
        mainObstacle: form.mainObstacle === 'אחר' ? `אחר: ${form.otherObstacle}` : form.mainObstacle,
        toolsMatrix: matrixText,
        collaboration: form.collaboration,
        comments: form.comments,
      }

      if (APPS_SCRIPT_URL) {
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      localStorage.setItem(STORAGE_KEY, '1')
      setDone(true)
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <Overlay onClose={onClose}>
        <div className="text-center py-8 flex flex-col items-center gap-4">
          <CheckCircle size={56} color="#22c55e" />
          <h2 className="text-2xl font-bold text-gray-900">תודה רבה!</h2>
          <p className="text-gray-500 text-sm max-w-xs">
            תשובותיך נשמרו. נשמח לשתף אותך בתוצאות כשנסיים לאסוף נתונים.
          </p>
          <button
            onClick={onClose}
            className="mt-2 px-6 py-2 rounded-xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#6366f1,#f97316)' }}
          >
            סגור
          </button>
        </div>
      </Overlay>
    )
  }

  return (
    <Overlay onClose={onClose}>
      <div dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-gray-900">סקר מורים — AI בכיתה</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">שלב {step} מתוך {TOTAL_STEPS}</p>

        <ProgressBar step={step} total={TOTAL_STEPS} />

        {/* Steps */}
        {step === 1 && (
          <StepWrapper title="קצת עליך">
            <Label>שם מלא</Label>
            <Input value={form.name} onChange={v => set('name', v)} placeholder="ישראל ישראלי" />
            <Label>מקצועות הוראה</Label>
            <Input value={form.subjects} onChange={v => set('subjects', v)} placeholder="מתמטיקה, אנגלית..." />
            <Label>שנות ותק בהוראה</Label>
            <Input value={form.seniority} onChange={v => set('seniority', v)} placeholder="לדוגמה: 12 שנים" />
            <Label>תפקידים נוספים (אופציונלי)</Label>
            <Input value={form.roles} onChange={v => set('roles', v)} placeholder="מחנך/ת, רכז/ת..." />
          </StepWrapper>
        )}

        {step === 2 && (
          <StepWrapper title="שימוש ב-AI כיום">
            <Label>באיזו תדירות אתה/את משתמש/ת בכלי AI?</Label>
            <div className="flex flex-col gap-2 mt-2">
              {['לא משתמש/ת כלל', 'פעם בכמה ימים', 'פעם ביום', 'מספר פעמים ביום'].map(opt => (
                <RadioOption key={opt} label={opt} checked={form.aiFrequency === opt}
                  onClick={() => set('aiFrequency', opt)} />
              ))}
            </div>
          </StepWrapper>
        )}

        {step === 3 && (
          <StepWrapper title="רצון לשלב AI בהוראה">
            <Label>עד כמה היית רוצה לשלב כלי AI בעבודת ההוראה שלך?</Label>
            <p className="text-xs text-gray-400 mb-4">1 = כלל לא, 5 = בהחלט כן</p>
            <ScaleSelector value={form.aiDesire} onChange={v => set('aiDesire', v)}
              labels={['כלל לא', 'בהחלט כן']} />
          </StepWrapper>
        )}

        {step === 4 && (
          <StepWrapper title="מה מעכב?">
            <Label>מה החסם העיקרי שלך לשימוש ב-AI?</Label>
            <div className="flex flex-col gap-2 mt-2">
              {[...OBSTACLES, 'אחר'].map(opt => (
                <RadioOption key={opt} label={opt} checked={form.mainObstacle === opt}
                  onClick={() => set('mainObstacle', opt)} />
              ))}
            </div>
            {form.mainObstacle === 'אחר' && (
              <Input className="mt-2" value={form.otherObstacle}
                onChange={v => set('otherObstacle', v)} placeholder="פרט/י..." />
            )}
          </StepWrapper>
        )}

        {step === 5 && (
          <StepWrapper title="רלוונטיות כלים">
            <Label>עד כמה כל כלי רלוונטי לצרכי ההוראה שלך?</Label>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-right pb-2 text-gray-500 font-medium">כלי</th>
                    {MATRIX_RATINGS.map(r => (
                      <th key={r} className="pb-2 text-gray-500 font-medium px-1 text-center whitespace-nowrap">{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TOOLS_MATRIX.map(tool => (
                    <tr key={tool} className="border-t border-gray-100">
                      <td className="py-2 pr-1 text-gray-700 text-right leading-snug" style={{ maxWidth: '180px' }}>{tool}</td>
                      {MATRIX_RATINGS.map((_, ri) => (
                        <td key={ri} className="py-2 text-center">
                          <button
                            onClick={() => set('toolsMatrix', { ...form.toolsMatrix, [tool]: ri })}
                            className="w-5 h-5 rounded-full border-2 transition-all mx-auto block"
                            style={
                              form.toolsMatrix[tool] === ri
                                ? { background: '#6366f1', borderColor: '#6366f1' }
                                : { background: 'transparent', borderColor: '#cbd5e1' }
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </StepWrapper>
        )}

        {step === 6 && (
          <StepWrapper title="שיתוף פעולה עם סוכן AI">
            <Label>באיזה מידה הייתם מוכנים לשתף פעולה עם תלמיד מבית הספר שיבנה עבורכם תוצר AI בהתאם לדרישותכם, המתבסס על חומר לימודי שהעברתם/אישרתם?</Label>
            <p className="text-xs text-gray-400 mb-4">1 = כלל לא, 5 = בשמחה רבה</p>
            <ScaleSelector value={form.collaboration} onChange={v => set('collaboration', v)}
              labels={['כלל לא', 'בשמחה רבה']} />
          </StepWrapper>
        )}

        {step === 7 && (
          <StepWrapper title="הערות נוספות">
            <Label>יש משהו נוסף שתרצה/י לשתף? (אופציונלי)</Label>
            <textarea
              className="w-full rounded-lg border border-gray-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 mt-1"
              rows={5}
              value={form.comments}
              onChange={e => set('comments', e.target.value)}
              placeholder="כל הערה, שאלה או רעיון..."
            />
          </StepWrapper>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-30"
            style={{ color: '#64748b', background: '#f1f5f9' }}
          >
            <ChevronRight size={16} />
            הקודם
          </button>

          {step < TOTAL_STEPS ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-1 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#6366f1,#f97316)' }}
            >
              הבא
              <ChevronLeft size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}
            >
              {submitting ? 'שולח...' : 'שלח סקר ✓'}
            </button>
          )}
        </div>
      </div>
    </Overlay>
  )
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function Overlay({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: '#fff' }}
      >
        {children}
      </div>
    </div>
  )
}

function StepWrapper({ title, children }) {
  return (
    <div>
      <h3 className="text-base font-bold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  )
}

function Label({ children }) {
  return <p className="text-sm font-medium text-gray-700 mb-1 mt-3">{children}</p>
}

function Input({ value, onChange, placeholder, className = '' }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${className}`}
    />
  )
}

function RadioOption({ label, checked, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-sm font-medium text-right transition-all"
      style={
        checked
          ? { borderColor: '#6366f1', background: 'rgba(99,102,241,0.08)', color: '#4338ca' }
          : { borderColor: '#e2e8f0', background: '#f8fafc', color: '#475569' }
      }
    >
      <span
        className="w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all"
        style={checked ? { borderColor: '#6366f1', background: '#6366f1' } : { borderColor: '#94a3b8' }}
      />
      {label}
    </button>
  )
}

export { STORAGE_KEY }
