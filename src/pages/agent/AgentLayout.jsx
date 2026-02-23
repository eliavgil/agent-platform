import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'
import PageLayout from '../../components/layout/PageLayout'
import { List, MessageSquare } from 'lucide-react'

const navItems = [
  {
    path: '/agent/requests',
    label: 'הבקשות שלי',
    icon: <List size={18} />,
    end: false,
  },
]

export default function AgentLayout() {
  return (
    <div className="flex">
      <Sidebar navItems={navItems} role="agent" />
      <PageLayout>
        <Outlet />
      </PageLayout>
    </div>
  )
}
