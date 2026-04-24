import { NavLink } from 'react-router-dom'

export default function PageLayout({ children, navItems = [] }) {
  return (
    <main className="md:mr-64 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-24 md:pb-8">
        {children}
      </div>

      {/* Mobile bottom nav */}
      {navItems.length > 0 && (
        <nav className="fixed bottom-0 right-0 left-0 z-40 md:hidden bg-white border-t border-gray-200 flex"
             dir="rtl">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={isActive ? 'text-indigo-600' : 'text-gray-400'}>
                    {item.icon}
                  </span>
                  <span className="leading-tight text-center" style={{ fontSize: '10px' }}>
                    {item.shortLabel || item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </main>
  )
}
