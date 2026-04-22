import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { createRequest, getAgents, uploadFile } from '../../lib/supabase'
import { getTools } from '../../lib/googleSheets'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import { Input, Textarea, Select } from '../../components/ui/Input'
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
    description: '',
    desired_tool_id: '',
    desired_tool_name: '',
    preferred_agent_id: '',
    priority: 'medium',
  })
  const [file, setFile] = useState(null)

  useEffect(() => {
    getTools().then(({ data }) => setTools(data || []))
    getAgents().then(({ data }) => setAgents(data || []))
  }, [])

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrors(e => ({ ...e, [e.target?.name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.subject) newErrors.subject = 'שדה חובה'
    if (!form.grade_level) newErrors.grade_level = 'שדה חובה'
    if (!form.description.trim()) newErrors.description = 'שדה חובה'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      let fileUrl = null
      let fileName = null

      if (file) {
        try {
          const ext = file.name.includes('.') ? file.name.split('.').pop() : ''
          const path = `${user.id}/${Date.now()}${ext ? '.' + ext : ''}`
          const result = await uploadFile('request-files', file, path)
          fileUrl = result.url
          fileName = file.name
        } catch (uploadErr) {
          console.warn('File upload failed:', uploadErr)
          setErrors(prev => ({ ...prev, file: 'העלאת הקובץ נכשלה. הבקשה תישלח ללא קובץ.' }))
        }
      }

      const { data, error } = await createRequest({
        teacher_id: user.id,
        subject: form.subject,
        grade_level: form.grade_level,
        description: form.description.trim(),
        desired_tool_id: form.desired_tool_id || null,
        desired_tool_name: form.desired_tool_name || null,
        preferred_agent_id: form.preferred_agent_id || null,
        priority: form.priority,
        file_url: fileUrl,
        file_name: fileName,
        status: 'pending',
      })

      if (error) throw error

      // Notification email — silent fail, never blocks the user
      fetch('https://formsubmit.co/ajax/eliavgil@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          _subject: `🔔 בקשה חדשה: ${form.subject} — ${form.grade_level}`,
          מקצוע: form.subject,
          כיתה: form.grade_level,
          תיאור: form.description.trim(),
          עדיפות: form.priority,
          כלי_מועדף: form.desired_tool_name || 'לפי המלצה',
          _captcha: 'false',
          _template: 'box',
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

  return (
    <>
      <Header
        title="בקשה חדשה לסוכן AI"
        subtitle="מלא את הפרטים ונמצא לך את הסוכן המתאים ביותר"
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-5">
            <Card variant="light">
              <CardBody className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">פרטי הבקשה</h3>

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

                <Textarea
                  label="תיאור מפורט של הבקשה"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  error={errors.description}
                  placeholder="תאר בפירוט מה אתה צריך עזרה בו, מה מטרת השיעור, מה הקשיים שנתקלת בהם..."
                  rows={5}
                  variant="light"
                  required
                />

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

            {/* File Upload */}
            <Card variant="light">
              <CardBody>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">קובץ מצורף (אופציונלי)</h3>
                {file ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <File size={20} className="text-accent flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-danger transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-accent/40 hover:bg-accent/5 transition-all group">
                    <Upload size={24} className="text-gray-400 group-hover:text-accent mb-2 transition-colors" />
                    <p className="text-sm text-gray-500 group-hover:text-gray-700">
                      לחץ להעלאת קובץ
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PDF, Word, תמונות עד 10MB</p>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>
                )}
                {errors.file && (
                  <p className="text-xs text-warning mt-2">{errors.file}</p>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Sidebar Options */}
          <div className="space-y-5">
            {/* Tool Selection */}
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
                      <span className="flex-shrink-0 text-base leading-none">
                        {tool.logoEmoji || '🤖'}
                      </span>
                      {tool.name}
                    </button>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Agent Preference */}
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
                <div className="mb-3 px-3 py-2 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
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
