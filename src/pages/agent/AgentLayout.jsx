import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'
import PageLayout from '../../components/layout/PageLayout'
import { List, GalleryHorizontal } from 'lucide-react'

const navItems = [
  {
    path: '/agent/requests',
    label: 'הבקשות שלי',
    icon: <List size={18} />,
    end: false,
  },
  {
    path: '/agent/outputs',
    label: 'התוצרים שלי',
    icon: <GalleryHorizontal size={18} />,
    end: false,
  },
]

export default function AgentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex">
      <Sidebar
        navItems={navItems}
        role="agent"
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <PageLayout onMenuOpen={() => setSidebarOpen(true)}>
        <Outlet />
      </PageLayout>
    </div>
  )
}
