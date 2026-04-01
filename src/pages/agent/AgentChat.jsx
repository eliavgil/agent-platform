import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRequest, updateRequest } from '../../lib/supabase'
import ChatWindow from '../../components/chat/ChatWindow'
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { ArrowRight, Download, PlayCircle, CheckCircle, Cpu } from 'lucide-react'

export default function AgentChat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    loadRequest()
  }, [id])

  const loadRequest = async () => {
    const { data } = await getRequest(id)
    setRequest(data)
    setLoading(false)
  }

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true)
    await updateRequest(id, { status: newStatus })
    loadRequest()
    setUpdatingStatus(false)
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
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate('/agent/requests')}>
          חזור לרשימה
        </Button>
      </div>
    )
  }

  const isClosed = request.status === 'completed' || request.status === 'cancelled'

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -mt-8 -mx-6">
      {/* Top Bar */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/agent/requests')}
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
              {request.ai_tools && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-600 rounded-full text-xs font-medium">
                  <Cpu size={11} />
                  {request.ai_tools}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{request.description}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
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

            {request.teacher && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg">
                <Avatar name={request.teacher.full_name} size="xs" />
                <div>
                  <p className="text-xs font-medium text-gray-800">{request.teacher.full_name}</p>
                  <p className="text-xs text-purple-500">מורה</p>
                </div>
              </div>
            )}

            {!isClosed && (
              <div className="flex gap-1.5">
                {request.status === 'assigned' && (
                  <Button
                    variant="outline"
                    size="md"
                    icon={<PlayCircle size={16} />}
                    loading={updatingStatus}
                    onClick={() => handleStatusChange('in_progress')}
                  >
                    התחל
                  </Button>
                )}
                {request.status === 'in_progress' && (
                  <Button
                    variant="success"
                    size="md"
                    icon={<CheckCircle size={16} />}
                    loading={updatingStatus}
                    onClick={() => handleStatusChange('completed')}
                  >
                    סיים
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden max-w-6xl mx-auto w-full px-6">
        <div className="h-full bg-white border-x border-gray-200">
          <ChatWindow
            requestId={id}
            disabled={isClosed}
            placeholder={`שלח הודעה ל-${request.teacher?.full_name || 'המורה'}...`}
            light={true}
          />
        </div>
      </div>
    </div>
  )
}
