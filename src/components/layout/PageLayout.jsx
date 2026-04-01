export default function PageLayout({ children }) {
  return (
    <main className="mr-64 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </div>
    </main>
  )
}
