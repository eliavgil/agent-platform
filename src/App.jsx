import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import TeacherLayout from './pages/teacher/TeacherLayout'
import TeacherToolLibrary from './pages/teacher/TeacherToolLibrary'
import TeacherNewRequest from './pages/teacher/TeacherNewRequest'
import TeacherRequests from './pages/teacher/TeacherRequests'
import TeacherChat from './pages/teacher/TeacherChat'

import AgentLayout from './pages/agent/AgentLayout'
import AgentRequests from './pages/agent/AgentRequests'
import AgentChat from './pages/agent/AgentChat'

import AdminLayout from './pages/admin/AdminLayout'
import AdminRequests from './pages/admin/AdminRequests'
import AdminChat from './pages/admin/AdminChat'

import OutputsPage from './pages/OutputsPage'
import LoadingScreen from './components/ui/LoadingScreen'

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) return <LoadingScreen />

  // If user is authenticated but profile hasn't loaded yet → prevent redirect loop
  if (user && !profile) return <LoadingScreen />

  const dashRoute =
    profile?.role === 'admin' ? '/admin' :
    profile?.role === 'agent' ? '/agent' : '/teacher'

  return (
    <Routes>
      {/* Public landing page — always visible, navbar handles logged-in state */}
      <Route path="/" element={<HomePage />} />
      <Route path="/outputs" element={<OutputsPage />} />

      {/* Auth */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage />} />

      {/* Teacher Routes */}
      <Route
        path="/teacher"
        element={user ? <RequireRole role="teacher"><TeacherLayout /></RequireRole> : <Navigate to="/login" replace />}
      >
        <Route index element={<Navigate to="tools" replace />} />
        <Route path="tools" element={<TeacherToolLibrary />} />
        <Route path="new-request" element={<TeacherNewRequest />} />
        <Route path="requests" element={<TeacherRequests />} />
        <Route path="requests/:id" element={<TeacherChat />} />
      </Route>

      {/* Agent Routes */}
      <Route
        path="/agent"
        element={user ? <RequireRole role="agent"><AgentLayout /></RequireRole> : <Navigate to="/login" replace />}
      >
        <Route index element={<Navigate to="requests" replace />} />
        <Route path="requests" element={<AgentRequests />} />
        <Route path="requests/:id" element={<AgentChat />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={user ? <RequireRole role="admin"><AdminLayout /></RequireRole> : <Navigate to="/login" replace />}
      >
        <Route index element={<Navigate to="requests" replace />} />
        <Route path="requests" element={<AdminRequests />} />
        <Route path="requests/:id" element={<AdminChat />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function RequireRole({ role, children }) {
  const { profile } = useAuth()
  // Admin can access everything
  if (profile?.role === 'admin') return children
  if (profile?.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
