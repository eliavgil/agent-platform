import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRequest } from '../../lib/supabase'
import ChatWindow from '../../components/chat/ChatWindow'
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import { ArrowRight, Download, Bot } from 'lucide-react'

// Parse file_url — supports plain URL (legacy) and JSON array [{url,name},…]
function parseAttachments(fileUrl, fileName) {
  if (!fileUrl) return []
  try {
    const parsed = JSON.parse(fileUrl)
    if (Array.isArray(parsed)) return parsed
  } catch {}
  return [{ url: fileUrl, name: fileName || 'קובץ מצורף' }]
}

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
        <p className="text-gray-400">הבקשה לא נמצאה</p>
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
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/teacher/requests')}
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
            <p className="text-xs text-gray-400 mt-0.5 truncate">{request.description}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {parseAttachments(request.file_url, request.file_name).map((f, i) => (
              <a
                key={i}
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-600 hover:text-gray-800 rounded-lg text-xs transition-colors"
              >
                <Download size={13} />
                {f.name || 'קובץ מצורף'}
              </a>
            ))}
            {request.agent ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                <Avatar name={request.agent.full_name} size="xs" />
                <div>
                  <p className="text-xs font-medium text-gray-800">{request.agent.full_name}</p>
                  <p className="text-xs text-blue-500">סוכן AI</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <Bot size={12} className="text-blue-400" />
                </div>
                <p className="text-xs text-blue-400">ממתין לסוכן</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden max-w-6xl mx-auto w-full px-6">
        <div className="h-full bg-white border-x border-gray-200">
          {isClosed ? (
            <div className="h-full flex flex-col">
              <ChatWindow requestId={id} disabled={true} light={true} />
              <div className="p-4 border-t border-gray-200 text-center">
                <span className="text-sm text-gray-400">
                  {request.status === 'completed' ? 'הבקשה הושלמה — השיחה נעולה' : 'הבקשה בוטלה'}
                </span>
              </div>
            </div>
          ) : (
            <ChatWindow
              requestId={id}
              placeholder={request.agent ? `שלח הודעה ל-${request.agent.full_name}...` : 'שלח הודעה...'}
              disabled={false}
              light={true}
            />
          )}
        </div>
      </div>
    </div>
  )
}
