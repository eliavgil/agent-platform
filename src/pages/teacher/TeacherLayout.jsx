import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'
import PageLayout from '../../components/layout/PageLayout'
import { Wand2, Plus, List, GalleryHorizontalEnd } from 'lucide-react'

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
]

export default function TeacherLayout() {
  return (
    <div className="flex">
      <Sidebar navItems={navItems} role="teacher" />
      <PageLayout>
        <Outlet />
      </PageLayout>
    </div>
  )
}
