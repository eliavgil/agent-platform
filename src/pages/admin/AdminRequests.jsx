import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllRequests, getAgents, updateRequest, subscribeToRequests } from '../../lib/supabase'
import Header from '../../components/layout/Header'
import Card, { CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { Select } from '../../components/ui/Input'
import {
  MessageSquare, Clock, Users, CheckSquare, AlertTriangle,
  Hourglass, Search, Filter, UserCheck
} from 'lucide-react'

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('he-IL', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_FILTERS = ['הכל', 'pending', 'assigned', 'in_progress', 'completed', 'cancelled']
const STATUS_LABELS_MAP = {
  'הכל': 'הכל',
  pending: 'ממתין',
  assigned: 'הוקצה',
  in_progress: 'בטיפול',
  completed: 'הושלם',
  cancelled: 'בוטל',
}

export default function AdminRequests() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('הכל')
  const [search, setSearch] = useState('')
  const [assignModal, setAssignModal] = useState(null) // request to assign
  const [selectedAgent, setSelectedAgent] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState('')

  useEffect(() => {
    loadData()
    const channel = subscribeToRequests(() => loadRequests())
    return () => channel.unsubscribe()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [reqResult, agentResult] = await Promise.all([getAllRequests(), getAgents()])
    if (reqResult.error) console.error('[AdminRequests] getAllRequests error:', reqResult.error)
    if (agentResult.error) console.error('[AdminRequests] getAgents error:', agentResult.error)
    setRequests(reqResult.data || [])
    setAgents(agentResult.data || [])
    setLoading(false)
  }

  const loadRequests = async () => {
    const { data, error } = await getAllRequests()
    if (error) console.error('[AdminRequests] loadRequests error:', error)
    setRequests(data || [])
  }

  const handleAssign = async () => {
    if (!selectedAgent) return
    setAssigning(true)
    setAssignError('')
    const { error } = await updateRequest(assignModal.id, {
      agent_id: selectedAgent,
      status: 'assigned',
    })
    if (error) {
      console.error('[AdminRequests] handleAssign error:', error)
      setAssignError('שגיאה בהקצאת הסוכן. ייתכן שחסרות הרשאות — נסה שוב.')
      setAssigning(false)
      return
    }
    setAssignModal(null)
    setSelectedAgent('')
    loadRequests()
    setAssigning(false)
  }

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    active: requests.filter(r => ['assigned', 'in_progress'].includes(r.status)).length,
    completed: requests.filter(r => r.status === 'completed').length,
  }

  const filtered = requests.filter(r => {
    const matchStatus = statusFilter === 'הכל' || r.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      r.subject?.toLowerCase().includes(q) ||
      r.grade_level?.toLowerCase().includes(q) ||
      r.teacher?.full_name?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  return (
    <>
      <Header
        title="ניהול בקשות"
        subtitle="כל הבקשות במערכת"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'סה"כ', value: stats.total, icon: <Users size={18} />, color: 'text-dark-300' },
          { label: 'ממתינות', value: stats.pending, icon: <Hourglass size={18} />, color: 'text-warning' },
          { label: 'פעילות', value: stats.active, icon: <AlertTriangle size={18} />, color: 'text-accent-light' },
          { label: 'הושלמו', value: stats.completed, icon: <CheckSquare size={18} />, color: 'text-success' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardBody className="flex items-center gap-3 py-3">
              <div className={`${stat.color} flex-shrink-0`}>{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-dark-400">{stat.label}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute top-1/2 right-3 -translate-y-1/2 text-dark-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי מורה, מקצוע, תיאור..."
            className="w-full bg-dark-800 border border-dark-600 text-gray-100 rounded-xl px-3 py-2.5 pr-9 text-sm
              placeholder:text-dark-400 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === status
                  ? 'bg-accent text-white'
                  : 'bg-dark-800 border border-dark-600 text-dark-300 hover:border-dark-500'
              }`}
            >
              {STATUS_LABELS_MAP[status]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-dark-800 rounded-xl p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={28} />}
          title="לא נמצאו בקשות"
          description="נסה לשנות את הסינון"
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(request => (
            <Card
              key={request.id}
              hover
              onClick={() => navigate(`/admin/requests/${request.id}`)}
            >
              <CardBody className="py-3">
                <div className="flex items-center gap-4">
                  {/* Teacher */}
                  <div className="flex items-center gap-2 w-36 flex-shrink-0">
                    <Avatar name={request.teacher?.full_name || '?'} size="xs" />
                    <span className="text-xs text-dark-300 truncate">{request.teacher?.full_name}</span>
                  </div>

                  {/* Subject & Grade */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">
                        {request.subject} — {request.grade_level}
                      </span>
                      <StatusBadge status={request.status} />
                      <PriorityBadge priority={request.priority} />
                    </div>
                    <p className="text-xs text-dark-400 truncate mt-0.5">{request.description}</p>
                  </div>

                  {/* Agent */}
                  <div className="w-36 flex-shrink-0">
                    {request.agent ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={request.agent.full_name} size="xs" />
                        <span className="text-xs text-dark-300 truncate">{request.agent.full_name}</span>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setAssignModal(request)
                          setSelectedAgent('')
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-warning/10 border border-warning/30 text-warning text-xs hover:bg-warning/20 transition-colors"
                      >
                        <UserCheck size={12} />
                        הקצה סוכן
                      </button>
                    )}
                  </div>

                  {/* Date */}
                  <div className="text-xs text-dark-500 flex-shrink-0 w-28 text-left">
                    {formatDate(request.created_at)}
                  </div>

                  {/* Actions */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={<MessageSquare size={13} />}
                      onClick={() => navigate(`/admin/requests/${request.id}`)}
                    >
                      שיחה
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Agent Modal */}
      <Modal
        isOpen={!!assignModal}
        onClose={() => { setAssignModal(null); setSelectedAgent(''); setAssignError('') }}
        title={`הקצה סוכן לבקשה`}
        size="sm"
      >
        {assignModal && (
          <div className="space-y-4">
            <div className="p-3 bg-dark-700 rounded-xl">
              <p className="text-sm font-medium text-white">{assignModal.subject} — {assignModal.grade_level}</p>
              <p className="text-xs text-dark-400 mt-0.5 line-clamp-2">{assignModal.description}</p>
            </div>
            <Select
              label="בחר סוכן"
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
            >
              <option value="">בחר סוכן...</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.full_name}</option>
              ))}
            </Select>
            {assignError && (
              <p className="text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
                {assignError}
              </p>
            )}
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="secondary" onClick={() => { setAssignModal(null); setSelectedAgent(''); setAssignError('') }}>
                ביטול
              </Button>
              <Button
                onClick={handleAssign}
                disabled={!selectedAgent}
                loading={assigning}
                icon={<UserCheck size={15} />}
              >
                הקצה
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
