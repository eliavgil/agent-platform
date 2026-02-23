import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRequest } from '../../lib/supabase'
import ChatWindow from '../../components/chat/ChatWindow'
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { ArrowRight, Download, Bot } from 'lucide-react'

export default function TeacherChat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequest()
  }, [id])

  const loadRequest = async () => {
    const { data } = await getRequest(id)
    setRequest(data)
    setLoading(false)
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
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate('/teacher/requests')}>
          חזור לרשימה
        </Button>
      </div>
    )
  }

  const isClosed = request.status === 'completed' || request.status === 'cancelled'

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -mt-8 -mx-6">
      {/* Top Bar */}
      <div className="flex-shrink-0 px-6 py-4 bg-dark-800 border-b border-dark-600/50">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/teacher/requests')}
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

          <div className="flex items-center gap-3">
            {request.file_url && (
              <a
                href={request.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-700 hover:bg-dark-600 border border-dark-500 text-dark-300 hover:text-gray-200 rounded-lg text-xs transition-colors"
              >
                <Download size={13} />
                קובץ מצורף
              </a>
            )}
            {request.agent ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-700 rounded-lg">
                <Avatar name={request.agent.full_name} size="xs" />
                <div>
                  <p className="text-xs font-medium text-gray-200">{request.agent.full_name}</p>
                  <p className="text-xs text-dark-400">סוכן AI</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-700 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-dark-600 flex items-center justify-center">
                  <Bot size={12} className="text-dark-400" />
                </div>
                <p className="text-xs text-dark-400">ממתין לסוכן</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden max-w-6xl mx-auto w-full px-6">
        <div className="h-full bg-dark-800 border-x border-dark-600/50">
          {isClosed ? (
            <div className="h-full flex flex-col">
              <ChatWindow requestId={id} disabled={true} />
              <div className="p-4 border-t border-dark-700 text-center">
                <span className="text-sm text-dark-400">
                  {request.status === 'completed' ? 'הבקשה הושלמה — השיחה נעולה' : 'הבקשה בוטלה'}
                </span>
              </div>
            </div>
          ) : (
            <ChatWindow
              requestId={id}
              placeholder={request.agent ? `שלח הודעה ל-${request.agent.full_name}...` : 'ממתין לשיבוץ סוכן...'}
              disabled={!request.agent_id}
            />
          )}
        </div>
      </div>
    </div>
  )
}
