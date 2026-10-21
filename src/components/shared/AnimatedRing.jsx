/**
 * Animated pulsing ring for the voice recorder button
 */
export default function AnimatedRing({ active, children, size = 100 }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {active && (
        <>
          <div style={{
            position: 'absolute', inset: -12,
            borderRadius: '50%',
            border: '2px solid rgba(124,92,191,0.5)',
            animation: 'pulse-ring 1.4s ease-in-out infinite',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute', inset: -24,
            borderRadius: '50%',
            border: '2px solid rgba(124,92,191,0.2)',
            animation: 'pulse-ring 1.4s ease-in-out infinite 0.3s',
            pointerEvents: 'none'
          }} />
        </>
      )}
      {children}
    </div>
  );
}
