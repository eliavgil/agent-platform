export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-accent/20"></div>
          <div className="absolute inset-0 rounded-full border-t-2 border-accent animate-spin"></div>
          <div className="absolute inset-3 rounded-full bg-accent/10 flex items-center justify-center">
            <span className="text-accent text-xl">⚡</span>
          </div>
        </div>
        <p className="text-dark-300 text-sm">טוען...</p>
      </div>
    </div>
  )
}
