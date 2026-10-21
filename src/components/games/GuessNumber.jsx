import { useState } from 'react';
import { RotateCcw, Send } from 'lucide-react';
import GameCard, { inputStyle, panelStyle } from './GameCard';

const PRESETS = [[1, 20], [1, 50], [1, 100]];
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Guess the Number, ported from web dev/guess-the-game: pick a range, get higher/lower hints. */
export default function GuessNumber() {
  const [range, setRange] = useState(null); // [min, max]
  const [custom, setCustom] = useState({ min: '', max: '' });
  const [secret, setSecret] = useState(null);
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState(null); // { text, tone }
  const [won, setWon] = useState(false);
  const [error, setError] = useState('');

  const start = (min, max) => {
    if (!Number.isInteger(min) || !Number.isInteger(max)) { setError('Enter valid numbers for both fields.'); return; }
    if (min >= max) { setError('Min must be less than Max.'); return; }
    setRange([min, max]);
    setSecret(randomBetween(min, max));
    setAttempts(0); setGuess(''); setFeedback(null); setWon(false); setError('');
  };

  const makeGuess = () => {
    const value = parseInt(guess, 10);
    if (Number.isNaN(value)) { setError('Enter a number.'); return; }
    if (value < range[0] || value > range[1]) { setError(`Must be between ${range[0]} and ${range[1]}.`); return; }
    setError('');
    setAttempts((a) => a + 1);
    setGuess('');
    if (value === secret) { setWon(true); setFeedback(null); return; }
    // Gentle "warm/cold" hint on top of the original higher/lower feedback.
    const close = Math.abs(value - secret) <= Math.max(2, Math.round((range[1] - range[0]) * 0.1));
    setFeedback({
      text: `The number is ${value < secret ? 'higher' : 'lower'} than ${value}.${close ? ' 🔥 You are very close!' : ''}`,
      tone: value < secret ? 'low' : 'high',
    });
  };

  return (
    <GameCard icon="🔢" title="Guess the Number" subtitle="A low-pressure puzzle: pick a range, then follow the higher/lower hints.">
      {!range ? (
        <div style={panelStyle}>
          <p style={{ marginBottom: 12, fontWeight: 600 }}>Choose a range</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {PRESETS.map(([min, max]) => (
              <button key={max} type="button" className="btn btn-secondary btn-sm" onClick={() => start(min, max)}>{min} – {max}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="number" aria-label="Minimum" placeholder="Min" value={custom.min} onChange={(e) => setCustom({ ...custom, min: e.target.value })} style={{ ...inputStyle, width: 100 }} />
            <input type="number" aria-label="Maximum" placeholder="Max" value={custom.max} onChange={(e) => setCustom({ ...custom, max: e.target.value })} style={{ ...inputStyle, width: 100 }} />
            <button type="button" className="btn btn-primary btn-sm" onClick={() => start(parseInt(custom.min, 10), parseInt(custom.max, 10))}>Set range</button>
          </div>
        </div>
      ) : won ? (
        <div className="animate-fade-in-scale" style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎉</div>
          <h3 style={{ marginBottom: 6 }}>You found it: {secret}!</h3>
          <p style={{ marginBottom: 20 }}>In {attempts} {attempts === 1 ? 'attempt' : 'attempts'}.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" onClick={() => start(range[0], range[1])}><RotateCcw size={16} /> Play again</button>
            <button type="button" className="btn btn-secondary" onClick={() => setRange(null)}>Change range</button>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ marginBottom: 12 }}>Pick a number between <strong>{range[0]}</strong> and <strong>{range[1]}</strong>. Attempts: {attempts}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="number" aria-label="Your guess" autoFocus value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') makeGuess(); }}
              style={{ ...inputStyle, width: 140 }}
            />
            <button type="button" className="btn btn-primary" onClick={makeGuess}><Send size={16} /> Guess</button>
            <button type="button" className="btn btn-secondary" onClick={() => setRange(null)}>Change range</button>
          </div>
          {feedback && (
            <p key={attempts} className="animate-fade-in" style={{
              marginTop: 16, padding: '12px 16px', borderRadius: 'var(--radius-md)',
              background: feedback.tone === 'low' ? 'rgba(94,207,177,0.1)' : 'rgba(244,162,97,0.1)',
              border: `1px solid ${feedback.tone === 'low' ? 'rgba(94,207,177,0.3)' : 'rgba(244,162,97,0.3)'}`,
            }}>
              {feedback.tone === 'low' ? '⬆️' : '⬇️'} {feedback.text}
            </p>
          )}
        </div>
      )}
      {error && <p role="alert" style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: 10 }}>{error}</p>}
    </GameCard>
  );
}
