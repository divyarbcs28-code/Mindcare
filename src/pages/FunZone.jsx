import { useState, useCallback } from 'react';
import { RotateCcw, Music2, Layers3, Wind, BookOpen, Hash, CircleDot, AudioLines, Drum, Sparkles, Play, Paintbrush, MessagesSquare, Globe2, Clapperboard, ExternalLink } from 'lucide-react';
import WellnessActivities from '../components/WellnessActivities';
import WorryBubbles from '../components/games/WorryBubbles';
import WordScramble from '../components/games/WordScramble';
import GuessNumber from '../components/games/GuessNumber';
import TicTacToe from '../components/games/TicTacToe';
import SimonGame from '../components/games/SimonGame';
import DrumKit from '../components/games/DrumKit';
import PageHero from '../components/shared/PageHero';

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
   MAIN FUN ZONE PAGE
───────────────────────────────────────────── */
const tabs = [
  { id: 'skribbl', label: 'Skribbl.io', icon: Paintbrush, detail: 'Draw a secret word while everyone races to guess it.', color: '#f4a261', tag: 'PLAY WITH FRIENDS', href: 'https://skribbl.io/?6nCQUlOM' },
  { id: 'garticphone', label: 'Gartic Phone', icon: Clapperboard, detail: 'Draw and describe in a telephone-game chain of surprises.', color: '#9b83ed', tag: 'PARTY GAME', href: 'https://garticphone.com/' },
  { id: 'codenames', label: 'Codenames', icon: MessagesSquare, detail: 'Give clever one-word clues and uncover your team’s cards.', color: '#5ecfb1', tag: 'TEAM STRATEGY', href: 'https://codenames.game/' },
  { id: 'geoguessr', label: 'GeoGuessr', icon: Globe2, detail: 'Explore a street-view location and guess where you landed.', color: '#72b9e8', tag: 'WORLD EXPLORER', href: 'https://www.geoguessr.com/free' },
  { id: 'memory', label: 'Memory Match', icon: Layers3, detail: 'Match pairs at your own pace.', color: '#5ecfb1', Component: MemoryGame },
  { id: 'bubbles', label: 'Worry Bubbles', icon: Wind, detail: 'Let a thought float away with each bubble.', color: '#72b9e8', Component: WorryBubbles },
  { id: 'scramble', label: 'Word Scramble', icon: BookOpen, detail: 'Untangle letters into a word.', color: '#f2c66d', Component: WordScramble },
  { id: 'guess', label: 'Guess the Number', icon: Hash, detail: 'Use clues to find the hidden number.', color: '#f09dc1', Component: GuessNumber },
  { id: 'tictactoe', label: 'Tic Tac Toe', icon: CircleDot, detail: 'A familiar little strategy challenge.', color: '#8fd6c4', Component: TicTacToe },
  { id: 'simon', label: 'Simon Says', icon: AudioLines, detail: 'Watch, listen, and repeat the pattern.', color: '#b99af5', Component: SimonGame },
  { id: 'drums', label: 'Drum Kit', icon: Drum, detail: 'Tap out a rhythm of your own.', color: '#e982a8', Component: DrumKit },
  { id: 'music', label: 'Find Music', icon: Music2, detail: 'Choose a language and genre for your music search.', color: '#6fcdb5', Component: MusicFinder },
];

// Best-fit games for each mood come first (marked ✨); the reason is shown to the user.
const moodGames = {
  sad:      { picks: ['garticphone', 'geoguessr', 'scramble'], reason: 'Try a playful group game, explore somewhere new, or solve a word puzzle.' },
  stressed: { picks: ['bubbles', 'memory', 'geoguessr'], reason: 'Release a thought, focus on a gentle puzzle, or take a virtual trip.' },
  anxious:  { picks: ['bubbles', 'memory', 'codenames'], reason: 'Try a grounding game, a quiet matching puzzle, or a team challenge.' },
  angry:    { picks: ['drums', 'skribbl', 'bubbles'], reason: 'Make some noise, draw something silly, or let a worry float away.' },
  happy:    { picks: ['skribbl', 'garticphone', 'codenames'], reason: 'Share the good mood with creative and collaborative games.' },
  calm:     { picks: ['geoguessr', 'scramble', 'memory'], reason: 'Explore, solve a word puzzle, or play a gentle matching game.' },
  bored:    { picks: ['garticphone', 'geoguessr', 'tictactoe'], reason: 'Jump into a party game, explore the world, or challenge a friend.' },
};

function ExternalGamePanel({ game }) {
  const Icon = game.icon;
  return <section className="glass-card" style={{ padding: 28, borderColor: `${game.color}55`, background: `linear-gradient(135deg, ${game.color}18, rgba(124,92,191,0.08))` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
      <span style={{ width: 54, height: 54, display: 'grid', placeItems: 'center', borderRadius: 17, color: game.color, background: `${game.color}20` }}><Icon size={28} /></span>
      <div><span style={{ color: game.color, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em' }}>{game.tag}</span><h3 className="font-display" style={{ fontSize: '1.25rem', margin: '4px 0 0' }}>{game.label}</h3></div>
    </div>
    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 18 }}>{game.detail}</p>
    <a href={game.href} target="_blank" rel="noreferrer" className="btn btn-primary"><ExternalLink size={16} /> Open {game.label}</a>
    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.74rem', margin: '14px 0 0' }}>This game opens on its own website in a new tab.</p>
  </section>;
}

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
  const [activeTab, setActiveTab] = useState('memory');
  const [mood, setMood] = useState('');
  const moodPlan = moodGames[mood];
  const activeActivity = tabs.find((t) => t.id === activeTab) || tabs[0];
  const ActiveGame = activeActivity.href ? ExternalGamePanel : activeActivity.Component;

  const handleMoodChange = useCallback((value) => {
    setMood(value);
    if (moodGames[value]) setActiveTab(moodGames[value].picks[0]);
  }, []);

  const launchActivity = (id) => {
    setActiveTab(id);
    const activity = tabs.find((item) => item.id === id);
    if (activity?.href) window.open(activity.href, '_blank', 'noopener,noreferrer');
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
            : 'Take a break. Try a new challenge, explore with friends, or find a soundtrack.'}</>}
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
        <ActiveGame mood={mood} game={activeActivity} />
      </div>

      {/* Footer note */}
      <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 8 }}>
        Fun Zone is designed to give you a mental break. Even 5 minutes can help! 🌟
      </p>
    </div>
  );
}
