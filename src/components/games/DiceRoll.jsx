import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import GameCard from './GameCard';

const rollDie = () => Math.floor(Math.random() * 6) + 1;

/** Dicee, ported from web dev/Dicee Challenge: you vs MindCare, rolled on demand instead of on page load. */
export default function DiceRoll() {
  const [dice, setDice] = useState([6, 6]);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState({ you: 0, mindcare: 0, draw: 0 });

  const roll = () => {
    setRolling(true);
    setResult(null);
    // A short tumble before the final faces land.
    const tumble = setInterval(() => setDice([rollDie(), rollDie()]), 80);
    setTimeout(() => {
      clearInterval(tumble);
      const [you, mindcare] = [rollDie(), rollDie()];
      setDice([you, mindcare]);
      const outcome = you > mindcare ? 'you' : mindcare > you ? 'mindcare' : 'draw';
      setResult(outcome);
      setScore((s) => ({ ...s, [outcome]: s[outcome] + 1 }));
      setRolling(false);
    }, 700);
  };

  const heading = { you: '🚩 You win this roll!', mindcare: 'MindCare wins this roll! 🚩', draw: "🤝 It's a draw!" }[result] || 'Roll the dice and see who gets the higher number.';

  return (
    <GameCard icon="🎲" title="Dice Duel" right={<span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>You {score.you} · MindCare {score.mindcare} · Draws {score.draw}</span>}>
      <p style={{ textAlign: 'center', fontWeight: 700, marginBottom: 20, minHeight: 24 }}>{heading}</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 24, flexWrap: 'wrap' }}>
        {['You', 'MindCare'].map((name, i) => (
          <div key={name} style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 600, marginBottom: 10 }}>{name}</p>
            <img
              src={`/games/dice/dice${dice[i]}.png`}
              alt={`${name} rolled ${dice[i]}`}
              style={{ width: 96, height: 96, transform: rolling ? `rotate(${dice[i] * 30}deg)` : 'none', transition: 'transform 0.08s linear' }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button type="button" className="btn btn-primary" disabled={rolling} onClick={roll}>🎲 {rolling ? 'Rolling…' : 'Roll'}</button>
        <button type="button" className="btn btn-secondary" disabled={rolling} onClick={() => { setScore({ you: 0, mindcare: 0, draw: 0 }); setResult(null); }}><RotateCcw size={16} /> Reset score</button>
      </div>
    </GameCard>
  );
}
