import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getTeacherRequests } from '../../lib/supabase'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import Card, { CardBody } from '../../components/ui/Card'
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import EmptyState from '../../components/ui/EmptyState'
import { Plus, MessageSquare, Clock, Filter } from 'lucide-react'

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const STATUS_FILTERS = ['הכל', 'pending', 'assigned', 'in_progress', 'completed', 'cancelled']
const STATUS_LABELS = {
  'הכל': 'הכל',
  pending: 'ממתין',
  assigned: 'הוקצה',
  in_progress: 'בטיפול',
  completed: 'הושלם',
  cancelled: 'בוטל',
}

export default function TeacherRequests() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('הכל')

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    setLoading(true)
    const { data } = await getTeacherRequests(user.id)
    setRequests(data || [])
    setLoading(false)
  }

  const filtered = statusFilter === 'הכל'
    ? requests
    : requests.filter(r => r.status === statusFilter)

  return (
    <>
      <Header
        title="הבקשות שלי"
        subtitle={`${requests.length} בקשות סה"כ`}
        actions={
          <Button
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => navigate('/teacher/new-request')}
          >
            בקשה חדשה
          </Button>
        }
      />

      {/* Status Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map(status => {
          const count = status === 'הכל'
            ? requests.length
            : requests.filter(r => r.status === status).length
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                statusFilter === status
                  ? 'bg-accent text-white'
                  : 'bg-dark-800 border border-dark-600 text-dark-300 hover:border-dark-500'
              }`}
            >
              {STATUS_LABELS[status]}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  statusFilter === status ? 'bg-white/20' : 'bg-dark-700'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-dark-800 rounded-xl p-5 animate-pulse">
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="h-4 bg-dark-700 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-dark-700 rounded w-2/3" />
                </div>
                <div className="h-6 bg-dark-700 rounded-full w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={28} />}
          title={statusFilter === 'הכל' ? 'אין בקשות עדיין' : 'אין בקשות בסטטוס זה'}
          description="צור בקשה חדשה ותחובר עם סוכן AI מתאים"
          action={
            statusFilter === 'הכל' ? (
              <Button icon={<Plus size={16} />} onClick={() => navigate('/teacher/new-request')}>
                בקשה חדשה
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(request => (
            <Card
              key={request.id}
              hover
              glow
              onClick={() => navigate(`/teacher/requests/${request.id}`)}
            >
              <CardBody>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-white text-base">
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
                        <span className="flex items-center gap-1">
                          🤖 {request.ai_tools.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {request.profiles ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={request.profiles.full_name} size="sm" />
                        <span className="text-xs text-dark-400">{request.profiles.full_name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-dark-500 bg-dark-700 px-2 py-1 rounded-lg">
                        ממתין לסוכן
                      </span>
                    )}
                    <Button variant="ghost" size="xs" icon={<MessageSquare size={13} />}>
                      צ׳אט
                    </Button>
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
