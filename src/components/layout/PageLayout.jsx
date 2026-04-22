import { Menu } from 'lucide-react'

export default function PageLayout({ children, onMenuOpen }) {
  return (
    <main className="md:mr-64 min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="sticky top-0 z-20 md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <span className="text-sm font-bold text-gray-900">פלטפורמת AI</span>
        <button
          onClick={onMenuOpen}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="פתח תפריט"
        >
          <Menu size={20} className="text-gray-600" />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {children}
      </div>
    </main>
  )
}
