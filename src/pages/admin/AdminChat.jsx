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
        <p className="text-gray-400">הבקשה לא נמצאה</p>
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate('/admin/requests')}>
          חזור לרשימה
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -mt-8 -mx-6">
      {/* Top Bar */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/requests')}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ArrowRight size={18} />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-gray-900 text-base">
                {request.subject} — {request.grade_level}
              </h1>
              <StatusBadge status={request.status} />
              <PriorityBadge priority={request.priority} />
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{request.description}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {request.file_url && (
              <a
                href={request.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-600 hover:text-gray-800 rounded-lg text-xs transition-colors"
              >
                <Download size={13} />
                קובץ
              </a>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
              {request.teacher && (
                <div className="flex items-center gap-1.5">
                  <Avatar name={request.teacher.full_name} size="xs" />
                  <div>
                    <p className="text-xs text-gray-400">מורה</p>
                    <p className="text-xs font-medium text-gray-800">{request.teacher.full_name}</p>
                  </div>
                </div>
              )}
              <div className="w-px h-6 bg-gray-200 mx-1" />
              {request.agent ? (
                <div className="flex items-center gap-1.5">
                  <Avatar name={request.agent.full_name} size="xs" />
                  <div>
                    <p className="text-xs text-gray-400">סוכן</p>
                    <p className="text-xs font-medium text-gray-800">{request.agent.full_name}</p>
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

      {/* Chat */}
      <div className="flex-1 overflow-hidden max-w-6xl mx-auto w-full px-6">
        <div className="h-full bg-white border-x border-gray-200 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <ChatWindow requestId={id} disabled={false} placeholder="שלח הודעה כמנהל..." light={true} />
          </div>
          <div className="px-4 py-2 border-t border-gray-200 flex items-center gap-2">
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
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
        variant="light"
      >
        <div className="space-y-4">
          <div className="p-3 bg-gray-100 rounded-xl text-sm">
            <p className="font-medium text-gray-900">{request.subject} — {request.grade_level}</p>
            <p className="text-gray-500 text-xs mt-0.5">מורה: {request.teacher?.full_name}</p>
          </div>

          <Select
            label="הקצה סוכן"
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            variant="light"
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
            variant="light"
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
