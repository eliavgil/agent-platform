import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'
import PageLayout from '../../components/layout/PageLayout'
import { List, GalleryHorizontal, UserCircle } from 'lucide-react'

const navItems = [
  { path: '/agent/requests', label: 'הבקשות שלי',  shortLabel: 'בקשות',  icon: <List size={20} />, end: false },
  { path: '/agent/outputs',  label: 'התוצרים שלי', shortLabel: 'תוצרים', icon: <GalleryHorizontal size={20} />, end: false },
  { path: '/agent/profile',  label: 'הפרופיל שלי', shortLabel: 'פרופיל', icon: <UserCircle size={20} />, end: false },
]

export default function AgentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex">
      <Sidebar navItems={navItems} role="agent" mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <PageLayout navItems={navItems}>
        <Outlet />
      </PageLayout>
    </div>
  )
}
