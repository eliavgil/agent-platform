import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getAgentRequests, updateRequest, subscribeToRequests } from '../../lib/supabase'
import Header from '../../components/layout/Header'
import Card, { CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import EmptyState from '../../components/ui/EmptyState'
import { MessageSquare, Clock, CheckCircle, PlayCircle, Download } from 'lucide-react'

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('he-IL', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const STATUS_LABELS = {
  assigned: 'הוקצה',
  in_progress: 'בטיפול',
  completed: 'הושלם',
}

export default function AgentRequests() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('active')
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    loadRequests()
    const channel = subscribeToRequests((payload) => {
      if (payload.new?.agent_id === user.id || payload.old?.agent_id === user.id) {
        loadRequests()
      }
    })
    return () => channel.unsubscribe()
  }, [])

  const loadRequests = async () => {
    const { data } = await getAgentRequests(user.id)
    setRequests(data || [])
    setLoading(false)
  }

  const handleStatusChange = async (id, newStatus, e) => {
    e.stopPropagation()
    setUpdatingId(id)
    await updateRequest(id, { status: newStatus })
    loadRequests()
    setUpdatingId(null)
  }

  const filtered = statusFilter === 'active'
    ? requests.filter(r => ['assigned', 'in_progress'].includes(r.status))
    : requests.filter(r => r.status === 'completed')

  const activeCount = requests.filter(r => ['assigned', 'in_progress'].includes(r.status)).length
  const completedCount = requests.filter(r => r.status === 'completed').length

  return (
    <>
      <Header
        title="הבקשות שלי"
        subtitle={`${activeCount} פעילות, ${completedCount} הושלמו`}
      />

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'active', label: 'פעילות', count: activeCount },
          { key: 'completed', label: 'הושלמו', count: completedCount },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              statusFilter === f.key
                ? 'bg-accent text-white'
                : 'bg-dark-800 border border-dark-600 text-dark-300 hover:border-dark-500'
            }`}
          >
            {f.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              statusFilter === f.key ? 'bg-white/20' : 'bg-dark-700'
            }`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-dark-800 rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-dark-700 rounded w-1/3 mb-2" />
              <div className="h-3 bg-dark-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={28} />}
          title={statusFilter === 'active' ? 'אין בקשות פעילות' : 'אין בקשות שהושלמו'}
          description={statusFilter === 'active' ? 'בקשות חדשות יופיעו כאן לאחר שיוקצו לך' : ''}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map(request => (
            <Card
              key={request.id}
              hover
              glow
              onClick={() => navigate(`/agent/requests/${request.id}`)}
            >
              <CardBody>
                <div className="flex items-start gap-4">
                  {/* Teacher info */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                    <Avatar
                      name={request.profiles?.full_name || '?'}
                      avatarUrl={request.profiles?.avatar_url}
                      size="md"
                    />
                    <span className="text-xs text-dark-500 text-center">
                      {request.profiles?.full_name?.split(' ')[0]}
                    </span>
                  </div>

                  {/* Request Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-white">
                        {request.subject} — {request.grade_level}
                      </h3>
                      <StatusBadge status={request.status} />
                      <PriorityBadge priority={request.priority} />
                    </div>
                    <p className="text-sm text-dark-400 line-clamp-2 mb-2">{request.description}</p>
                    <div className="flex items-center gap-4 text-xs text-dark-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(request.created_at)}
                      </span>
                      {request.ai_tools && (
                        <span>🤖 {request.ai_tools.name}</span>
                      )}
                      {request.file_url && (
                        <a
                          href={request.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-accent-light hover:text-accent"
                        >
                          <Download size={12} />
                          קובץ מצורף
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={<MessageSquare size={13} />}
                      onClick={() => navigate(`/agent/requests/${request.id}`)}
                    >
                      צ׳אט
                    </Button>
                    {request.status === 'assigned' && (
                      <Button
                        variant="outline"
                        size="xs"
                        icon={<PlayCircle size={13} />}
                        loading={updatingId === request.id}
                        onClick={(e) => handleStatusChange(request.id, 'in_progress', e)}
                      >
                        התחל
                      </Button>
                    )}
                    {request.status === 'in_progress' && (
                      <Button
                        variant="success"
                        size="xs"
                        icon={<CheckCircle size={13} />}
                        loading={updatingId === request.id}
                        onClick={(e) => handleStatusChange(request.id, 'completed', e)}
                      >
                        סיים
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
