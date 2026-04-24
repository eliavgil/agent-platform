import { NavLink } from 'react-router-dom'

export default function PageLayout({ children, navItems = [] }) {
  const hasMobileNav = navItems.length > 0

  return (
    <main className="md:mr-64 min-h-screen bg-gray-50">
      {/* Content — extra bottom padding on mobile so bottom nav doesn't overlap */}
      <div
        className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8"
        style={{ paddingBottom: hasMobileNav ? 'calc(4rem + env(safe-area-inset-bottom, 0px))' : undefined }}
      >
        {children}
      </div>

      {/* Mobile bottom nav — hidden on md+ */}
      {hasMobileNav && (
        <nav
          className="fixed bottom-0 right-0 left-0 z-50 md:hidden flex bg-white border-t border-gray-200"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          dir="rtl"
        >
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-gray-400'
                }`
              }
            >
              {item.icon}
              <span style={{ fontSize: '10px', lineHeight: 1.2 }}>
                {item.shortLabel || item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      )}
    </main>
  )
}
