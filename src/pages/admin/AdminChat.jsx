import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRequest, updateRequest, getAgents } from '../../lib/supabase'
import ChatWindow from '../../components/chat/ChatWindow'
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Select } from '../../components/ui/Input'
import {
  ArrowRight, Download, UserCheck, Settings,
  CheckCircle, XCircle, PlayCircle
} from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'ממתין' },
  { value: 'assigned', label: 'הוקצה' },
  { value: 'in_progress', label: 'בטיפול' },
  { value: 'completed', label: 'הושלם' },
  { value: 'cancelled', label: 'בוטל' },
]

export default function AdminChat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showManage, setShowManage] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [updating, setUpdating] = useState(false)
  const [manageError, setManageError] = useState('')

  useEffect(() => {
    Promise.all([loadRequest(), getAgents().then(({ data }) => setAgents(data || []))])
  }, [id])

  const loadRequest = async () => {
    const { data } = await getRequest(id)
    setRequest(data)
    if (data) {
      setSelectedAgent(data.agent_id || '')
      setSelectedStatus(data.status)
    }
    setLoading(false)
  }

  const handleSaveManage = async () => {
    setUpdating(true)
    setManageError('')
    const updates = {}
    if (selectedAgent !== request.agent_id) {
      updates.agent_id = selectedAgent || null
      if (selectedAgent && request.status === 'pending') {
        updates.status = 'assigned'
      }
    }
    if (selectedStatus !== request.status) {
      updates.status = selectedStatus
    }
    if (Object.keys(updates).length > 0) {
      const { error } = await updateRequest(id, updates)
      if (error) {
        console.error('[AdminChat] handleSaveManage error:', error)
        setManageError('שגיאה בעדכון הבקשה. ייתכן שחסרות הרשאות — נסה שוב.')
        setUpdating(false)
        return
      }
      await loadRequest()
    }
    setUpdating(false)
    setShowManage(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="text-center py-20">
        <p className="text-dark-400">הבקשה לא נמצאה</p>
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate('/admin/requests')}>
          חזור לרשימה
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -mt-8 -mx-6">
      {/* Top Bar */}
      <div className="flex-shrink-0 px-6 py-4 bg-dark-800 border-b border-dark-600/50">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/requests')}
            className="p-2 rounded-xl hover:bg-dark-700 text-dark-400 hover:text-gray-200 transition-colors"
          >
            <ArrowRight size={18} />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-white text-base">
                {request.subject} — {request.grade_level}
              </h1>
              <StatusBadge status={request.status} />
              <PriorityBadge priority={request.priority} />
            </div>
            <p className="text-xs text-dark-400 mt-0.5 truncate">{request.description}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {request.file_url && (
              <a
                href={request.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-700 hover:bg-dark-600 border border-dark-500 text-dark-300 hover:text-gray-200 rounded-lg text-xs transition-colors"
              >
                <Download size={13} />
                קובץ
              </a>
            )}

            {/* Participants */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-700 rounded-lg">
              {request.teacher && (
                <div className="flex items-center gap-1.5">
                  <Avatar name={request.teacher.full_name} size="xs" />
                  <div>
                    <p className="text-xs text-dark-400">מורה</p>
                    <p className="text-xs font-medium text-gray-200">{request.teacher.full_name}</p>
                  </div>
                </div>
              )}
              <div className="w-px h-6 bg-dark-600 mx-1" />
              {request.agent ? (
                <div className="flex items-center gap-1.5">
                  <Avatar name={request.agent.full_name} size="xs" />
                  <div>
                    <p className="text-xs text-dark-400">סוכן</p>
                    <p className="text-xs font-medium text-gray-200">{request.agent.full_name}</p>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-warning">לא הוקצה סוכן</span>
              )}
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={<Settings size={14} />}
              onClick={() => setShowManage(true)}
            >
              נהל
            </Button>
          </div>
        </div>
      </div>

      {/* Chat - Read-only for admin (viewing only) */}
      <div className="flex-1 overflow-hidden max-w-6xl mx-auto w-full px-6">
        <div className="h-full bg-dark-800 border-x border-dark-600/50 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <ChatWindow requestId={id} disabled={false} placeholder="שלח הודעה כמנהל..." />
          </div>
          <div className="px-4 py-2 border-t border-dark-700 flex items-center gap-2">
            <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
              👁 מצב מנהל — הודעות שלך יסומנו
            </span>
          </div>
        </div>
      </div>

      {/* Manage Modal */}
      <Modal
        isOpen={showManage}
        onClose={() => setShowManage(false)}
        title="ניהול בקשה"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-dark-700 rounded-xl text-sm">
            <p className="font-medium text-white">{request.subject} — {request.grade_level}</p>
            <p className="text-dark-400 text-xs mt-0.5">מורה: {request.teacher?.full_name}</p>
          </div>

          <Select
            label="הקצה סוכן"
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
          >
            <option value="">ללא סוכן</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.full_name}</option>
            ))}
          </Select>

          <Select
            label="סטטוס"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>

          {manageError && (
            <p className="text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
              {manageError}
            </p>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => { setShowManage(false); setManageError('') }}>
              ביטול
            </Button>
            <Button onClick={handleSaveManage} loading={updating}>
              שמור
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
