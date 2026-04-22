import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { createRequest, getAgents, uploadFile } from '../../lib/supabase'
import { getTools } from '../../lib/googleSheets'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import { Select } from '../../components/ui/Input'
import Card, { CardBody } from '../../components/ui/Card'
import Avatar from '../../components/ui/Avatar'
import { Upload, X, File, CheckCircle, Bot } from 'lucide-react'

const GRADE_LEVELS = [
  'גן חובה', 'כיתה א', 'כיתה ב', 'כיתה ג', 'כיתה ד', 'כיתה ה', 'כיתה ו',
  'כיתה ז', 'כיתה ח', 'כיתה ט', 'כיתה י', 'כיתה יא', 'כיתה יב',
]

const SUBJECTS = [
  'מתמטיקה', 'עברית', 'אנגלית', 'מדעים', 'היסטוריה', 'גיאוגרפיה',
  'אזרחות', 'ספרות', 'אמנות', 'מוזיקה', 'חינוך גופני', 'מחשבים', 'אחר',
]

// ── Output types ───────────────────────────────────────────────────────────────
const OUTPUT_TYPES = [
  {
    id: 'exam',
    icon: '📝',
    label: 'מבחן / בוחן',
    desc: 'בדיקה ומשוב אוטומטיים, כולל לשאלות פתוחות, אפשר גם לייצר את המשימה עצמה',
    hint: 'לתוצר מיטבי מומלץ להעביר:\nקובץ טקסט עם החומר לבחינה ו/או שאלות מוכנות או שאלות לדוגמא + תשובות מדויקות או כלליות',
  },
  {
    id: 'task',
    icon: '✅',
    label: 'מבדק / משימה',
    desc: 'הכנה מהירה, בדיקה אוטומטית, רעיונות יצירתיים',
    hint: '',
  },
  {
    id: 'presentation',
    icon: '🎨',
    label: 'מצגת',
    desc: 'גרפיקה מרהיבה מותאמת ללמידה, מידע מדויק בהתאם לנושא המבוקש',
    hint: '',
  },
  {
    id: 'self_learning',
    icon: '🤖',
    label: 'למידה עצמאית',
    desc: 'לדוגמא צ׳ט בוט מומחה לנושאים ממוקדים, בגרות בספרות למשל, מורה פרטי לכל דבר',
    hint: '',
  },
  {
    id: 'lesson_plan',
    icon: '📚',
    label: 'מערך שיעור מבוסס מחקר',
    desc: 'כולל סיכום החומר והכנה של כלי עזר להוראה ולמידה כגון: סקירת וידאו, פודקסט, בוחן, כרטיסיות עזר, אינפוגרפיקה, מצגת ועוד',
    hint: '',
  },
  {
    id: 'song',
    icon: '🎵',
    label: 'שירים',
    desc: 'בוחרים סגנון מוסיקלי, מצרפים מילים או נושא ומקבלים שיר להיט',
    hint: '',
  },
  {
    id: 'other',
    icon: '💡',
    label: 'אחר',
    desc: '',
    hint: '',
  },
]

const MAX_FILES = 3

export default function TeacherNewRequest() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tools, setTools] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    subject: '',
    grade_level: '',
    desired_tool_id: '',
    desired_tool_name: '',
    preferred_agent_id: '',
    priority: 'medium',
  })

  // Output type + editable hint/description
  const [outputType, setOutputType] = useState(null)   // OUTPUT_TYPES entry
  const [hintText, setHintText]     = useState('')      // editable hint / request body

  // Up to 3 files
  const [files, setFiles] = useState([])  // array of File objects

  useEffect(() => {
    getTools().then(({ data }) => setTools(data || []))
    getAgents().then(({ data }) => setAgents(data || []))
  }, [])

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrors(prev => ({ ...prev, [e.target?.name]: '' }))
  }

  const handleSelectType = (type) => {
    setOutputType(type)
    setHintText(type.hint || '')
    setErrors(prev => ({ ...prev, outputType: '', description: '' }))
  }

  const handleAddFiles = (e) => {
    const incoming = Array.from(e.target.files || [])
    setFiles(prev => {
      const combined = [...prev, ...incoming]
      return combined.slice(0, MAX_FILES)   // cap at 3
    })
    e.target.value = ''  // allow re-selecting same file
  }

  const handleRemoveFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.subject)    newErrors.subject    = 'שדה חובה'
    if (!form.grade_level) newErrors.grade_level = 'שדה חובה'
    if (!outputType)      newErrors.outputType  = 'בחרו סוג תוצר'
    if (!hintText.trim()) newErrors.description = 'נא לפרט את הבקשה'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      // Upload up to 3 files; encode as JSON array so multiple URLs fit in one column
      let fileUrl  = null
      let fileName = null

      if (files.length > 0) {
        const uploaded = []
        for (const f of files) {
          try {
            const ext  = f.name.includes('.') ? f.name.split('.').pop() : ''
            const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}${ext ? '.' + ext : ''}`
            const result = await uploadFile('request-files', f, path)
            uploaded.push({ url: result.url, name: f.name })
          } catch (uploadErr) {
            console.warn('File upload failed:', uploadErr)
          }
        }
        if (uploaded.length === 1) {
          fileUrl  = uploaded[0].url
          fileName = uploaded[0].name
        } else if (uploaded.length > 1) {
          // Encode as JSON array — readers must handle both plain URL and JSON
          fileUrl  = JSON.stringify(uploaded)
          fileName = uploaded.map(u => u.name).join(', ')
        }
        if (uploaded.length < files.length) {
          setErrors(prev => ({ ...prev, file: 'חלק מהקבצים לא הועלו. הבקשה תישלח עם הקבצים שהועלו בהצלחה.' }))
        }
      }

      // Build the description: type label + teacher's edited text
      const description = `${outputType.label}\n\n${hintText.trim()}`

      const { error } = await createRequest({
        teacher_id:         user.id,
        subject:            form.subject,
        grade_level:        form.grade_level,
        description,
        desired_tool_id:    form.desired_tool_id  || null,
        desired_tool_name:  form.desired_tool_name || null,
        preferred_agent_id: form.preferred_agent_id || null,
        priority:           form.priority,
        file_url:           fileUrl,
        file_name:          fileName,
        status:             'pending',
      })

      if (error) throw error

      // Notification email — silent fail
      fetch('https://formsubmit.co/ajax/eliavgil@gmail.com', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          _subject:    `🔔 בקשה חדשה: ${form.subject} — ${form.grade_level}`,
          מקצוע:       form.subject,
          כיתה:        form.grade_level,
          סוג_תוצר:    outputType.label,
          תיאור:       hintText.trim(),
          עדיפות:      form.priority,
          כלי_מועדף:   form.desired_tool_name || 'לפי המלצה',
          _captcha:    'false',
          _template:   'box',
        }),
      }).catch(() => {})

      setSuccess(true)
      setTimeout(() => navigate('/teacher/requests'), 2000)
    } catch (err) {
      console.error(err)
      setErrors({ submit: 'שגיאה ביצירת הבקשה. נסה שוב.' })
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-success/10 border-2 border-success/30 flex items-center justify-center mb-4">
          <CheckCircle size={40} className="text-success" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">הבקשה נשלחה!</h2>
        <p className="text-gray-500">הבקשה שלך התקבלה ותועבר לסוכן בהקדם</p>
        <p className="text-gray-400 text-sm mt-1">מעביר אותך לרשימת הבקשות...</p>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <>
      <Header
        title="בקשה חדשה לסוכן AI"
        subtitle="מלא את הפרטים ונמצא לך את הסוכן המתאים ביותר"
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Main column ────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Basic details */}
            <Card variant="light">
              <CardBody className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">פרטי הבקשה</h3>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="מקצוע"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    error={errors.subject}
                    variant="light"
                    required
                  >
                    <option value="">בחר מקצוע...</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>

                  <Select
                    label="כיתה"
                    name="grade_level"
                    value={form.grade_level}
                    onChange={handleChange}
                    error={errors.grade_level}
                    variant="light"
                    required
                  >
                    <option value="">בחר כיתה...</option>
                    {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                  </Select>
                </div>

                <Select
                  label="עדיפות"
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  variant="light"
                >
                  <option value="low">נמוכה - אין דחיפות</option>
                  <option value="medium">בינונית - תוך שבוע</option>
                  <option value="high">גבוהה - דחוף</option>
                </Select>
              </CardBody>
            </Card>

            {/* Output type selector */}
            <Card variant="light">
              <CardBody className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-0.5">
                    איזה תוצר תרצו לקבל?
                  </h3>
                  {errors.outputType && (
                    <p className="text-xs text-red-500 mt-1">{errors.outputType}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {OUTPUT_TYPES.map((type, idx) => {
                    const isSelected = outputType?.id === type.id
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleSelectType(type)}
                        className="flex items-start gap-3 p-3 rounded-xl border text-right transition-all"
                        style={isSelected
                          ? { borderColor: '#f97316', background: 'rgba(249,115,22,0.07)', boxShadow: '0 0 0 1px #f97316' }
                          : { borderColor: '#e5e7eb', background: '#fff' }
                        }
                      >
                        <span className="text-xl leading-none mt-0.5 flex-shrink-0">{type.icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                            <span className="text-xs font-bold text-gray-400">{idx + 1}.</span>
                            {type.label}
                          </p>
                          {type.desc && (
                            <p className="text-xs text-gray-400 mt-0.5 leading-snug">{type.desc}</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Contextual hint — appears when a type is selected */}
                {outputType && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{outputType.icon}</span>
                      <label className="text-sm font-semibold text-gray-700">
                        {outputType.label} — פרטו את הבקשה
                      </label>
                    </div>
                    <textarea
                      value={hintText}
                      onChange={e => {
                        setHintText(e.target.value)
                        setErrors(prev => ({ ...prev, description: '' }))
                      }}
                      rows={4}
                      placeholder="הוסיפו כאן פרטים על מה שתרצו שהסוכן יכין..."
                      className="w-full px-3 py-2.5 rounded-xl border text-sm resize-y outline-none transition-colors"
                      style={{
                        borderColor: errors.description ? '#ef4444' : '#e5e7eb',
                        background:  '#fafafa',
                      }}
                      onFocus={e => { e.target.style.borderColor = '#f97316' }}
                      onBlur={e  => { e.target.style.borderColor = errors.description ? '#ef4444' : '#e5e7eb' }}
                    />
                    {errors.description && (
                      <p className="text-xs text-red-500">{errors.description}</p>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* File upload — up to 3 files */}
            <Card variant="light">
              <CardBody className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    קבצים מצורפים (אופציונלי)
                  </h3>
                  <span className="text-xs text-gray-400">{files.length}/{MAX_FILES} קבצים</span>
                </div>

                {/* Uploaded files list */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <File size={18} className="text-orange-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 truncate">{f.name}</p>
                          <p className="text-xs text-gray-400">{(f.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload zone — hidden when 3 files already selected */}
                {files.length < MAX_FILES && (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400/60 hover:bg-orange-50/30 transition-all group">
                    <Upload size={22} className="text-gray-400 group-hover:text-orange-400 mb-2 transition-colors" />
                    <p className="text-sm text-gray-500 group-hover:text-gray-700">
                      {files.length === 0 ? 'לחצו להעלאת קובץ' : 'הוסיפו עוד קובץ'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF, Word, תמונות עד 10MB · עד {MAX_FILES} קבצים
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                      multiple
                      onChange={handleAddFiles}
                    />
                  </label>
                )}

                {errors.file && (
                  <p className="text-xs text-amber-600">{errors.file}</p>
                )}
              </CardBody>
            </Card>
          </div>

          {/* ── Sidebar ────────────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Tool selection */}
            <Card variant="light">
              <CardBody>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">כלי AI מועדף</h3>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, desired_tool_id: null, desired_tool_name: '' }))}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      !form.desired_tool_name
                        ? 'bg-accent/15 border border-accent/30 text-accent-light'
                        : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    <Bot size={16} />
                    <span>כל כלי / לפי המלצה</span>
                  </button>
                  {tools.map(tool => (
                    <button
                      key={tool.id || tool.name}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, desired_tool_id: null, desired_tool_name: tool.name }))}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        form.desired_tool_name === tool.name
                          ? 'bg-accent/15 border border-accent/30 text-accent-light'
                          : 'hover:bg-gray-100 text-gray-500'
                      }`}
                    >
                      <span className="flex-shrink-0 text-base leading-none">{tool.logoEmoji || '🤖'}</span>
                      {tool.name}
                    </button>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Agent preference */}
            <Card variant="light">
              <CardBody>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">סוכן מועדף</h3>
                {agents.length === 0 ? (
                  <p className="text-sm text-gray-400">אין סוכנים זמינים כרגע</p>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, preferred_agent_id: '' }))}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        !form.preferred_agent_id
                          ? 'bg-accent/15 border border-accent/30 text-accent-light'
                          : 'hover:bg-gray-100 text-gray-500'
                      }`}
                    >
                      ללא העדפה
                    </button>
                    {agents.map(agent => (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, preferred_agent_id: agent.id }))}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          form.preferred_agent_id === agent.id
                            ? 'bg-accent/15 border border-accent/30 text-accent-light'
                            : 'hover:bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Avatar name={agent.full_name} size="xs" />
                        <span>{agent.full_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Submit */}
            <div>
              {errors.submit && (
                <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {errors.submit}
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={loading}
              >
                שלח בקשה
              </Button>
              <p className="text-xs text-gray-400 text-center mt-2">
                הבקשה תטופל בהקדם על ידי סוכן AI מתאים
              </p>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}
