import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'
import PageLayout from '../../components/layout/PageLayout'
import { Plus, List, GalleryHorizontalEnd, UserCircle } from 'lucide-react'

const navItems = [
  { path: '/outputs',              label: 'ספריית תוצרים', shortLabel: 'תוצרים', icon: <GalleryHorizontalEnd size={20} />, end: false },
  { path: '/teacher/new-request', label: 'בקשה חדשה',     shortLabel: 'בקשה',   icon: <Plus size={20} />, end: false },
  { path: '/teacher/requests',    label: 'הבקשות שלי',    shortLabel: 'הבקשות', icon: <List size={20} />, end: false },
  { path: '/teacher/profile',     label: 'הפרופיל שלי',   shortLabel: 'פרופיל', icon: <UserCircle size={20} />, end: false },
]

export default function TeacherLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex">
      <Sidebar navItems={navItems} role="teacher" mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <PageLayout navItems={navItems}>
        <Outlet />
      </PageLayout>
    </div>
  )
}
