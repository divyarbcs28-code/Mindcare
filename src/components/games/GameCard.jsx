/** Card frame shared by the Fun Zone games, matching the existing glass-card game layout. */
export default function GameCard({ icon, title, subtitle, right, children }) {
  return (
    <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: subtitle ? 6 : 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.5rem' }}>{icon}</span>
          <h3 className="font-display" style={{ fontSize: '1rem', margin: 0 }}>{title}</h3>
        </div>
        {right}
      </div>
      {subtitle && <p style={{ fontSize: '0.83rem', color: 'var(--color-text-muted)', marginBottom: 20 }}>{subtitle}</p>}
      {children}
    </div>
  );
}

export const panelStyle = {
  padding: 20,
  background: 'rgba(255,255,255,0.04)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
};

export const inputStyle = {
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--color-text-primary)',
  fontFamily: 'inherit',
  fontSize: '0.95rem',
  outline: 'none',
};

/** Play a sound from /public, ignoring autoplay or decoding errors. */
export function playSound(src, volume = 0.5) {
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.play().catch(() => {});
  } catch { /* audio unavailable */ }
}
