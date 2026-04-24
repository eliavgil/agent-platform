import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'
import PageLayout from '../../components/layout/PageLayout'
import { List, GalleryHorizontal, Users } from 'lucide-react'

const navItems = [
  { path: '/admin/requests', label: 'כל הבקשות', shortLabel: 'בקשות', icon: <List size={20} />, end: false },
  { path: '/admin/outputs',  label: 'תוצרים',    shortLabel: 'תוצרים', icon: <GalleryHorizontal size={20} />, end: false },
  { path: '/admin/users',    label: 'משתמשים',   shortLabel: 'משתמשים', icon: <Users size={20} />, end: false },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex">
      <Sidebar navItems={navItems} role="admin" mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <PageLayout navItems={navItems}>
        <Outlet />
      </PageLayout>
    </div>
  )
}
