import { Player } from '@remotion/player'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'

function BrandedLoader() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const sc = spring({ frame, fps, config: { damping: 18, stiffness: 80 } })
  const logoScale   = interpolate(sc, [0, 1], [0, 1])
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' })

  // Continuous orbit angle
  const angle = (frame / 60) * 360
  const orbitR = 46

  // Soft pulse
  const pulse = Math.sin((frame / 30) * Math.PI) * 0.08 + 0.92

  return (
    <AbsoluteFill style={{ background: '#07080f', alignItems: 'center', justifyContent: 'center' }}>

      {/* Outer glow */}
      <div style={{
        position: 'absolute', width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%)',
        transform: `scale(${pulse})`,
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
      }} />

      {/* Orbit track */}
      <svg width="120" height="120" style={{ position: 'absolute' }}>
        <circle cx="60" cy="60" r={orbitR} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
      </svg>

      {/* Orbiting dot */}
      {(() => {
        const rad = (angle * Math.PI) / 180
        const dx  = Math.cos(rad) * orbitR
        const dy  = Math.sin(rad) * orbitR
        const dotOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: 'clamp' })
        return (
          <div style={{
            position: 'absolute',
            width: 10, height: 10, borderRadius: '50%',
            background: 'linear-gradient(135deg,#f97316,#ea580c)',
            boxShadow: '0 0 12px rgba(249,115,22,0.8)',
            transform: `translate(${dx}px, ${dy}px)`,
            opacity: dotOpacity,
          }} />
        )
      })()}

      {/* Logo */}
      <img src="/logo3.png" alt="Prometheus" style={{
        width: 52, height: 52, objectFit: 'contain',
        transform: `scale(${logoScale})`,
        opacity: logoOpacity,
        position: 'relative', zIndex: 1,
      }} />

      {/* Text */}
      <p style={{
        position: 'absolute', bottom: 50,
        color: 'rgba(255,255,255,0.4)', fontSize: 13,
        fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.12em',
        opacity: interpolate(frame, [20, 40], [0, 1], { extrapolateRight: 'clamp' }),
      }}>
        טוען...
      </p>
    </AbsoluteFill>
  )
}

export default function LoadingScreen() {
  return (
    <div style={{ background: '#07080f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Player
        component={BrandedLoader}
        durationInFrames={180}
        compositionWidth={400}
        compositionHeight={300}
        fps={60}
        style={{ width: 400, height: 300 }}
        loop
        autoPlay
      />
    </div>
  )
}
