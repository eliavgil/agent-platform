export default function LoadingScreen() {
  return (
    <div style={{
      background: '#07080f', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <style>{`
        @keyframes ls-orbit {
          from { transform: rotate(0deg) translateX(46px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(46px) rotate(-360deg); }
        }
        @keyframes ls-pulse {
          0%, 100% { transform: scale(0.92); opacity: 0.6; }
          50%       { transform: scale(1.0);  opacity: 1;   }
        }
        @keyframes ls-fadein {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1);   }
        }
        @keyframes ls-text {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* Outer glow */}
        <div style={{
          position: 'absolute', width: 160, height: 160, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.22) 0%, transparent 70%)',
          animation: 'ls-pulse 2s ease-in-out infinite',
        }} />

        {/* Orbit track */}
        <svg width="120" height="120" style={{ position: 'absolute' }}>
          <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
        </svg>

        {/* Orbiting dot */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          marginTop: -5, marginLeft: -5,
          width: 10, height: 10, borderRadius: '50%',
          background: 'linear-gradient(135deg,#f97316,#ea580c)',
          boxShadow: '0 0 12px rgba(249,115,22,0.8)',
          animation: 'ls-orbit 1.4s linear infinite',
          transformOrigin: '5px 5px',
        }} />

        {/* Logo */}
        <img src="/logo3.png" alt="Prometheus" style={{
          width: 52, height: 52, objectFit: 'contain',
          position: 'relative', zIndex: 1,
          animation: 'ls-fadein 0.5s ease-out forwards',
        }} />
      </div>

      {/* Text */}
      <p style={{
        position: 'absolute', bottom: 48,
        color: 'rgba(255,255,255,0.4)', fontSize: 13,
        fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.12em',
        animation: 'ls-text 0.6s 0.4s ease-out forwards',
        opacity: 0,
      }}>
        טוען...
      </p>
    </div>
  )
}
