import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import GameCard, { playSound } from './GameCard';

const PADS = [
  { id: 'green', color: '#2ECC71' },
  { id: 'red', color: '#E74C3C' },
  { id: 'yellow', color: '#F1C40F' },
  { id: 'blue', color: '#3498DB' },
];
const STEP_MS = 600;

/**
 * Simon, ported from web dev/Simon Game Challenge with a gentler flow: the whole sequence replays each
 * level, sound is optional, and a mistake ends the round softly instead of a "Game Over" screen.
 */
export default function SimonGame() {
  const [sequence, setSequence] = useState([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | showing | input | missed
  const [lit, setLit] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const [best, setBest] = useState(0);
  const timers = useRef([]);

  const flash = (id) => {
    setLit(id);
    if (soundOn) playSound(`/games/simon/${id}.mp3`, 0.4);
    timers.current.push(setTimeout(() => setLit(null), STEP_MS / 2));
  };

  const showSequence = (seq) => {
    setPhase('showing');
    seq.forEach((id, i) => timers.current.push(setTimeout(() => flash(id), 500 + i * STEP_MS)));
    timers.current.push(setTimeout(() => { setPhase('input'); setInputIndex(0); }, 500 + seq.length * STEP_MS));
  };

  const nextLevel = (seq) => {
    const next = [...seq, PADS[Math.floor(Math.random() * PADS.length)].id];
    setSequence(next);
    showSequence(next);
  };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const press = (id) => {
    if (phase !== 'input') return;
    flash(id);
    if (sequence[inputIndex] !== id) {
      if (soundOn) playSound('/games/simon/wrong.mp3', 0.25);
      setBest((b) => Math.max(b, sequence.length - 1));
      setPhase('missed');
      return;
    }
    if (inputIndex + 1 === sequence.length) {
      setBest((b) => Math.max(b, sequence.length));
      setPhase('showing');
      timers.current.push(setTimeout(() => nextLevel(sequence), 700));
    } else {
      setInputIndex(inputIndex + 1);
    }
  };

  const start = () => { timers.current.forEach(clearTimeout); timers.current = []; nextLevel([]); };

  const message = {
    idle: 'Watch the pads light up, then repeat the pattern.',
    showing: 'Watch carefully…',
    input: `Your turn: ${inputIndex} / ${sequence.length}`,
    missed: `Not quite! You remembered ${Math.max(0, sequence.length - 1)} in a row. Have another go?`,
  }[phase];

  return (
    <GameCard
      icon="🎶"
      title="Simon Says"
      right={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {best > 0 && <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)' }}>Best: {best}</span>}
          <button type="button" className="btn btn-secondary btn-sm" aria-label={soundOn ? 'Mute sounds' : 'Turn sounds on'} onClick={() => setSoundOn(!soundOn)}>
            {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>
      }
    >
      <p style={{ textAlign: 'center', fontWeight: 600, marginBottom: 6 }}>{phase === 'idle' ? 'Memory sequence' : `Level ${sequence.length}`}</p>
      <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 18 }}>{message}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, width: '100%', maxWidth: 280, margin: '0 auto 18px' }}>
        {PADS.map(({ id, color }) => (
          <button
            key={id}
            type="button"
            aria-label={`${id} pad`}
            onClick={() => press(id)}
            style={{
              aspectRatio: '1', borderRadius: 'var(--radius-lg)', border: 'none', background: color,
              opacity: lit === id ? 1 : 0.35,
              transform: lit === id ? 'scale(0.96)' : 'scale(1)',
              boxShadow: lit === id ? `0 0 28px ${color}` : 'none',
              cursor: phase === 'input' ? 'pointer' : 'default', transition: 'all 0.15s ease',
            }}
          />
        ))}
      </div>
      {(phase === 'idle' || phase === 'missed') && (
        <div style={{ textAlign: 'center' }}>
          <button type="button" className="btn btn-primary" onClick={start}>
            {phase === 'idle' ? <><Play size={16} /> Start</> : <><RotateCcw size={16} /> Try again</>}
          </button>
        </div>
      )}
    </GameCard>
  );
}
