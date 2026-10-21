import { useState } from 'react';
import { Plus } from 'lucide-react';
import GameCard, { inputStyle } from './GameCard';

const STARTER_WORRIES = ['Deadlines', 'Exams', 'Too much to do', 'Overthinking', 'Group project', 'Sleep'];
const RELEASE_MESSAGES = ['Let it float away 🌬️', 'One less thing to carry ✨', 'Breathe out slowly 🍃', 'You are doing your best 💜', 'Lighter already 🎈'];
const HUES = [260, 170, 200, 30, 320];

let nextId = 0;
const makeBubble = (text) => ({
  id: nextId++,
  text,
  left: 5 + Math.random() * 70, // % across the field
  size: 84 + Math.random() * 36,
  duration: 7 + Math.random() * 5, // seconds per float cycle
  delay: -Math.random() * 6, // start mid-float so bubbles don't move in lockstep
  hue: HUES[Math.floor(Math.random() * HUES.length)],
});

/** New calming game: write down worries, watch them float as bubbles, and pop them one by one. */
export default function WorryBubbles() {
  const [bubbles, setBubbles] = useState(() => STARTER_WORRIES.map(makeBubble));
  const [draft, setDraft] = useState('');
  const [popped, setPopped] = useState(0);
  const [message, setMessage] = useState('');

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    setBubbles((b) => [...b, makeBubble(text.slice(0, 30))]);
    setDraft('');
  };

  const pop = (id) => {
    setBubbles((b) => b.filter((bubble) => bubble.id !== id));
    setPopped((p) => p + 1);
    setMessage(RELEASE_MESSAGES[Math.floor(Math.random() * RELEASE_MESSAGES.length)]);
  };

  return (
    <GameCard icon="🫧" title="Worry Bubbles" subtitle="Add what is on your mind, then pop each bubble and let it go." right={<span style={{ fontSize: '0.8rem', color: 'var(--color-accent)' }}>Popped: {popped}</span>}>
      <style>{`
        @keyframes worry-float {
          0% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-150px) translateX(14px); }
          100% { transform: translateY(0) translateX(0); }
        }
      `}</style>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          aria-label="Add a worry"
          placeholder="What's worrying you? (not saved)"
          value={draft}
          maxLength={30}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
          style={{ ...inputStyle, flex: '1 1 200px' }}
        />
        <button type="button" className="btn btn-primary btn-sm" onClick={add}><Plus size={14} /> Add bubble</button>
      </div>
      <div style={{ position: 'relative', height: 300, overflow: 'hidden', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(180deg, rgba(124,92,191,0.08), rgba(94,207,177,0.08))', border: '1px solid var(--color-border)' }}>
        {bubbles.map((b) => (
          <button
            key={b.id}
            type="button"
            aria-label={`Pop worry: ${b.text}`}
            onClick={() => pop(b.id)}
            style={{
              position: 'absolute', bottom: 12, left: `${b.left}%`, width: b.size, height: b.size, borderRadius: '50%',
              border: `1px solid hsla(${b.hue}, 70%, 70%, 0.6)`,
              background: `radial-gradient(circle at 30% 30%, hsla(${b.hue}, 80%, 85%, 0.45), hsla(${b.hue}, 70%, 60%, 0.15))`,
              color: 'var(--color-text-primary)', fontSize: '0.75rem', fontWeight: 600, padding: 8, cursor: 'pointer',
              animation: `worry-float ${b.duration}s ease-in-out ${b.delay}s infinite`, fontFamily: 'var(--font-body)',
              overflowWrap: 'anywhere',
            }}
          >
            {b.text}
          </button>
        ))}
        {bubbles.length === 0 && (
          <div className="animate-fade-in-scale" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🌤️</div>
            <p style={{ fontWeight: 700, marginBottom: 4 }}>All clear.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 14 }}>Take one slow breath in… and out.</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setBubbles(STARTER_WORRIES.map(makeBubble))}>Refill bubbles</button>
          </div>
        )}
      </div>
      <p style={{ textAlign: 'center', minHeight: 22, marginTop: 12, color: 'var(--color-accent)', fontSize: '0.9rem' }}>{message}</p>
    </GameCard>
  );
}
