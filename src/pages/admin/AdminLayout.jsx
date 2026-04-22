import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'
import PageLayout from '../../components/layout/PageLayout'
import { List, GalleryHorizontal, Users } from 'lucide-react'

const navItems = [
  {
    path: '/admin/requests',
    label: 'כל הבקשות',
    icon: <List size={18} />,
    end: false,
  },
  {
    path: '/admin/outputs',
    label: 'תוצרים',
    icon: <GalleryHorizontal size={18} />,
    end: false,
  },
  {
    path: '/admin/users',
    label: 'משתמשים',
    icon: <Users size={18} />,
    end: false,
  },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex">
      <Sidebar
        navItems={navItems}
        role="admin"
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <PageLayout onMenuOpen={() => setSidebarOpen(true)}>
        <Outlet />
      </PageLayout>
    </div>
  )
}
