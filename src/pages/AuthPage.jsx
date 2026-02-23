import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Bot, Eye, EyeOff } from 'lucide-react'

// Google icon SVG
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

// Ministry of Education icon
function EduIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" fill="#1565C0"/>
      <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" fill="#1976D2"/>
    </svg>
  )
}

export default function AuthPage() {
  const { signIn, signInWithGoogle, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'edu'
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'teacher',
  })

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const isEduEmail = (email) =>
    /^[^@]+@(edu\.gov\.il|moe\.gov\.il|outlook\.com|[a-z-]+\.muni\.il)$/i.test(email)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Basic email validation (skip for secret admin "7")
    const isAdminAttempt = form.email.trim() === '7' && form.password.trim() === '7'
    if (!isAdminAttempt && mode !== 'register') {
      if (!form.email.includes('@')) {
        setError('כתובת אימייל לא תקינה')
        setLoading(false)
        return
      }
    }

    try {
      if (mode === 'login' || mode === 'edu') {
        const result = await signIn(form.email, form.password)
        // Admin secret login → go directly to dashboard
        if (result?.user?.id === 'local-admin') {
          navigate('/admin', { replace: true })
          return
        }
        // Regular login → show homepage first (hero visible)
        navigate('/', { replace: true })
        return
      } else {
        if (!form.fullName.trim()) {
          setError('אנא הכנס שם מלא')
          setLoading(false)
          return
        }
        await signUp(form.email, form.password, form.fullName, form.role)
      }
    } catch (err) {
      const messages = {
        'Invalid login credentials': 'אימייל או סיסמה שגויים',
        'User already registered': 'משתמש עם אימייל זה כבר קיים',
        'Password should be at least 6 characters': 'הסיסמה חייבת להיות לפחות 6 תווים',
        'Email not confirmed': 'אנא אשר את האימייל שלך תחילה',
      }
      setError(messages[err.message] || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      await signInWithGoogle()
      // Page will redirect to Google — no need to setGoogleLoading(false)
    } catch (err) {
      setError('שגיאה בהתחברות עם Google: ' + err.message)
      setGoogleLoading(false)
    }
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setError('')
    setForm({ email: '', password: '', fullName: '', role: 'teacher' })
  }

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-dark-800 to-dark-900 border-l border-dark-700/50 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-accent/5 blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full bg-purple-600/5 blur-3xl" />
        </div>

        <div className="relative z-10 text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-accent/30">
            <Bot size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            פלטפורמת<br />
            <span className="text-gradient">סוכני AI</span>
          </h1>
          <p className="text-dark-300 text-lg leading-relaxed">
            חיבור חכם בין מורים לסוכני בינה מלאכותית לשיפור חווית ההוראה
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { emoji: '🎓', label: 'מורים' },
              { emoji: '🤖', label: 'סוכני AI' },
              { emoji: '💡', label: 'חדשנות' },
            ].map(item => (
              <div key={item.label} className="bg-dark-800/50 rounded-2xl p-4 border border-dark-600/30">
                <div className="text-2xl mb-1">{item.emoji}</div>
                <div className="text-xs text-dark-300 font-medium">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">פלטפורמת AI</h1>
          </div>

          <div className="bg-dark-800 border border-dark-600/50 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-1">
              {mode === 'register' ? 'צור חשבון' : 'ברוך הבא'}
            </h2>
            <p className="text-dark-400 text-sm mb-6">
              {mode === 'register' ? 'הצטרף לפלטפורמה' :
               mode === 'edu' ? 'התחבר עם מייל ארגוני של משרד החינוך' :
               'התחבר לחשבונך'}
            </p>

            {error && (
              <div className="mb-4 px-4 py-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm">
                {error}
              </div>
            )}

            {/* OAuth buttons — shown only on login mode */}
            {mode === 'login' && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-medium py-2.5 px-4 rounded-xl border border-gray-200 transition-all text-sm mb-3 disabled:opacity-60"
                >
                  <GoogleIcon />
                  {googleLoading ? 'מתחבר...' : 'התחבר עם Google'}
                </button>

                <button
                  type="button"
                  onClick={() => switchMode('edu')}
                  className="w-full flex items-center justify-center gap-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-medium py-2.5 px-4 rounded-xl border border-blue-600/30 transition-all text-sm mb-4"
                >
                  <EduIcon />
                  התחבר עם מייל ארגוני — משרד החינוך
                </button>

                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-dark-600" />
                  </div>
                  <div className="relative flex justify-center text-xs text-dark-400 bg-dark-800 px-2">
                    <span className="px-2">או התחבר עם אימייל</span>
                  </div>
                </div>
              </>
            )}

            {/* Edu mode back button */}
            {mode === 'edu' && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-600/10 border border-blue-600/20 rounded-lg px-3 py-2">
                  <EduIcon />
                  <span>הכנס את כתובת המייל הארגונית שלך (לדוגמה: name@edu.gov.il)</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {mode === 'register' && (
                <>
                  <Input
                    label="שם מלא"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="ישראל ישראלי"
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-1.5">
                      תפקיד <span className="text-danger">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'teacher', label: '🎓 מורה' },
                        { value: 'agent', label: '🤖 סוכן AI' },
                      ].map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, role: option.value }))}
                          className={`
                            py-2.5 px-4 rounded-xl text-sm font-medium border transition-all
                            ${form.role === option.value
                              ? 'bg-accent/15 border-accent/50 text-accent-light'
                              : 'bg-dark-700 border-dark-600 text-dark-300 hover:border-dark-500'
                            }
                          `}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">
                  {mode === 'edu' ? 'מייל ארגוני' : 'אימייל'}
                  <span className="text-danger mr-1">*</span>
                </label>
                <input
                  type="text"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={mode === 'edu' ? 'name@edu.gov.il' : 'email@example.com'}
                  required
                  autoComplete="username"
                  className="w-full bg-dark-700 border border-dark-600 text-gray-100 rounded-lg px-3 py-2.5 text-sm
                    placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:border-accent focus:ring-accent/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">
                  סיסמה <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="לפחות 6 תווים"
                    required
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    className="w-full bg-dark-700 border border-dark-600 text-gray-100 rounded-lg px-3 py-2.5 text-sm
                      placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:border-accent focus:ring-accent/20 transition-all pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 flex items-center pl-3 text-dark-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-6"
                size="lg"
                loading={loading}
              >
                {mode === 'register' ? 'צור חשבון' : 'התחבר'}
              </Button>
            </form>

            {mode === 'edu' && (
              <button
                onClick={() => switchMode('login')}
                className="mt-4 w-full text-center text-sm text-dark-400 hover:text-dark-200 transition-colors"
              >
                חזור לאפשרויות התחברות
              </button>
            )}

            {mode !== 'edu' && (
              <p className="mt-5 text-center text-sm text-dark-400">
                {mode === 'login' ? 'אין לך חשבון?' : 'כבר יש לך חשבון?'}
                {' '}
                <button
                  onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                  className="text-accent-light hover:text-accent font-medium transition-colors"
                >
                  {mode === 'login' ? 'הירשם' : 'התחבר'}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
