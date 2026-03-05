import { useLocation } from 'react-router-dom'

export default function PageLayout({ children }) {
  const { pathname } = useLocation()
  const isRequestsPage = pathname.includes('/requests')
  return (
    <main className={`mr-64 min-h-screen ${isRequestsPage ? 'bg-gray-50' : 'bg-dark-900'}`}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </div>
    </main>
  )
}
