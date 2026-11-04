import { useState, useCallback } from 'react';
import { RefreshCw, Zap, RotateCcw, Music2, Laugh, Brain, Layers3, Timer, Wind, BookOpen, Hash, CircleDot, AudioLines, Dices, Drum, Sparkles, Play } from 'lucide-react';
import { jokes } from '../data/jokes';
import { quizQuestions } from '../data/quizData';
import WellnessActivities from '../components/WellnessActivities';
import WorryBubbles from '../components/games/WorryBubbles';
import WordScramble from '../components/games/WordScramble';
import GuessNumber from '../components/games/GuessNumber';
import TicTacToe from '../components/games/TicTacToe';
import SimonGame from '../components/games/SimonGame';
import DiceRoll from '../components/games/DiceRoll';
import DrumKit from '../components/games/DrumKit';
import PageHero from '../components/shared/PageHero';

/* ─────────────────────────────────────────────
   JOKE CARD
───────────────────────────────────────────── */
function JokeSection() {
  const [jokeIndex, setJokeIndex] = useState(0);
  const [showPunchline, setShowPunchline] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const nextJoke = () => {
    setShowPunchline(false);
    setAnimKey(k => k + 1);
    setJokeIndex(i => (i + 1) % jokes.length);
  };

  const current = jokes[jokeIndex];

  return (
    <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: '1.5rem' }}>😂</span>
        <h3 className="font-display" style={{ fontSize: '1rem' }}>Make Me Laugh</h3>
      </div>
      <div key={animKey} className="animate-fade-in-scale" style={{
        padding: 24,
        background: 'rgba(244,162,97,0.08)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(244,162,97,0.2)',
        minHeight: 140,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.5, marginBottom: showPunchline ? 16 : 0 }}>
          {current.setup}
        </p>
        {showPunchline && (
          <p className="animate-fade-in" style={{ fontSize: '1rem', color: 'var(--color-warning)', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
            😄 {current.punchline}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center' }}>
        {!showPunchline ? (
          <button id="btn-show-punchline" onClick={() => setShowPunchline(true)} className="btn btn-primary">
            <Zap size={16} /> Show punchline
          </button>
        ) : (
          <button id="btn-next-joke" onClick={nextJoke} className="btn btn-secondary">
            <RefreshCw size={16} /> Next joke
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   QUIZ
───────────────────────────────────────────── */
function QuizSection() {
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = quizQuestions[qIndex];

  const handleSelect = (i) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === current.answer) setScore(s => s + 1);
    setTimeout(() => {
      if (qIndex + 1 < quizQuestions.length) {
        setQIndex(q => q + 1);
        setSelected(null);
      } else {
        setFinished(true);
      }
    }, 1400);
  };

  const restart = () => {
    setQIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    return (
      <div className="glass-card" style={{ padding: 28, marginBottom: 24, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, justifyContent: 'center' }}>
          <span style={{ fontSize: '1.5rem' }}>🧠</span>
          <h3 className="font-display" style={{ fontSize: '1rem' }}>Funny Quiz</h3>
        </div>
        <div className="animate-fade-in-scale">
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>
            {score >= 5 ? '🏆' : score >= 3 ? '🎉' : '😅'}
          </div>
          <h3 style={{ marginBottom: 8 }}>Quiz complete!</h3>
          <p style={{ marginBottom: 4 }}>
            You scored <strong style={{ color: 'var(--color-primary-light)', fontSize: '1.3rem' }}>{score}</strong> / {quizQuestions.length}
          </p>
          <p style={{ marginBottom: 24, fontSize: '0.875rem' }}>
            {score >= 5 ? 'You are officially a chaos expert!' : score >= 3 ? 'Solid relatable energy!' : "At least you're honest 😂"}
          </p>
          <button id="btn-restart-quiz" onClick={restart} className="btn btn-primary">
            <RotateCcw size={16} /> Play again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.5rem' }}>🧠</span>
          <h3 className="font-display" style={{ fontSize: '1rem' }}>Funny Quiz</h3>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{qIndex + 1} / {quizQuestions.length}</span>
      </div>

      {/* Progress */}
      <div className="progress-bar" style={{ marginBottom: 20 }}>
        <div className="progress-fill" style={{ width: `${((qIndex) / quizQuestions.length) * 100}%`, background: 'var(--gradient-primary)' }} />
      </div>

      <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 20, lineHeight: 1.5 }}>
        {current.question}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {current.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === current.answer;
          let bg = 'rgba(255,255,255,0.04)';
          let border = 'var(--color-border)';
          let color = 'var(--color-text-primary)';

          if (selected !== null) {
            if (isCorrect) { bg = 'rgba(94,207,177,0.15)'; border = 'rgba(94,207,177,0.4)'; color = 'var(--color-accent)'; }
            else if (isSelected) { bg = 'rgba(231,111,81,0.12)'; border = 'rgba(231,111,81,0.3)'; color = 'var(--color-danger)'; }
          }

          return (
            <button
              key={i}
              id={`quiz-opt-${qIndex}-${i}`}
              onClick={() => handleSelect(i)}
              style={{
                padding: '12px 16px',
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: 'var(--radius-md)',
                color,
                fontSize: '0.875rem',
                textAlign: 'left',
                cursor: selected !== null ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'var(--font-body)',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="animate-fade-in" style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(124,92,191,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(124,92,191,0.2)', fontSize: '0.83rem', lineHeight: 1.6 }}>
          💬 {current.fun}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MEMORY CARD FLIP GAME
───────────────────────────────────────────── */
const CARD_EMOJIS = ['🌟', '🎵', '🌈', '🦋', '🎯', '🍀', '🎪', '🌙'];

function shuffle(arr) {
  const a = [...arr, ...arr].map((val, i) => ({ id: i, val, flipped: false, matched: false }));
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function MemoryGame() {
  const [cards, setCards] = useState(() => shuffle(CARD_EMOJIS));
  const [flipped, setFlipped] = useState([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [lock, setLock] = useState(false);

  const handleFlip = (idx) => {
    if (lock || cards[idx].flipped || cards[idx].matched) return;
    const newFlipped = [...flipped, idx];
    const newCards = cards.map((c, i) => i === idx ? { ...c, flipped: true } : c);
    setCards(newCards);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setLock(true);
      const [a, b] = newFlipped;
      if (newCards[a].val === newCards[b].val) {
        const matched = newCards.map((c, i) => (i === a || i === b) ? { ...c, matched: true } : c);
        setCards(matched);
        setFlipped([]);
        setLock(false);
        if (matched.every(c => c.matched)) setWon(true);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => (i === a || i === b) ? { ...c, flipped: false } : c));
          setFlipped([]);
          setLock(false);
        }, 900);
      }
    } else {
      setFlipped(newFlipped);
    }
  };

  const restart = () => {
    setCards(shuffle(CARD_EMOJIS));
    setFlipped([]);
    setMoves(0);
    setWon(false);
    setLock(false);
  };

  return (
    <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.5rem' }}>🃏</span>
          <h3 className="font-display" style={{ fontSize: '1rem' }}>Memory Card Flip</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Moves: {moves}</span>
          <button id="btn-memory-restart" onClick={restart} className="btn btn-secondary btn-sm"><RotateCcw size={14} /></button>
        </div>
      </div>

      {won ? (
        <div className="animate-fade-in-scale" style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
          <h3 style={{ marginBottom: 8 }}>You won!</h3>
          <p style={{ marginBottom: 20 }}>Completed in <strong style={{ color: 'var(--color-primary-light)' }}>{moves}</strong> moves</p>
          <button id="btn-memory-play-again" onClick={restart} className="btn btn-primary"><RotateCcw size={16} /> Play again</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {cards.map((card, i) => (
            <button
              key={`${card.id}-${i}`}
              id={`memory-card-${i}`}
              onClick={() => handleFlip(i)}
              style={{
                height: 70,
                borderRadius: 'var(--radius-md)',
                border: card.matched ? '2px solid rgba(94,207,177,0.5)' : '1px solid var(--color-border)',
                background: card.flipped || card.matched
                  ? card.matched ? 'rgba(94,207,177,0.12)' : 'rgba(124,92,191,0.15)'
                  : 'rgba(255,255,255,0.05)',
                fontSize: card.flipped || card.matched ? '1.6rem' : '0',
                cursor: card.matched ? 'default' : 'pointer',
                transition: 'all 0.25s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: card.flipped && !card.matched ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {(card.flipped || card.matched) ? card.val : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   REACTION SPEED GAME
───────────────────────────────────────────── */
function ReactionGame() {
  const [phase, setPhase] = useState('idle'); // idle | waiting | ready | result
  const [startTime, setStartTime] = useState(null);
  const [reactionTime, setReactionTime] = useState(null);
  const [bestTime, setBestTime] = useState(null);
  const timerRef = useState(null);

  const startGame = () => {
    setPhase('waiting');
    setReactionTime(null);
    const delay = 1500 + Math.random() * 3000;
    timerRef[1](setTimeout(() => {
      setStartTime(Date.now());
      setPhase('ready');
    }, delay));
  };

  const handleTap = () => {
    if (phase === 'waiting') {
      // Too early
      clearTimeout(timerRef[0]);
      setPhase('idle');
      setReactionTime('too_early');
      return;
    }
    if (phase === 'ready') {
      const rt = Date.now() - startTime;
      setReactionTime(rt);
      if (!bestTime || rt < bestTime) setBestTime(rt);
      setPhase('result');
    }
  };

  const getLabel = (rt) => {
    if (rt < 200) return { label: '⚡ Lightning fast!', color: 'var(--color-accent)' };
    if (rt < 300) return { label: '🚀 Great reflexes!', color: 'var(--color-primary-light)' };
    if (rt < 450) return { label: '👍 Pretty good!', color: 'var(--color-warning)' };
    return { label: '🙂 Keep practising!', color: 'var(--color-text-secondary)' };
  };

  const bgColor = {
    idle: 'rgba(124,92,191,0.1)',
    waiting: 'rgba(231,111,81,0.12)',
    ready: 'rgba(94,207,177,0.2)',
    result: 'rgba(124,92,191,0.1)',
  }[phase];

  return (
    <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.5rem' }}>⚡</span>
          <h3 className="font-display" style={{ fontSize: '1rem' }}>Reaction Speed</h3>
        </div>
        {bestTime && (
          <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)' }}>Best: {bestTime}ms</span>
        )}
      </div>

      <button
        id="btn-reaction-tap"
        onClick={phase === 'idle' || phase === 'result' ? startGame : handleTap}
        style={{
          width: '100%',
          minHeight: 160,
          borderRadius: 'var(--radius-xl)',
          border: `2px solid ${phase === 'ready' ? 'rgba(94,207,177,0.5)' : phase === 'waiting' ? 'rgba(231,111,81,0.3)' : 'rgba(124,92,191,0.3)'}`,
          background: bgColor,
          cursor: 'pointer',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 10, transition: 'all 0.15s ease',
          fontFamily: 'var(--font-body)',
        }}
      >
        {phase === 'idle' && (
          <>
            <Zap size={32} color="var(--color-primary-light)" />
            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)', margin: 0 }}>Tap to Start</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>Wait for green, then tap as fast as you can!</p>
          </>
        )}
        {phase === 'waiting' && (
          <>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-danger)', boxShadow: '0 0 20px rgba(231,111,81,0.6)' }} />
            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-danger)', margin: 0 }}>Wait…</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>Don't tap yet!</p>
          </>
        )}
        {phase === 'ready' && (
          <>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-accent)', boxShadow: '0 0 30px rgba(94,207,177,0.8)', animation: 'glow-pulse 0.3s ease' }} />
            <p style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--color-accent)', margin: 0 }}>TAP NOW!</p>
          </>
        )}
        {phase === 'result' && (
          <>
            {reactionTime === 'too_early' ? (
              <>
                <span style={{ fontSize: '2rem' }}>😅</span>
                <p style={{ fontWeight: 700, color: 'var(--color-danger)', margin: 0 }}>Too early!</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>Tap to try again</p>
              </>
            ) : (
              <>
                <p style={{ fontWeight: 800, fontSize: '2rem', fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)', margin: 0 }}>{reactionTime}ms</p>
                <p style={{ fontWeight: 600, margin: 0, ...(() => getLabel(reactionTime))() }}>{getLabel(reactionTime).label}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>Tap to play again</p>
              </>
            )}
          </>
        )}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN FUN ZONE PAGE
───────────────────────────────────────────── */
const tabs = [
  { id: 'jokes', label: 'Jokes', icon: Laugh, detail: 'A quick laugh and a lighter moment.', color: '#f4a261', Component: JokeSection },
  { id: 'quiz', label: 'Funny Quiz', icon: Brain, detail: 'A playful quiz with unexpected answers.', color: '#9b83ed', Component: QuizSection },
  { id: 'memory', label: 'Memory Match', icon: Layers3, detail: 'Match pairs at your own pace.', color: '#5ecfb1', Component: MemoryGame },
  { id: 'reaction', label: 'Reaction Speed', icon: Timer, detail: 'Wait for green, then test your reflexes.', color: '#ef8b78', Component: ReactionGame },
  { id: 'bubbles', label: 'Worry Bubbles', icon: Wind, detail: 'Let a thought float away with each bubble.', color: '#72b9e8', Component: WorryBubbles },
  { id: 'scramble', label: 'Word Scramble', icon: BookOpen, detail: 'Untangle letters into a word.', color: '#f2c66d', Component: WordScramble },
  { id: 'guess', label: 'Guess the Number', icon: Hash, detail: 'Use clues to find the hidden number.', color: '#f09dc1', Component: GuessNumber },
  { id: 'tictactoe', label: 'Tic Tac Toe', icon: CircleDot, detail: 'A familiar little strategy challenge.', color: '#8fd6c4', Component: TicTacToe },
  { id: 'simon', label: 'Simon Says', icon: AudioLines, detail: 'Watch, listen, and repeat the pattern.', color: '#b99af5', Component: SimonGame },
  { id: 'dice', label: 'Dice Duel', icon: Dices, detail: 'Roll the dice and see what happens.', color: '#f4a261', Component: DiceRoll },
  { id: 'drums', label: 'Drum Kit', icon: Drum, detail: 'Tap out a rhythm of your own.', color: '#e982a8', Component: DrumKit },
  { id: 'music', label: 'Find Music', icon: Music2, detail: 'Choose a language and genre for your music search.', color: '#6fcdb5', Component: MusicFinder },
];

// Best-fit games for each mood come first (marked ✨); the reason is shown to the user.
const moodGames = {
  sad:      { picks: ['jokes', 'scramble', 'dice'],         reason: 'A little laughter and a light win can lift a heavy moment.' },
  stressed: { picks: ['bubbles', 'memory', 'guess'],        reason: 'Pop your worries, then settle into a calm, focused game.' },
  anxious:  { picks: ['bubbles', 'memory', 'simon'],        reason: 'Gentle focus brings your attention back to the present.' },
  angry:    { picks: ['drums', 'reaction', 'bubbles'],      reason: 'Drumming and quick reflexes are safe ways to let off steam.' },
  happy:    { picks: ['quiz', 'tictactoe', 'drums'],        reason: 'Keep the good energy going with something playful.' },
  calm:     { picks: ['scramble', 'guess', 'memory'],       reason: 'A light brain teaser suits a relaxed mind.' },
  bored:    { picks: ['simon', 'tictactoe', 'scramble'],    reason: 'A quick challenge is a great cure for boredom.' },
};

function MusicFinder({ mood }) {
  const [language, setLanguage] = useState('Any language');
  const [genre, setGenre] = useState('Any genre');
  const [artist, setArtist] = useState('');
  const [searched, setSearched] = useState(false);
  const searchMusic = (event) => {
    event.preventDefault();
    const terms = [genre !== 'Any genre' && genre, language !== 'Any language' && language, artist.trim(), mood && `${mood} mood`, 'music'].filter(Boolean);
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(terms.join(' '))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setSearched(true);
  };
  const field = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-primary)', font: 'inherit' };
  return (
    <section className="glass-card" style={{ padding: 28, borderColor: 'rgba(94,207,177,0.25)', background: 'linear-gradient(135deg, rgba(94,207,177,0.09), rgba(124,92,191,0.09))' }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 8 }}>
        <span style={{ width: 52, height: 52, display: 'grid', placeItems: 'center', borderRadius: 16, background: 'rgba(94,207,177,0.14)', color: 'var(--color-accent)' }}><Music2 size={26} /></span>
        <div><p style={{ color: 'var(--color-accent)', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', margin: '0 0 4px' }}>YOUR SOUNDTRACK</p><h3 className="font-display" style={{ fontSize: '1.2rem', margin: 0 }}>Find something that fits</h3></div>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 22 }}>Pick the kind of music you want to hear. We’ll search YouTube for matching tracks{mood ? ` with a ${mood} mood` : ''}.</p>
      <form onSubmit={searchMusic} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, alignItems: 'end' }}>
        <label style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>Language<select aria-label="Music language" value={language} onChange={e => setLanguage(e.target.value)} style={{ ...field, marginTop: 7 }}><option>Any language</option>{['English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Spanish', 'Korean', 'Japanese'].map(x => <option key={x}>{x}</option>)}</select></label>
        <label style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>Genre<select aria-label="Music genre" value={genre} onChange={e => setGenre(e.target.value)} style={{ ...field, marginTop: 7 }}><option>Any genre</option>{['Lo-fi', 'Classical', 'Pop', 'Indie', 'Rock', 'Jazz', 'Instrumental', 'Devotional', 'Cinematic', 'Ambient'].map(x => <option key={x}>{x}</option>)}</select></label>
        <label style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>Artist or extra details<input aria-label="Artist or extra music details" value={artist} onChange={e => setArtist(e.target.value)} placeholder="Optional" style={{ ...field, marginTop: 7 }} /></label>
        <button type="submit" className="btn btn-primary" style={{ minHeight: 46, justifyContent: 'center' }}><Play size={16} /> Find my music</button>
      </form>
      {searched && <p role="status" style={{ color: 'var(--color-accent)', fontSize: '0.82rem', margin: '14px 0 0' }}>Your music search opened in a new YouTube tab. Adjust your choices to try another mix.</p>}
    </section>
  );
}

export default function FunZone() {
  const [activeTab, setActiveTab] = useState('jokes');
  const [mood, setMood] = useState('');
  const moodPlan = moodGames[mood];
  const ActiveGame = tabs.find((t) => t.id === activeTab)?.Component || JokeSection;

  const handleMoodChange = useCallback((value) => {
    setMood(value);
    if (moodGames[value]) setActiveTab(moodGames[value].picks[0]);
  }, []);

  const launchActivity = (id) => {
    setActiveTab(id);
    window.requestAnimationFrame(() => document.getElementById('activity-player')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <div className="animate-fade-in">
      <PageHero
        image="/images/funzone-friends.webp"
        position="center 40%"
        eyebrow="Take a break"
        title="Fun Zone 🎮"
        subtitle={<>{moodPlan
            ? <>Picked for feeling <strong style={{ color: 'var(--color-accent)' }}>{mood}</strong>: {moodPlan.reason}</>
            : 'Take a break. Laugh a little. Play a game. You deserve it.'}</>}
      />
      <WellnessActivities onMoodChange={handleMoodChange} />

      <section style={{ margin: '30px 0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div><p style={{ color: 'var(--color-primary-light)', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', margin: '0 0 5px' }}>PICK YOUR BREAK</p><h2 className="font-display" style={{ fontSize: '1.35rem', margin: 0 }}>Play, explore, or listen</h2></div>
          {moodPlan && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 999, padding: '8px 12px', color: 'var(--color-accent)', background: 'rgba(94,207,177,0.1)', border: '1px solid rgba(94,207,177,0.22)', fontSize: '0.78rem', fontWeight: 700 }}><Sparkles size={14} /> 3 picks for {mood}</span>}
        </div>
        {moodPlan && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 26 }}>
          {moodPlan.picks.slice(0, 3).map((id, index) => {
            const item = tabs.find(t => t.id === id);
            const Icon = item.icon;
            return <button key={id} type="button" onClick={() => launchActivity(id)} style={{ position: 'relative', textAlign: 'left', padding: 20, minHeight: 150, overflow: 'hidden', borderRadius: 20, border: activeTab === id ? `1px solid ${item.color}88` : '1px solid var(--color-border)', background: `linear-gradient(145deg, ${item.color}20, rgba(255,255,255,0.035) 68%)`, color: 'var(--color-text-primary)', cursor: 'pointer', boxShadow: activeTab === id ? `0 12px 28px ${item.color}20` : 'none', transition: 'transform 180ms ease, box-shadow 180ms ease' }}>
              <span style={{ position: 'absolute', right: 14, top: 14, padding: '5px 9px', display: 'inline-flex', gap: 5, alignItems: 'center', borderRadius: 999, background: `${item.color}22`, color: item.color, fontSize: '0.68rem', fontWeight: 800 }}><Sparkles size={12} /> PICK {index + 1}</span>
              <span style={{ width: 48, height: 48, display: 'grid', placeItems: 'center', borderRadius: 15, background: `${item.color}20`, color: item.color, marginBottom: 15 }}><Icon size={24} /></span>
              <strong style={{ display: 'block', fontSize: '1rem', marginBottom: 5 }}>{item.label}</strong><span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', lineHeight: 1.5 }}>{item.detail}</span>
            </button>;
          })}
        </div>}
        <h3 className="font-display" style={{ fontSize: '1rem', margin: '0 0 13px' }}>All activities</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
          {tabs.map((item) => {
            const Icon = item.icon;
            const isRecommended = Boolean(moodPlan?.picks.includes(item.id));
            const isActive = activeTab === item.id;
            return <button key={item.id} id={`activity-${item.id}`} type="button" onClick={() => launchActivity(item.id)} aria-pressed={isActive} style={{ textAlign: 'left', position: 'relative', padding: 16, minHeight: 148, borderRadius: 18, border: isActive ? `1px solid ${item.color}88` : isRecommended ? `1px solid ${item.color}55` : '1px solid var(--color-border)', background: isActive ? `${item.color}16` : 'rgba(255,255,255,0.025)', color: 'var(--color-text-primary)', cursor: 'pointer', transition: 'all 180ms ease' }}>
              {isRecommended && <span style={{ position: 'absolute', right: 10, top: 10, fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.04em', color: item.color, background: `${item.color}18`, padding: '5px 7px', borderRadius: 999 }}>FOR {mood.toUpperCase()}</span>}
              <span style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 13, background: `${item.color}1c`, color: item.color, marginBottom: 13 }}><Icon size={21} /></span>
              <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: 5 }}>{item.label}</strong><span style={{ display: 'block', fontSize: '0.76rem', lineHeight: 1.45, color: 'var(--color-text-muted)' }}>{item.detail}</span>
            </button>;
          })}
        </div>
      </section>

      <div id="activity-player" key={activeTab} className="animate-fade-in-scale" style={{ scrollMarginTop: 24 }}>
        <ActiveGame mood={mood} />
      </div>

      {/* Footer note */}
      <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 8 }}>
        Fun Zone is designed to give you a mental break. Even 5 minutes can help! 🌟
      </p>
    </div>
  );
}
