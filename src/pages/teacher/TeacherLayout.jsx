import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'
import PageLayout from '../../components/layout/PageLayout'
import { Plus, List, GalleryHorizontalEnd, UserCircle } from 'lucide-react'

const navItems = [
  {
    path: '/outputs',
    label: 'ספריית תוצרים',
    icon: <GalleryHorizontalEnd size={18} />,
    end: false,
  },
  {
    path: '/teacher/new-request',
    label: 'בקשה חדשה',
    icon: <Plus size={18} />,
    end: false,
  },
  {
    path: '/teacher/requests',
    label: 'הבקשות שלי',
    icon: <List size={18} />,
    end: false,
  },
  {
    path: '/teacher/profile',
    label: 'הפרופיל שלי',
    icon: <UserCircle size={18} />,
    end: false,
  },
]

export default function TeacherLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex">
      <Sidebar
        navItems={navItems}
        role="teacher"
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <PageLayout onMenuOpen={() => setSidebarOpen(true)}>
        <Outlet />
      </PageLayout>
    </div>
  )
}
