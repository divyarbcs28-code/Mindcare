/**
 * Animated colored dot with label for pattern display
 */
export default function PatternDot({ color, label, sublabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 12, height: 12,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 10px ${color}88`,
        flexShrink: 0
      }} />
      <div>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>{label}</p>
        {sublabel && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>{sublabel}</p>}
      </div>
    </div>
  );
}
