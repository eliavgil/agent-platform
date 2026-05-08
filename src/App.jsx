import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoadingScreen from './components/ui/LoadingScreen'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

// Always in main bundle — shown immediately on load
import HomePage    from './pages/HomePage'
import AuthPage    from './pages/AuthPage'

// Lazy — only loaded when the user navigates there
const OutputsPage  = lazy(() => import('./pages/OutputsPage'))
const AboutPage    = lazy(() => import('./pages/AboutPage'))
const RemotionDemo = lazy(() => import('./pages/RemotionDemo'))

const TeacherLayout     = lazy(() => import('./pages/teacher/TeacherLayout'))
const TeacherNewRequest = lazy(() => import('./pages/teacher/TeacherNewRequest'))
const TeacherRequests   = lazy(() => import('./pages/teacher/TeacherRequests'))
const TeacherChat       = lazy(() => import('./pages/teacher/TeacherChat'))
const TeacherProfile    = lazy(() => import('./pages/teacher/TeacherProfile'))

const AgentLayout   = lazy(() => import('./pages/agent/AgentLayout'))
const AgentRequests = lazy(() => import('./pages/agent/AgentRequests'))
const AgentChat     = lazy(() => import('./pages/agent/AgentChat'))
const AgentOutputs  = lazy(() => import('./pages/agent/AgentOutputs'))
const AgentProfile  = lazy(() => import('./pages/agent/AgentProfile'))

const AdminLayout   = lazy(() => import('./pages/admin/AdminLayout'))
const AdminRequests = lazy(() => import('./pages/admin/AdminRequests'))
const AdminChat     = lazy(() => import('./pages/admin/AdminChat'))
const AdminOutputs  = lazy(() => import('./pages/admin/AdminOutputs'))
const AdminUsers    = lazy(() => import('./pages/admin/AdminUsers'))

const Fallback = <LoadingScreen />

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (user && !profile) return <LoadingScreen />

  const dashRoute =
    profile?.role === 'admin' ? '/admin' :
    profile?.role === 'agent' ? '/agent' : '/teacher'

  return (
    <Suspense fallback={Fallback}>
      <Routes>
        {/* Public */}
        <Route path="/"            element={<HomePage />} />
        <Route path="/outputs"     element={<OutputsPage />} />
        <Route path="/about"       element={<AboutPage />} />
        <Route path="/remotion-demo" element={<RemotionDemo />} />

        {/* Auth */}
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage />} />

        {/* Teacher */}
        <Route
          path="/teacher"
          element={user ? <RequireRole role="teacher"><TeacherLayout /></RequireRole> : <Navigate to="/login" replace />}
        >
          <Route index element={<Navigate to="new-request" replace />} />
          <Route path="new-request" element={<TeacherNewRequest />} />
          <Route path="requests"    element={<TeacherRequests />} />
          <Route path="requests/:id" element={<TeacherChat />} />
          <Route path="profile"     element={<TeacherProfile />} />
        </Route>

        {/* Agent */}
        <Route
          path="/agent"
          element={user ? <RequireRole role="agent"><AgentLayout /></RequireRole> : <Navigate to="/login" replace />}
        >
          <Route index element={<Navigate to="requests" replace />} />
          <Route path="requests"     element={<AgentRequests />} />
          <Route path="requests/:id" element={<AgentChat />} />
          <Route path="outputs"      element={<AgentOutputs />} />
          <Route path="profile"      element={<AgentProfile />} />
        </Route>

        {/* Admin */}
        <Route
          path="/admin"
          element={user ? <RequireRole role="admin"><AdminLayout /></RequireRole> : <Navigate to="/login" replace />}
        >
          <Route index element={<Navigate to="requests" replace />} />
          <Route path="requests"     element={<AdminRequests />} />
          <Route path="requests/:id" element={<AdminChat />} />
          <Route path="outputs"      element={<AdminOutputs />} />
          <Route path="users"        element={<AdminUsers />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

function RequireRole({ role, children }) {
  const { profile } = useAuth()
  if (profile?.role === 'admin') return children
  if (profile?.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
