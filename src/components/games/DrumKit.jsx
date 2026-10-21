import { useCallback, useEffect, useState } from 'react';
import GameCard, { playSound } from './GameCard';

// Same key → sound mapping as web dev/Drum Kit Starting Files.
const DRUMS = [
  { key: 'w', name: 'Tom 1', sound: 'tom-1', emoji: '🥁' },
  { key: 'a', name: 'Tom 2', sound: 'tom-2', emoji: '🥁' },
  { key: 's', name: 'Tom 3', sound: 'tom-3', emoji: '🥁' },
  { key: 'd', name: 'Tom 4', sound: 'tom-4', emoji: '🥁' },
  { key: 'j', name: 'Crash', sound: 'crash', emoji: '💥' },
  { key: 'k', name: 'Kick', sound: 'kick-bass', emoji: '🦶' },
  { key: 'l', name: 'Snare', sound: 'snare', emoji: '🪘' },
];

/** Drum Kit, ported from web dev/Drum Kit: tap pads or press W A S D J K L, with a volume control. */
export default function DrumKit() {
  const [volume, setVolume] = useState(0.5);
  const [active, setActive] = useState(null);
  const [hits, setHits] = useState(0);

  const hit = useCallback((key) => {
    const drum = DRUMS.find((d) => d.key === key);
    if (!drum) return;
    playSound(`/games/drums/${drum.sound}.mp3`, volume);
    setActive(key);
    setHits((h) => h + 1);
    setTimeout(() => setActive((current) => (current === key ? null : current)), 120);
  }, [volume]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.repeat || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
      hit(event.key.toLowerCase());
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [hit]);

  return (
    <GameCard
      icon="🥁"
      title="Drum Kit"
      subtitle="Tap a pad or use your keyboard. Let some energy out to a beat of your own."
      right={
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          Volume
          <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
        </label>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 10, marginBottom: 14 }}>
        {DRUMS.map(({ key, name, emoji }) => (
          <button
            key={key}
            type="button"
            onClick={() => hit(key)}
            style={{
              padding: '18px 8px', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontFamily: 'var(--font-body)',
              border: `1px solid ${active === key ? 'rgba(244,162,97,0.6)' : 'var(--color-border)'}`,
              background: active === key ? 'rgba(244,162,97,0.2)' : 'rgba(255,255,255,0.05)',
              transform: active === key ? 'scale(0.94)' : 'scale(1)', transition: 'all 0.1s ease',
              color: 'var(--color-text-primary)',
            }}
          >
            <div style={{ fontSize: '1.6rem' }}>{emoji}</div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', textTransform: 'uppercase' }}>{key}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{name}</div>
          </button>
        ))}
      </div>
      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>Beats played: {hits}</p>
    </GameCard>
  );
}
