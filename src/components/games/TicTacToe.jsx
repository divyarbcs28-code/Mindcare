import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import GameCard from './GameCard';

const WIN_PATTERNS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];
const COLORS = { X: '#FF6B8B', O: '#4FD8E8' };

function findWin(board) {
  return WIN_PATTERNS.find(([a, b, c]) => board[a] && board[a] === board[b] && board[b] === board[c]) || null;
}

/** A friendly opponent: takes a winning move, blocks yours, otherwise plays loosely so you can win. */
function computerMove(board) {
  const empty = board.map((v, i) => (v ? null : i)).filter((i) => i !== null);
  const completes = (mark) => empty.find((i) => {
    const next = [...board];
    next[i] = mark;
    return findWin(next);
  });
  const win = completes('O');
  if (win !== undefined) return win;
  const block = completes('X');
  if (block !== undefined && Math.random() < 0.8) return block;
  if (!board[4] && Math.random() < 0.5) return 4;
  return empty[Math.floor(Math.random() * empty.length)];
}

/** Tic Tac Toe, ported from web dev/tic tac toe, with an optional computer opponent. */
export default function TicTacToe() {
  const [mode, setMode] = useState('computer'); // computer | friend
  const [board, setBoard] = useState(Array(9).fill(''));
  const [player, setPlayer] = useState('X');
  const [score, setScore] = useState({ X: 0, O: 0, draw: 0 });

  const winLine = findWin(board);
  const winner = winLine ? board[winLine[0]] : null;
  const draw = !winner && board.every(Boolean);
  const over = Boolean(winner) || draw;

  const play = (index) => {
    if (board[index] || over) return;
    const next = [...board];
    next[index] = player;
    setBoard(next);
    const line = findWin(next);
    if (line) setScore((s) => ({ ...s, [player]: s[player] + 1 }));
    else if (next.every(Boolean)) setScore((s) => ({ ...s, draw: s.draw + 1 }));
    else setPlayer(player === 'X' ? 'O' : 'X');
  };

  // Computer plays O after a short pause.
  useEffect(() => {
    if (mode !== 'computer' || player !== 'O' || over) return undefined;
    const timer = setTimeout(() => play(computerMove(board)), 450);
    return () => clearTimeout(timer);
  });

  const restart = () => { setBoard(Array(9).fill('')); setPlayer('X'); };
  const switchMode = (value) => { setMode(value); restart(); setScore({ X: 0, O: 0, draw: 0 }); };
  const oName = mode === 'computer' ? 'MindCare' : 'Player O';

  let status = `${player === 'X' ? (mode === 'computer' ? 'Your' : "Player X's") : (mode === 'computer' ? "MindCare's" : "Player O's")} turn`;
  if (winner) status = winner === 'X' ? (mode === 'computer' ? '🎉 You win!' : '🎉 Player X wins!') : `${oName} wins this one. Rematch?`;
  if (draw) status = "🤝 It's a draw!";

  return (
    <GameCard
      icon="⭕"
      title="Tic Tac Toe"
      right={
        <div style={{ display: 'flex', gap: 6 }}>
          {[['computer', 'vs MindCare'], ['friend', 'vs Friend']].map(([value, label]) => (
            <button key={value} type="button" className={`btn btn-sm ${mode === value ? 'btn-primary' : 'btn-secondary'}`} onClick={() => switchMode(value)}>{label}</button>
          ))}
        </div>
      }
    >
      <p style={{ textAlign: 'center', fontWeight: 700, marginBottom: 14, color: winner === 'X' ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>{status}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: '100%', maxWidth: 300, margin: '0 auto 16px' }}>
        {board.map((value, i) => {
          const highlighted = winLine?.includes(i);
          return (
            <button
              key={i}
              type="button"
              aria-label={`Square ${i + 1}${value ? `, ${value}` : ''}`}
              onClick={() => (mode === 'friend' || player === 'X') && play(i)}
              style={{
                aspectRatio: '1', borderRadius: 'var(--radius-md)', fontSize: '2rem', fontWeight: 800,
                fontFamily: 'var(--font-display)', color: COLORS[value] || 'transparent',
                background: highlighted ? 'rgba(94,207,177,0.18)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${highlighted ? 'rgba(94,207,177,0.5)' : 'var(--color-border)'}`,
                cursor: value || over ? 'default' : 'pointer', transition: 'all 0.2s ease',
              }}
            >
              {value || '·'}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          {mode === 'computer' ? 'You' : 'X'}: {score.X} · {oName}: {score.O} · Draws: {score.draw}
        </span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={restart}><RotateCcw size={14} /> {over ? 'Play again' : 'Restart'}</button>
      </div>
    </GameCard>
  );
}
