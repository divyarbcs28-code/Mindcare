import { useState } from 'react';
import { Lightbulb, SkipForward } from 'lucide-react';
import GameCard, { inputStyle } from './GameCard';

const WORDS = [
  ['SUNSHINE', 'Warm light on a clear day'],
  ['RAINBOW', 'Colours after the rain'],
  ['PUPPY', 'A young, playful dog'],
  ['PICNIC', 'A meal eaten outdoors'],
  ['MUSIC', 'Something you listen to and hum along with'],
  ['LAUGHTER', 'What a good joke brings'],
  ['FRIENDS', 'People who have your back'],
  ['ADVENTURE', 'An exciting new experience'],
  ['CHOCOLATE', 'A sweet treat'],
  ['BUTTERFLY', 'Started life as a caterpillar'],
  ['WEEKEND', 'Saturday and Sunday'],
  ['GARDEN', 'Where flowers grow'],
  ['BALLOON', 'Floats when filled with helium'],
  ['HOLIDAY', 'A break from school or work'],
  ['DANCE', 'Moving to the beat'],
];

function scramble(word) {
  let letters;
  do {
    letters = word.split('');
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
  } while (letters.join('') === word);
  return letters.join('');
}

const pickWord = (exclude) => {
  const options = WORDS.filter(([w]) => w !== exclude);
  const [word, hint] = options[Math.floor(Math.random() * options.length)];
  return { word, hint, scrambled: scramble(word) };
};

/** New word game for boredom: unscramble cheerful words, with optional hints. */
export default function WordScramble() {
  const [round, setRound] = useState(() => pickWord());
  const [guess, setGuess] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [revealed, setRevealed] = useState(1); // letters revealed by the second hint level
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const next = () => {
    setRound(pickWord(round.word));
    setGuess(''); setShowHint(false); setRevealed(1); setFeedback(null);
  };

  const check = () => {
    if (!guess.trim()) return;
    if (guess.trim().toUpperCase() === round.word) {
      setScore((s) => s + (showHint ? 1 : 2));
      setStreak((s) => s + 1);
      setFeedback({ ok: true, text: `🎉 Yes! "${round.word}"` });
      setTimeout(next, 1100);
    } else {
      setStreak(0);
      setFeedback({ ok: false, text: 'Not quite. Try rearranging again!' });
    }
  };

  return (
    <GameCard icon="🔤" title="Word Scramble" right={<span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Score {score} · Streak {streak}🔥</span>}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {round.scrambled.split('').map((letter, i) => (
          <span key={`${round.word}-${i}`} className="animate-fade-in-scale" style={{
            width: 40, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 'var(--radius-md)', background: 'rgba(124,92,191,0.15)', border: '1px solid rgba(124,92,191,0.35)',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--color-primary-light)',
          }}>{letter}</span>
        ))}
      </div>
      {showHint && (
        <p className="animate-fade-in" style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--color-warning)', marginBottom: 12 }}>
          💡 {round.hint} · starts with <strong>{round.word.slice(0, revealed)}</strong>
        </p>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <input
          aria-label="Your answer"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') check(); }}
          placeholder="Type the word"
          style={{ ...inputStyle, textTransform: 'uppercase', width: 200 }}
        />
        <button type="button" className="btn btn-primary" onClick={check}>Check</button>
        <button type="button" className="btn btn-secondary" onClick={() => (showHint ? setRevealed((r) => Math.min(r + 1, round.word.length - 1)) : setShowHint(true))}>
          <Lightbulb size={16} /> {showHint ? 'Another letter' : 'Hint'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => { setStreak(0); next(); }}><SkipForward size={16} /> Skip</button>
      </div>
      {feedback && (
        <p className="animate-fade-in" style={{ textAlign: 'center', marginTop: 14, color: feedback.ok ? 'var(--color-accent)' : 'var(--color-warning)' }}>{feedback.text}</p>
      )}
    </GameCard>
  );
}
